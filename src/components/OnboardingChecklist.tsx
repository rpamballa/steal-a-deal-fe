import React from 'react';

import type {DealerOnboardingView, OnboardingStage} from '../api';

type Props = {
  onboarding: DealerOnboardingView;
};

const steps: {stage: OnboardingStage; label: string; timestampKey: keyof DealerOnboardingView}[] = [
  {stage: 'REGISTERED', label: 'Dealership registered', timestampKey: 'registeredAt'},
  {stage: 'APPROVED', label: 'Approved by StealADeal', timestampKey: 'approvedAt'},
  {stage: 'USER_CREATED', label: 'Dealer login created', timestampKey: 'userCreatedAt'},
  {
    stage: 'SUBSCRIPTION_ACTIVE',
    label: 'Subscription active',
    timestampKey: 'subscriptionActiveAt',
  },
  {stage: 'INVENTORY_LIVE', label: 'Inventory live', timestampKey: 'inventoryLiveAt'},
  {stage: 'FIRST_LEAD', label: 'First lead received', timestampKey: 'firstLeadAt'},
  {stage: 'FIRST_DEAL', label: 'First deal started', timestampKey: 'firstDealAt'},
  {stage: 'ACTIVATED', label: 'First deal closed', timestampKey: 'activatedAt'},
];

export function OnboardingChecklist({onboarding}: Props) {
  return (
    <section className="onboarding-card" aria-label="Dealer onboarding progress">
      <header className="onboarding-header">
        <div>
          <p className="card-kicker">Onboarding</p>
          <strong className="onboarding-stage">
            {onboarding.complete
              ? 'Onboarding complete'
              : formatLabel(onboarding.stage)}
          </strong>
        </div>
        <div className="onboarding-percent">
          <strong>{onboarding.percentComplete}%</strong>
          <span>{onboarding.complete ? 'done' : 'complete'}</span>
        </div>
      </header>

      <div
        className="onboarding-progress"
        role="progressbar"
        aria-valuenow={onboarding.percentComplete}
        aria-valuemin={0}
        aria-valuemax={100}>
        <span
          className="onboarding-progress-fill"
          style={{width: `${onboarding.percentComplete}%`}}
        />
      </div>

      {!onboarding.complete ? (
        <div className="onboarding-next">
          <span className="onboarding-next-label">Next</span>
          <p>{onboarding.nextAction}</p>
          {onboarding.nudgeCount > 0 ? (
            <span className="onboarding-nudge">
              {onboarding.nudgeCount} reminder{onboarding.nudgeCount === 1 ? '' : 's'} sent
            </span>
          ) : null}
        </div>
      ) : null}

      <ol className="onboarding-steps">
        {steps.map(step => {
          const reachedAt = onboarding[step.timestampKey] as string | null;
          const done = Boolean(reachedAt);
          const isNext = onboarding.nextActionStage === step.stage;
          return (
            <li
              key={step.stage}
              className={[
                'onboarding-step',
                done ? 'done' : '',
                isNext ? 'next' : '',
              ]
                .filter(Boolean)
                .join(' ')}>
              <span className="onboarding-step-marker" aria-hidden="true">
                {done ? '✓' : ''}
              </span>
              <div className="onboarding-step-body">
                <strong>{step.label}</strong>
                <span className="onboarding-step-meta">
                  {done
                    ? `Reached ${formatDate(reachedAt)}`
                    : isNext
                      ? 'Up next'
                      : 'Pending'}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatDate(iso: string | null) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
