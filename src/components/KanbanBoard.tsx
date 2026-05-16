import React, {useMemo} from 'react';

import type {Deal, DealStage} from '../api';

type Props = {
  deals: Deal[];
  onSelectDeal?: (dealId: number) => void;
  selectedDealId?: number | null;
};

const columns: {stage: DealStage; label: string}[] = [
  {stage: 'INITIATED', label: 'Initiated'},
  {stage: 'OFFER_SENT', label: 'Offer sent'},
  {stage: 'DEPOSIT_PAID', label: 'Deposit paid'},
  {stage: 'DOCUMENTS_PENDING', label: 'Docs pending'},
  {stage: 'READY_FOR_HANDOFF', label: 'Ready for handoff'},
];

export function KanbanBoard({deals, onSelectDeal, selectedDealId}: Props) {
  const grouped = useMemo(() => {
    const map = new Map<DealStage, Deal[]>();
    for (const column of columns) {
      map.set(column.stage, []);
    }
    for (const deal of deals) {
      if (deal.stage === 'BUYER_CONFIRMED') {
        map.get('DEPOSIT_PAID')?.push(deal);
        continue;
      }
      const bucket = map.get(deal.stage);
      if (bucket) {
        bucket.push(deal);
      }
    }
    for (const bucket of map.values()) {
      bucket.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    }
    return map;
  }, [deals]);

  const totalDeals = useMemo(
    () =>
      columns.reduce((sum, column) => sum + (grouped.get(column.stage)?.length ?? 0), 0),
    [grouped],
  );

  if (totalDeals === 0) {
    return (
      <p className="kanban-empty">
        No active deals in any stage yet.
      </p>
    );
  }

  return (
    <div className="kanban-board" role="list">
      {columns.map(column => {
        const items = grouped.get(column.stage) ?? [];
        return (
          <div key={column.stage} className="kanban-column" role="listitem">
            <header className="kanban-column-header">
              <strong>{column.label}</strong>
              <span className="kanban-column-count">{items.length}</span>
            </header>
            <div className="kanban-column-body">
              {items.length === 0 ? (
                <p className="kanban-column-empty">No deals here.</p>
              ) : (
                items.map(deal => {
                  const days = daysSince(deal.updatedAt);
                  const stale = days >= 3;
                  return (
                    <button
                      type="button"
                      key={deal.id}
                      className={[
                        'kanban-card',
                        selectedDealId === deal.id ? 'selected' : '',
                        stale ? 'stale' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => onSelectDeal?.(deal.id)}>
                      <div className="kanban-card-title">{deal.vehicleTitle}</div>
                      <div className="kanban-card-buyer">{deal.buyerName}</div>
                      <div className="kanban-card-meta">
                        <span>{deal.depositPaid ? 'Deposit ✓' : 'No deposit'}</span>
                        <span className={stale ? 'kanban-card-stale' : ''}>
                          {days === 0 ? 'today' : `${days}d`}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function daysSince(iso: string) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 0;
  return Math.max(0, Math.floor((Date.now() - then) / 86_400_000));
}
