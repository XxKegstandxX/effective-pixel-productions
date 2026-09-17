export type SlotStatus = 'open' | 'held' | 'booked'
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled'

export interface EventRow {
  id: string
  name: string
  event_date: string      // 'YYYY-MM-DD'
  start_time: string      // 'HH:MM:SS'
  end_time: string        // 'HH:MM:SS'
  slot_minutes: number
  price_cents: number
  timezone: string        // IANA, e.g. 'America/New_York'
  charity_info: string | null   // optional blurb shown on /headshots; supports blank-line paragraphs
  image_url: string | null      // optional image URL shown alongside the blurb
  created_at: string
}

export interface SlotRow {
  id: string
  event_id: string
  start_time: string      // ISO timestamptz
  end_time: string
  status: SlotStatus
  held_until: string | null
  created_at: string
}

export interface BookingRow {
  id: string
  slot_id: string
  full_name: string
  email: string
  phone: string
  amount_cents: number
  fee_covered: boolean
  stripe_session_id: string | null
  stripe_payment_intent_id: string | null
  status: BookingStatus
  stripe_refund_id: string | null
  refund_cents: number | null
  created_at: string
}
