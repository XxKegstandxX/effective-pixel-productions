import 'server-only'
import Stripe from 'stripe'

export const STRIPE_API_VERSION = '2026-08-26.dahlia'

let stripeClient: Stripe | undefined

export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('Missing STRIPE_SECRET_KEY')
    // Pinned to match the webhook endpoint's API version in the Stripe dashboard.
    // If you bump this, update the endpoint (Developers → Webhooks) to the same version.
    stripeClient = new Stripe(key, { apiVersion: STRIPE_API_VERSION })
  }
  return stripeClient
}
