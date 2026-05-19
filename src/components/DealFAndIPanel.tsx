import React, {useCallback, useEffect, useState} from 'react';

import {
  api,
  type FAndIProduct,
  type FAndISummary,
  type PlatformFee,
} from '../api';
import {formatCurrency, formatLabel} from '../lib/format';
import {toast} from '../lib/toast';
import {toUserMessage} from '../lib/userMessage';

type Props = {
  dealId: number;
  canManage: boolean; // dealer/admin can generate docs + attach F&I
  onDocsChanged?: () => void; // refresh the deal-room documents list
};

export function DealFAndIPanel({dealId, canManage, onDocsChanged}: Props) {
  const [summary, setSummary] = useState<FAndISummary | null>(null);
  const [products, setProducts] = useState<FAndIProduct[]>([]);
  const [fee, setFee] = useState<PlatformFee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, p, f] = await Promise.all([
        api.getDealFAndI(dealId),
        canManage ? api.listFAndIProducts(true) : Promise.resolve([]),
        api.getDealPlatformFee(dealId).catch(() => null),
      ]);
      setSummary(s);
      setProducts(p);
      setFee(f);
    } catch (e) {
      setError(toUserMessage(e));
    } finally {
      setLoading(false);
    }
  }, [dealId, canManage]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const run = async (key: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(key);
    try {
      await fn();
      toast.success(ok);
      await load();
      onDocsChanged?.();
    } catch (e) {
      toast.error(toUserMessage(e));
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="skeleton-block" aria-busy="true" aria-label="Loading">
        <span className="skeleton-line skeleton-line-lg" />
        <span className="skeleton-line" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="stack">
        <div className="notice error">{error}</div>
        <button
          type="button"
          className="secondary-button"
          onClick={() => load().catch(() => {})}>
          Retry
        </button>
      </div>
    );
  }

  const attachedIds = new Set((summary?.items ?? []).map(i => i.productId));
  const available = products.filter(p => p.active && !attachedIds.has(p.id));

  return (
    <div className="fni-panel">
      {canManage ? (
        <section className="fni-block">
          <h4 className="panel-title">Required disclosures</h4>
          <p className="field-hint">
            Generate the buyer’s agreement and the regulatory odometer +
            AS-IS disclosures. The deal cannot complete documents without
            them.
          </p>
          <div className="inline-actions">
            <button
              type="button"
              className="secondary-button compact-button"
              disabled={busy === 'ba'}
              onClick={() =>
                run(
                  'ba',
                  () => api.generateBuyerAgreement(dealId),
                  'Buyer agreement generated.',
                )
              }>
              {busy === 'ba' ? '…' : 'Buyer agreement'}
            </button>
            <button
              type="button"
              className="secondary-button compact-button"
              disabled={busy === 'odo'}
              onClick={() =>
                run(
                  'odo',
                  () => api.generateOdometerDisclosure(dealId),
                  'Odometer disclosure generated.',
                )
              }>
              {busy === 'odo' ? '…' : 'Odometer disclosure'}
            </button>
            <button
              type="button"
              className="secondary-button compact-button"
              disabled={busy === 'asis'}
              onClick={() =>
                run(
                  'asis',
                  () => api.generateAsIsDisclosure(dealId),
                  'AS-IS disclosure generated.',
                )
              }>
              {busy === 'asis' ? '…' : 'AS-IS disclosure'}
            </button>
          </div>
        </section>
      ) : null}

      <section className="fni-block">
        <h4 className="panel-title">F&amp;I products</h4>
        {summary && summary.items.length > 0 ? (
          <ul className="fni-list">
            {summary.items.map(item => (
              <li key={item.id} className="fni-row">
                <div>
                  <strong>{item.productName}</strong>
                  <span className="fni-meta">{formatLabel(item.type)}</span>
                </div>
                <span className="fni-price">{formatCurrency(item.price)}</span>
                {canManage ? (
                  <button
                    type="button"
                    className="ghost-button compact-button"
                    disabled={busy === `rm${item.id}`}
                    onClick={() =>
                      run(
                        `rm${item.id}`,
                        () => api.removeFAndI(dealId, item.id),
                        'Product removed.',
                      )
                    }>
                    Remove
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="field-hint">No F&amp;I products on this deal.</p>
        )}
        {summary ? (
          <p className="fni-total">
            Total: <strong>{formatCurrency(summary.totalRetail)}</strong>
          </p>
        ) : null}

        {canManage && available.length > 0 ? (
          <div className="fni-add">
            <span className="field-hint">Add a product:</span>
            <div className="chip-row">
              {available.map(p => (
                <button
                  key={p.id}
                  type="button"
                  className="secondary-button compact-button"
                  disabled={busy === `add${p.id}`}
                  onClick={() =>
                    run(
                      `add${p.id}`,
                      () => api.attachFAndI(dealId, p.id),
                      `${p.name} added.`,
                    )
                  }>
                  {p.name} · {formatCurrency(p.retailPrice)}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {fee ? (
        <section className="fni-block">
          <h4 className="panel-title">Platform fee</h4>
          <p className="field-hint">
            {formatCurrency(fee.feeAmount)} ({(fee.feeRate * 100).toFixed(2)}%
            of {formatCurrency(fee.vehiclePrice)}) —{' '}
            {fee.settled ? 'settled' : 'due at close'}.
          </p>
        </section>
      ) : null}
    </div>
  );
}
