---
name: write-explanation
description: Write or rewrite the explanatory content of a deck — scene callouts, diagram labels, speaker notes. Use whenever you are deciding what a scene says (not how it animates), or when an explanation was rejected as too hard, too compressed, or badly written.
---

# Writing the explanation

`new-scene` covers the mechanics (beats, layout, stepEffects). This covers the words.

The failure this skill exists to prevent: an explanation that is *technically correct and completely useless* — every claim true, every term unexplained, every derivation named instead of performed. It reads as expert shorthand and teaches nobody. Compression is not economy; it is a debt paid by the audience.

## 1. Inventory the vocabulary before writing anything

List every term the source paper uses without defining, then assign each one a place where **this deck** defines it. Papers open in the middle of their own argument and assume the reader has the field's shorthand; a livestream audience does not.

For each term ask: can a smart non-specialist state what this *is* after my slide? If the answer needs a second slide, give it a second slide.

> K3 §2.3.3 uses "quantile", "load", "bias", "fixed-step rule" with no definition. Four terms → one whole scene (`02-qb-quantile`) defines quantile on eight numbers you can count; the other three get a scene before the paper's argument starts (`01-qb-problem`).

## 2. Order by understanding, not by the paper

The paper's order is optimised for reviewers who already know the field. Reorder to: **문제 → 도구 → 유도 → 정리 → 구현**.

- **문제** — what goes wrong, in numbers, before any solution exists.
- **도구** — the one piece of vocabulary the derivation will lean on, defined on its own.
- **유도** — the argument, one move per beat.
- **정리** — what the argument buys: relation to the thing it replaces, what ships.
- **구현** — how it is actually computed at scale.

Announce the destination early. A beat that ends *"…and the tool for that is a quantile"* makes the next scene expected instead of 난데없는.

## 3. Perform the derivation; naming it is not explaining it

"라그랑주 쌍대를 취하면 분위수가 나온다" is a table of contents, not an explanation. Every step of a derivation owes the audience two things:

1. **Why this move** — what problem with the previous line forces it.
2. **What it hands you** — the concrete object you now hold.

And state the *destination* of the derivation up front, so each move is visibly aimed at something:

> 목적지는 "쌍대를 구했다"가 아니다. 배치 전체를 봐야 풀리는 문제를, 토큰 하나만 보고 계산되는 규칙으로 바꾸는 것이다. β는 부산물이 아니라 결과물이다.

Translate the machinery into plain language once: 라그랑주 승수 → "제약을 강요하는 대신 어기면 값을 물리는 것", α → "토큰이 전문가를 한 명 더 부를 때 내는 값". Then use the technical name freely.

## 4. Any assertion the audience cannot check is noise

"조각별 선형이라 닫힌 해가 있다" tells a reader who already knew, and nobody else. Replace every such sentence with the calculation:

> f는 꺾인 직선을 여러 개 더한 것이다. α가 마진 하나를 지나칠 때마다 항이 하나씩 꺼지므로 기울기는 k에서 α보다 큰 마진의 개수를 뺀 값이다. 왼쪽 끝에서는 3 − 8 = −5, 오른쪽으로 밀수록 올라가 개수가 k = 3인 구간에서 0이 된다. 그 자리가 4번째 마진이다.

**Small worked examples beat general statements.** Pick numbers small enough to verify on screen (8 values, an 8×4 table) and make the visual the calculation itself — plot the objective, highlight the flat minimum, put the kinks on the axis ticks. If a claim has a picture that proves it, that picture is the scene.

## 5. Split rather than compress

When a scene will not fit, the honest move is another scene, never shorter sentences. Symptoms that a split is owed: a beat carrying two unrelated ideas, a callout that has become a list of clauses, a derivation squeezed into one screen. Two 5-beat scenes teach; one 10-beat scene does not.

Corollary: keep each screen inside its budget (~3 callouts, diagram node labels under ~16 Korean chars — see `CLAUDE.md` and the boundary-still check in `new-scene`). Budget pressure is a signal to split content, not to compress prose.

## 6. Korean that reads as Korean

평서체 (…이다 / …한다), full sentences, spoken-Korean rhythm. The tics to avoid, all of them translationese:

| 쓰지 말 것 | 대신 |
|---|---|
| 붙임표를 접착제로 — `부호만 쓴 것 — 학습률이 없는 이유다` | 문장 둘로 끊고 **그래서 / 따라서 / 그런데 / 대신 / 반면**으로 잇는다 |
| 명사형 종결 남발 — `…인 셈이다`, `…한 것`, 특히 `…는 이유다` ("which is why"의 직역) | 동사로 끝낸다 |
| 조어·압축 — `학습률류`, `통신 0`, `누적 스텝 전부 누적` | 풀어 쓴다 |
| 주어 실종, 특히 절마다 주어가 바뀔 때 | 바뀌는 자리에서는 주어를 밝힌다 |
| 기호를 그대로 읽는 문장 — `기울기가 곧 q − ℓⱼ` | 한국어로 한 번 말한다: `기울기는 목표 부하에서 실제 부하를 뺀 값이다` |

붙임표는 화면당 한 번, 진짜 삽입구일 때만. 제목에는 써도 된다.

Same standard applies to `notes.ts` — the presenter reads those aloud, so they are the most spoken text in the repo.

## 7. Before finishing

- 소리 내어 읽어 본다. 붙임표가 있어야 버티는 문장은 두 문장이다.
- 정의 없이 쓴 용어가 남았는가. 남았다면 어디서 정의할지 정한다.
- 유도에 "…하면 …가 나온다"로 건너뛴 자리가 있는가.
- 청중이 화면에서 세어 확인할 수 있는 구체 예가 편마다 하나는 있는가.
- 렌더한 스틸을 실제로 본다 (`--frame=-1`, `--frame=0`). 넘치면 문장을 줄이기 전에 편을 나눌 수 있는지부터 본다.
