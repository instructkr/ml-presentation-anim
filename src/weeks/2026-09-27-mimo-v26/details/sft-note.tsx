import React from 'react';

/** The `sft` node opens this note: the paper says almost nothing about the stage, and the note says so. */
export const sftNote = (
  <>
    <p>논문은 RL 앞에 짧은 SFT(지도 미세조정) 단계를 둔다고만 적는다 (§4). 데이터 구성이나 학습 길이는 밝히지 않는다.</p>
    <p>
      대신 이 단계가 RL에 넘겨주는 것은 분명히 적혀 있다. RL은 SFT 체크포인트의 FP32 마스터 가중치와, Muown이 행마다
      들고 있는 옵티마이저 상태를 그대로 이어받아 시작한다. 논문은 그 이유를 MXFP4 학습을 안정시키기 위해서라고
      설명한다 (§5.1).
    </p>
  </>
);
