import React from 'react';

/**
 * Static informational content. The Terms, Privacy, and Dealer
 * Subscription Agreement text is sourced from the company's working
 * legal DRAFTS (counsel-review banners retained). It is not legal
 * advice and must be finalized by qualified counsel before launch;
 * publication-time specifics remain explicit [TBD] placeholders.
 */

const COMPANY = 'StealADeal, Inc.';
const OPERATOR = 'YP Solutions Inc.';
const OPERATOR_LOCATION = 'Morrisville, North Carolina';
const CONTACT_EMAIL = 'support@stealadeal.io';
const LEGAL_EMAIL = 'legal@stealadeal.io';

const DRAFT_NOTICE =
  'DRAFT FOR COUNSEL REVIEW — NOT LEGAL ADVICE. This document is a working draft to be reviewed and finalized by qualified counsel before publication.';

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
      <p className="info-sub">
        Buyer and Visitor Terms — applies to anyone using the StealADeal
        marketplace.
      </p>
      <div className="notice error" role="note">
        {DRAFT_NOTICE} Items derived from operational facts are stated as
        drafted; items requiring legal judgment (liability caps, arbitration
        scope, class-waiver enforceability) are flagged inline.
      </div>

      <p className="info-fineprint">
        Effective date: [to be set on publication] · Last updated: [to be set
        on publication]
      </p>

      <h3>1. Acceptance of these Terms</h3>
      <p>
        By accessing or using the StealADeal website, mobile applications,
        deal room, or any related services (collectively, the “Platform”),
        you agree to be bound by these Terms of Service (“Terms”) and by our{' '}
        {privacyLink}, which is incorporated by reference. If you do not
        agree, you must not use the Platform.
      </p>
      <p>
        These Terms form a binding contract between you and {COMPANY}, a
        Delaware corporation (“StealADeal”, “we”, “us”, or “our”). The
        Platform is operated on our behalf by {OPERATOR}.
      </p>

      <h3>2. What StealADeal Is — and Is Not</h3>
      <p>
        StealADeal is a technology platform. We provide software that lets
        independent, state-licensed motor vehicle dealers list inventory and
        lets prospective buyers find, compare, and begin transactions for
        used vehicles.
      </p>
      <p>
        StealADeal is <strong>NOT</strong> a motor vehicle dealer, broker,
        auction, lender, insurer, warranty provider, escrow agent, or party
        to any vehicle sale. Every vehicle offered through the Platform is
        sold by the listing dealer (the “Dealer”). The Dealer is the seller
        of record and is solely responsible for: vehicle condition and
        description; pricing; the sales contract; title transfer; collection
        and remittance of taxes, fees, and any DMV charges; legally required
        disclosures (including the FTC Used Car Buyers Guide and any odometer
        disclosure); and all other applicable federal, state, and local
        regulatory compliance.
      </p>
      <p>
        StealADeal does not take title to any vehicle, does not negotiate
        price on behalf of any party, does not hold buyer funds in a platform
        account, and does not receive or hold the proceeds of any vehicle
        sale. Platform technology fees are billed only to Dealers as a
        software service charge — they are not a commission on, share of, or
        markup on any sale.
      </p>

      <h3>3. Eligibility and Accounts</h3>
      <p>
        You must be at least eighteen (18) years old, legally able to form a
        binding contract, and not prohibited from using the Platform under
        applicable law. You are responsible for all activity that occurs
        under your account and for maintaining the confidentiality of your
        credentials. You agree to provide accurate, current, and complete
        registration information and to keep it updated.
      </p>
      <p>
        We may suspend or terminate your account at any time if we reasonably
        believe you have violated these Terms, applicable law, or the rights
        of any other user.
      </p>

      <h3>4. The Buyer–Dealer Transaction</h3>
      <p>
        Listings, prices, photos, vehicle history summaries, payment
        estimates, “deal score” indicators, “match” recommendations,
        financing estimates, and any similar features are provided for
        convenience only. They are informational, may be inaccurate, may
        change without notice, and are not offers, appraisals, guarantees, or
        commitments by StealADeal or the Dealer.
      </p>
      <p>
        A binding agreement to purchase a vehicle arises only when you and
        the Dealer execute a written sales contract together. Any deposit,
        financing application, trade-in valuation, vehicle inspection,
        refund, cancellation, warranty, “as-is” disclosure, or post-sale
        remedy is governed solely by your contract with the Dealer and
        applicable law. StealADeal is not a party to that contract.
      </p>
      <p>
        Any payment you make in connection with a transaction (including, for
        example, a refundable hold or deposit) is processed by a third-party
        payment processor under that processor’s terms and is paid to or held
        for the benefit of the Dealer — never StealADeal. Refund eligibility
        and timing are determined by the Dealer and applicable law.
      </p>

      <h3>5. Buyer Information Provided to the Dealer</h3>
      <p>
        When you start a deal with a Dealer, the Dealer needs information from
        you to complete the sale and to satisfy its own legal obligations
        (for example: title and registration, financing applications, “Red
        Flags” identity verification, tax reporting, and dealer
        recordkeeping). You authorize StealADeal to share information you
        provide through the Platform with the Dealer for those purposes.
      </p>
      <p>
        Sensitive identifying or financial information requested by a Dealer
        in connection with financing or titling — including, where
        applicable, Social Security number, driver’s license details, and
        credit information — is provided by you to the Dealer for use in your
        transaction with that Dealer. StealADeal does not retain that
        information for its own purposes beyond what is necessary to
        facilitate the specific transaction and to satisfy applicable
        record-retention requirements. The {privacyLink} explains this in
        more detail.
      </p>

      <h3>6. Fees and Payments</h3>
      <p>
        Use of the Platform by buyers and visitors is free. StealADeal does
        not charge buyers any subscription, transaction, success, finder, or
        convenience fee. We are compensated by Dealers under a separate
        Dealer Subscription Agreement.
      </p>
      <p>
        If you initiate a deposit or other in-deal payment, that amount is
        set by the Dealer, is collected by a third-party payment processor,
        and is held for the benefit of the Dealer.
      </p>

      <h3>7. Acceptable Use</h3>
      <p>You agree not to:</p>
      <ul>
        <li>
          use the Platform to violate any law, infringe any third party’s
          rights, or facilitate fraud;
        </li>
        <li>
          submit false, misleading, or impersonating information, including
          in any lead, inquiry, deposit, or financing application;
        </li>
        <li>
          scrape, crawl, harvest, or use automated means to extract data from
          the Platform, except for narrowly tailored search-engine crawling
          consistent with our robots.txt;
        </li>
        <li>
          interfere with, probe, or attempt to circumvent the security or
          integrity of the Platform or any third-party service it relies on;
        </li>
        <li>
          resell, sublicense, or commercially redistribute any portion of the
          Platform, including listing content, photos, or “deal score” data;
        </li>
        <li>
          use the Platform to harass, defame, or threaten any other user,
          including any Dealer or Dealer staff.
        </li>
      </ul>

      <h3>8. Intellectual Property</h3>
      <p>
        The Platform — including all software, design, text, graphics, the
        “StealADeal” name and marks, the deal-score methodology, and all
        related know-how — is owned by StealADeal or its licensors and is
        protected by U.S. and international intellectual-property laws.
        Subject to your compliance with these Terms, StealADeal grants you a
        limited, revocable, non-exclusive, non-transferable license to access
        and use the Platform for its intended purpose. Vehicle listing
        content is provided by the listing Dealer, who is solely responsible
        for its accuracy and lawfulness.
      </p>

      <h3>9. Third-Party Services</h3>
      <p>
        The Platform integrates with third-party services for payments,
        electronic signature, identity-verification, communications,
        vehicle-history data, and analytics. Your use of those services is
        also subject to their own terms and privacy policies. StealADeal is
        not responsible for third-party services and disclaims liability for
        their acts or omissions to the extent permitted by law.
      </p>

      <h3>10. Disclaimers</h3>
      <p>
        To the maximum extent permitted by law, the Platform, all content,
        and all features (including the “deal score”, “match”,
        payment-estimate, and price-drop alerts) are provided “AS IS” and “AS
        AVAILABLE” without warranty of any kind, whether express, implied, or
        statutory, including warranties of merchantability, fitness for a
        particular purpose, non-infringement, accuracy, or uninterrupted
        availability. StealADeal does not warrant any vehicle, Dealer,
        listing, valuation, estimate, financing or insurance product, or
        third-party service. Test-drive, inspect, and obtain an independent
        mechanical inspection before purchasing.
      </p>

      <h3>11. Limitation of Liability</h3>
      <p>
        To the maximum extent permitted by law, neither StealADeal nor its
        operator, affiliates, officers, employees, or licensors will be
        liable for any indirect, incidental, special, consequential,
        exemplary, or punitive damages, or for any loss of profits, revenue,
        data, goodwill, or business opportunity, arising out of or related to
        your use of the Platform or any transaction with a Dealer.
      </p>
      <p>
        Subject to applicable law, StealADeal’s aggregate liability to you for
        all claims is capped at the greater of (a) US$100, or (b) the total
        amount you have paid to StealADeal in the twelve (12) months
        preceding the event giving rise to the claim — which, because buyers
        do not pay StealADeal, is generally US$100. [Cap and carve-outs to be
        reviewed by counsel.] Nothing limits liability that cannot lawfully
        be limited.
      </p>

      <h3>12. Indemnification</h3>
      <p>
        You agree to indemnify, defend, and hold harmless StealADeal, its
        operator, and their respective affiliates, officers, employees, and
        agents from any third-party claim, demand, liability, loss, damage,
        cost, or expense (including reasonable attorneys’ fees) arising out of
        or related to (a) your use of the Platform, (b) your breach of these
        Terms or applicable law, (c) your interactions with any Dealer, or
        (d) any content you submit through the Platform.
      </p>

      <h3>13. Termination</h3>
      <p>
        You may stop using the Platform at any time and may request account
        deletion by emailing us at the address below. We may suspend or
        terminate your access at any time for any reason, including suspected
        violation of these Terms or risk to the Platform or its users.
        Sections that by their nature should survive termination will
        survive.
      </p>

      <h3>14. Governing Law; Forum</h3>
      <p>
        These Terms, and any dispute arising out of or related to them or the
        Platform, are governed by the laws of the State of Delaware, without
        regard to its conflict-of-laws principles. Subject to Section 15, the
        state and federal courts located in New Castle County, Delaware will
        have exclusive jurisdiction, and you consent to personal jurisdiction
        and venue there.
      </p>

      <h3>15. Dispute Resolution</h3>
      <p>
        [OPEN ITEM — counsel to decide arbitration scope and class-action
        waiver.] We expect to require informal dispute resolution by
        good-faith email negotiation before any formal proceeding, and to
        include a binding individual arbitration provision (with carve-outs
        for small-claims-court and intellectual-property claims) governed by
        the Federal Arbitration Act and administered by the American
        Arbitration Association under its Consumer Arbitration Rules, seated
        in Wilmington, Delaware.
      </p>

      <h3>16. Changes to These Terms</h3>
      <p>
        We may revise these Terms from time to time. When we do, we will
        update the “Last updated” date and, for material changes, provide
        reasonable notice (for example, by email or an in-Platform notice).
        Your continued use after the revised Terms take effect constitutes
        acceptance.
      </p>

      <h3>17. Miscellaneous</h3>
      <p>
        These Terms (with the {privacyLink} and any in-Platform notice at the
        point of a specific feature) are the entire agreement between you and
        StealADeal regarding the Platform. If any provision is held
        unenforceable, the rest remains in effect. Our failure to enforce a
        provision is not a waiver. You may not assign these Terms; we may
        assign them to an affiliate or in connection with a merger,
        acquisition, or sale of assets. There are no third-party
        beneficiaries.
      </p>

      <h3>18. Contact</h3>
      <p>
        {COMPANY}, a State of Delaware corporation. Platform operations by{' '}
        {OPERATOR}, {OPERATOR_LOCATION}.
        <br />
        Legal notices:{' '}
        <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>
        <br />
        General support:{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        <br />
        Mailing address: [to be inserted on publication]
      </p>

      <p className="info-fineprint">
        StealADeal is a technology platform. Vehicles are sold by the listing
        dealer, a licensed motor vehicle dealer. StealADeal is not a party to
        the sale.
      </p>
    </article>
  );
}

export function PrivacyView() {
  return (
    <article className="info-page">
      <p className="info-sub">
        How we collect, use, share, and protect your information.
      </p>
      <div className="notice error" role="note">
        {DRAFT_NOTICE} Counsel should confirm GLBA Safeguards Rule analysis,
        state-specific consumer-privacy disclosures (CCPA/CPRA and others),
        the cookie/tracking disclosure, and the data-retention schedule.
      </div>

      <p className="info-fineprint">
        Effective date: [to be set on publication] · Last updated: [to be set
        on publication]
      </p>

      <h3>1. Who we are</h3>
      <p>
        {COMPANY} (“StealADeal”, “we”, “us”, “our”) is a State of Delaware
        corporation operating an online marketplace and dealer workflow
        platform for the sale of used vehicles by independent, state-licensed
        motor vehicle dealers. The Platform is operated on our behalf by{' '}
        {OPERATOR}, {OPERATOR_LOCATION}. Contact for privacy questions or
        requests: <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>.
      </p>

      <h3>2. Scope</h3>
      <p>
        This Policy applies to information we collect through the StealADeal
        website, mobile applications, deal room, dealer portal, and related
        communications. It does not apply to information collected by Dealers
        in their own systems or by third-party services you reach from the
        Platform.
      </p>

      <h3>3. Categories of information we collect</h3>
      <p>
        <strong>Information you give us.</strong> Account information (name,
        email, password stored only as a salted hash, role, and for
        dealer-affiliated users the dealership); profile and activity content
        (saved vehicles, saved searches, comparisons, messages and leads to
        Dealers, appointment requests, deal-room entries); transaction-routing
        information you submit so a Dealer can complete a sale — where a sale
        involves financing, titling, identity verification, or tax-reporting,
        you may provide sensitive personal information (date of birth,
        driver’s license number, Social Security number, or financial-account
        information) that we route to the Dealer; and communications with us.
      </p>
      <p>
        <strong>Information collected automatically.</strong> Technical and
        log data (IP address, browser/device, language, referring URL, pages
        accessed, timestamps, request IDs and error events). We do not log
        passwords or payment card numbers. We use a small set of strictly
        necessary cookies to operate the Platform and may use limited
        analytics. [Cookie banner/consent to be finalized by counsel.]
      </p>
      <p>
        <strong>Information from third parties.</strong> Payment processors
        confirm whether a deposit succeeded/failed/was refunded (no full card
        numbers); the e-signature provider confirms view/sign status and
        returns the signed PDF; vehicle-history and VIN-decode providers
        return vehicle attributes attached to a listing.
      </p>

      <h3>4. How we use information</h3>
      <ul>
        <li>operate the Platform and authenticate users;</li>
        <li>
          connect buyers and Dealers and route transaction information from a
          buyer to the Dealer they are transacting with;
        </li>
        <li>
          process Platform events such as a deposit (third-party processor) or
          a buyer-agreement signature (third-party e-sign);
        </li>
        <li>
          send notifications you opt into (price-drop alerts on saved
          vehicles/searches) and operational messages;
        </li>
        <li>secure accounts, prevent fraud, debug and improve the Platform;</li>
        <li>comply with legal obligations and enforce our Terms.</li>
      </ul>
      <p>
        We do not sell your personal information, and we do not “share” it for
        cross-context behavioral advertising as defined under California law.
      </p>

      <h3>5. How sensitive financial and identifying information is handled</h3>
      <p>
        You provide sensitive information (driver’s license, SSN where
        financing/titling requires it, financial-account details) to the
        Dealer through the Platform. StealADeal acts as a conduit and does not
        use this information for any independent purpose. Specifically: we
        transmit it to the Dealer for your transaction; we do not store it in
        plaintext beyond what is necessary to deliver it and redact/tokenize
        where practicable; we do not use it for marketing, “deal score”,
        analytics, or model training; and we do not share it with third
        parties other than the Dealer, our service providers under
        confidentiality obligations, and as required by law. Payment-card
        information is collected directly by our payment processor and is not
        stored on StealADeal’s servers — only processor-side identifiers and
        status. [GLBA Safeguards Rule scope: for counsel to confirm.]
      </p>

      <h3>6. How we share information</h3>
      <p>
        With the Dealer for your transaction; with service providers acting on
        our behalf (hosting, payments, e-signature, identity verification,
        communications, VIN/vehicle-history, support, error tracking,
        analytics) bound to use it only on our instructions; for legal and
        safety reasons; and in a corporate transaction (merger, acquisition,
        financing, or asset sale) with notice or consent where required. A
        current subprocessor list is available on request at{' '}
        <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>.
      </p>

      <h3>7. Authentication, retention, and security</h3>
      <p>
        We use industry-standard safeguards including encryption in transit,
        encryption at rest for sensitive fields, salted password hashing,
        short-lived access tokens, and a rotating refresh-token mechanism so
        access tokens are held only in browser memory for the active session
        — not in browser local storage. No method is perfectly secure. We
        retain information while your account is active and as needed for
        legal, tax, accounting, dispute, and enforcement purposes; sensitive
        routing information is kept for the minimum period necessary and then
        deleted or rendered inaccessible. [Final retention schedule with
        counsel.]
      </p>

      <h3>8. Your choices and rights</h3>
      <ul>
        <li>update account information and notification preferences;</li>
        <li>turn price-drop and saved-search alerts on or off;</li>
        <li>delete saved vehicles and saved searches;</li>
        <li>
          request access, correction, or deletion by contacting{' '}
          <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a> (we may verify
          your identity and may be unable to delete information we must retain
          by law).
        </li>
      </ul>
      <p>
        Depending on where you reside you may have additional rights (to
        know, delete, correct, opt out of “sale”/“sharing”, and limit use of
        sensitive personal information). We do not sell or share personal
        information for cross-context behavioral advertising.
        [State-specific disclosures and “Do Not Sell or Share” mechanism: to
        be inserted by counsel.]
      </p>

      <h3>9. Children</h3>
      <p>
        The Platform is not directed to children under 16 and is intended for
        users who can form a binding contract. We do not knowingly collect
        personal information from children.
      </p>

      <h3>10. International users</h3>
      <p>
        The Platform is operated from the United States and intended for U.S.
        residents. If you access it from elsewhere, your information will be
        transferred to and processed in the United States.
      </p>

      <h3>11. Changes to this Policy</h3>
      <p>
        We may update this Policy. We will update the “Last updated” date and,
        for material changes, provide reasonable notice before the change
        takes effect.
      </p>

      <h3>12. How to contact us</h3>
      <p>
        {COMPANY}, a State of Delaware corporation. Platform operated by{' '}
        {OPERATOR}, {OPERATOR_LOCATION}.
        <br />
        Privacy contact:{' '}
        <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>
        <br />
        Mailing address: [to be inserted on publication]
      </p>

      <p className="info-fineprint">
        StealADeal is a technology platform. Vehicles are sold by the listing
        dealer, a licensed motor vehicle dealer. StealADeal is not a party to
        the sale.
      </p>
    </article>
  );
}

export function DealerTermsView() {
  return (
    <article className="info-page">
      <p className="info-sub">
        Dealer Subscription Agreement — master agreement between {COMPANY} and
        a participating motor vehicle dealer.
      </p>
      <div className="notice error" role="note">
        {DRAFT_NOTICE} Counsel should confirm: classification of the platform
        fee as a software-and-services charge (not a brokerage commission)
        under each state’s dealer-licensing law; tax characterization of the
        0.75% transaction fee; liability cap; indemnification scope; and any
        state-specific dealer disclosures.
      </div>
      <p className="info-fineprint">
        Effective date: the date the Dealer accepts this Agreement and is
        approved by StealADeal.
      </p>

      <h3>1. Parties</h3>
      <p>
        This Agreement is between {COMPANY}, a State of Delaware corporation
        with operations conducted by {OPERATOR} (“StealADeal”), and the motor
        vehicle dealer that registers and is approved (the “Dealer”).
      </p>

      <h3>2. The Platform &amp; license</h3>
      <p>
        Subject to this Agreement and payment of fees, StealADeal grants the
        Dealer a non-exclusive, non-transferable, revocable right to access
        the Platform to post Listings; receive and manage buyer inquiries,
        appointments, and Deals; electronically deliver buyer-facing
        agreements via the integrated e-signature service; and view analytics
        on the Dealer’s Listings and Deals.
      </p>

      <h3>3. Dealer representations and covenants</h3>
      <p>
        The Dealer represents and covenants on a continuing basis that it is
        and will remain a duly licensed motor vehicle dealer in every
        jurisdiction where it sells; is the seller of record for every Deal
        and takes title to every vehicle sold; will collect and remit all
        taxes and DMV fees and issue all required disclosures (FTC Used Car
        Buyers Guide, odometer, and any state “as-is”/warranty disclosures);
        will comply with all applicable laws (dealer licensing, motor-vehicle
        sales, used-car warranties, financing, advertising, the FTC Red Flags
        Rule, UDAP, CAN-SPAM, and consumer privacy); will keep Listings
        accurate, current, and lawful; will handle buyer information only to
        serve the buyer’s inquiry/Deal and lawful follow-up; and will not make
        “bait and switch” offers.
      </p>

      <h3>4. Buyer information and privacy</h3>
      <p>
        The Platform routes buyer information (and, where the buyer provides
        it, sensitive identifying/financial information) from the buyer to the
        Dealer to complete the sale. StealADeal acts as a conduit and does not
        use it for any independent purpose. Upon receipt the Dealer becomes
        the controller and must secure and dispose of it under all applicable
        laws, including the Gramm-Leach-Bliley Act and its Safeguards Rule and
        the FTC Red Flags Rule, and must not use it for unsolicited marketing,
        list rental, sale, or transfer except as permitted by the buyer or
        law.
      </p>

      <h3>5. Fees</h3>
      <p>
        <strong>Subscription Fee.</strong> US$1,100 per Dealer location per
        month, billed on the Effective Date and recurring monthly,
        non-refundable except as stated.
      </p>
      <p>
        <strong>Transaction Fee.</strong> 0.75% of the gross vehicle sale
        price (excluding taxes, DMV fees, F&amp;I products, and trade-in
        credit) for each Deal that closes during the Attribution Window
        (a buyer whose first contact for that or a substantially similar
        vehicle occurred through the Platform within the preceding 90 days),
        invoiced monthly in arrears, due within 15 days. The Parties intend
        the Transaction Fee to be a software-and-services facilitation fee —
        <strong>
          {' '}
          not a brokerage or sales commission
        </strong>{' '}
        — and the Dealer will not characterize it as a sales commission in any
        buyer disclosure, sales document, or tax filing.
      </p>
      <p>
        <strong>F&amp;I Revenue Share (optional).</strong> If the Parties
        enable F&amp;I in writing, the Dealer pays a 15–25% revenue share of
        the net commission on F&amp;I products attached through the Platform,
        per the addendum.
      </p>
      <p>
        <strong>Payment &amp; late fees.</strong> The Dealer keeps a valid
        payment method with StealADeal’s processor and authorizes charges for
        all fees and taxes when due. Past-due amounts accrue interest at the
        lesser of 1.0%/month or the maximum lawful rate.
      </p>
      <p>
        <strong>Grace period.</strong> Unpaid &gt;7 days: StealADeal may block
        new Deals. Unpaid &gt;30 days: StealADeal may suspend Listings from
        public visibility and, after notice, terminate — with read-only access
        to in-flight Deals to complete buyer obligations.
      </p>

      <h3>6. The Platform is not a dealer or party to the sale</h3>
      <p>
        StealADeal is a technology provider and is NOT a motor vehicle dealer,
        broker, auction, lender, insurer, warranty provider, or escrow agent,
        and is NOT a party to any sale. It does not take title, negotiate
        price, or hold sale proceeds. The Dealer is solely responsible for the
        sales contract, title transfer, taxes/fees, disclosures, and post-sale
        obligations, and will display (and not obscure) the Platform-provided
        “not a party to the sale” disclosure.
      </p>

      <h3>7. Service levels, IP, and confidentiality</h3>
      <p>
        StealADeal uses commercially reasonable efforts to keep the Platform
        available and may modify features with reasonable notice of material
        adverse changes. StealADeal owns the Platform and marks; the Dealer
        owns its Listings and grants StealADeal a license to host and display
        them and to use aggregated, de-identified data for service
        improvement. Each Party protects the other’s Confidential Information
        with at least reasonable care.
      </p>

      <h3>8. Term &amp; termination</h3>
      <p>
        Month-to-month from the Effective Date. Either Party may terminate for
        convenience on 30 days’ notice (StealADeal pro-rates any prepaid
        Subscription Fee for a convenience termination it initiates), or
        immediately for cause (uncured material breach, insolvency, or loss of
        a required license). In-flight Deals may be completed during a
        reasonable wind-down.
      </p>

      <h3>9. Warranties, liability, indemnification, insurance</h3>
      <p>
        The Platform is provided “AS IS”/“AS AVAILABLE” except for express
        warranties. Subject to carve-outs (indemnity, fees, confidentiality,
        gross negligence, willful misconduct, fraud), neither Party is liable
        for indirect or consequential damages, and each Party’s aggregate
        liability is capped at fees paid/payable in the prior 12 months. The
        Dealer indemnifies StealADeal for claims arising from vehicles it
        sells, its legal violations, its handling of buyer information,
        Listing content, taxes/fees, and breach; StealADeal provides a limited
        IP-infringement indemnity for the Dealer’s permitted use. The Dealer
        maintains customary dealer insurance (general/garage liability, dealer
        bond, and cyber/data-breach coverage).
      </p>

      <h3>10. Governing law &amp; general</h3>
      <p>
        Governed by Delaware law; exclusive jurisdiction in New Castle County,
        Delaware (with equitable relief available anywhere to protect IP or
        Confidential Information); jury-trial waiver. The Parties are
        independent contractors. Notices to StealADeal must be copied to{' '}
        <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>.
      </p>

      <h3>11. Acceptance</h3>
      <p>
        By clicking “I Accept” during onboarding (or signing a counterpart),
        the Dealer agrees to be bound on behalf of the entity it represents
        and confirms it has authority to do so.
      </p>

      <p className="info-fineprint">
        StealADeal is a technology platform. Vehicles are sold by the listing
        dealer, a licensed motor vehicle dealer. StealADeal is not a party to
        the sale.
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
