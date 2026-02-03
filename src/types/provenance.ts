export type EventType =
  | 'text-typed'
  | 'ai-generation-requested'
  | 'ai-generation-received'
  | 'mark-applied'
  | 'edit-in-place'
  | 'prompt-request'
  | 'diff-resolved'
  | 'pushback-shown'
  | 'pushback-response'
  | 'process2-shown'
  | 'process2-response'
  | 'awareness-toggled'
  | 'goal-changed';

export interface ProvenanceEvent {
  id: string;
  type: EventType;
  timestamp: number;
  data: Record<string, unknown>;
}
