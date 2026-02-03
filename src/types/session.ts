import type { JSONContent } from '@tiptap/react';
import type { ProvenanceEvent } from './provenance';
import type { SegmentScore } from './editor';

export interface Session {
  id: string;
  goal: string;
  goalHistory: GoalChange[];
  documentState: JSONContent;
  provenanceLog: ProvenanceEvent[];
  relianceScores: SegmentScore[];
  createdAt: number;
  lastModifiedAt: number;
}

export interface GoalChange {
  previousGoal: string;
  newGoal: string;
  source: GoalChangeSource;
  timestamp: number;
}

export type GoalChangeSource = 'manual' | 'process2' | 'inferred';
