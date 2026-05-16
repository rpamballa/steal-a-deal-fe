import React, {useMemo} from 'react';

import type {DealActivity, DealReadiness, DealStage} from '../api';

type Props = {
  currentStage: DealStage;
  activity: DealActivity[];
  readiness: DealReadiness | null;
};

const stageOrder: DealStage[] = [
  'INITIATED',
  'OFFER_SENT',
  'BUYER_CONFIRMED',
  'DEPOSIT_PAID',
  'DOCUMENTS_PENDING',
  'READY_FOR_HANDOFF',
  'COMPLETED',
];

export function DealTimeline({currentStage, activity, readiness}: Props) {
  const currentIndex = Math.max(0, stageOrder.indexOf(currentStage));
  const canceled = currentStage === 'CANCELED';

  const eventsByStage = useMemo(() => {
    const map = new Map<DealStage, DealActivity[]>();
    for (const event of activity) {
      const matched = stageOrder.find(stage =>
        event.eventType.toUpperCase().includes(stage),
      );
      if (matched) {
        const bucket = map.get(matched) ?? [];
        bucket.push(event);
        map.set(matched, bucket);
      }
    }
    return map;
  }, [activity]);

  const blockerCount = readiness?.blockers.length ?? 0;

  return (
    <div className="deal-timeline">
      {stageOrder.map((stage, index) => {
        const reached = !canceled && index <= currentIndex;
        const isCurrent = !canceled && index === currentIndex;
        const stageEvents = eventsByStage.get(stage) ?? [];
        const stageBlocked = isCurrent && blockerCount > 0;
        return (
          <div
            key={stage}
            className={[
              'deal-timeline-row',
              reached ? 'reached' : '',
              isCurrent ? 'current' : '',
              stageBlocked ? 'blocked' : '',
            ]
              .filter(Boolean)
              .join(' ')}>
            <div className="deal-timeline-marker" aria-hidden="true">
              <span className="deal-timeline-dot" />
              {index < stageOrder.length - 1 ? (
                <span className="deal-timeline-line" />
              ) : null}
            </div>
            <div className="deal-timeline-body">
              <div className="deal-timeline-stage">
                <strong>{formatLabel(stage)}</strong>
                {isCurrent ? <span className="deal-timeline-chip">Current</span> : null}
                {stageBlocked ? (
                  <span className="deal-timeline-chip warn">
                    {blockerCount} blocker{blockerCount === 1 ? '' : 's'}
                  </span>
                ) : null}
              </div>
              {stageEvents.length > 0 ? (
                <ul className="deal-timeline-events">
                  {stageEvents.map(event => (
                    <li key={event.id}>
                      <span>{event.message}</span>
                      <time>{formatDateTime(event.createdAt)}</time>
                    </li>
                  ))}
                </ul>
              ) : null}
              {isCurrent && readiness && readiness.blockers.length > 0 ? (
                <ul className="deal-timeline-blockers">
                  {readiness.blockers.map(blocker => (
                    <li key={blocker}>{blocker}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        );
      })}
      {canceled ? (
        <div className="deal-timeline-row canceled">
          <div className="deal-timeline-marker" aria-hidden="true">
            <span className="deal-timeline-dot" />
          </div>
          <div className="deal-timeline-body">
            <strong>Canceled</strong>
          </div>
        </div>
      ) : null}
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

function formatDateTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
