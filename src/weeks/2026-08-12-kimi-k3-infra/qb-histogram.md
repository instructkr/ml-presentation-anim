# QB 히스토그램 추정 — 구현 메모

`scenes/06-qb-histogram.tsx` / `diagrams/qb-histogram.diagram.ts`의 근거.
출처는 K3 테크리포트 §2.3.3 "Histogram estimation" 단락과 부록 D.

## 문제

Eq. 14의 `b̂_j = −quantile_{1−k/n}(s_{:,j} − α)`는 **스텝 전체**에 걸친 분위수다.
m이 수백만이고 그 값들은 데이터 병렬 랭크와 gradient accumulation 스텝에 흩어져 있어
한자리에 모이는 순간이 없다. O(mn)개를 모아 정렬하는 것은 학습 루프 안에서 불가능하다.

업데이트가 쓰는 것은 마진 값이 아니라 **분포**뿐이고, 분포는 히스토그램이 고정 비용으로 요약한다.

## 담는 값: 필요 bias r

```
r_ij := α_i − s_ij      전문가 j를 토큰 i의 컷오프에 딱 올려놓는 데 필요한 bias
```

부호를 뒤집으면 순서가 뒤집히므로 `b̂_j = quantile_{k/n}(r_{:,j})`.
마진의 위쪽 q개를 세는 대신 **r의 아래쪽 q개**를 세면 같은 답이고, 그래서 누적을 아래에서부터 한다.

## 구간이 공짜로 정해지는 이유

- `s_ij ∈ (0,1)` — 시그모이드 출력
- `α_i`는 어떤 j′의 biased score `s_ij′ + b_j′`이므로 `α_i ∈ (b_min, 1 + b_max)`
- 따라서 **모든** `r_ij ∈ [b_min − 1, b_max + 1]`

범위를 찾으려고 min/max all-reduce를 먼저 돌릴 필요가 없다. 마진 대신 r을 담는 두 번째 이유.
`B = 1000`개로 균등 분할, `w = (b_max − b_min + 2)/B`, 매 스텝 재계산.
b는 모든 랭크가 동일하게 들고 있으므로 모든 랭크가 같은 격자로 담는다 — 개수를 그냥 더할 수 있는 전제.

## 파이프라인

1. **forward, 통신 0** — 각 랭크가 로컬 r을 `H ∈ ℕ^{n×B}`에 scatter-add. 누적 스텝도 같은 H에 더한다.
   전문가 j의 행은 라우팅된 토큰이 아니라 **모든 토큰을 한 번씩** 세므로 행 합이 m이다.
2. **스텝 끝, 통신 1회** — `all_reduce(H, SUM)`. 레이어당 정수 nB개.
3. **복원** — 모든 랭크가 같은 H로 각자 계산하므로 broadcast 불필요, 결정론적.
   아래에서부터 누적해 `⌈q⌉`에 처음 닿는 칸을 고르고 (`q = mk/n`, 전역 m),
   그 칸 앞 누적을 c_j, 칸 안 개수를 h_j라 할 때

   ```
   b̂_j = (b_min − 1) + ( bin_j + clip((q − c_j)/h_j, 0, 1) ) · w
   ```

   앞부분이 칸의 왼쪽 모서리, 뒤 항이 칸 안에서 자를 자리. 칸 안이 균등하다고 보는 것이 유일한 근사다.
4. **마무리** — `b ← b̂ − mean(b̂)`. 선택적으로 스텝 간 EMA. 갱신은 다음 스텝부터 적용된다(인과성).

> ⚠️ 논문은 3번의 칸 번호를 `β_j`로 쓴다. 부록 C의 `β_j`(열 방향 승수 = bias)와 **다른 것**이다.
> 03~05편을 막 본 청중은 헷갈리므로 슬라이드에서는 `bin_j`로 쓴다.

## 비용과 정확도

- **통신**: 레이어당 스텝당 정수 nB개. K3 기준 896 × 1000 ≈ 90만, int32면 약 3.6 MB(자체 산술).
  **m과 무관**하다. 논문은 raw margin을 micro-batch마다 교환하는 대안의 1% 미만이라고 적었다.
- **FLOP은 줄지 않는다** — r은 여전히 m×n으로 조밀하다. 라우터가 어차피 s를 m×n으로 만들고 있으므로
  로컬 계산은 이미 치른 비용이고, 히스토그램이 없애는 것은 통신과 정렬이다.
- **오차**: 누적 개수가 칸 모서리에서 정확하므로 참값과 추정치가 같은 칸 안에 있다.
  오차가 칸 폭 w로 상한되고 B=1000이면 수 ×10⁻³. 잔여 불균형은 측정되지 않았다.
- **옳은 양**: 개수는 그냥 더해지므로 합쳐진 표는 배치를 어떻게 쪼갰든 불변이고,
  결과는 전 배치를 한 덩어리로 본 분위수다. 랭크별 분위수의 평균이 아니며 그 둘은 일반적으로 다르다.

## 의사코드

```python
b_min, b_max = b.min(), b.max()
lo, w = b_min - 1.0, (b_max - b_min + 2.0) / B
H = zeros((n, B), dtype=int32)                  # 랭크 로컬

for mb in micro_batches:                        # 통신 없음
    s     = sigmoid(router(mb))                 # (m_mb, n)
    alpha = cutoff(s + b)                       # (m_mb,)
    r     = alpha[:, None] - s                  # (m_mb, n)
    idx   = clamp(floor((r - lo) / w), 0, B - 1)
    H.scatter_add_(dim=1, index=idx.T, src=1)

all_reduce(H, op=SUM)                           # 통신 1회, m과 무관

q     = m_global * k / n
cum   = cumsum(H, dim=1)
bin_  = argmax(cum >= ceil(q), dim=1)
c, h  = cum.gather(bin_ - 1), H.gather(bin_)
b_hat = lo + (bin_ + clip((q - c) / h, 0, 1)) * w
b_next = b_hat - b_hat.mean()                   # 다음 스텝부터
```
