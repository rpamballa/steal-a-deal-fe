import React from 'react';

import type {DealerPortal} from '../api';

type Props = {
  portal: DealerPortal;
};

export function OperationsDashboard({portal}: Props) {
  const {overview, pipeline, queueSummary} = portal;

  const funnelStages = [
    {label: 'Leads', value: overview.leadCount},
    {label: 'New', value: overview.newLeadCount},
    {label: 'Qualified', value: overview.qualifiedLeadCount},
    {label: 'Appointments', value: overview.appointmentCount},
    {label: 'Deals open', value: overview.activeDealCount},
    {label: 'Completed', value: overview.completedDealCount},
  ];

  const funnelMax = Math.max(...funnelStages.map(stage => stage.value), 1);

  const inventorySplit = pipeline.inventoryStatusCounts;
  const inventoryTotal = inventorySplit.reduce(
    (sum, status) => sum + status.count,
    0,
  );

  const dealStageCounts = pipeline.dealStageCounts;
  const dealStageTotal = dealStageCounts.reduce(
    (sum, item) => sum + item.count,
    0,
  );

  return (
    <div className="ops-dashboard">
      <div className="ops-tile-row">
        <KpiTile
          label="Active deals"
          value={overview.activeDealCount}
          context={`${overview.readyForHandoffCount} ready for handoff`}
        />
        <KpiTile
          label="Stalled deals"
          value={overview.stalledDealCount}
          tone={overview.stalledDealCount > 0 ? 'warn' : undefined}
          context={`${overview.openTaskCount} open tasks`}
        />
        <KpiTile
          label="Inventory live"
          value={overview.liveInventoryCount}
          context={`${formatCurrency(overview.totalInventoryValue)} listed value`}
        />
        <KpiTile
          label="New leads"
          value={overview.newLeadCount}
          context={`${overview.qualifiedLeadCount} qualified`}
        />
      </div>

      <section className="ops-card">
        <header className="ops-card-header">
          <strong>Funnel</strong>
          <span className="ops-card-sub">From inquiry to close</span>
        </header>
        <ul className="ops-funnel">
          {funnelStages.map(stage => (
            <li key={stage.label}>
              <span className="ops-funnel-label">{stage.label}</span>
              <span
                className="ops-funnel-bar"
                style={{width: `${(stage.value / funnelMax) * 100}%`}}
                aria-hidden="true"
              />
              <span className="ops-funnel-value">{stage.value}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="ops-card-row">
        <section className="ops-card">
          <header className="ops-card-header">
            <strong>Inventory health</strong>
            <span className="ops-card-sub">{inventoryTotal} listings</span>
          </header>
          <ul className="ops-distribution">
            {inventorySplit.map(item => (
              <li key={item.code}>
                <span>{formatLabel(item.code)}</span>
                <span
                  className="ops-distribution-bar"
                  style={{
                    width: `${inventoryTotal === 0 ? 0 : (item.count / inventoryTotal) * 100}%`,
                  }}
                  aria-hidden="true"
                />
                <strong>{item.count}</strong>
              </li>
            ))}
          </ul>
        </section>

        <section className="ops-card">
          <header className="ops-card-header">
            <strong>Deal stages</strong>
            <span className="ops-card-sub">{dealStageTotal} active</span>
          </header>
          <ul className="ops-distribution">
            {dealStageCounts.map(item => (
              <li key={item.code}>
                <span>{formatLabel(item.code)}</span>
                <span
                  className="ops-distribution-bar"
                  style={{
                    width: `${dealStageTotal === 0 ? 0 : (item.count / dealStageTotal) * 100}%`,
                  }}
                  aria-hidden="true"
                />
                <strong>{item.count}</strong>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="ops-card">
        <header className="ops-card-header">
          <strong>Queue</strong>
          <span className="ops-card-sub">Where attention is needed</span>
        </header>
        <div className="ops-queue-row">
          <QueueTile label="Awaiting buyer" value={queueSummary.awaitingBuyerCount} />
          <QueueTile
            label="Needs doc review"
            value={queueSummary.needsDocumentReviewCount}
          />
          <QueueTile
            label="Ready for handoff"
            value={queueSummary.readyForHandoffCount}
            tone="good"
          />
          <QueueTile
            label="Stalled"
            value={queueSummary.stalledCount}
            tone={queueSummary.stalledCount > 0 ? 'warn' : undefined}
          />
        </div>
      </section>

      <p className="ops-disclaimer">
        Live operations metrics. Revenue, gross-per-unit, and the rep leaderboard
        are coming soon.
      </p>
    </div>
  );
}

function KpiTile({
  label,
  value,
  context,
  tone,
}: {
  label: string;
  value: number;
  context?: string;
  tone?: 'warn' | 'good';
}) {
  return (
    <div className={tone ? `ops-tile ${tone}` : 'ops-tile'}>
      <span className="ops-tile-label">{label}</span>
      <strong className="ops-tile-value">{value}</strong>
      {context ? <span className="ops-tile-context">{context}</span> : null}
    </div>
  );
}

function QueueTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: 'warn' | 'good';
}) {
  return (
    <div className={tone ? `ops-queue-tile ${tone}` : 'ops-queue-tile'}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatCurrency(value: number) {
  return value.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}
