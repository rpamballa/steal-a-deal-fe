import React, {useState} from 'react';

import type {Favorite, SavedSearch} from '../api';

type Props = {
  favorites: Favorite[];
  savedSearches: SavedSearch[];
  pendingFavoriteId: number | null;
  onOpenVehicle: (vehicleId: number) => void;
  onRemoveFavorite: (vehicleId: number) => void;
  onApplySearch: (search: SavedSearch) => void;
  onToggleAlert: (search: SavedSearch) => void;
  onRenameSearch: (search: SavedSearch, name: string) => void;
  onDeleteSearch: (id: number) => void;
  onBrowse: () => void;
};

function usd(n: number) {
  return n.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

function describeQuery(s: SavedSearch): string {
  const q = s.query;
  const parts: string[] = [];
  if (q.q) parts.push(`“${q.q}”`);
  if (q.make) parts.push(q.make);
  if (q.model) parts.push(q.model);
  if (q.minYear) parts.push(`${q.minYear}+`);
  if (q.maxMileage) parts.push(`≤${q.maxMileage.toLocaleString()} mi`);
  if (q.maxPrice) parts.push(`≤${usd(q.maxPrice)}`);
  if (q.status && q.status !== 'LIVE') parts.push(q.status);
  return parts.length ? parts.join(' · ') : 'All cars';
}

export function GarageView({
  favorites,
  savedSearches,
  pendingFavoriteId,
  onOpenVehicle,
  onRemoveFavorite,
  onApplySearch,
  onToggleAlert,
  onRenameSearch,
  onDeleteSearch,
  onBrowse,
}: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftName, setDraftName] = useState('');
  return (
    <div className="garage">
      <section className="garage-section">
        <h3 className="panel-title">Saved cars ({favorites.length})</h3>
        {favorites.length === 0 ? (
          <div className="garage-empty">
            <p>
              No saved cars yet. Tap the heart on any listing to keep it here
              and track price drops.
            </p>
            <button
              type="button"
              className="primary-button"
              onClick={onBrowse}>
              Browse inventory
            </button>
          </div>
        ) : (
          <div className="garage-grid">
            {favorites.map(fav => {
              const v = fav.vehicle;
              return (
                <article key={fav.id} className="garage-card">
                  <img
                    className="garage-card-image"
                    src={v.primaryImageUrl}
                    alt={`${v.make} ${v.model}`}
                  />
                  <div className="garage-card-body">
                    <strong>
                      {v.modelYear} {v.make} {v.model}
                    </strong>
                    <span className="garage-card-price">{usd(v.price)}</span>
                    <span className="garage-card-meta">
                      {v.mileage.toLocaleString()} mi · {v.dealerName}
                    </span>
                  </div>
                  <div className="garage-card-actions">
                    <button
                      type="button"
                      className="primary-button compact-button"
                      onClick={() => onOpenVehicle(v.id)}>
                      View
                    </button>
                    <button
                      type="button"
                      className="ghost-button compact-button"
                      disabled={pendingFavoriteId === v.id}
                      onClick={() => onRemoveFavorite(v.id)}>
                      Remove
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="garage-section">
        <h3 className="panel-title">
          Saved searches ({savedSearches.length})
        </h3>
        {savedSearches.length === 0 ? (
          <p className="garage-hint">
            Save a search from the inventory filters to get notified when a
            matching car drops in price.
          </p>
        ) : (
          <ul className="saved-search-list">
            {savedSearches.map(s => (
              <li key={s.id} className="saved-search-row">
                <div className="saved-search-info">
                  {editingId === s.id ? (
                    <form
                      className="saved-search-rename"
                      onSubmit={e => {
                        e.preventDefault();
                        const next = draftName.trim();
                        if (next && next !== s.name) {
                          onRenameSearch(s, next);
                        }
                        setEditingId(null);
                      }}>
                      <input
                        autoFocus
                        value={draftName}
                        aria-label="Search name"
                        maxLength={60}
                        onChange={e => setDraftName(e.target.value)}
                      />
                      <button
                        type="submit"
                        className="secondary-button compact-button">
                        Save
                      </button>
                      <button
                        type="button"
                        className="ghost-button compact-button"
                        onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <strong>{s.name}</strong>
                  )}
                  <span>{describeQuery(s)}</span>
                  <span className="saved-search-count">
                    {s.lastMatchedCount} match
                    {s.lastMatchedCount === 1 ? '' : 'es'} when saved
                  </span>
                </div>
                <div className="saved-search-actions">
                  <label className="saved-search-alert">
                    <input
                      type="checkbox"
                      checked={s.alertOnPriceDrop}
                      onChange={() => onToggleAlert(s)}
                    />
                    <span>Price-drop alerts</span>
                  </label>
                  <button
                    type="button"
                    className="secondary-button compact-button"
                    onClick={() => onApplySearch(s)}>
                    Apply
                  </button>
                  {editingId === s.id ? null : (
                    <button
                      type="button"
                      className="ghost-button compact-button"
                      onClick={() => {
                        setEditingId(s.id);
                        setDraftName(s.name);
                      }}>
                      Rename
                    </button>
                  )}
                  <button
                    type="button"
                    className="ghost-button compact-button"
                    onClick={() => onDeleteSearch(s.id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
