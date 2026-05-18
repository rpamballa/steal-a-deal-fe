import React from 'react';

import type {Vehicle} from '../api';
import {formatCurrency, formatMileage, getVehicleGallery} from '../lib/format';

export function PanelHeader({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <div className="panel-header">
      <h3 className="panel-title">{title}</h3>
      <p className="panel-detail">{detail}</p>
    </div>
  );
}

export function SummaryBox({title, value}: {title: string; value: string}) {
  return (
    <article className="summary-box">
      <p>{title}</p>
      <strong>{value}</strong>
    </article>
  );
}

export function DetailRow({label, value}: {label: string; value: string}) {
  return (
    <div className="detail-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function EmptyState({message}: {message: string}) {
  return <div className="empty-state">{message}</div>;
}

export function VehicleSummaryCard({
  vehicle,
  large = false,
  activeImage,
  onSelectImage,
}: {
  vehicle: Vehicle;
  large?: boolean;
  activeImage?: string | null;
  onSelectImage?: (imageUrl: string) => void;
}) {
  const galleryImages = getVehicleGallery(vehicle);
  const resolvedActiveImage =
    activeImage && galleryImages.includes(activeImage)
      ? activeImage
      : galleryImages[0];

  return (
    <article className={large ? 'vehicle-summary large' : 'vehicle-summary'}>
      <div className="vehicle-image-wrap">
        <img
          className="vehicle-image"
          src={resolvedActiveImage}
          alt={`${vehicle.modelYear} ${vehicle.make} ${vehicle.model}`}
        />
      </div>
      {galleryImages.length > 1 ? (
        <div className="vehicle-gallery-row">
          {galleryImages.slice(0, 5).map((imageUrl, index) => (
            <button
              key={`${vehicle.id}-detail-${index}`}
              type="button"
              className={
                imageUrl === resolvedActiveImage
                  ? 'vehicle-gallery-thumb active'
                  : 'vehicle-gallery-thumb'
              }
              onClick={() => onSelectImage?.(imageUrl)}>
              <img
                className="vehicle-gallery-image"
                src={imageUrl}
                alt={`${vehicle.make} ${vehicle.model} detail ${index + 1}`}
              />
            </button>
          ))}
        </div>
      ) : null}
      <p className="card-kicker">{vehicle.dealerName}</p>
      <h4>
        {vehicle.modelYear} {vehicle.make} {vehicle.model}
      </h4>
      <p>{vehicle.trim}</p>
      <div className="summary-meta">
        <span>{vehicle.status}</span>
        <span>{formatMileage(vehicle.mileage)}</span>
      </div>
      <strong>{formatCurrency(vehicle.price)}</strong>
    </article>
  );
}
