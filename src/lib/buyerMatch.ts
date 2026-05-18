import type {Vehicle} from '../api';

/**
 * Buyer-facing "gamification" scoring. Everything here is transparent
 * and derived only from the listings actually on the platform — no
 * invented market values or fake authority.
 */

export type DealTier = 'GREAT' | 'FAIR' | 'HIGH';

export type DealScore = {
  tier: DealTier | null; // null = not enough comparable listings
  betterThan: number; // # of peers this is cheaper than
  peers: number; // comparable listings considered
  label: string;
};

/**
 * Deal score = this car's price vs. other LIVE listings of the same
 * make+model. Honest and explainable ("cheaper than 9 of 12 similar
 * listings here"). Needs >= 3 peers or it abstains.
 */
export function dealScore(
  vehicle: Vehicle,
  all: readonly Vehicle[],
): DealScore {
  const peers = all.filter(
    other =>
      other.id !== vehicle.id &&
      other.status === 'LIVE' &&
      other.make === vehicle.make &&
      other.model === vehicle.model,
  );

  if (peers.length < 3) {
    return {
      tier: null,
      betterThan: 0,
      peers: peers.length,
      label: 'Not enough similar listings to score',
    };
  }

  const cheaperThan = peers.filter(p => vehicle.price < p.price).length;
  const ratio = cheaperThan / peers.length;
  const tier: DealTier =
    ratio >= 0.66 ? 'GREAT' : ratio >= 0.34 ? 'FAIR' : 'HIGH';
  const label = `Cheaper than ${cheaperThan} of ${peers.length} similar ${vehicle.make} ${vehicle.model} listings`;
  return {tier, betterThan: cheaperThan, peers: peers.length, label};
}

// ── Match quiz ────────────────────────────────────────────────

export type UseCase =
  | 'COMMUTE'
  | 'FAMILY'
  | 'ADVENTURE'
  | 'PERFORMANCE'
  | 'WORK';
export type Priority = 'PRICE' | 'LOW_MILES' | 'NEWER' | 'SPACE';
export type BodyPref = 'ANY' | 'SEDAN' | 'SUV' | 'TRUCK' | 'SPORT';

export type MatchAnswers = {
  useCase: UseCase;
  maxBudget: number; // all-in, includes est. tax (matches the slider)
  priority: Priority;
  body: BodyPref;
};

const SUV_HINTS = [
  'rav4',
  'cr-v',
  'crv',
  'explorer',
  'highlander',
  'pilot',
  'tahoe',
  'suburban',
  'x5',
  'x3',
  'q5',
  'cx-5',
  'cx5',
  'rogue',
  'escape',
  'equinox',
  'tucson',
  'santa fe',
  'telluride',
  'sorento',
  '4runner',
  'wrangler',
  'bronco',
];
const TRUCK_HINTS = [
  'f-150',
  'f150',
  'silverado',
  'sierra',
  'ram',
  'tacoma',
  'tundra',
  'ranger',
  'colorado',
  'frontier',
  'titan',
  'ridgeline',
];
const SPORT_HINTS = [
  'mustang',
  'camaro',
  'corvette',
  'challenger',
  'charger',
  '911',
  'gt',
  'gt-r',
  'gtr',
  'supra',
  'miata',
  'mx-5',
  'brz',
  'gr86',
  '86',
  'si',
  'type r',
  'sti',
  'wrx',
  'm3',
  'm4',
  'amg',
];

export function inferBody(vehicle: Vehicle): Exclude<BodyPref, 'ANY'> {
  const hay = `${vehicle.model} ${vehicle.trim}`.toLowerCase();
  if (TRUCK_HINTS.some(h => hay.includes(h))) return 'TRUCK';
  if (SPORT_HINTS.some(h => hay.includes(h))) return 'SPORT';
  if (SUV_HINTS.some(h => hay.includes(h))) return 'SUV';
  return 'SEDAN';
}

const USE_TO_BODY: Record<UseCase, Exclude<BodyPref, 'ANY'>[]> = {
  COMMUTE: ['SEDAN'],
  FAMILY: ['SUV', 'SEDAN'],
  ADVENTURE: ['SUV', 'TRUCK'],
  PERFORMANCE: ['SPORT'],
  WORK: ['TRUCK'],
};

/**
 * Returns a 0–100 match percentage. Transparent weighting:
 *  budget fit 35, priority alignment 30, use fit 20, body fit 15.
 */
export function matchPercent(
  vehicle: Vehicle,
  answers: MatchAnswers,
  all: readonly Vehicle[],
): number {
  let score = 0;

  // Budget (all-in incl. ~7% est. tax to mirror the slider)
  const allIn = vehicle.price * 1.07;
  if (allIn <= answers.maxBudget) {
    score += 35;
  } else {
    const over = (allIn - answers.maxBudget) / answers.maxBudget;
    score += Math.max(0, 35 - over * 70); // fades out fast past budget
  }

  // Priority alignment (relative to the visible inventory)
  const prices = all.map(v => v.price);
  const miles = all.map(v => v.mileage);
  const years = all.map(v => v.modelYear);
  const pct = (val: number, arr: number[], higherIsBetter: boolean) => {
    if (arr.length < 2) return 0.5;
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    if (max === min) return 0.5;
    const norm = (val - min) / (max - min);
    return higherIsBetter ? norm : 1 - norm;
  };
  let prioFit = 0.5;
  if (answers.priority === 'PRICE') prioFit = pct(vehicle.price, prices, false);
  else if (answers.priority === 'LOW_MILES')
    prioFit = pct(vehicle.mileage, miles, false);
  else if (answers.priority === 'NEWER')
    prioFit = pct(vehicle.modelYear, years, true);
  else if (answers.priority === 'SPACE')
    prioFit = inferBody(vehicle) === 'SUV' || inferBody(vehicle) === 'TRUCK'
      ? 1
      : 0.3;
  score += prioFit * 30;

  // Use-case fit
  const body = inferBody(vehicle);
  score += USE_TO_BODY[answers.useCase].includes(body) ? 20 : 6;

  // Body preference
  if (answers.body === 'ANY') score += 12;
  else score += answers.body === body ? 15 : 4;

  return Math.round(Math.max(0, Math.min(100, score)));
}
