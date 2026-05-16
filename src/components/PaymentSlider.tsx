import React, {useMemo, useState} from 'react';

type CreditBand = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';

const aprByBand: Record<CreditBand, number> = {
  EXCELLENT: 0.049,
  GOOD: 0.069,
  FAIR: 0.099,
  POOR: 0.149,
};

const termOptions = [36, 48, 60, 72];

type Props = {
  vehiclePrice: number;
  defaultDownPayment?: number;
  defaultTermMonths?: number;
};

export function PaymentSlider({
  vehiclePrice,
  defaultDownPayment,
  defaultTermMonths = 60,
}: Props) {
  const minDown = 0;
  const maxDown = Math.max(0, Math.round(vehiclePrice * 0.5));
  const initialDown =
    defaultDownPayment ?? Math.min(maxDown, Math.round(vehiclePrice * 0.1));
  const [downPayment, setDownPayment] = useState(initialDown);
  const [termMonths, setTermMonths] = useState(defaultTermMonths);
  const [creditBand, setCreditBand] = useState<CreditBand>('GOOD');

  const apr = aprByBand[creditBand];
  const principal = Math.max(0, vehiclePrice - downPayment);
  const monthlyPayment = useMemo(
    () => calculateMonthlyPayment(principal, apr, termMonths),
    [principal, apr, termMonths],
  );

  return (
    <section className="payment-slider" aria-label="Estimate your payment">
      <header className="payment-slider-header">
        <p className="card-kicker">Estimate your payment</p>
        <strong className="payment-slider-amount">
          {formatCurrency(monthlyPayment)} <span>/ mo</span>
        </strong>
        <span className="payment-slider-rate">at {(apr * 100).toFixed(2)}% APR</span>
      </header>

      <label className="payment-slider-field">
        <div className="payment-slider-row">
          <span>Down payment</span>
          <strong>{formatCurrency(downPayment)}</strong>
        </div>
        <input
          type="range"
          min={minDown}
          max={maxDown}
          step={250}
          value={downPayment}
          onChange={event => setDownPayment(Number(event.target.value))}
          aria-label="Down payment"
        />
      </label>

      <fieldset className="payment-slider-field">
        <legend>Term</legend>
        <div className="payment-slider-options">
          {termOptions.map(option => (
            <button
              key={option}
              type="button"
              className={
                option === termMonths
                  ? 'payment-slider-option active'
                  : 'payment-slider-option'
              }
              onClick={() => setTermMonths(option)}>
              {option} mo
            </button>
          ))}
        </div>
      </fieldset>

      <label className="payment-slider-field">
        <span>Credit</span>
        <select
          className="text-input"
          value={creditBand}
          onChange={event => setCreditBand(event.target.value as CreditBand)}>
          <option value="EXCELLENT">Excellent (720+)</option>
          <option value="GOOD">Good (660–719)</option>
          <option value="FAIR">Fair (600–659)</option>
          <option value="POOR">Rebuilding (&lt; 600)</option>
        </select>
      </label>

      <p className="payment-slider-disclaimer">
        Estimate only. Pre-qualification with a soft credit check is coming soon.
      </p>
    </section>
  );
}

function calculateMonthlyPayment(principal: number, apr: number, termMonths: number) {
  if (principal <= 0 || termMonths <= 0) return 0;
  const monthlyRate = apr / 12;
  if (monthlyRate === 0) return principal / termMonths;
  const factor = Math.pow(1 + monthlyRate, -termMonths);
  return (principal * monthlyRate) / (1 - factor);
}

function formatCurrency(value: number) {
  return value.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}
