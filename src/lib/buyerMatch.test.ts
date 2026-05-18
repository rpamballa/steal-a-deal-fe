import {describe, expect, it} from 'vitest';

import type {Vehicle} from '../api';
import {dealScore, inferBody, matchPercent} from './buyerMatch';

function v(p: Partial<Vehicle>): Vehicle {
  return {
    id: 1,
    dealerId: 1,
    dealerName: 'Lot',
    vin: 'VIN',
    modelYear: 2020,
    make: 'Toyota',
    model: 'Camry',
    trim: 'LE',
    primaryImageUrl: '',
    imageUrls: [],
    mileage: 40000,
    price: 20000,
    status: 'LIVE',
    ...p,
  };
}

describe('dealScore', () => {
  it('abstains with fewer than 3 comparable listings', () => {
    const target = v({id: 1, price: 20000});
    const res = dealScore(target, [target, v({id: 2, price: 22000})]);
    expect(res.tier).toBeNull();
    expect(res.peers).toBe(1);
  });

  it('rates a low price among peers as GREAT', () => {
    const target = v({id: 1, price: 15000});
    const peers = [2, 3, 4, 5].map(id => v({id, price: 25000}));
    const res = dealScore(target, [target, ...peers]);
    expect(res.tier).toBe('GREAT');
    expect(res.betterThan).toBe(4);
  });

  it('rates the most expensive among peers as HIGH', () => {
    const target = v({id: 1, price: 40000});
    const peers = [2, 3, 4, 5].map(id => v({id, price: 20000}));
    const res = dealScore(target, [target, ...peers]);
    expect(res.tier).toBe('HIGH');
  });

  it('only compares same make+model LIVE listings', () => {
    const target = v({id: 1, price: 18000, make: 'Toyota', model: 'Camry'});
    const all = [
      target,
      v({id: 2, price: 30000, make: 'Honda', model: 'Accord'}),
      v({id: 3, price: 30000, make: 'Toyota', model: 'RAV4'}),
      v({id: 4, price: 30000, status: 'SOLD'}),
    ];
    expect(dealScore(target, all).tier).toBeNull(); // <3 true peers
  });
});

describe('dealScore (market-aware)', () => {
  it('uses backend market value when present (below market = GREAT)', () => {
    const target = v({id: 1, price: 18000, marketValueCents: 2200000});
    const res = dealScore(target, [target]);
    expect(res.tier).toBe('GREAT');
    expect(res.label).toMatch(/below market value/);
  });
  it('flags above-market pricing as HIGH', () => {
    const target = v({id: 1, price: 26000, marketValueCents: 2200000});
    expect(dealScore(target, [target]).tier).toBe('HIGH');
  });
  it('around market value is FAIR', () => {
    const target = v({id: 1, price: 22000, marketValueCents: 2200000});
    expect(dealScore(target, [target]).tier).toBe('FAIR');
  });
});

describe('inferBody', () => {
  it('prefers the backend bodyType over keyword inference', () => {
    expect(inferBody(v({model: 'Mustang', bodyType: 'SUV'}))).toBe('SUV');
    expect(inferBody(v({model: 'Camry', bodyType: 'TRUCK'}))).toBe('TRUCK');
    expect(inferBody(v({model: 'X', trim: 'Y', bodyType: 'CONVERTIBLE'}))).toBe(
      'SPORT',
    );
  });
  it('falls back to keyword inference when bodyType is null/OTHER', () => {
    expect(inferBody(v({model: 'F-150', bodyType: null}))).toBe('TRUCK');
    expect(inferBody(v({model: 'RAV4', bodyType: 'OTHER'}))).toBe('SUV');
    expect(inferBody(v({model: 'Mustang'}))).toBe('SPORT');
    expect(inferBody(v({model: 'Camry'}))).toBe('SEDAN');
  });
});

describe('matchPercent', () => {
  const inventory = [
    v({id: 1, price: 15000, mileage: 30000, modelYear: 2019, model: 'Camry'}),
    v({id: 2, price: 45000, mileage: 80000, modelYear: 2015, model: 'F-150'}),
  ];

  it('scores within budget higher than over budget', () => {
    const cheap = matchPercent(inventory[0], {
      useCase: 'COMMUTE',
      maxBudget: 20000,
      priority: 'PRICE',
      body: 'SEDAN',
    }, inventory);
    const over = matchPercent(inventory[1], {
      useCase: 'COMMUTE',
      maxBudget: 20000,
      priority: 'PRICE',
      body: 'SEDAN',
    }, inventory);
    expect(cheap).toBeGreaterThan(over);
    expect(cheap).toBeLessThanOrEqual(100);
    expect(over).toBeGreaterThanOrEqual(0);
  });

  it('rewards body + use-case alignment', () => {
    const truck = v({id: 3, model: 'F-150', price: 30000});
    const asWork = matchPercent(truck, {
      useCase: 'WORK',
      maxBudget: 40000,
      priority: 'SPACE',
      body: 'TRUCK',
    }, [truck, ...inventory]);
    const asCommute = matchPercent(truck, {
      useCase: 'COMMUTE',
      maxBudget: 40000,
      priority: 'PRICE',
      body: 'SEDAN',
    }, [truck, ...inventory]);
    expect(asWork).toBeGreaterThan(asCommute);
  });
});
