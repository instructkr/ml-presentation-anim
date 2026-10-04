import { dynamicSamplerScene } from '../scenes/35-dynamic-sampler';
import { mixerConcurrencyScene } from '../scenes/36-mixer-concurrency';
import { mixerScheduleScene } from '../scenes/37-mixer-schedule';
import { FIG15_SPREAD } from '../data/infra-fig16';
import { DEMAND_PER_100, acceptRange, fastest, one, pct, read, slowest } from '../data/mixer-concurrency';
import { ALPHA, at, behindShare, blended, collectedPct, deficitOnly, fullSource, targetOnly } from '../data/mixer-schedule';
import { ACCEPT_RATE, BATCH, DRAWN, FIRST, G, KEPT, count, dropped } from '../data/mixer-sampler';
import { RL_SCALE } from '../data/objective-rl-scale';
import type { WeekTrack } from './types';

/**
 * 배치 채우기, 앞쪽 세 장면 (§4.1, §6.2, §6.3): the dynamic sampler, then the
 * first two mechanisms of the Sample Mixer. Notes are keyed by the root-diagram
 * node id ('sampler') and '<nodeId>/<stepId>' — one per beat.
 *
 * The report gives the dynamic sampler one sentence and a citation, so its
 * notes are DAPO §3.2 (refs: arXiv 2503.14476); the Sample Mixer is the
 * report's own (§6.3). Two letters of §6.3 clash with the rest of the talk: its
 * r_i is the group acceptance rate, not the ratio r of Eq. 1, and its A_i is
 * the number of groups already accepted, not 평균과의 차이. The scenes keep the
 * paper's letters so Eq. 6–7 can be matched; the notes say so where each first
 * appears.
 */

// numbers the notes read out, taken from the same data files the scenes draw
const whole = (v: number) => String(Math.round(v));
const share = (v: number) => `${whole(v * 100)}%`;
const DROPPED = DRAWN.length - KEPT;

const code2 = read('code2');
const visual = read('visual');
const general = read('general');
const code1 = read('code1');
const cyber = read('cyber');
const chat = read('chat');
/** occupancy as Fig. 16's bottom row prints it: a share of 1 */
const occ = (v: number) => (v / 100).toFixed(2);

export const mixerTrack: WeekTrack = {
  scenes: [dynamicSamplerScene, mixerConcurrencyScene, mixerScheduleScene],
  details: {
    sampler: { kind: 'scene', scene: dynamicSamplerScene },
    mixer: { kind: 'scene', scene: mixerConcurrencyScene },
    schedule: { kind: 'scene', scene: mixerScheduleScene },
  },
  notes: {
    // ── 35 · dynamic sampler ────────────────────────────────────────────────
    sampler: `학습 배치에 어떤 그룹을 넣고 어떤 그룹을 버리는지 보는 장면입니다. 논문은 이 일을 dynamic sampler가 한다고 한 문장으로만 적고 DAPO 논문을 인용합니다 (§4.1). 그래서 이 장면의 설명은 DAPO §3.2에서 가져왔습니다. 화면의 과제 ${DRAWN.length}개와 통과한 횟수는 모두 예시이고, 그룹 크기 ${G}만 논문 값입니다.`,
    'sampler/groups': `과제 하나를 ${G}번 푼 묶음을 그룹이라고 불렀습니다. 막대 하나가 그룹 하나이고, 높이는 ${G}번 가운데 테스트를 통과한 횟수입니다. 학습 배치에 그룹이 ${BATCH}개 필요하다고 하고, 먼저 과제 ${BATCH}개를 풀었습니다. 실제 배치는 과제 ${RL_SCALE.prompts.toLocaleString('en-US')}개입니다 (§4.1).`,
    'sampler/flat': `모두 통과한 그룹은 점수가 전부 1이라 평균도 1이고, 평균과의 차이가 전부 0입니다. 모두 실패한 그룹도 마찬가지입니다. 차이가 0이면 Eq. 1에서 그 그룹의 항이 통째로 0이 되어 모델을 조금도 움직이지 못합니다. DAPO는 여기에 한 가지를 더 짚습니다. 학습이 진행될수록 모두 통과하는 과제가 계속 늘어납니다. 그러면 배치 안에서 실제로 기울기를 내는 과제의 수가 줄어들고, 배치 전체의 기울기가 작아지면서 잡음에 약해집니다 (DAPO §3.2).`,
    'sampler/drop': `그래서 이런 그룹은 학습 배치에 넣지 않습니다. 식의 k는 한 그룹에서 통과한 풀이의 수입니다. k가 0보다 크고 ${G}보다 작아야 한다는 조건은 DAPO의 Eq. 11에 붙어 있는 제약을 옮긴 것입니다. 화면에서는 처음 ${FIRST.length}그룹 가운데 모두 통과한 ${count(FIRST, G)}개와 모두 실패한 ${count(FIRST, 0)}개가 빠져서 ${FIRST.length - dropped(FIRST).length}개만 남았습니다. MiMo도 모두 통과했거나 모두 실패한 그룹을 걸러 낸다고 적습니다 (§4.1).`,
    'sampler/refill': `빠진 만큼 배치가 비었으므로, 조건에 맞는 그룹이 ${BATCH}개가 될 때까지 새 과제를 계속 풉니다. DAPO는 이 방식을 dynamic sampling이라고 부릅니다. 배치 하나를 만드는 데 드는 풀이의 양이 그때그때 달라진다는 뜻입니다 (DAPO §3.2). MiMo에서 이 판정은 가볍습니다. sampler는 풀이의 내용을 읽지 않고 그룹의 통과율만 보고 받거나 버립니다. Groupwise Grader가 켜진 과제에서는 Grader가 그보다 먼저 그룹의 점수를 고쳐 씁니다. 받은 그룹에는 길이 감점, 평균과의 차이 계산, 토큰 감점이 차례로 적용되고, 그러고도 차이가 전부 0인 그룹은 기본 설정에서 한 번 더 버려집니다 (§6.2).`,
    'sampler/cost': `예시에서는 ${DRAWN.length}그룹을 풀어서 ${KEPT}그룹을 건졌으니, 받아들인 비율이 약 ${share(ACCEPT_RATE)}입니다. 버려진 ${DROPPED}그룹의 풀이 ${DROPPED * G}개는 학습에 쓰이지 않습니다. DAPO는 이 비용을 치르고도 전체 학습 시간이 크게 늘지 않았다고 보고합니다. 같은 성능에 이르는 데 필요한 스텝 수가 줄었기 때문입니다. DAPO의 표 1에서는 dynamic sampling을 더했을 때 AIME 2024 점수가 42에서 50으로 올랐습니다 (DAPO §4.2). 참고로 MAI-Thinking-1은 범위를 더 좁게 잡습니다. 통과율이 0.1에서 0.8 사이인 과제만 남기고, 128번 가운데 16번을 먼저 풀어 본 뒤 통과율이 범위를 벗어난 과제는 거기서 그만둡니다 (MAI-Thinking-1 §3.1.3). 받아들이는 비율은 과제 종류마다 다릅니다. 논문의 그림 16에서는 ${pct(acceptRange.lo * 100)}에서 ${whole(acceptRange.hi * 100)}%까지 벌어집니다. 다음 장면은 이 차이에서 시작합니다.`,

    // ── 36 · Sample Mixer: 몫 ───────────────────────────────────────────────
    mixer: `여러 종류의 과제를 한 배치에 섞을 때, 느린 과제를 얼마나 더 많이 돌려야 하는지 계산하는 장면입니다. 이 일을 맡은 모듈이 Sample Mixer입니다. MiMo-V2-Flash의 Data Scheduler를 이어받은 것이고, 장치가 네 가지입니다 (§6.3, MiMo-V2-Flash §4.6.2). 종류마다 동시에 돌릴 풀이의 한도를 정하는 Adaptive Rollout Concurrency, 시작할 순서를 정하는 Adaptive Rollout Scheduling, 새 풀이를 놓을 GPU를 고르는 Predictive Rollout Dispatch, 시작 직후를 메우는 Sample Replay입니다. 이 장면은 첫째이고, 나머지는 다음 두 장면에서 봅니다. 여섯 과제 종류의 목표 몫, 받아들이는 비율, 평균 풀이 시간은 그림 16의 범례에 적힌 논문 값이고, 화면의 나머지 숫자는 모두 이 값으로 계산했습니다.`,
    'mixer/target': `RL 배치에는 여러 종류의 과제가 섞여 들어가고, 종류마다 배치에서 차지할 몫이 미리 정해져 있습니다. 논문은 이 종류를 data source라고 부르고, 한 스텝에 남겨야 하는 그룹 수를 B로 적습니다 (§6.3). 왼쪽 막대가 그림 16의 여섯 종류와 그 몫입니다. ${code1.label}이 ${pct(code1.target)}, ${code2.label}가 ${pct(code2.target)}입니다. 어려운 점은 종류마다 일의 크기가 크게 다르다는 것입니다. 논문이 잰 ${FIG15_SPREAD.sources}개 종류 사이에서 풀이 하나가 쓰는 토큰 수는 ${FIG15_SPREAD.tokens}배, 풀이에 걸리는 시간은 ${FIG15_SPREAD.duration}배까지 차이가 납니다 (§6.3, 그림 15). 그런데도 매 스텝의 배치는 정해 둔 몫대로 채워져야 합니다.`,
    'mixer/accept': `먼저 버려지는 양을 셈에 넣습니다. 식의 r은 그 종류에서 푼 그룹 가운데 배치에 받아들여지는 비율입니다. 앞 장면에서 본 dynamic sampler가 그룹을 버리기 때문에 1보다 작아집니다. 글자는 같지만 Eq. 1의 비율 r과는 다른 값입니다. B그룹을 남기려면 B를 r로 나눈 만큼 풀어야 하고, 논문은 이 값을 m으로 적습니다 (§6.3). 오른쪽 막대는 m을 여섯 종류의 합에 대한 몫으로 그린 것입니다. ${general.label}은 받아들이는 비율이 ${pct(general.accept * 100)}라서 몫이 ${pct(general.target)}에서 ${pct(general.demandShare)}로 늘고, 버리는 그룹이 없는 ${visual.label}은 그만큼 줄어듭니다. 여섯 종류를 합치면 100그룹을 남기는 데 약 ${whole(DEMAND_PER_100)}그룹을 풀어야 합니다. 이 숫자는 제가 범례 값으로 계산했습니다.`,
    'mixer/time': `다음은 시간입니다. t는 풀이 하나에 걸리는 시간이고, 모델이 글을 쓰는 시간과 환경이 도구를 실행하는 시간을 합친 값입니다. 학습 스텝 사이에 멈춰 있는 시간은 넣지 않습니다 (§6.3). 같은 수의 그룹을 내놓더라도 오래 걸리는 종류는 그만큼 많은 풀이를 동시에 돌리고 있어야 합니다. 그래서 필요한 동시 풀이 수는 t와 m의 곱에 비례합니다 (§6.3). 화면에서 자리라고 부르는 것은 동시에 도는 풀이 하나가 차지하는 칸입니다. 범례에 적힌 값은 평균 풀이 시간입니다. 이것이 t의 정의와 정확히 같은 값인지는 논문이 밝히지 않았고, 여기서는 이 값을 t로 썼습니다.`,
    'mixer/read': `두 그림을 나란히 읽어 봅니다. ${code2.label}는 배치의 ${pct(code2.target)}를 채우는 종류인데 자리는 ${pct(code2.concurrencyShare)}를 씁니다. 풀이 하나가 ${one(code2.minutes)}분으로 길고 받아들이는 비율도 ${whole(code2.accept * 100)}%로 낮기 때문입니다. 반대로 ${visual.label}은 배치의 ${pct(visual.target)}를 채우면서 자리는 ${pct(visual.concurrencyShare)}만 씁니다. ${one(visual.minutes)}분이면 끝나고 버려지는 그룹이 없기 때문입니다. 오른쪽의 여섯 값은 제가 범례의 숫자로 계산한 것인데, 그림 16 아랫줄에 평평하게 그려진 자리 점유율과 맞습니다. 그래프에서 읽으면 ${code2.label}가 약 ${occ(code2.concurrencyShare)}, ${code1.label}과 ${cyber.label}가 약 ${occ(cyber.concurrencyShare)}, ${chat.label}이 약 ${occ(chat.concurrencyShare)}입니다.`,
    'mixer/spare': `마지막은 여유분입니다. Sample Mixer는 종류마다 m의 (1 + p)배까지 풀이를 시작할 수 있게 한도를 줍니다. p가 여유분의 비율이고, 논문은 oversampling ratio라고 부릅니다 (§6.3, Eq. 6). 식을 읽으면 p는 풀이 시간 t에 계수 c를 곱하고 1을 뺀 값이고, clip은 이 값을 정해 둔 하한과 상한 사이로 자른다는 뜻입니다. 그래서 풀이가 오래 걸리는 종류일수록 여유분이 커지고, 하한이나 상한에 닿으면 거기서 멈춥니다. 여섯 종류 가운데서는 ${one(slowest.minutes)}분이 걸리는 ${slowest.label}가 가장 많이, ${one(fastest.minutes)}분이 걸리는 ${fastest.label}이 가장 적게 받습니다. c는 모든 종류가 함께 쓰는 값 하나이고, m으로 무게를 준 p의 평균이 전체 여유분 p̄와 같아지도록 정합니다. 이 배분은 최근의 풀이 시간과 받아들이는 비율로 계속 다시 계산합니다 (§6.3). 하한과 상한, p̄의 실제 값은 논문에 없습니다. 여기서부터는 해석입니다. 느린 풀이는 모자란 것을 알고 나서 시작하면 그 스텝 안에 끝나지 않으므로, 미리 넉넉하게 시작해 둔다고 읽을 수 있습니다.`,

    // ── 37 · Sample Mixer: 순서 ─────────────────────────────────────────────
    schedule: `자리가 하나 비었을 때 어느 종류의 과제를 다음에 시작할지 정하는 장면입니다. Sample Mixer의 둘째 장치인 Adaptive Rollout Scheduling이고, 식은 Eq. 7입니다 (§6.3). 목표 B와 받아들이는 비율 r은 그림 16의 논문 값입니다. 왼쪽 그림의 진행 상황은 예시이고, 오른쪽 막대는 그 예시를 Eq. 7에 넣어 계산한 값입니다. 글자 두 개를 미리 짚어 둡니다. 이 식의 A는 평균과의 차이가 아니라 이번 배치에 이미 받아들인 그룹 수이고, r은 Eq. 1의 비율이 아니라 받아들이는 비율입니다.`,
    'schedule/snapshot': `한 스텝의 배치를 모으는 도중의 한순간을 그렸습니다. 막대는 종류마다 이번 배치의 목표 B 가운데 지금까지 받아들인 그룹 A가 몇 퍼센트인지입니다. ${fullSource.label}은 벌써 ${whole(at(collectedPct, fullSource.id))}%를 채웠고, ${cyber.label}는 ${whole(at(collectedPct, 'cyber'))}%입니다. 이 진행 상황은 예시입니다. 풀이가 ${one(visual.minutes)}분이면 끝나는 종류가 ${one(cyber.minutes)}분이 걸리는 종류보다 먼저 찬다고 가정했습니다.`,
    'schedule/target': `첫째 방법은 목표만 보는 것입니다. 무게 w를 B를 r로 나눈 값, 곧 앞 장면의 m으로 둡니다. 자리가 빌 때마다 이 무게에 비례해서 다음 과제의 종류를 고릅니다. 논문은 smooth weighted round-robin을 쓴다고 적습니다. 무게가 큰 종류가 더 자주 뽑히되, 같은 종류가 연달아 몰리지 않고 고르게 섞여 나오도록 차례를 돌리는 방식입니다 (§6.3). 그런데 이 무게는 진행 상황을 보지 않습니다. 그래서 이미 다 채운 ${fullSource.label}도 ${pct(at(targetOnly, fullSource.id))}의 비율로 계속 시작합니다. 논문의 모의실험에서 이 방식은 자리 점유율은 평평하게 유지하지만, 풀이가 짧은 Chat, Visual, General이 매 스텝 목표의 두 배쯤을 모읍니다. 두 배라는 값은 그림 16 (b)를 확대해서 읽은 근사값입니다.`,
    'schedule/deficit': `둘째 방법은 모자란 양만 보는 것입니다. 분자의 B − A가 이번 배치에서 아직 모자란 그룹 수이고, 위첨자 +는 그 값이 음수이면 0으로 바꾼다는 표시입니다. 그래서 다 채운 ${fullSource.label}은 무게가 0이 되어 새 풀이를 시작하지 않고, 가장 많이 모자란 ${cyber.label}와 ${code2.label}가 무게의 ${pct(behindShare(deficitOnly))}를 가져갑니다. 논문의 모의실험에서 이 방식은 자리 점유율이 크게 출렁입니다. ${cyber.label}와 ${code2.label}가 번갈아 자리를 거의 다 차지했다가 비우고, ${cyber.label}는 한 스텝 목표의 다섯 배쯤까지 모읍니다. 이 값도 그림 16 (a)를 확대해서 읽은 근사값입니다. 여기서부터는 해석입니다. 느린 풀이는 시작하고 한참 뒤에야 끝납니다. 그래서 모자란 양에만 반응하면 늘 한발 늦게 몰아서 시작하고 한발 늦게 멈추게 됩니다.`,
    'schedule/blend': `Eq. 7은 두 값을 α로 섞습니다. α는 0과 1 사이의 값이고, 1이면 목표만, 0이면 모자란 양만 봅니다. 논문은 앞의 항이 꾸준히 풀어야 할 양을 지키고, 뒤의 항이 모자란 종류를 앞세운다고 설명합니다 (§6.3). 화면은 α가 ${ALPHA}일 때입니다. 다 채운 ${fullSource.label}도 ${pct(at(blended, fullSource.id))}로 조금씩 이어서 시작하고, 뒤처진 ${code2.label}는 ${pct(at(blended, 'code2'))}로 올라갑니다. 논문의 모의실험에서 α = ${ALPHA}는 모자란 양만 볼 때보다 자리 점유율이 안정적이고, 목표만 볼 때보다 모은 양이 고릅니다 (§6.3, 그림 16 (c)). 그래프에서 읽으면 처음 두 스텝이 지난 뒤로는 모든 종류가 목표의 100%에서 120% 사이에 머뭅니다. 여기에 시작할 때의 동시 풀이 수를 t와 m의 곱에 비례하게 나눠 주면 처음의 흔들림도 사라지고, 논문은 이 설정을 steady-state startup이라고 부릅니다 (그림 16 (d)). 이 모의실험에는 한계가 있습니다. 실제 실행에서 잰 풀이 시간으로 돌렸고, 전체 동시 풀이 수는 고정했으며, 학습 시간, 채점이 늦게 도착하는 시간, 오래된 풀이를 버리는 규칙, Sample Replay는 넣지 않았습니다. 실제 학습에서 쓴 α 값은 논문에 따로 적혀 있지 않습니다.`,
  },
};
