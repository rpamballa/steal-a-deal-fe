import React, {useCallback, useEffect, useState} from 'react';

import {api, type AuditEvent} from '../api';
import {formatDateTime, formatLabel} from '../lib/format';
import {toUserMessage} from '../lib/userMessage';

export function AdminAudit() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dealId, setDealId] = useState('');
  const [actor, setActor] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEvents(
        await api.listAuditEvents({
          dealId: dealId ? Number(dealId) : undefined,
          actorReference: actor.trim() || undefined,
          limit: 200,
        }),
      );
    } catch (e) {
      setError(toUserMessage(e));
    } finally {
      setLoading(false);
    }
  }, [dealId, actor]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  return (
    <div className="stack">
      <section className="panel">
        <h3 className="panel-title">Filter audit trail</h3>
        <div className="dealer-inv-grid">
          <label className="field">
            <span>Deal ID</span>
            <input
              value={dealId}
              onChange={e => setDealId(e.target.value)}
              placeholder="(any)"
            />
          </label>
          <label className="field">
            <span>Actor reference</span>
            <input
              value={actor}
              onChange={e => setActor(e.target.value)}
              placeholder="email or id (any)"
            />
          </label>
        </div>
        <div className="inline-actions">
          <button
            type="button"
            className="primary-button"
            onClick={() => load().catch(() => {})}>
            Apply
          </button>
        </div>
      </section>

      <section className="table-card">
        <div className="table-header">
          <h4>Events ({events.length})</h4>
        </div>
        {loading ? (
          <div className="skeleton-block" aria-busy="true">
            <span className="skeleton-line skeleton-line-lg" />
            <span className="skeleton-line" />
            <span className="skeleton-line" />
          </div>
        ) : error ? (
          <div className="stack">
            <div className="notice error">{error}</div>
            <button
              type="button"
              className="secondary-button"
              onClick={() => load().catch(() => {})}>
              Retry
            </button>
          </div>
        ) : events.length === 0 ? (
          <p className="empty-state">No audit events match.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {events.map(ev => (
                <tr key={ev.id}>
                  <td>{formatDateTime(ev.createdAt)}</td>
                  <td>
                    {formatLabel(ev.actorType)}
                    <br />
                    <span className="muted-text">{ev.actorReference}</span>
                  </td>
                  <td>{formatLabel(ev.action)}</td>
                  <td>
                    {ev.entityType}
                    {ev.entityId != null ? ` #${ev.entityId}` : ''}
                    {ev.dealId != null ? ` (deal ${ev.dealId})` : ''}
                  </td>
                  <td className="muted-text">{ev.detail ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
