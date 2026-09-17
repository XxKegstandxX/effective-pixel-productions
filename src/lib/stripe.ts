import 'server-only'
import Stripe from 'stripe'

let stripeClient: Stripe | undefined

export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('Missing STRIPE_SECRET_KEY')
    // apiVersion intentionally omitted: uses the version pinned by the installed SDK.
    stripeClient = new Stripe(key)
  }
  return stripeClient
}
