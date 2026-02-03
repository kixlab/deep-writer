import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Session } from '@/types';
import { exportSession } from '../export';

function createMockSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'export-test-1',
    goal: 'Write about testing',
    goalHistory: [],
    documentState: { type: 'doc', content: [] },
    provenanceLog: [],
    relianceScores: [],
    createdAt: 1700000000000,
    lastModifiedAt: 1700000000000,
    ...overrides,
  };
}

describe('exportSession', () => {
  let mockClick: ReturnType<typeof vi.fn>;
  let mockCreateObjectURL: ReturnType<typeof vi.fn>;
  let mockRevokeObjectURL: ReturnType<typeof vi.fn>;
  let capturedAnchor: HTMLAnchorElement;

  beforeEach(() => {
    mockClick = vi.fn();
    mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    mockRevokeObjectURL = vi.fn();

    vi.stubGlobal('URL', {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    });

    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        capturedAnchor = {
          href: '',
          download: '',
          click: mockClick,
        } as unknown as HTMLAnchorElement;
        return capturedAnchor;
      }
      return document.createElement(tag);
    });

    // Fix the date to 2025-01-15 for deterministic filename
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('should create a JSON blob with the session data', () => {
    const session = createMockSession();
    exportSession(session);

    expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
    const blobArg = mockCreateObjectURL.mock.calls[0][0] as Blob;
    expect(blobArg).toBeInstanceOf(Blob);
    expect(blobArg.type).toBe('application/json');
  });

  it('should produce correct JSON content in the blob', async () => {
    const session = createMockSession();
    exportSession(session);

    const blobArg = mockCreateObjectURL.mock.calls[0][0] as Blob;
    const text = await blobArg.text();
    const parsed = JSON.parse(text);

    expect(parsed).toEqual(session);
    expect(parsed.id).toBe('export-test-1');
    expect(parsed.goal).toBe('Write about testing');
  });

  it('should set the correct filename with session ID and date', () => {
    const session = createMockSession({ id: 'my-session-42' });
    exportSession(session);

    expect(capturedAnchor.download).toBe(
      'cowrithink-session-my-session-42-2025-01-15.json',
    );
  });

  it('should set the anchor href to the object URL', () => {
    const session = createMockSession();
    exportSession(session);

    expect(capturedAnchor.href).toBe('blob:mock-url');
  });

  it('should trigger a click on the anchor element', () => {
    const session = createMockSession();
    exportSession(session);

    expect(mockClick).toHaveBeenCalledTimes(1);
  });

  it('should revoke the object URL after download', () => {
    const session = createMockSession();
    exportSession(session);

    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    expect(mockRevokeObjectURL).toHaveBeenCalledTimes(1);
  });

  it('should call operations in the correct order: create URL, click, revoke', () => {
    const callOrder: string[] = [];
    mockCreateObjectURL.mockImplementation(() => {
      callOrder.push('createObjectURL');
      return 'blob:mock-url';
    });
    mockClick.mockImplementation(() => {
      callOrder.push('click');
    });
    mockRevokeObjectURL.mockImplementation(() => {
      callOrder.push('revokeObjectURL');
    });

    const session = createMockSession();
    exportSession(session);

    expect(callOrder).toEqual(['createObjectURL', 'click', 'revokeObjectURL']);
  });
});
