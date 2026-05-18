import React, {useState} from 'react';

import type {
  BodyPref,
  MatchAnswers,
  Priority,
  UseCase,
} from '../lib/buyerMatch';

type Props = {
  open: boolean;
  initial?: MatchAnswers | null;
  onClose: () => void;
  onApply: (answers: MatchAnswers) => void;
};

const USE_OPTS: {value: UseCase; label: string}[] = [
  {value: 'COMMUTE', label: 'Daily commute'},
  {value: 'FAMILY', label: 'Family hauler'},
  {value: 'ADVENTURE', label: 'Adventure / outdoors'},
  {value: 'PERFORMANCE', label: 'Fun to drive'},
  {value: 'WORK', label: 'Work / towing'},
];
const PRIO_OPTS: {value: Priority; label: string}[] = [
  {value: 'PRICE', label: 'Lowest price'},
  {value: 'LOW_MILES', label: 'Fewer miles'},
  {value: 'NEWER', label: 'Newer year'},
  {value: 'SPACE', label: 'More space'},
];
const BODY_OPTS: {value: BodyPref; label: string}[] = [
  {value: 'ANY', label: 'No preference'},
  {value: 'SEDAN', label: 'Sedan'},
  {value: 'SUV', label: 'SUV'},
  {value: 'TRUCK', label: 'Truck'},
  {value: 'SPORT', label: 'Sporty'},
];

export function MatchQuiz({open, initial, onClose, onApply}: Props) {
  const [useCase, setUseCase] = useState<UseCase>(initial?.useCase ?? 'COMMUTE');
  const [maxBudget, setMaxBudget] = useState(initial?.maxBudget ?? 30000);
  const [priority, setPriority] = useState<Priority>(
    initial?.priority ?? 'PRICE',
  );
  const [body, setBody] = useState<BodyPref>(initial?.body ?? 'ANY');

  if (!open) return null;

  const chips = <V extends string>(
    opts: {value: V; label: string}[],
    selected: V,
    onPick: (v: V) => void,
  ) => (
    <div className="quiz-chips">
      {opts.map(o => (
        <button
          key={o.value}
          type="button"
          className={o.value === selected ? 'quiz-chip active' : 'quiz-chip'}
          aria-pressed={o.value === selected}
          onClick={() => onPick(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );

  return (
    <div
      className="dialog-overlay"
      role="presentation"
      onClick={onClose}>
      <div
        className="dialog quiz-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Find your match"
        onClick={e => e.stopPropagation()}>
        <h3 className="dialog-title">Find your match</h3>
        <p className="quiz-sub">
          Four quick questions — we&rsquo;ll rank every car by how well it fits.
          Nothing is saved or shared.
        </p>

        <div className="quiz-field">
          <span>What will you mainly use it for?</span>
          {chips(USE_OPTS, useCase, setUseCase)}
        </div>

        <div className="quiz-field">
          <span>
            All-in budget (incl. est. tax):{' '}
            <strong>
              {maxBudget.toLocaleString(undefined, {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0,
              })}
            </strong>
          </span>
          <input
            type="range"
            min={10000}
            max={90000}
            step={2500}
            value={maxBudget}
            onChange={e => setMaxBudget(Number(e.target.value))}
            aria-label="All-in budget"
          />
        </div>

        <div className="quiz-field">
          <span>What matters most?</span>
          {chips(PRIO_OPTS, priority, setPriority)}
        </div>

        <div className="quiz-field">
          <span>Body style</span>
          {chips(BODY_OPTS, body, setBody)}
        </div>

        <div className="dialog-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={() => onApply({useCase, maxBudget, priority, body})}>
            Show my matches
          </button>
        </div>
      </div>
    </div>
  );
}
