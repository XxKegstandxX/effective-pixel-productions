import 'server-only'
import { revalidatePath } from 'next/cache'

/**
 * Purge any server-side route/data cache for pages that render booking state.
 * The pages are force-dynamic already, so this is a safety net; the client
 * Router Cache is handled by `staleTimes.dynamic = 0` in next.config.js plus
 * router.refresh() after in-place mutations.
 */
export function revalidateBookingPages(bookingId?: string) {
  revalidatePath('/headshots')
  revalidatePath('/headshots/success')
  if (bookingId) revalidatePath(`/headshots/manage/${bookingId}`)
  else revalidatePath('/headshots/manage/[bookingId]', 'page')
}
