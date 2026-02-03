export interface GapInfo {
  id: string;
  position: { from: number; to: number };
  originalText: string;
}

export interface ConstraintInfo {
  text: string;
  position: { from: number; to: number };
}

export type GenerateMode = 'regenerate' | 'selection' | 'continuation';

export interface GenerateRequest {
  goal: string;
  document: string;
  gaps: GapInfo[];
  constraints: ConstraintInfo[];
  userRequest?: string;
  mode: GenerateMode;
}

export interface GenerateResponse {
  gaps: Array<{ id: string; text: string }>;
}

export interface GenerateError {
  error: string;
  retryable: boolean;
}
