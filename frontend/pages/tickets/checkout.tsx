import { NextPageContext } from 'next'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Select from 'react-select'
import styled from 'styled-components'

import { Subtitle, Text } from '~/components/common'
import renderPage from '~/renderPage'
import { ClubEvent, EventTicket } from '~/types'
import { doApiRequest } from '~/utils'

// TODO: see if we want to move these types to another file
type EventTicketsResponse = {
  totals: { type: string; count: number }[]
}
type CartResponse = { tickets: EventTicket[]; detail: string }

const checkoutSteps = ['select', 'checkout', 'purchase'] as const
type CheckoutStep = typeof checkoutSteps[number]

// TODO: make this styling consistent with the rest of everything bruh
const TicketOption = styled.li`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  padding: 20px 0;

  .option-right {
    margin-left: auto;
    width: 5rem;
  }

  h4 {
    font-size: 20px;
    font-weight: 600;
  }

  .price {
    font-size: 18px;
    font-weight: 600;
  }

  .description {
    font-size: 15px;
  }
`

// TODO: move to separate component file if too big
const SelectTicketsStep = ({
  event: { club: clubCode, id: eventId },
  eventTickets: { totals: tickets },
  serverCart: { cart, getTicketsOfType, loading, mutating, setTicketCount },
}: {
  event: ClubEvent
  eventTickets: EventTicketsResponse
  serverCart: ReturnType<typeof useServerCart>
}) => {
  // callback for each select to use
  const updateTicketCount = useCallback(
    (type: string, count: number) => {
      if (mutating || loading) {
        // TODO: remove
        alert(`this shouldn't happen!!`)
        return
      }
      setTicketCount(clubCode as string, eventId, type, count)
    },
    [mutating, loading, setTicketCount],
  )

  return (
    <ul>
      {/* TODO: if count === 0 then mark as sold out */}
      {tickets.map(({ type, count }) => {
        const countOptions = useMemo(() => {
          const countOptions: {
            label: string
            value: number
          }[] = []
          for (let i = 0; i <= Math.min(count, 25); i++) {
            countOptions.push({ label: i.toString(), value: i })
          }
          return countOptions
        }, [tickets])

        const currentAmount = useMemo(
          () => getTicketsOfType(clubCode as string, eventId, type).length,
          [cart],
        )

        // TODO: figure out why react-select hates these types
        return (
          <TicketOption key={type}>
            <div className="option-left">
              <h4>{type}</h4>
            </div>
            <div className="option-right">
              <Select
                options={countOptions}
                isDisabled={mutating}
                value={{ label: currentAmount, value: currentAmount }}
                onChange={({ value }: { value: number }) => {
                  updateTicketCount(type, value)
                }}
              />
            </div>
          </TicketOption>
        )
      })}
    </ul>
  )
}

const ResponsiveCheckoutGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;

  /* checkout UI */
  .ui {
    overflow-x: scroll;
    background-color: aliceblue;
  }

  /* two sections separated by gray line */
  .ui-top,
  .ui-bottom {
    padding: 25px 10%;
  }

  .ui-top {
    border-bottom: 1px solid rgba(0, 0, 0, 0.2);
  }

  /* cart panel */
  .cart {
    overflow-x: scroll;
    background-color: lightcoral;
  }
`

// TODO: move this somewhere (no hooks folder ;-;)
/**
 * Hook to fetch and update ticket cart information.
 * @param initialCart Initial server-side fetched cart.
 */
const useServerCart = (initialCart: CartResponse) => {
  const [cart, setCart] = useState<CartResponse>(initialCart)
  const [loading, setLoading] = useState(false)
  const [mutating, setMutating] = useState(false)

  const getTicketsOfType = (clubCode: string, eventId: number, type: string) =>
    cart.tickets.filter(
      (ticket) =>
        ticket.type === type &&
        ticket.event.club === clubCode &&
        ticket.event.id === eventId,
    )

  // AbortController to manage fetching
  const fetchController = useRef<AbortController>()
  useEffect(() => {
    fetchController.current = new AbortController()
  }, [fetchController])

  /**
   * Re-fetches online cart data. Updates `onlineCart` accordingly.
   */
  const fetchCart = useCallback(async () => {
    // cancel if we're already loading
    fetchController.current?.abort()
    fetchController.current = new AbortController()
    setLoading(true)

    try {
      const res = await doApiRequest('/tickets/cart/', {
        signal: fetchController.current?.signal,
      })
      const newCart = (await res.json()) as CartResponse

      setCart(newCart)
      setLoading(false)

      return newCart
    } catch (err) {
      // we were aborted or something else went wrong
      setLoading(false)
      return null
    }
  }, [fetchController])

  /**
   * Sends an API request attempting to update the ticket count for a certain
   * club code, event id, and ticket type to the requested amount.
   */
  const setTicketCount = useCallback(
    async (clubCode: string, eventId: number, type: string, count: number) => {
      // cancel fetch if happening
      fetchController.current?.abort()

      // get count of all preexisting tickets of the same type
      const existingTickets = getTicketsOfType(clubCode, eventId, type)
      const ticketsNeeded = count - existingTickets.length

      // cancel if no ticket updates needed
      if (ticketsNeeded === 0) {
        return cart
      }

      setMutating(true)

      try {
        if (ticketsNeeded > 0) {
          // add tickets to cart
          await doApiRequest(
            `/clubs/${clubCode}/events/${eventId}/add_to_cart/`,
            {
              method: 'POST',
              body: { type, count: ticketsNeeded },
            },
          )
        } else {
          // remove tickets from cart
          await doApiRequest(
            `/clubs/${clubCode}/events/${eventId}/remove_from_cart/`,
            {
              method: 'POST',
              body: { type, count: -ticketsNeeded },
            },
          )
        }
      } catch (err) {
        // got a 500 or something bruh
        setMutating(false)
        alert(`this shouldn't happen!!`)
        return null
      }

      // fetch when done POSTing
      const newCart = await fetchCart()

      setMutating(false)

      return newCart
    },
    [cart.tickets, fetchCart, fetchController],
  )

  return {
    cart: cart,
    getTicketsOfType: getTicketsOfType,
    loading,
    fetchCart,
    mutating,
    setTicketCount,
  }
}

const TicketCheckoutPage = ({
  initialCheckoutStep,
  initialCart,
  event,
  eventTickets,
}: {
  initialCheckoutStep: CheckoutStep
  initialCart: CartResponse
  event: ClubEvent
  eventTickets: EventTicketsResponse
}) => {
  const { query } = useRouter()

  const step = (typeof query?.step === 'string'
    ? query.step
    : initialCheckoutStep) as CheckoutStep

  const serverCart = useServerCart(initialCart)
  const { cart } = serverCart

  return (
    <>
      <ResponsiveCheckoutGrid>
        <div className="ui">
          <div className="ui-top">
            <Subtitle>{event.club_name}</Subtitle>
          </div>
          <div className="ui-bottom">
            {step === 'select' && (
              <SelectTicketsStep
                event={event}
                eventTickets={eventTickets}
                serverCart={serverCart}
              />
            )}
            {step === 'checkout' && (
              <>Checking out! {event && <h2>{event.club_name}</h2>}</>
            )}
            {step === 'purchase' && (
              <>Purchasing! {event && <h2>{event.club_name}</h2>}</>
            )}
            <div>Tickets: {JSON.stringify(eventTickets)}</div>
          </div>
        </div>
        <div className="cart">
          <Text>Event: {JSON.stringify(event)}</Text>
          <Text>Cart: {JSON.stringify(cart)}</Text>
        </div>
      </ResponsiveCheckoutGrid>
    </>
  )
}

TicketCheckoutPage.getInitialProps = async ({
  query,
  req,
}: NextPageContext) => {
  const clubCode = typeof query?.club === 'string' ? query.club : undefined
  const eventId = typeof query?.event === 'string' ? query.event : undefined
  const checkoutStep = (typeof query?.step === 'string'
    ? query.step
    : 'select') as CheckoutStep

  const data = {
    headers: req ? { cookie: req.headers.cookie } : undefined,
  }

  const [cartRes, eventRes, eventTicketsRes] = await Promise.all([
    doApiRequest('/tickets/cart/', data),
    clubCode && eventId
      ? doApiRequest(`/clubs/${clubCode}/events/${eventId}/`, data)
      : undefined,
    clubCode ?? eventId
      ? doApiRequest(`/clubs/${clubCode}/events/${eventId}/tickets/`, data)
      : undefined,
  ])

  const [cart, event, eventTickets] = await Promise.all([
    cartRes.json(),
    eventRes?.json(),
    eventTicketsRes?.json(),
  ])

  return {
    initialCheckoutStep: checkoutStep,
    initialCart: cart,
    event,
    eventTickets,
  }
}

// TODO: remove
// http://localhost:3000/tickets/checkout?club=harvard-rejects&event=54

export default renderPage(TicketCheckoutPage)
