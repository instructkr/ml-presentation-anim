/**
 * The RL task mix (§5.1, "RL Settings"): the share of each domain in the
 * mixed-task run, in percent. These are the paper's numbers, not examples.
 * `label` is what the chart prints under the bar; `paper` is the report's own
 * name for the domain.
 */
export interface TaskDomain {
  id: 'code' | 'general' | 'visual' | 'context' | 'cyber';
  label: string;
  paper: string;
  /** percent of the RL tasks */
  share: number;
}

export const TASK_MIX: TaskDomain[] = [
  { id: 'code', label: '코딩', paper: 'agentic and competitive coding', share: 68 },
  { id: 'general', label: '도구 사용', paper: 'general tool use', share: 12 },
  { id: 'visual', label: '디자인', paper: 'aesthetic design', share: 13 },
  { id: 'context', label: '문맥 따르기', paper: 'context following', share: 3 },
  { id: 'cyber', label: '보안', paper: 'cyber security', share: 4 },
];

export const taskIndex = (id: TaskDomain['id']): number => TASK_MIX.findIndex((d) => d.id === id);
export const taskShare = (id: TaskDomain['id']): number => TASK_MIX[taskIndex(id)]!.share;
