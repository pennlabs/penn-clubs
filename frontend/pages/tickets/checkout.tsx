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
    background-color: aliceblue;
  }

  /* cart panel */
  .cart {
    background-color: lightcoral;
  }
`

const TicketCheckoutPage = ({
  checkoutStep: initialCheckoutStep,
  cart,
  event,
  eventTickets,
}) => {
  const { query } = useRouter()

  const step = initialCheckoutStep ?? (query && query.step ? query.step[0] : 1)

  return (
    <>
      <ResponsiveCheckoutGrid>
        <div className="ui">
          {step === 1 && <>{event && <div>{event.club_name}</div>}</>}
        </div>
        <div className="cart">event: {event}</div>
      </ResponsiveCheckoutGrid>
    </>
  )
}

TicketCheckoutPage.getInitialProps = async ({
  query,
  req,
}: NextPageContext) => {
  const clubCode = query && query.club ? query.club[0] : undefined
  const eventId = query && query.event ? query.event[0] : undefined
  const checkoutStep = query && query.step ? query.step[0] : 1

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

  return { checkoutStep: checkoutStep, cart, event, eventTickets }
}

// http://localhost:3000/tickets/checkout?club=harvard-rejects&event=54

export default renderPage(TicketCheckoutPage)
