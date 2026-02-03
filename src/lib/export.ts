import type { Session } from '@/types';

/**
 * Format a date as YYYY-MM-DD.
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Export a session as a JSON file download.
 *
 * Creates a JSON blob from the session object, generates a temporary
 * object URL, triggers a download via an anchor element click, and
 * cleans up the object URL afterward.
 *
 * Filename format: cowrithink-session-{sessionId}-{YYYY-MM-DD}.json
 */
export function exportSession(session: Session): void {
  const json = JSON.stringify(session, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const dateStr = formatDate(new Date());
  const filename = `cowrithink-session-${session.id}-${dateStr}.json`;

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(url);
}
