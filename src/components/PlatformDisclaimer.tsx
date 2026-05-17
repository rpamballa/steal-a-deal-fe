import React from 'react';

type Props = {
  dealerName?: string | null;
  variant?: 'footer' | 'inline';
};

/**
 * Legal positioning: StealADeal is a technology platform, never a
 * party to the vehicle sale. The licensed dealer is the seller.
 * Shown site-wide (footer) and on the transaction surface (inline).
 */
export function PlatformDisclaimer({dealerName, variant = 'footer'}: Props) {
  const seller = dealerName?.trim()
    ? `${dealerName.trim()}, a licensed motor vehicle dealer`
    : 'a licensed motor vehicle dealer';

  if (variant === 'inline') {
    return (
      <p className="platform-disclaimer platform-disclaimer-inline" role="note">
        StealADeal is a technology platform. This vehicle is sold by{' '}
        {seller}. StealADeal is not a party to the sale and does not take
        title to, negotiate the price of, or hold funds for any vehicle.
      </p>
    );
  }

  return (
    <footer className="platform-disclaimer platform-disclaimer-footer">
      <p>
        StealADeal is a technology platform that connects buyers with
        independent, licensed motor vehicle dealers. Vehicles are sold by the
        listing dealer — StealADeal is not a dealer, broker, or party to any
        sale, and does not hold title or buyer funds. Pricing, financing, and
        contract terms are set and fulfilled by the dealer.
      </p>
      <p className="platform-disclaimer-fineprint">
        © {new Date().getFullYear()} StealADeal. Platform technology fees are
        billed to dealers as a software service charge, not a sales commission.
      </p>
    </footer>
  );
}
