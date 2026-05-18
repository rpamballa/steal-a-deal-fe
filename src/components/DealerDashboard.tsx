import React from 'react';

import type {
  DealerOnboardingView,
  DealerPortal,
  DealerQueue,
  PortalSubscription,
} from '../api';
import {OnboardingChecklist} from './OnboardingChecklist';
import {OperationsDashboard} from './OperationsDashboard';

type DealerNav =
  | 'inventory'
  | 'leads'
  | 'appointments'
  | 'deal-desk'
  | 'reporting';

type Props = {
  dealerName: string;
  onboarding: DealerOnboardingView | null;
  portal: DealerPortal | null;
  queue: DealerQueue | null;
  subscription: PortalSubscription | null;
  onNavigate: (view: DealerNav) => void;
};

export function DealerDashboard({
  dealerName,
  onboarding,
  portal,
  queue,
  subscription,
  onNavigate,
}: Props) {
  const o = portal?.overview;
  const actions: {
    view: DealerNav;
    label: string;
    desc: string;
    badge?: number;
  }[] = [
    {
      view: 'inventory',
      label: 'Manage inventory',
      desc: 'Add, edit, and publish vehicles',
      badge: o?.liveInventoryCount,
    },
    {
      view: 'leads',
      label: 'Respond to leads',
      desc: 'Buyer inquiries awaiting a reply',
      badge: o?.newLeadCount,
    },
    {
      view: 'appointments',
      label: 'Appointments',
      desc: 'Confirm test drives & deliveries',
      badge: o?.requestedAppointmentCount,
    },
    {
      view: 'deal-desk',
      label: 'Work the pipeline',
      desc: 'Move deals toward handoff',
      badge: o?.activeDealCount,
    },
    {
      view: 'reporting',
      label: 'Performance',
      desc: 'Operations metrics & funnel',
    },
  ];

  return (
    <div className="dealer-dash">
      <section className="dealer-dash-hero">
        <div>
          <p className="card-kicker">Dealer dashboard</p>
          <h3 className="dealer-dash-title">{dealerName}</h3>
          <p className="dealer-dash-sub">
            Everything for your dealership in one place — set up, list cars,
            respond to buyers, and close deals.
          </p>
        </div>
        {subscription ? (
          <span
            className={
              subscription.status === 'ACTIVE'
                ? 'dealer-dash-plan ok'
                : 'dealer-dash-plan warn'
            }>
            {subscription.plan} · {subscription.status}
          </span>
        ) : null}
      </section>

      {onboarding && !onboarding.complete ? (
        <OnboardingChecklist onboarding={onboarding} />
      ) : null}

      <section>
        <h4 className="panel-title">Manage your activities</h4>
        <div className="dealer-dash-actions">
          {actions.map(a => (
            <button
              key={a.view}
              type="button"
              className="dealer-dash-action"
              onClick={() => onNavigate(a.view)}>
              <span className="dealer-dash-action-label">{a.label}</span>
              <span className="dealer-dash-action-desc">{a.desc}</span>
              {a.badge != null ? (
                <span className="dealer-dash-action-badge">{a.badge}</span>
              ) : null}
            </button>
          ))}
        </div>
      </section>

      {queue?.summary ? (
        <section className="dealer-dash-queue">
          <h4 className="panel-title">Needs attention</h4>
          <div className="dealer-dash-queue-row">
            <div className="dealer-dash-qtile">
              <strong>{queue.summary.awaitingBuyerCount}</strong>
              <span>Awaiting buyer</span>
            </div>
            <div className="dealer-dash-qtile">
              <strong>{queue.summary.needsDocumentReviewCount}</strong>
              <span>Docs to review</span>
            </div>
            <div className="dealer-dash-qtile good">
              <strong>{queue.summary.readyForHandoffCount}</strong>
              <span>Ready for handoff</span>
            </div>
            <div
              className={
                queue.summary.stalledCount > 0
                  ? 'dealer-dash-qtile warn'
                  : 'dealer-dash-qtile'
              }>
              <strong>{queue.summary.stalledCount}</strong>
              <span>Stalled</span>
            </div>
          </div>
        </section>
      ) : null}

      {portal ? <OperationsDashboard portal={portal} /> : null}
    </div>
  );
}
