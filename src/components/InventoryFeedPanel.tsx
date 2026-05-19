import React, {useCallback, useEffect, useState} from 'react';

import {api, type DealerInventoryFeed} from '../api';
import {formatDateTime} from '../lib/format';
import {toast} from '../lib/toast';
import {toUserMessage} from '../lib/userMessage';

export function InventoryFeedPanel({dealerId}: {dealerId: number}) {
  const [feed, setFeed] = useState<DealerInventoryFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedUrl, setFeedUrl] = useState('');
  const [mode, setMode] = useState('UPSERT');
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState<'save' | 'sync' | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const f = await api.getInventoryFeed(dealerId);
      setFeed(f);
      setFeedUrl(f.feedUrl ?? '');
      setMode(f.mode ?? 'UPSERT');
      setEnabled(f.enabled);
    } catch {
      // No feed configured yet — that's fine; keep the empty form.
      setFeed(null);
    } finally {
      setLoading(false);
    }
  }, [dealerId]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const save = async () => {
    if (!feedUrl.trim()) {
      toast.error('A feed URL is required.');
      return;
    }
    setBusy('save');
    try {
      const f = await api.configureInventoryFeed(dealerId, {
        feedUrl: feedUrl.trim(),
        mode,
        enabled,
      });
      setFeed(f);
      toast.success('Inventory feed saved.');
    } catch (e) {
      toast.error(toUserMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const sync = async () => {
    setBusy('sync');
    try {
      const r = await api.syncInventoryFeed(dealerId);
      toast.success(
        `Synced: ${r.createdCount} created · ${r.updatedCount} updated · ${r.rejectedCount} rejected.`,
      );
      await load();
    } catch (e) {
      toast.error(toUserMessage(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="dealer-inv-csv panel">
      <h3 className="panel-title">Automated inventory feed</h3>
      <p className="field-hint">
        Point us at your DMS/feed URL and we’ll keep your listings in sync.
        {feed?.lastSyncedAt
          ? ` Last sync ${formatDateTime(feed.lastSyncedAt)} — ${
              feed.lastSyncStatus ?? 'unknown'
            }.`
          : ' Not synced yet.'}
      </p>
      {loading ? (
        <div className="skeleton-block" aria-busy="true">
          <span className="skeleton-line" />
        </div>
      ) : (
        <>
          <div className="dealer-inv-grid">
            <label className="field" style={{gridColumn: '1 / -1'}}>
              <span>Feed URL</span>
              <input
                value={feedUrl}
                onChange={e => setFeedUrl(e.target.value)}
                placeholder="https://feeds.example.com/dealer.csv"
              />
            </label>
            <label className="field">
              <span>Mode</span>
              <select value={mode} onChange={e => setMode(e.target.value)}>
                <option value="UPSERT">Upsert</option>
                <option value="CREATE_ONLY">Create only</option>
              </select>
            </label>
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={enabled}
                onChange={e => setEnabled(e.target.checked)}
              />
              <span>Enabled</span>
            </label>
          </div>
          <div className="inline-actions">
            <button
              type="button"
              className="primary-button"
              disabled={busy === 'save'}
              onClick={() => save().catch(() => {})}>
              {busy === 'save' ? 'Saving…' : 'Save feed'}
            </button>
            <button
              type="button"
              className="secondary-button"
              disabled={busy === 'sync' || !feed}
              onClick={() => sync().catch(() => {})}>
              {busy === 'sync' ? 'Syncing…' : 'Sync now'}
            </button>
          </div>
          {feed?.lastSyncDetail ? (
            <p className="field-hint">{feed.lastSyncDetail}</p>
          ) : null}
        </>
      )}
    </section>
  );
}
