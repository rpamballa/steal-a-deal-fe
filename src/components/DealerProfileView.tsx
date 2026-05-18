import React from 'react';

import type {Dealer, Vehicle} from '../api';

type Props = {
  dealer: Dealer;
  vehicles: Vehicle[];
  onOpenVehicle: (vehicleId: number) => void;
  onBrowse: () => void;
};

function usd(n: number) {
  return n.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

export function DealerProfileView({
  dealer,
  vehicles,
  onOpenVehicle,
  onBrowse,
}: Props) {
  const live = vehicles.filter(v => v.status === 'LIVE');

  return (
    <div className="dealer-profile">
      <header className="dealer-profile-head">
        <div>
          <p className="card-kicker">Selling dealer</p>
          <h3 className="dealer-profile-name">{dealer.name}</h3>
          <p className="dealer-profile-meta">
            {dealer.city}, {dealer.state} · License {dealer.licenseNumber}
          </p>
        </div>
        {dealer.approved ? (
          <span className="dealer-verified" title="License verified by StealADeal">
            ✓ Verified dealer
          </span>
        ) : (
          <span className="dealer-pending">Pending verification</span>
        )}
      </header>

      <p className="dealer-profile-note">
        {dealer.name} is an independent, licensed motor vehicle dealer. They
        set pricing, prepare the sales contract, hold title, and handle all
        regulatory compliance. StealADeal is the technology platform and is
        not a party to the sale.
      </p>

      <h4 className="panel-title">
        Available from this dealer ({live.length})
      </h4>
      {live.length === 0 ? (
        <div className="dealer-profile-empty">
          <p>No live listings from this dealer right now.</p>
          <button type="button" className="primary-button" onClick={onBrowse}>
            Browse all inventory
          </button>
        </div>
      ) : (
        <div className="dealer-profile-grid">
          {live.map(v => (
            <article key={v.id} className="dealer-profile-card">
              <img
                className="dealer-profile-image"
                src={v.primaryImageUrl}
                alt={`${v.make} ${v.model}`}
              />
              <div className="dealer-profile-card-body">
                <strong>
                  {v.modelYear} {v.make} {v.model}
                </strong>
                <span className="dealer-profile-price">{usd(v.price)}</span>
                <span className="dealer-profile-card-meta">
                  {v.mileage.toLocaleString()} mi
                </span>
              </div>
              <button
                type="button"
                className="primary-button compact-button"
                onClick={() => onOpenVehicle(v.id)}>
                View details
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
