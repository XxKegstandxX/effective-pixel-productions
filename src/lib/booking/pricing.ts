// Stripe's standard US card rate. If the organizer has a nonprofit rate
// (2.2% + $0.30) or uses a different processor, change these two numbers.
export const STRIPE_PERCENT_FEE = 0.029
export const STRIPE_FIXED_FEE_CENTS = 30

// Matches Stripe Checkout's minimum session lifetime, so a hold never lapses
// while its Checkout session is still payable.
export const HOLD_MINUTES = 30

/**
 * Gross amount to charge so the organizer nets `priceCents` after Stripe's fee.
 * total = (price + fixed) / (1 - percent), rounded to the nearest cent.
 * $85.00 → (85.00 + 0.30) / 0.971 = 87.8475 → $87.85
 */
export function grossUpCents(priceCents: number): number {
  return Math.round((priceCents + STRIPE_FIXED_FEE_CENTS) / (1 - STRIPE_PERCENT_FEE))
}

export function totalCents(priceCents: number, coverFee: boolean): number {
  return coverFee ? grossUpCents(priceCents) : priceCents
}

export function formatUsd(cents: number): string {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}
