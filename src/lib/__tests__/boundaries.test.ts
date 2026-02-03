import { describe, it, expect } from 'vitest';
import { Schema } from '@tiptap/pm/model';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import {
  getWordBoundary,
  getPhraseBoundary,
  getSentenceBoundary,
  posToCharIndex,
  charIndexToPos,
} from '../boundaries';

// --- Test Helper: Create ProseMirror doc from text ---

const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: {
      content: 'inline*',
      group: 'block',
      parseDOM: [{ tag: 'p' }],
      toDOM() {
        return ['p', 0];
      },
    },
    text: { group: 'inline' },
  },
});

function createDoc(text: string): ProseMirrorNode {
  const paragraphs = text.split('\n').map((line) =>
    schema.nodes.paragraph.create(
      null,
      line.length > 0 ? [schema.text(line)] : [],
    ),
  );
  return schema.nodes.doc.create(null, paragraphs);
}

function getTextAt(doc: ProseMirrorNode, from: number, to: number): string {
  return doc.textBetween(from, to, '', '');
}

// --- posToCharIndex / charIndexToPos ---

describe('posToCharIndex', () => {
  it('converts position 0 to char index 0', () => {
    const doc = createDoc('Hello world');
    // Position 0 is before the paragraph node, position 1 is start of text
    expect(posToCharIndex(doc, 1)).toBe(0);
  });

  it('converts mid-text position correctly', () => {
    const doc = createDoc('Hello world');
    // Position 1 = 'H', position 6 = ' ', position 7 = 'w'
    expect(posToCharIndex(doc, 6)).toBe(5);
  });
});

describe('charIndexToPos', () => {
  it('converts char index 0 to document position', () => {
    const doc = createDoc('Hello world');
    expect(charIndexToPos(doc, 0)).toBe(1); // +1 for paragraph opening
  });

  it('converts mid-text char index correctly', () => {
    const doc = createDoc('Hello world');
    const pos = charIndexToPos(doc, 5);
    expect(pos).toBe(6); // 'H'(1) + 5 chars = 6
  });

  it('handles end of text', () => {
    const doc = createDoc('Hello');
    const pos = charIndexToPos(doc, 5);
    expect(pos).toBe(6); // 1 + 5
  });
});

// --- getWordBoundary ---

describe('getWordBoundary', () => {
  it('selects a single word', () => {
    const doc = createDoc('The quick brown fox');
    // Click on 'quick' (position within 'quick': char index 4-9)
    const pos = charIndexToPos(doc, 5); // 'u' in 'quick'
    const range = getWordBoundary(doc, pos);
    expect(getTextAt(doc, range.from, range.to)).toBe('quick');
  });

  it('selects the first word', () => {
    const doc = createDoc('Hello world');
    const pos = charIndexToPos(doc, 2); // 'l' in 'Hello'
    const range = getWordBoundary(doc, pos);
    expect(getTextAt(doc, range.from, range.to)).toBe('Hello');
  });

  it('selects the last word', () => {
    const doc = createDoc('Hello world');
    const pos = charIndexToPos(doc, 8); // 'r' in 'world'
    const range = getWordBoundary(doc, pos);
    expect(getTextAt(doc, range.from, range.to)).toBe('world');
  });

  it('includes attached punctuation', () => {
    const doc = createDoc('Hello, world.');
    const pos = charIndexToPos(doc, 4); // 'o' in 'Hello,'
    const range = getWordBoundary(doc, pos);
    expect(getTextAt(doc, range.from, range.to)).toBe('Hello,');
  });

  it('handles single word document', () => {
    const doc = createDoc('Word');
    const pos = charIndexToPos(doc, 2);
    const range = getWordBoundary(doc, pos);
    expect(getTextAt(doc, range.from, range.to)).toBe('Word');
  });
});

// --- getSentenceBoundary ---

describe('getSentenceBoundary', () => {
  it('selects a full sentence', () => {
    const doc = createDoc('First sentence. Second sentence. Third sentence.');
    // Click within 'Second sentence.'
    const pos = charIndexToPos(doc, 20); // 'c' in 'Second'
    const range = getSentenceBoundary(doc, pos);
    expect(getTextAt(doc, range.from, range.to)).toBe('Second sentence.');
  });

  it('selects the first sentence', () => {
    const doc = createDoc('First sentence. Second sentence.');
    const pos = charIndexToPos(doc, 3); // 's' in 'First'
    const range = getSentenceBoundary(doc, pos);
    expect(getTextAt(doc, range.from, range.to)).toBe('First sentence.');
  });

  it('selects the last sentence', () => {
    const doc = createDoc('First. Last sentence.');
    const pos = charIndexToPos(doc, 10); // 's' in 'sentence'
    const range = getSentenceBoundary(doc, pos);
    expect(getTextAt(doc, range.from, range.to)).toBe('Last sentence.');
  });

  it('handles question mark as terminator', () => {
    const doc = createDoc('Is this a question? Yes it is.');
    const pos = charIndexToPos(doc, 10); // within first sentence
    const range = getSentenceBoundary(doc, pos);
    expect(getTextAt(doc, range.from, range.to)).toBe('Is this a question?');
  });

  it('handles exclamation mark as terminator', () => {
    const doc = createDoc('What a surprise! Indeed.');
    const pos = charIndexToPos(doc, 5); // within first sentence
    const range = getSentenceBoundary(doc, pos);
    expect(getTextAt(doc, range.from, range.to)).toBe('What a surprise!');
  });

  it('handles text without sentence terminators', () => {
    const doc = createDoc('No punctuation at end');
    const pos = charIndexToPos(doc, 5);
    const range = getSentenceBoundary(doc, pos);
    expect(getTextAt(doc, range.from, range.to)).toBe('No punctuation at end');
  });
});

// --- getPhraseBoundary ---

describe('getPhraseBoundary', () => {
  it('selects a phrase delimited by comma', () => {
    const doc = createDoc('The quick brown fox, the lazy dog.');
    // Click within 'The quick brown fox'
    const pos = charIndexToPos(doc, 5); // 'u' in 'quick'
    const range = getPhraseBoundary(doc, pos);
    expect(getTextAt(doc, range.from, range.to)).toBe('The quick brown fox');
  });

  it('selects phrase after comma', () => {
    const doc = createDoc('First part, second part.');
    // Click within 'second part'
    const pos = charIndexToPos(doc, 15); // within 'second'
    const range = getPhraseBoundary(doc, pos);
    expect(getTextAt(doc, range.from, range.to)).toBe('second part.');
  });

  it('selects phrase delimited by semicolon', () => {
    const doc = createDoc('Part one; part two.');
    const pos = charIndexToPos(doc, 3); // within 'Part one'
    const range = getPhraseBoundary(doc, pos);
    expect(getTextAt(doc, range.from, range.to)).toBe('Part one');
  });

  it('selects phrase delimited by conjunction "and"', () => {
    const doc = createDoc('Dogs and cats live here.');
    const pos = charIndexToPos(doc, 1); // within 'Dogs'
    const range = getPhraseBoundary(doc, pos);
    expect(getTextAt(doc, range.from, range.to)).toBe('Dogs');
  });

  it('selects phrase delimited by conjunction "but"', () => {
    const doc = createDoc('I tried but failed.');
    const pos = charIndexToPos(doc, 1); // within 'I tried'
    const range = getPhraseBoundary(doc, pos);
    expect(getTextAt(doc, range.from, range.to)).toBe('I tried');
  });

  it('returns full sentence when no delimiters exist', () => {
    const doc = createDoc('Simple sentence here.');
    const pos = charIndexToPos(doc, 8); // within sentence
    const range = getPhraseBoundary(doc, pos);
    expect(getTextAt(doc, range.from, range.to)).toBe('Simple sentence here.');
  });
});
