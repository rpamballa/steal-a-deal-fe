import React, {useState} from 'react';

export type ReadinessStep = {
  id: string;
  label: string;
  done: boolean;
  /** Plain-English help shown when expanded (anxiety reducer). */
  help: string;
  /** Optional acknowledgement toggle for explainer-type steps. */
  ackable?: boolean;
  onAck?: () => void;
};

type Props = {
  steps: ReadinessStep[];
  onDismiss?: () => void;
};

/**
 * First-time-buyer confidence builder. Progress is derived from real
 * actions (budget set, compared cars, shortlisted) plus two explainer
 * acknowledgements — not vanity points. Calm, reassuring tone.
 */
export function ReadinessMeter({steps, onDismiss}: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const done = steps.filter(s => s.done).length;
  const pct = Math.round((done / steps.length) * 100);
  const allDone = done === steps.length;

  return (
    <section className="readiness" aria-label="Your buying readiness">
      <header className="readiness-head">
        <div>
          <p className="card-kicker">Your readiness</p>
          <strong className="readiness-pct">
            {allDone ? "You're ready to buy with confidence" : `${pct}% ready`}
          </strong>
        </div>
        {onDismiss ? (
          <button
            type="button"
            className="ghost-button"
            aria-label="Hide readiness"
            onClick={onDismiss}>
            Hide
          </button>
        ) : null}
      </header>

      <div
        className="readiness-bar"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}>
        <span className="readiness-fill" style={{width: `${pct}%`}} />
      </div>

      <ul className="readiness-steps">
        {steps.map(step => {
          const expanded = openId === step.id;
          return (
            <li
              key={step.id}
              className={step.done ? 'readiness-step done' : 'readiness-step'}>
              <button
                type="button"
                className="readiness-step-row"
                aria-expanded={expanded}
                onClick={() => setOpenId(expanded ? null : step.id)}>
                <span className="readiness-check" aria-hidden="true">
                  {step.done ? '✓' : ''}
                </span>
                <span className="readiness-label">{step.label}</span>
                <span className="readiness-caret" aria-hidden="true">
                  {expanded ? '▾' : '▸'}
                </span>
              </button>
              {expanded ? (
                <div className="readiness-help">
                  <p>{step.help}</p>
                  {step.ackable && !step.done && step.onAck ? (
                    <button
                      type="button"
                      className="secondary-button compact-button"
                      onClick={step.onAck}>
                      Got it
                    </button>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
