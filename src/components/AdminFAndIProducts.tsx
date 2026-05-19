import React, {useCallback, useEffect, useState} from 'react';

import {
  api,
  type FAndIProduct,
  type FAndIProductType,
} from '../api';
import {formatCurrency, formatLabel} from '../lib/format';
import {toast} from '../lib/toast';
import {toUserMessage} from '../lib/userMessage';

const TYPES: FAndIProductType[] = [
  'EXTENDED_WARRANTY',
  'GAP_INSURANCE',
  'TIRE_AND_WHEEL',
  'PREPAID_MAINTENANCE',
  'APPEARANCE_PROTECTION',
];

export function AdminFAndIProducts() {
  const [products, setProducts] = useState<FAndIProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    type: 'EXTENDED_WARRANTY' as FAndIProductType,
    name: '',
    retailPrice: '',
    revenueShareRate: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProducts(await api.listFAndIProducts(false));
    } catch (e) {
      setError(toUserMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const create = async () => {
    const retailPrice = Number(form.retailPrice);
    const revenueShareRate = Number(form.revenueShareRate);
    if (!form.name.trim() || !Number.isFinite(retailPrice)) {
      toast.error('Name and a numeric retail price are required.');
      return;
    }
    setBusy(true);
    try {
      await api.createFAndIProduct({
        type: form.type,
        name: form.name.trim(),
        retailPrice,
        revenueShareRate: Number.isFinite(revenueShareRate)
          ? revenueShareRate
          : 0,
      });
      toast.success('Product created.');
      setForm({...form, name: '', retailPrice: '', revenueShareRate: ''});
      await load();
    } catch (e) {
      toast.error(toUserMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (p: FAndIProduct) => {
    try {
      await api.setFAndIProductActive(p.id, !p.active);
      await load();
    } catch (e) {
      toast.error(toUserMessage(e));
    }
  };

  return (
    <div className="stack">
      <section className="panel">
        <h3 className="panel-title">Add F&amp;I product</h3>
        <div className="dealer-inv-grid">
          <label className="field">
            <span>Type</span>
            <select
              value={form.type}
              onChange={e =>
                setForm({...form, type: e.target.value as FAndIProductType})
              }>
              {TYPES.map(t => (
                <option key={t} value={t}>
                  {formatLabel(t)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Name</span>
            <input
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              placeholder="Premium Extended Warranty"
            />
          </label>
          <label className="field">
            <span>Retail price (USD)</span>
            <input
              value={form.retailPrice}
              onChange={e =>
                setForm({...form, retailPrice: e.target.value})
              }
              placeholder="1899"
            />
          </label>
          <label className="field">
            <span>Revenue share rate (0–1)</span>
            <input
              value={form.revenueShareRate}
              onChange={e =>
                setForm({...form, revenueShareRate: e.target.value})
              }
              placeholder="0.2"
            />
          </label>
        </div>
        <div className="inline-actions">
          <button
            type="button"
            className="primary-button"
            disabled={busy}
            onClick={() => create().catch(() => {})}>
            {busy ? 'Saving…' : 'Add product'}
          </button>
        </div>
      </section>

      <section className="table-card">
        <div className="table-header">
          <h4>Catalog ({products.length})</h4>
        </div>
        {loading ? (
          <div className="skeleton-block" aria-busy="true">
            <span className="skeleton-line skeleton-line-lg" />
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
        ) : products.length === 0 ? (
          <p className="empty-state">No F&amp;I products yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Retail</th>
                <th>Rev share</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{formatLabel(p.type)}</td>
                  <td>{formatCurrency(p.retailPrice)}</td>
                  <td>{(p.revenueShareRate * 100).toFixed(1)}%</td>
                  <td>
                    <span
                      className={`listing-badge status-${
                        p.active ? 'live' : 'draft'
                      }`}>
                      {p.active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="ghost-button compact-button"
                      onClick={() => toggle(p).catch(() => {})}>
                      {p.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
