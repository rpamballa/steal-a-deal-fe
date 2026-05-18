import React from 'react';

import type {DealScore} from '../lib/buyerMatch';

const TIER_LABEL = {
  GREAT: 'Great deal',
  FAIR: 'Fair price',
  HIGH: 'Priced high',
} as const;

export function DealScoreBadge({
  score,
  showLabel = false,
}: {
  score: DealScore;
  showLabel?: boolean;
}) {
  if (!score.tier) return null;
  return (
    <span
      className={`deal-score deal-score-${score.tier.toLowerCase()}`}
      title={score.label}>
      <span className="deal-score-dot" aria-hidden="true" />
      {TIER_LABEL[score.tier]}
      {showLabel ? <span className="deal-score-detail"> · {score.label}</span> : null}
    </span>
  );
}
