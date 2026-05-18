import React from 'react';

import {MAX_VEHICLE_PHOTOS, type Vehicle} from '../api';
import {formatCurrency, formatLabel, formatMileage} from '../lib/format';

type VehicleForm = {
  dealerId: string;
  vin: string;
  modelYear: string;
  make: string;
  model: string;
  trim: string;
  imageUrls: string;
  mileage: string;
  price: string;
  status: Vehicle['status'];
};

type Props = {
  vehicles: Vehicle[];
  vehicleForm: VehicleForm;
  editingVehicleId: number | null;
  pendingVehicleSave: boolean;
  pendingVehiclePublishId: number | null;
  onVehicleFormChange: (field: keyof VehicleForm, value: string) => void;
  onSaveVehicle: () => Promise<void> | void;
  onCancelVehicleEdit: () => void;
  onStartVehicleEdit: (vehicle: Vehicle) => void;
  onToggleVehiclePublish: (vehicle: Vehicle) => Promise<void> | void;
};

const STATUSES: Vehicle['status'][] = ['DRAFT', 'LIVE', 'RESERVED', 'SOLD'];

const FIELDS: {key: keyof VehicleForm; label: string; placeholder: string}[] = [
  {key: 'vin', label: 'VIN', placeholder: '1HGCM82633A004352'},
  {key: 'modelYear', label: 'Year', placeholder: '2021'},
  {key: 'make', label: 'Make', placeholder: 'Honda'},
  {key: 'model', label: 'Model', placeholder: 'Accord'},
  {key: 'trim', label: 'Trim', placeholder: 'EX-L'},
  {key: 'mileage', label: 'Mileage', placeholder: '32000'},
  {key: 'price', label: 'Price (USD)', placeholder: '24990'},
];

export function DealerInventoryView({
  vehicles,
  vehicleForm,
  editingVehicleId,
  pendingVehicleSave,
  pendingVehiclePublishId,
  onVehicleFormChange,
  onSaveVehicle,
  onCancelVehicleEdit,
  onStartVehicleEdit,
  onToggleVehiclePublish,
}: Props) {
  const photoCount = vehicleForm.imageUrls
    .split(',')
    .map(v => v.trim())
    .filter(Boolean).length;
  const photosOver = photoCount > MAX_VEHICLE_PHOTOS;

  return (
    <div className="dealer-inv">
      <section className="dealer-inv-form panel">
        <h3 className="panel-title">
          {editingVehicleId ? 'Edit vehicle' : 'Add a vehicle'}
        </h3>
        <div className="dealer-inv-grid">
          {FIELDS.map(f => (
            <label key={f.key} className="field">
              <span>{f.label}</span>
              <input
                value={vehicleForm[f.key]}
                placeholder={f.placeholder}
                onChange={e => onVehicleFormChange(f.key, e.target.value)}
              />
            </label>
          ))}
          <label className="field">
            <span>Status</span>
            <select
              value={vehicleForm.status}
              onChange={e =>
                onVehicleFormChange('status', e.target.value)
              }>
              {STATUSES.map(s => (
                <option key={s} value={s}>
                  {formatLabel(s)}
                </option>
              ))}
            </select>
          </label>
          <label className="field dealer-inv-images">
            <span>
              Image URLs (comma-separated, max {MAX_VEHICLE_PHOTOS})
            </span>
            <input
              value={vehicleForm.imageUrls}
              placeholder="https://… , https://…"
              aria-invalid={photosOver}
              onChange={e =>
                onVehicleFormChange('imageUrls', e.target.value)
              }
            />
            <span className={photosOver ? 'field-error' : 'field-hint'}>
              {photoCount}/{MAX_VEHICLE_PHOTOS} photos
              {photosOver ? ' — remove some to publish' : ''}
            </span>
          </label>
        </div>
        <div className="inline-actions">
          <button
            type="button"
            className="primary-button"
            disabled={pendingVehicleSave || photosOver}
            onClick={() => {
              Promise.resolve(onSaveVehicle()).catch(() => {});
            }}>
            {pendingVehicleSave
              ? 'Saving…'
              : editingVehicleId
                ? 'Save changes'
                : 'Add vehicle'}
          </button>
          {editingVehicleId ? (
            <button
              type="button"
              className="secondary-button"
              onClick={onCancelVehicleEdit}>
              Cancel
            </button>
          ) : null}
        </div>
      </section>

      <section className="dealer-inv-list">
        <h3 className="panel-title">Your inventory ({vehicles.length})</h3>
        {vehicles.length === 0 ? (
          <p className="empty-state">
            No vehicles yet. Add one above or bulk-upload a CSV.
          </p>
        ) : (
          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>VIN</th>
                  <th>Mileage</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map(v => {
                  const live = v.status === 'LIVE';
                  const publishing = pendingVehiclePublishId === v.id;
                  return (
                    <tr key={v.id}>
                      <td>
                        {v.modelYear} {v.make} {v.model}{' '}
                        <span className="muted-text">{v.trim}</span>
                      </td>
                      <td className="muted-text">{v.vin}</td>
                      <td>{formatMileage(v.mileage)}</td>
                      <td>{formatCurrency(v.price)}</td>
                      <td>
                        <span
                          className={`listing-badge status-${v.status.toLowerCase()}`}>
                          {v.status}
                        </span>
                      </td>
                      <td>
                        <div className="inline-actions">
                          <button
                            type="button"
                            className="secondary-button compact-button"
                            onClick={() => onStartVehicleEdit(v)}>
                            Edit
                          </button>
                          {v.status === 'SOLD' ? null : (
                            <button
                              type="button"
                              className={
                                live
                                  ? 'ghost-button compact-button'
                                  : 'primary-button compact-button'
                              }
                              disabled={publishing}
                              onClick={() => {
                                Promise.resolve(
                                  onToggleVehiclePublish(v),
                                ).catch(() => {});
                              }}>
                              {publishing
                                ? '…'
                                : live
                                  ? 'Unpublish'
                                  : 'Publish'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
