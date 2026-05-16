/**
 * Minimal URL <-> app-state sync (no router dependency).
 * Keeps view + key selections in the query string so deep links,
 * the browser Back button, and refresh all work.
 */

export type UrlState = {
  view: string | null;
  vehicle: number | null;
  dealer: number | null;
};

export function readUrlState(): UrlState {
  if (typeof window === 'undefined') {
    return {view: null, vehicle: null, dealer: null};
  }
  const params = new URLSearchParams(window.location.search);
  const num = (key: string) => {
    const raw = params.get(key);
    if (raw == null || raw === '') return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  };
  return {
    view: params.get('view'),
    vehicle: num('vehicle'),
    dealer: num('dealer'),
  };
}

function buildSearch(state: UrlState): string {
  const params = new URLSearchParams();
  if (state.view) params.set('view', state.view);
  if (state.vehicle != null) params.set('vehicle', String(state.vehicle));
  if (state.dealer != null) params.set('dealer', String(state.dealer));
  const query = params.toString();
  return query ? `?${query}` : window.location.pathname;
}

/**
 * Reflect state into the URL. `push` adds a history entry (so Back
 * works between views); otherwise replace (for incidental selection
 * changes that should not spam history).
 */
export function writeUrlState(state: UrlState, push: boolean) {
  if (typeof window === 'undefined') return;
  const next = buildSearch(state);
  const current = window.location.search || window.location.pathname;
  if (next === current) return;
  if (push) {
    window.history.pushState(null, '', next);
  } else {
    window.history.replaceState(null, '', next);
  }
}

export function onUrlPop(handler: (state: UrlState) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const listener = () => handler(readUrlState());
  window.addEventListener('popstate', listener);
  return () => window.removeEventListener('popstate', listener);
}
