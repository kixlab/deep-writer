import type { ProvenanceEvent } from './provenance';

export type RoundType = 'generation' | 'alternative';
export type Dimension = 'd1' | 'd2' | 'd3';
export type ContributionLevel = 1 | 2 | 3 | 4 | 5;

export interface RoundMetadata {
  roundId: string;
  roundNumber: number;
  type: RoundType;
  timestamp: number;
  parentRounds: string[];
  prompt: string | null;
  promptLength: number;
  constraintCount: number;
  constraintTypes: string[];
  generationMode: string;
  diffActions: { accepted: number; rejected: number; edited: number };
  events: ProvenanceEvent[];
}

export interface Edge {
  to: string;
  dimension: Dimension;
  strength: number; // 0.0 to 1.0
  reason: string;
}

export interface RoundNodeScores {
  d1: number;
  d2: number;
  d3: number;
}

export interface RoundNodeMetadata {
  prompt: string | null;
  constraints: string[];
  action: string;
  type: RoundType;
}

export interface RoundNodeNarrative {
  conceptsPreserved: string[];
  conceptsAdded: string[];
  conceptsLost: string[];
  summary: string;
}

export interface RoundNode {
  roundId: string;
  scores: RoundNodeScores;
  edges: Edge[];
  metadata: RoundNodeMetadata;
  narrative: RoundNodeNarrative | null;
}

export interface RoundAnalysis {
  roundId: string;
  scores: RoundNodeScores;
  edges: Edge[];
  conceptsPreserved: string[];
  conceptsAdded: string[];
  conceptsLost: string[];
  narrativeSummary: string;
}
