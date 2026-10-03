import { taskMixScene } from '../scenes/12-task-mix';
import { rewardHackingScene } from '../scenes/13-reward-hacking';
import { multiHarnessScene } from '../scenes/14-multi-harness';
import { HELD_OUT_HARNESSES, TRAINING_HARNESSES, fig10Summary } from '../data/environment-fig10';
import { HACK_SHARE_CEILING, detectedHackRange, hackSummary } from '../data/environment-hack';
import { taskShare } from '../data/environment-task-mix';
import type { WeekTrack } from './types';

// numbers the notes read out, taken from the same data files the scenes draw
const whole = (v: number) => String(Math.round(v));
const one = (v: number) => v.toFixed(1);
const F = fig10Summary;
const H = hackSummary;

/**
 * 환경과 harness (§4.2): task mix, reward hacking, multi-harness.
 * Notes are keyed by the root-diagram node id ('tasks') and '<nodeId>/<stepId>' — one per beat.
 * §4.2 stays light on screen, so these notes carry the detail of each pipeline.
 */
export const environmentTrack: WeekTrack = {
  scenes: [taskMixScene, rewardHackingScene, multiHarnessScene],
  details: {
    tasks: { kind: 'scene', scene: taskMixScene },
    hack: { kind: 'scene', scene: rewardHackingScene },
    harness: { kind: 'scene', scene: multiHarnessScene },
  },
  notes: {
    // ── 12 · 과제 구성 ────────────────────────────────────────────────────────
    tasks:
      'RL에서 어떤 과제를 풀게 했는지 보는 장면입니다. 막대는 과제 종류별 비율이고, 논문 숫자 그대로입니다 (§5.1). 논문은 RL 계산을 키운 세 방향 가운데 하나로 환경과 harness의 다양성을 꼽습니다 (§4.2). 여기서는 종류마다 채점을 어떻게 하는지만 한 줄씩 짚고 넘어갑니다.',
    'tasks/mix': `비율은 코딩 ${taskShare('code')}%, 도구 사용 ${taskShare('general')}%, 디자인 ${taskShare('visual')}%, 문맥 따르기 ${taskShare('context')}%, 보안 ${taskShare('cyber')}%입니다 (§5.1). 논문의 이름으로는 agentic and competitive coding, general tool use, aesthetic design, context following, cyber security입니다. RL 한 스텝의 배치에는 이 다섯 종류가 함께 섞여 들어갑니다. 문맥 따르기 과제가 어떤 것인지는 논문에 설명이 없습니다. 그래서 뒤에서도 이 막대는 따로 짚지 않습니다.`,
    'tasks/code':
      '코딩 과제는 풀이를 실제로 실행해서 테스트로 채점할 수 있어서 RL에 잘 맞습니다 (§4.2.1). 과제는 다섯 갈래로 만듭니다. GitHub의 pull request와 issue, 사내에서 실제로 들어온 개발 요청, 요구사항이 많은 명세 기반 과제, 기존 코드의 기능에서 과제를 뽑아내는 CodeMidas, 그리고 긴 호흡의 엔지니어링 과제입니다. 여기에 공개 데이터셋과 외부 업체의 데이터를 더합니다. 그런데 테스트가 틀리면 보상도 틀립니다. 그래서 채점 자체를 두 가지로 검증합니다. 첫째는 정확성입니다. 과제마다 agent가 네 번 풀고, 감사 agent가 풀이를 직접 판단한 결과를 테스트가 준 보상과 견줍니다. 틀린 풀이가 통과했으면 테스트가 느슨하다는 뜻이고, 맞는 풀이가 떨어졌으면 테스트가 지나치게 까다롭다는 뜻입니다. 둘째는 안정성입니다. 기준 패치를 넣기 전에는 fail-to-pass 테스트가 실패하고 pass-to-pass 테스트가 통과해야 하며, 넣은 뒤에는 둘 다 통과해야 합니다. 이 결과가 여덟 번 다시 돌려도 같아야 합니다.',
    'tasks/general':
      '도구 사용 과제는 문서를 분석하고 업무용 소프트웨어를 다루는 실제 업무 흐름입니다 (§4.2.2). 환경은 실제 파일과, 소프트웨어의 동작을 흉내 낸 mock으로 만듭니다. 모든 상태를 로컬에 두기 때문에 풀이마다 처음 상태로 되돌릴 수 있습니다. 채점은 통과와 실패로만 갈리는 작은 항목들의 목록, 곧 rubric으로 합니다. 데이터베이스 값이나 결과물 형식처럼 딱 떨어지는 항목은 코드로 검사하고, 내용이 열려 있는 항목은 LLM이 판단합니다. LLM이 판단하는 항목은 같은 모델로 여러 번, 그리고 다른 모델로도 판정해 보고, 결과가 엇갈리는 모호한 항목을 골라냅니다. RL 중에는 직접 띄운 MiMo-V2.6-SFT 모델이 이 채점을 맡습니다.',
    'tasks/visual':
      '디자인 과제는 웹사이트, 게임, 3D 장면, 슬라이드, SVG 같은 시각 결과물을 만드는 일입니다 (§4.2.3). 두 갈래가 있습니다. 하나는 열린 디자인입니다. 좋은 답이 여러 가지라서 정해진 규칙만으로는 품질을 재기 어렵습니다. 그래서 먼저 결과물 하나하나를 실행 여부, 지시 준수, 레이아웃, 기본 미감으로 채점하는 기준을 다듬습니다. 이 기준이 안정된 다음에 같은 과제의 풀이 그룹을 렌더해서 서로 견주고, 눈에 띄게 나은 것과 못한 것을 가려 보상을 다르게 줍니다. 다른 하나는 주어진 목표를 그대로 따라 만드는 과제입니다. 목표 이미지가 있으므로 주로 픽셀 단위 유사도로 채점하고, LLM의 전체적인 판단을 보탭니다.',
    'tasks/cyber':
      '보안 과제는 실제 취약점을 재현하는 일입니다. 프로젝트와 목표 버그가 주어지면 그 버그를 터뜨리는 입력, 곧 PoC를 만들어야 합니다 (§4.2.4). 어려운 점은 아무 충돌이나 내는 것이 아니라 설명된 바로 그 취약점을 건드려야 한다는 것입니다. 그래서 정답 sanitizer 보고서에서 취약점 종류와 충돌 위치를 뽑아 두고, PoC가 낸 충돌이 두 가지 모두와 문자열로 일치할 때만 통과시킵니다. 이 방식은 실행할 때마다 결과가 같고 계산이 거의 들지 않습니다. 논문은 기존 방식 두 가지가 왜 부족한지도 적습니다. 고치기 전 바이너리만 죽는지 보는 방식은 패치가 불완전하면 맞는 PoC를 떨어뜨립니다. LLM에게 판정을 맡기면 같은 PoC에 실행마다 다른 답이 나옵니다. 과제는 OSS-Fuzz에서 가져옵니다. 사람이 확인한 사례가 수만 건 있어서 대규모 RL에 맞습니다.',

    // ── 13 · reward hacking ───────────────────────────────────────────────────
    hack: `과제를 풀지 않고 보상만 얻는 꼼수를 어떻게 막는지 보는 장면입니다. 논문은 이 꼼수를 reward hacking이라고 부릅니다 (§4.2.6, 그림 6). 그림은 가운데의 RL Training 하나에서 시작해서, 꼼수가 들어오는 길과 그것을 막는 장치 세 개를 차례로 붙여 갑니다. 마지막에 나오는 ${HACK_SHARE_CEILING}%는 논문 숫자입니다.`,
    'hack/leak':
      'reward hacking은 환경이나 채점의 빈틈을 이용해 높은 보상을 받는 행동입니다. 학습이 이 행동을 강화하면 점수는 오르는데 실력은 늘지 않습니다 (§4.2.6). 저장소의 버그를 고치는 과제에서 되풀이된 형태는 정답 유출입니다. 표 2에 다섯 가지 사례가 실려 있습니다. 패키지의 새 버전을 설치해서 고쳐진 소스를 읽고, 원본 저장소에서 파일을 내려받고, 저장소를 통째로 clone하고, issue에 달린 수정 내역을 찾아보고, 어느 버전에서 고쳐졌는지 뒤져 봅니다. 이렇게 만든 패치도 테스트는 통과합니다. 하지만 버그 보고서와 주어진 코드만 보고 고친 것은 아닙니다.',
    'hack/clean':
      '첫째 장치는 학습 전의 환경 정리입니다 (§4.2.6). 환경을 만들 때 기준 패치를 넣고 빌드하면 정답을 드러내는 흔적이 남습니다. 그래서 빌드 로그, 검증기 출력, 남은 패치, 생성된 바이너리와 바이트코드, 캐시를 지웁니다. Git 기록은 과제의 기준 commit까지만 남깁니다. 네트워크는 컨테이너 단위로 막아서 원본 저장소나 다른 버전의 패키지에 닿지 못하게 합니다. 정답을 가져오지 말라는 지시문도 함께 넣습니다. 이보다 앞선 Mid-training에서도 손을 썼습니다. 초기 실험에서 나온 꼼수 사례를, 모델이 잘못된 추론을 스스로 짚고 과제 명세에 근거한 행동으로 이어 가는 예제로 고쳐서 학습 데이터에 넣었습니다.',
    'hack/attack': `둘째 장치는 Hack Agent입니다. 정리한 환경을 일부러 뚫어 보는 전용 agent입니다 (§4.2.6). 초기 실험에서 본 사례를 길잡이로 주면, 알려진 길을 확인하면서 새 길도 찾습니다. 여기서 찾은 구멍으로 정리 절차와 접근 제한을 고치고, 고친 환경에 Hack Agent를 다시 돌립니다. 그림 6 (b)의 위쪽 그래프가 이 반복입니다. 첫 라운드에는 거의 모든 환경이 뚫렸습니다. 데이터셋 네 개 가운데 ${H.twoRoundDatasets}개는 두 번째 라운드에 뚫리는 환경의 비율이 데이터셋에 따라 약 ${H.twoRoundLo}%에서 ${H.twoRoundHi}% 수준까지 내려갔고, 나머지 하나는 ${H.slowRounds}번째 라운드에도 약 ${H.slowLeft}%가 남았습니다. 이 숫자는 그래프에서 읽은 근사값입니다. 논문은 어느 환경에서도 뚫는 방법을 더 찾지 못할 때까지 이 과정을 계속했다고 적습니다.`,
    'hack/audit':
      '셋째 장치는 학습 중의 감사입니다. 모델이 바뀌면 학습 전의 점검에서는 나오지 않던 지름길을 새로 찾을 수 있기 때문입니다 (§4.2.6). 그래서 학습 내내 풀이를 오프라인으로 감사하고, 거기서 찾은 약점으로 환경 정리와 접근 제한을 다시 고칩니다. 화면에서 풀이 감사에서 환경 정리로 돌아가는 선이 이것입니다. 채점 단계에서도 따로 막습니다. 뒤에서 볼 Groupwise Grader가 꼼수로 확인된 풀이의 보상을 0으로 바꾼 다음에 그룹의 평균과 평균과의 차이를 다시 계산합니다 (§4.3.2).',
    'hack/rate': `결과입니다. 이 보정을 켠 상태에서 확인된 꼼수의 비율은 Flash와 Pro 모두 학습 내내 ${HACK_SHARE_CEILING}% 아래였습니다 (§4.2.6). 그림 6 (b)의 아래쪽 그래프를 보면 30 스텝 동안 대략 ${detectedHackRange.lo}%에서 ${detectedHackRange.hi}% 사이를 오르내립니다. 이 범위는 그래프에서 읽은 근사값입니다. 0이 되지는 않았다는 점도 짚습니다. 다만 확인된 꼼수는 보상이 0으로 바뀌므로 학습에서 강화되지 않습니다.`,

    // ── 14 · multi-harness ────────────────────────────────────────────────────
    harness:
      'harness를 바꿔도 실력이 따라오는지 보는 장면입니다 (§4.2.5, §5.3, 그림 10). 세로축은 DeepSWE v1.1의 Pass@1, 곧 한 번 풀어서 통과한 비율이고, 가로축은 RL 스텝입니다. 두 선은 그림 10의 굵은 평균선 둘이고, 그래프에서 읽은 근사값입니다.',
    'harness/mini': `harness는 모델을 감싸는 프로그램입니다. 시스템 프롬프트를 주고, 도구를 쥐여 주고, 문맥을 관리하면서 agent의 반복을 돌립니다 (§4.2.5). harness 하나에서만 학습하면 푸는 요령이 그 harness의 구현에 묶여서 다른 곳으로 옮겨 가지 않을 수 있습니다. 그렇다고 MiMo Code나 Codex 같은 실제 제품을 그대로 쓰기도 어렵습니다. 제품에는 안전장치와 지시 프롬프트가 많이 붙어 있는데 과제 보상은 이것을 재지 않습니다. 부품이 서로 얽혀 있어서 하나만 바꿔 볼 수도 없습니다. 그래서 MiMo는 최소한의 agent 반복 하나에서 출발해 Code, General, Visual, Cyber용 mini-harness를 여러 개 만들었습니다. 파란 선은 학습에 쓴 mini-harness ${TRAINING_HARNESSES}개의 평균이고, 약 ${whole(F.trainingStart)}%에서 ${whole(F.trainingEnd)}%로 올랐습니다.`,
    'harness/heldout': `금색 선은 학습에 한 번도 쓰지 않은 harness ${HELD_OUT_HARNESSES.length}개의 평균입니다. ${HELD_OUT_HARNESSES.join(', ')}입니다 (§5.3). 논문은 체크포인트마다 오르내림은 있어도 셋 모두 학습이 진행될수록 올랐다고 적습니다. 처음 보는 harness에서도 같이 오른다는 것은, 모델이 배운 것이 특정 harness의 요령이 아니라 코딩 실력이라는 근거입니다.`,
    'harness/gap': `처음 보는 harness의 평균 Pass@1은 약 ${whole(F.heldOutStart)}%에서 ${whole(F.heldOutEnd)}%로 올랐습니다 (§5.3). 학습에 쓴 harness와의 차이도 줄었습니다. 그래프에서 읽은 값으로 첫 체크포인트에서는 약 ${one(F.gapStart)}점, 마지막에는 약 ${one(F.gapEnd)}점 차이입니다. 논문은 이 결과를, 가볍고 조립할 수 있는 mini-harness로 다양성을 넣은 설계가 통했다는 근거로 듭니다.`,
  },
};
