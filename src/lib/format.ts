import type {Vehicle} from '../api';
import {toUserMessage} from './userMessage';

export function formatLabel(value: string | null | undefined): string {
  if (!value) {
    return 'Unknown';
  }
  return value
    .toLowerCase()
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatMileage(value: number): string {
  return `${new Intl.NumberFormat('en-US').format(value)} mi`;
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function getErrorMessage(error: unknown): string {
  return toUserMessage(error);
}

export function getVehicleGallery(vehicle: Vehicle): string[] {
  const seen = new Set<string>();
  return [vehicle.primaryImageUrl, ...(vehicle.imageUrls ?? [])].filter(
    imageUrl => {
      if (!imageUrl || seen.has(imageUrl)) {
        return false;
      }
      seen.add(imageUrl);
      return true;
    },
  );
}
