import { DateTime } from 'luxon'
import { ClubEvent } from '~/types'

/**
 * Return the default date range for events in the calendar view.
 * Returns the events for a month with a little bit of padding on both edges (6 days).
 */
export const getDefaultDateRange = () => ({
  start: DateTime.local().startOf('day').minus({ days: 6 }),
  end: DateTime.local().startOf('day').plus({ month: 1, days: 6 }),
})

export const classify = <T, K>(arr: T[], predicate: (item: T) => K): Map<K, T[]> => {
  const map = new Map<K, T[]>()
  for (const item of arr) {
    const key = predicate(item)
    const list = map.get(key) || []
    list.push(item)
    map.set(key, list)
  }
  return map
}

export async function fetchEventsInRange(
  start: DateTime,
  end: DateTime,
  doApiRequest: (url: string, data?: any) => Promise<Response>,
  data?: Omit<RequestInit, 'body' | 'headers'> & {
    body?: FormData | any
    headers?: { [key: string]: string | null | void }
  },
): Promise<ClubEvent[]> {
  const params = new URLSearchParams({
    latest_start_time__gte: start.toISO()!,
    earliest_end_time__lte: end.toISO()!,
    format: 'json',
  })
  const response = await doApiRequest(`/events/?${params.toString()}`, data)
  if (!response.ok) throw new Error('Failed to fetch events')
  return response.json() as Promise<ClubEvent[]>
}
