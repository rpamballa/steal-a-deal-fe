import React from 'react';

/**
 * Static informational content. The Terms text is a DRAFT grounded in
 * the platform's actual operating model; it is not legal advice and
 * must be reviewed by qualified counsel before launch. Unknown
 * legal/contact specifics are left as explicit [TBD] placeholders
 * rather than invented.
 */

const COMPANY = 'StealADeal, Inc.';
const OPERATOR = 'YPTek Solutions, Inc.';
const OPERATOR_LOCATION = 'Morrisville, North Carolina';
const CONTACT_EMAIL = 'admin@ypteksolutions.com';

export function AboutView() {
  return (
    <article className="info-page">
      <p className="info-lead">
        StealADeal is a transaction-first marketplace and software platform
        that connects car buyers with independent, licensed motor vehicle
        dealers — and helps both sides complete the deal online with clear
        pricing and no dealership pressure.
      </p>

      <h3>What we are</h3>
      <p>
        StealADeal is a <strong>technology platform</strong>. We are not a
        motor vehicle dealer, broker, lender, or party to any vehicle sale.
        Every vehicle is sold by the listing dealer — a licensed,
        independent business that sets its own pricing, prepares the
        contract, holds title, and is responsible for regulatory
        compliance. StealADeal provides the software: discovery, comparison,
        payment-estimate tools, the deal room, and dealer operations.
      </p>

      <h3>For buyers</h3>
      <ul>
        <li>Browse live, dealer-verified inventory with transparent pricing.</li>
        <li>
          Compare cars side by side, estimate payments, and see a
          transparent deal score.
        </li>
        <li>
          Save cars to your garage and get notified when a watched car
          drops in price.
        </li>
        <li>
          Message a dealer, book a test drive, and complete paperwork in
          the deal room — at your pace, no obligation.
        </li>
      </ul>

      <h3>For dealers</h3>
      <ul>
        <li>List and manage inventory, leads, and appointments in one place.</li>
        <li>
          Work deals through a structured pipeline with documents and
          handoff tracking.
        </li>
        <li>
          A flat software subscription and platform service fee — never a
          commission on your sale.
        </li>
      </ul>

      <h3>Company</h3>
      <p>
        {COMPANY} is a Delaware corporation. The platform is operated by{' '}
        {OPERATOR}, based in {OPERATOR_LOCATION}. Questions:{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <p className="info-fineprint">
        StealADeal is a technology platform. Vehicles are sold by the
        listing dealer, a licensed motor vehicle dealer. StealADeal is not a
        party to the sale.
      </p>
    </article>
  );
}

export function TermsView({
  onNavigate,
}: {
  onNavigate?: (view: 'privacy') => void;
}) {
  const privacyLink = onNavigate ? (
    <button
      type="button"
      className="footer-link"
      onClick={() => onNavigate('privacy')}>
      Privacy Policy
    </button>
  ) : (
    <span>Privacy Policy [link TBD]</span>
  );
  return (
    <article className="info-page">
      <div className="notice error" role="note">
        DRAFT for review — this is not legal advice. These terms must be
        reviewed and finalized by qualified counsel before launch. Items in
        [brackets] are placeholders pending business/legal input.
      </div>

      <p className="info-fineprint">
        Effective date: [TBD] · Last updated: [TBD]
      </p>

      <h3>1. Acceptance</h3>
      <p>
        By accessing or using the StealADeal website and services (the
        “Platform”), you agree to these Terms &amp; Conditions and our{' '}
        {privacyLink}. If you do not agree, do not use the Platform.
      </p>

      <h3>2. What StealADeal is — and is not</h3>
      <p>
        StealADeal is a technology platform that connects buyers with
        independent, licensed motor vehicle dealers. {COMPANY} is{' '}
        <strong>not</strong> a motor vehicle dealer, broker, auction,
        lender, or party to any vehicle sale. The selling dealer is the
        seller of record and is solely responsible for the vehicle, its
        condition and description, pricing, the sales contract, title
        transfer, taxes, disclosures, and all applicable regulatory
        compliance. StealADeal does not take title to any vehicle, does not
        negotiate price on behalf of any party, and does not hold buyer
        funds in a platform account.
      </p>

      <h3>3. Eligibility &amp; accounts</h3>
      <p>
        You must be able to form a binding contract and provide accurate
        registration information. You are responsible for activity under
        your account and for keeping your credentials secure. Dealer
        accounts may only be used by a licensed motor vehicle dealer and
        require approval.
      </p>

      <h3>4. Buyers</h3>
      <p>
        Listings, pricing, availability, payment estimates, and any “deal
        score” or “match” indicators are provided for convenience and may
        change; they are not offers and are not guarantees. Any deposit,
        financing, or payment is a transaction between you and the dealer
        and/or a third-party payment processor — StealADeal does not hold
        or disburse buyer funds. Refund eligibility and contract terms are
        set by the dealer and applicable law.
      </p>

      <h3>5. Dealers</h3>
      <p>
        Dealers represent that they hold all required licenses and will
        comply with all applicable laws, including title, odometer,
        as-is/warranty, and FTC disclosure requirements. Dealers are
        responsible for the accuracy of listings and for fulfilling sales.
        Platform fees are a software/technology service charge billed to
        the dealer and are not a commission on, or a share of, any vehicle
        sale.
      </p>

      <h3>6. Fees &amp; payments</h3>
      <p>
        Buyer use of the marketplace is free. Dealer subscription and
        platform service fees are described in the applicable dealer
        agreement. Payments are processed by third-party providers under
        their own terms.
      </p>

      <h3>7. Disclaimers</h3>
      <p>
        The Platform and all content are provided “as is” and “as
        available” without warranties of any kind to the maximum extent
        permitted by law. StealADeal does not warrant any vehicle, dealer,
        listing, valuation, estimate, or third-party service.
      </p>

      <h3>8. Limitation of liability</h3>
      <p>
        To the maximum extent permitted by law, {COMPANY} and {OPERATOR}{' '}
        will not be liable for indirect, incidental, special, consequential,
        or punitive damages, or for any vehicle transaction between a buyer
        and a dealer. [Liability cap and carve-outs: TBD by counsel.]
      </p>

      <h3>9. Indemnification</h3>
      <p>
        You agree to indemnify StealADeal against claims arising from your
        misuse of the Platform or your violation of these Terms or
        applicable law. [Scope: TBD by counsel.]
      </p>

      <h3>10. Privacy</h3>
      <p>
        Your use of the Platform is also governed by our {privacyLink},
        which explains what we collect and how it is used.
      </p>

      <h3>11. Changes</h3>
      <p>
        We may update these Terms; material changes will be posted with a
        revised effective date. Continued use after changes constitutes
        acceptance.
      </p>

      <h3>12. Governing law &amp; disputes</h3>
      <p>
        These Terms are governed by the laws of [State: TBD]. Dispute
        resolution, venue, and any arbitration/class-action terms are [TBD
        by counsel].
      </p>

      <h3>13. Contact</h3>
      <p>
        {OPERATOR}, {OPERATOR_LOCATION}.{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <p className="info-fineprint">
        StealADeal is a technology platform. Vehicles are sold by the
        listing dealer, a licensed motor vehicle dealer. StealADeal is not a
        party to the sale.
      </p>
    </article>
  );
}

export function PrivacyView() {
  return (
    <article className="info-page">
      <div className="notice error" role="note">
        DRAFT for review — this is not legal advice. This policy must be
        reviewed and finalized by qualified counsel before launch. Items in
        [brackets] are placeholders pending business/legal input.
      </div>

      <p className="info-fineprint">
        Effective date: [TBD] · Last updated: [TBD]
      </p>

      <h3>1. Who we are</h3>
      <p>
        {COMPANY}, operated by {OPERATOR} ({OPERATOR_LOCATION}), provides the
        StealADeal technology platform. This policy explains what we collect
        and how we use it. Contact:{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <h3>2. Information we collect</h3>
      <ul>
        <li>
          <strong>Account data</strong> you provide: name, email, password
          (stored only as a salted hash), role, and — for dealers — the
          dealership you’re associated with.
        </li>
        <li>
          <strong>Activity data</strong>: saved cars, saved searches,
          comparisons, leads/inquiries, appointments, and deal activity you
          create on the Platform.
        </li>
        <li>
          <strong>Technical data</strong>: standard request/diagnostic logs
          (request identifiers, error events). We do not log passwords or
          payment card numbers.
        </li>
      </ul>

      <h3>3. How we use it</h3>
      <p>
        To operate the marketplace and deal room, connect you with dealers,
        send notifications you opt into (such as price-drop alerts on saved
        cars/searches), secure accounts, and improve the service. We do not
        sell your personal information.
      </p>

      <h3>4. Authentication &amp; storage</h3>
      <p>
        Access tokens are held only in browser memory for the active session
        — not in localStorage — and expire quickly; a rotating refresh token
        maintains your session. Closing or hard-refreshing the tab may
        require signing in again. [Cookie usage, if any: TBD by counsel.]
      </p>

      <h3>5. Sharing</h3>
      <p>
        When you contact a dealer, request a test drive, or start a deal,
        the relevant information is shared with that dealer so they can serve
        you. Payments are handled by third-party processors under their own
        privacy terms — StealADeal does not store card details or hold buyer
        funds. We may share data with service providers or as required by
        law. [Subprocessor list: TBD.]
      </p>

      <h3>6. Your choices</h3>
      <p>
        You can edit or delete saved cars and searches, turn price-drop
        alerts on or off, and request account deletion by contacting us.
        [Jurisdiction-specific rights (e.g., CCPA/GDPR) and verified-request
        process: TBD by counsel.]
      </p>

      <h3>7. Data retention &amp; security</h3>
      <p>
        We retain data for as long as your account is active or as needed to
        provide the service and meet legal obligations. We use reasonable
        technical and organizational safeguards; no method is 100% secure.
        [Retention schedule: TBD.]
      </p>

      <h3>8. Children</h3>
      <p>
        The Platform is not directed to children and is intended for users
        who can form a binding contract.
      </p>

      <h3>9. Changes &amp; contact</h3>
      <p>
        We may update this policy; material changes will be posted with a
        revised effective date. Questions:{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <p className="info-fineprint">
        StealADeal is a technology platform. Vehicles are sold by the
        listing dealer, a licensed motor vehicle dealer. StealADeal is not a
        party to the sale.
      </p>
    </article>
  );
}

export function FaqView() {
  const faqs: {q: string; a: string}[] = [
    {
      q: 'Is StealADeal a car dealer?',
      a: 'No. StealADeal is a technology platform. Every vehicle is sold by an independent, licensed dealer who sets the price, prepares the contract, holds title, and handles compliance. We provide the software.',
    },
    {
      q: 'Does it cost anything to browse or buy?',
      a: 'Browsing, comparing, saving cars, and using the deal room are free for buyers. Dealers pay a software subscription and platform service fee — never a commission on your sale.',
    },
    {
      q: 'Do I need an account to look at cars?',
      a: 'No. You can browse inventory, view details, compare, and estimate payments as a guest. An account is needed to save cars, save searches, message a dealer, book a test drive, or start a purchase.',
    },
    {
      q: 'How does the deposit work?',
      a: 'Any deposit is part of the transaction between you and the dealer and is processed by a third-party payment provider. StealADeal never holds buyer funds. Refund eligibility and contract terms are set by the dealer and applicable law.',
    },
    {
      q: 'What is the “deal score”?',
      a: 'A transparency aid. When market-value data is available it shows how the price compares to market; otherwise it compares the price to similar listings on the platform. It is informational, not an appraisal or an offer.',
    },
    {
      q: 'How do price-drop alerts work?',
      a: 'Save a car to your garage or save a search with alerts enabled. If a matching car’s price drops, you’ll get a notification. Manage alerts anytime in My Garage.',
    },
    {
      q: 'How is my login kept secure?',
      a: 'Session tokens live only in memory (never localStorage) and are short-lived with automatic refresh. Passwords are stored only as a salted hash.',
    },
    {
      q: 'I’m a dealer — how do I get listed?',
      a: 'Create a dealer account; listings go live after license approval. You manage inventory, leads, appointments, and deals from the dealer portal.',
    },
  ];
  return (
    <article className="info-page">
      <p className="info-lead">
        Quick answers about how StealADeal works for buyers and dealers.
      </p>
      <dl className="faq-list">
        {faqs.map(item => (
          <div key={item.q} className="faq-item">
            <dt>{item.q}</dt>
            <dd>{item.a}</dd>
          </div>
        ))}
      </dl>
      <p className="info-fineprint">
        Still stuck? Email{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </article>
  );
}

export function ContactView() {
  return (
    <article className="info-page">
      <p className="info-lead">
        We’d love to hear from you — whether you’re a buyer with a question
        or a dealer who wants to join the network.
      </p>

      <h3>General &amp; support</h3>
      <p>
        Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We aim
        to respond within [TBD] business days.
      </p>

      <h3>Dealers</h3>
      <p>
        Interested in listing your inventory? Reach out at{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and we’ll walk
        you through onboarding and approval.
      </p>

      <h3>Company</h3>
      <p>
        {COMPANY} — a Delaware corporation. Platform operated by {OPERATOR},{' '}
        {OPERATOR_LOCATION}. [Mailing address &amp; support phone: TBD.]
      </p>

      <p className="info-fineprint">
        For questions about a specific vehicle, price, or paperwork, the
        selling dealer is your point of contact — StealADeal is the
        technology platform and is not a party to the sale.
      </p>
    </article>
  );
}
