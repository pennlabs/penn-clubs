import { NextPageContext } from 'next'
import { useRouter } from 'next/router'
import styled from 'styled-components'

import renderPage from '~/renderPage'
import { doApiRequest } from '~/utils'

const ResponsiveCheckoutGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;

  /* checkout UI */
  .ui {
    overflow-x: scroll;
    background-color: aliceblue;
  }

  /* cart panel */
  .cart {
    overflow-x: scroll;
    background-color: lightcoral;
  }
`

enum CheckoutStep {
  Select = 'select',
  Checkout = 'checkout',
  Purchase = 'purchase',
}

const checkoutStepOrder: CheckoutStep[] = [
  CheckoutStep.Select,
  CheckoutStep.Checkout,
  CheckoutStep.Purchase,
]

// TODO: figure out a nice way to do steps
const checkoutStepComponents: {
  [key in CheckoutStep]: (props) => React.ReactNode
} = {
  select: (props) => <></>,
  checkout: (props) => <></>,
  purchase: (props) => <></>,
}

const TicketCheckoutPage = ({
  checkoutStep: initialCheckoutStep,
  cart,
  event,
  eventTickets,
}) => {
  const { query } = useRouter()

  const step = (typeof query?.step === 'string'
    ? query.step
    : initialCheckoutStep) as CheckoutStep

  return (
    <>
      <ResponsiveCheckoutGrid>
        <div className="ui">
          {step === CheckoutStep.Select && (
            <>Selecting! {event && <h2>{event.club_name}</h2>}</>
          )}
          {step === CheckoutStep.Checkout && (
            <>Checking out! {event && <h2>{event.club_name}</h2>}</>
          )}
          {step === CheckoutStep.Purchase && (
            <>Purchasing! {event && <h2>{event.club_name}</h2>}</>
          )}
          <div>Tickets: {JSON.stringify(eventTickets)}</div>
        </div>
        <div className="cart">event: {JSON.stringify(event)}</div>
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
    : CheckoutStep.Select) as CheckoutStep

  const data = {
    headers: req ? { cookie: req.headers.cookie } : undefined,
  }

  const [cartRes, eventRes, eventTicketsRes] = await Promise.all([
    doApiRequest('/tickets/cart', data),
    clubCode && eventId
      ? doApiRequest(`/clubs/${clubCode}/events/${eventId}`, data)
      : undefined,
    clubCode ?? eventId
      ? doApiRequest(`/clubs/${clubCode}/events/${eventId}/tickets`, data)
      : undefined,
  ])

  const [cart, event, eventTickets] = await Promise.all([
    cartRes.json(),
    eventRes?.json(),
    eventTicketsRes?.json(),
  ])

  return { checkoutStep, cart, event, eventTickets }
}

// http://localhost:3000/tickets/checkout?club=harvard-rejects&event=54

export default renderPage(TicketCheckoutPage)
