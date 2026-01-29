import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format INR currency
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format USD currency
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Format number with Indian number system (lakhs, crores)
export function formatIndianNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}

// Parse number from string (handles commas)
export function parseNumber(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned) || 0;
}

// Calculate percentage
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100 * 10) / 10;
}

// Format date
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Cost categories
export const COST_CATEGORIES = [
  { key: 'materialPurchase', label: 'Material Purchase', color: '#3B82F6' },
  { key: 'dyeing', label: 'Dyeing', color: '#8B5CF6' },
  { key: 'weaving', label: 'Weaving', color: '#10B981' },
  { key: 'finishing', label: 'Finishing', color: '#F59E0B' },
  { key: 'rework', label: 'Rework', color: '#EF4444' },
  { key: 'packingLabels', label: 'Packing + Labels', color: '#06B6D4' },
  { key: 'shipping', label: 'Shipping', color: '#EC4899' },
] as const;

export type CostCategoryKey = typeof COST_CATEGORIES[number]['key'];
