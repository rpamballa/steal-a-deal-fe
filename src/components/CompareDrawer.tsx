import React from 'react';

import type {Vehicle} from '../api';

type Props = {
  vehicles: Vehicle[];
  maxItems?: number;
  onRemove: (vehicleId: number) => void;
  onOpen: () => void;
  onClear: () => void;
};

export function CompareDrawer({
  vehicles,
  maxItems = 3,
  onRemove,
  onOpen,
  onClear,
}: Props) {
  if (vehicles.length === 0) {
    return null;
  }

  return (
    <div className="compare-drawer" role="region" aria-label="Comparison list">
      <div className="compare-drawer-label">
        <strong>Compare</strong>
        <span>
          {vehicles.length} of {maxItems}
        </span>
      </div>
      <ul className="compare-drawer-list">
        {vehicles.map(vehicle => (
          <li key={vehicle.id} className="compare-drawer-chip">
            <span>
              {vehicle.modelYear} {vehicle.make} {vehicle.model}
            </span>
            <button
              type="button"
              className="compare-drawer-remove"
              aria-label={`Remove ${vehicle.make} ${vehicle.model}`}
              onClick={() => onRemove(vehicle.id)}>
              ×
            </button>
          </li>
        ))}
      </ul>
      <div className="compare-drawer-actions">
        <button type="button" className="ghost-button" onClick={onClear}>
          Clear
        </button>
        <button
          type="button"
          className="primary-button"
          disabled={vehicles.length < 2}
          onClick={onOpen}>
          Compare side-by-side
        </button>
      </div>
    </div>
  );
}
