import React from 'react';

type Props = {
  dealerName?: string | null;
  variant?: 'footer' | 'inline';
  onNavigate?: (
    view: 'about' | 'terms' | 'dealer-terms' | 'privacy' | 'faq' | 'contact',
  ) => void;
};

/**
 * Legal positioning: StealADeal is a technology platform, never a
 * party to the vehicle sale. The licensed dealer is the seller.
 * Shown site-wide (footer) and on the transaction surface (inline).
 */
export function PlatformDisclaimer({
  dealerName,
  variant = 'footer',
  onNavigate,
}: Props) {
  // Exact regulatory string mandated by Dev-Instruction §8.3.
  const dealer = dealerName?.trim() ? dealerName.trim() : 'the listing dealer';
  const mandated = `StealADeal is a technology platform. Vehicles are sold by ${dealer}, a licensed motor vehicle dealer. StealADeal is not a party to the sale.`;

  if (variant === 'inline') {
    return (
      <p className="platform-disclaimer platform-disclaimer-inline" role="note">
        {mandated} StealADeal does not take title to, negotiate the price of,
        or hold funds for any vehicle.
      </p>
    );
  }

  return (
    <footer className="platform-disclaimer platform-disclaimer-footer">
      <p>{mandated}</p>
      <p>
        StealADeal connects buyers with independent, licensed motor vehicle
        dealers. It is not a dealer or broker, holds no title or buyer funds,
        and pricing, financing, and contract terms are set and fulfilled by the
        dealer.
      </p>
      <p className="platform-disclaimer-fineprint">
        © {new Date().getFullYear()} StealADeal, Inc. Platform technology fees
        are billed to dealers as a software service charge, not a sales
        commission.
      </p>
      {onNavigate ? (
        <p className="platform-disclaimer-links">
          {(
            [
              ['about', 'About'],
              ['faq', 'Help & FAQ'],
              ['contact', 'Contact'],
              ['terms', 'Terms'],
              ['dealer-terms', 'Dealer Agreement'],
              ['privacy', 'Privacy'],
            ] as const
          ).map(([view, label], i) => (
            <React.Fragment key={view}>
              {i > 0 ? <span aria-hidden="true">·</span> : null}
              <button
                type="button"
                className="footer-link"
                onClick={() => onNavigate(view)}>
                {label}
              </button>
            </React.Fragment>
          ))}
        </p>
      ) : null}
    </footer>
  );
}
