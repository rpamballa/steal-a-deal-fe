/**
 * Maps any thrown error into a calm, user-safe sentence.
 * Never surfaces HTTP status text, stack traces, URLs, or the word
 * "backend" to an end user.
 */
export function toUserMessage(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';

  const text = raw.trim();

  if (!text) {
    return 'Something went wrong. Please try again.';
  }

  // Network / connectivity
  if (
    /failed to fetch|network|networkerror|load failed|connection|timeout|timed out/i.test(
      text,
    )
  ) {
    return 'We could not reach the service. Check your connection and try again.';
  }

  // Auth / session
  if (/\b401\b|unauthorized|token|expired|forbidden|\b403\b/i.test(text)) {
    return 'Your session has expired. Please sign in again.';
  }

  // Not found
  if (/\b404\b|not found/i.test(text)) {
    return "We couldn't find what you were looking for. It may have changed.";
  }

  // Conflict / validation echoed from the server
  if (/\b409\b|already exists|conflict|duplicate/i.test(text)) {
    return 'That action conflicts with the current state. Refresh and try again.';
  }

  // Server-side failure
  if (/\b5\d{2}\b|internal server|server error|unexpected/i.test(text)) {
    return 'Something went wrong on our end. Please try again in a moment.';
  }

  // A clean, human server validation message (no technical noise) — pass through.
  if (
    text.length <= 160 &&
    !/[{}<>]|https?:\/\/|status\s*\d{3}|\bGET\b|\bPOST\b|\bPATCH\b|exception|stack/i.test(
      text,
    )
  ) {
    return text;
  }

  return 'Something went wrong. Please try again.';
}
