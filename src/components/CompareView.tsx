import React from 'react';

import type {Vehicle} from '../api';
import type {DealScore} from '../lib/buyerMatch';
import {DealScoreBadge} from './DealScoreBadge';

type Insight = {deal: DealScore; matchPct: number | null};

type Props = {
  vehicles: Vehicle[];
  insights?: Map<number, Insight>;
  onRemove: (vehicleId: number) => void;
  onSelect?: (vehicleId: number) => void;
  onClear: () => void;
  onBrowse: () => void;
};

function formatUsd(value: number) {
  return value.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

type Row = {
  label: string;
  values: (string | number)[];
  highlight?: 'min' | 'max';
};

export function CompareView({
  vehicles,
  insights,
  onRemove,
  onSelect,
  onClear,
  onBrowse,
}: Props) {
  if (vehicles.length === 0) {
    return (
      <div className="compare-empty">
        <p>No vehicles selected to compare yet.</p>
        <button type="button" className="primary-button" onClick={onBrowse}>
          Browse inventory
        </button>
      </div>
    );
  }

  const rows: Row[] = [
    {label: 'Price', values: vehicles.map(v => v.price), highlight: 'min'},
    {label: 'Mileage', values: vehicles.map(v => v.mileage), highlight: 'min'},
    {label: 'Model year', values: vehicles.map(v => v.modelYear), highlight: 'max'},
    {label: 'Trim', values: vehicles.map(v => v.trim)},
    {label: 'Dealer', values: vehicles.map(v => v.dealerName)},
    {label: 'VIN', values: vehicles.map(v => v.vin)},
    {label: 'Status', values: vehicles.map(v => v.status)},
  ];

  const cheapest = vehicles.reduce((a, b) => (b.price < a.price ? b : a));
  const priciest = vehicles.reduce((a, b) => (b.price > a.price ? b : a));
  const spread = priciest.price - cheapest.price;

  return (
    <div className="compare-view">
      <header className="compare-view-header">
        {vehicles.length >= 2 && spread > 0 ? (
          <div className="compare-savings" role="note">
            <strong>{formatUsd(spread)}</strong> spread in this set — the{' '}
            {cheapest.modelYear} {cheapest.make} {cheapest.model} is the lowest
            price here, {formatUsd(spread)} less than the{' '}
            {priciest.make} {priciest.model}. Lowest price isn’t always best
            value — check miles, year, and the deal score below.
          </div>
        ) : null}
        <div className="compare-view-actions">
          <button type="button" className="secondary-button" onClick={onBrowse}>
            Add another
          </button>
          <button type="button" className="ghost-button" onClick={onClear}>
            Clear all
          </button>
        </div>
      </header>

      <div
        className="compare-grid"
        style={{
          gridTemplateColumns: `160px repeat(${vehicles.length}, minmax(0, 1fr))`,
        }}>
        <div />
        {vehicles.map(vehicle => (
          <div key={vehicle.id} className="compare-card">
            <img
              src={vehicle.primaryImageUrl}
              alt={`${vehicle.make} ${vehicle.model}`}
              className="compare-card-image"
            />
            <strong>
              {vehicle.modelYear} {vehicle.make} {vehicle.model}
            </strong>
            <div className="compare-card-actions">
              <button
                type="button"
                className="primary-button compact-button"
                onClick={() => onSelect?.(vehicle.id)}>
                Open
              </button>
              <button
                type="button"
                className="ghost-button compact-button"
                onClick={() => onRemove(vehicle.id)}>
                Remove
              </button>
            </div>
          </div>
        ))}

        {rows.map(row => {
          const bestIndex = pickHighlight(row);
          return (
            <React.Fragment key={row.label}>
              <div className="compare-row-label">{row.label}</div>
              {row.values.map((value, index) => (
                <div
                  key={`${row.label}-${index}`}
                  className={
                    bestIndex === index ? 'compare-row-value best' : 'compare-row-value'
                  }>
                  {formatValue(row.label, value)}
                </div>
              ))}
            </React.Fragment>
          );
        })}

        {insights ? (
          <React.Fragment key="deal-score">
            <div className="compare-row-label">Deal score</div>
            {vehicles.map(vehicle => {
              const deal = insights.get(vehicle.id)?.deal;
              return (
                <div key={`deal-${vehicle.id}`} className="compare-row-value">
                  {deal && deal.tier ? (
                    <DealScoreBadge score={deal} />
                  ) : (
                    <span className="compare-na">Not enough comps</span>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ) : null}

        {insights &&
        vehicles.some(v => insights.get(v.id)?.matchPct != null) ? (
          <React.Fragment key="match">
            <div className="compare-row-label">Match</div>
            {vehicles.map(vehicle => {
              const pct = insights.get(vehicle.id)?.matchPct ?? null;
              return (
                <div key={`match-${vehicle.id}`} className="compare-row-value">
                  {pct == null ? (
                    <span className="compare-na">—</span>
                  ) : (
                    <span
                      className={pct >= 75 ? 'match-pct strong' : 'match-pct'}>
                      {pct}%
                    </span>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ) : null}
      </div>
    </div>
  );
}

function pickHighlight(row: Row): number | null {
  if (!row.highlight || row.values.length < 2) return null;
  const numeric = row.values.map(value =>
    typeof value === 'number' ? value : Number.NaN,
  );
  if (numeric.some(value => Number.isNaN(value))) return null;
  if (row.highlight === 'min') {
    const min = Math.min(...numeric);
    return numeric.indexOf(min);
  }
  const max = Math.max(...numeric);
  return numeric.indexOf(max);
}

function formatValue(label: string, value: string | number) {
  if (typeof value !== 'number') return value;
  if (label === 'Price') {
    return value.toLocaleString(undefined, {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    });
  }
  if (label === 'Mileage') {
    return `${value.toLocaleString()} mi`;
  }
  return value.toString();
}
