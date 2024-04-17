import React, { useMemo, useState } from 'react'
import styled from 'styled-components'

import { CARD_HEADING, CLUBS_GREY, H1_TEXT } from '~/constants'
import { EventTicket } from '~/types'
import { doApiRequest } from '~/utils'

import { CardHeader, CardTitle } from '../ClubCard'
import { Card } from '../common'
import PaymentForm from './PaymentForm'

export interface CountedEventTicket extends EventTicket {
  count: number
}

export interface CartTicketsProps {
  tickets: EventTicket[]
}

const TicketCard = styled(Card)`
  display: flex;
  flex-direction: row;
`

const Body = styled.div`
  margin-left: 10px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`

const XButton = styled.button`
  width: 14px;
  height: 14px;
`

const EventTitle = styled.strong`
  font-size: 1.3rem;
  line-height: 1.2;
  color: ${H1_TEXT};
  margin-bottom: 0.5rem;
  font-weight: ${CARD_HEADING};
`

const ClubName = styled.div`
  color: ${CLUBS_GREY};
`

interface TicketImageProps {
  url: string | null
}

const THUMBNAIL_SIZE = '40px'

const Thumbnail = styled.div<TicketImageProps>`
  width: ${THUMBNAIL_SIZE};
  height: ${THUMBNAIL_SIZE};
  margin: 8px;

  background-image: url(${({ url }) => url || '/static/img/tickets.png'});
  background-size: contain;
  border-radius: 3px;
`

/**
 * Combines an array of tickets into a list of unique ticket types with counts
 * @param tickets - Original array of tickets
 * @returns Array of tickets condensed into unique types
 */
const combineTickets = (tickets: EventTicket[]): CountedEventTicket[] =>
  Object.values(
    tickets.reduce(
      (acc, ticket) => ({
        ...acc,
        [`${ticket.event.id}_${ticket.type}`]: {
          ...ticket,
          count: (acc[`${ticket.event.id}_${ticket.type}`]?.count ?? 0) + 1,
        },
      }),
      {},
    ),
  )

const CartTickets: React.FC<CartTicketsProps> = ({ tickets }) => {
  const condensedTickets = useMemo(() => combineTickets(tickets), [tickets])
  const [isPaying, setIsPaying] = useState(false)
  // TODO: if cart is frozen, set to true automatically
  // TODO: delete in favor of storing token in cart ()
  const [checkoutToken, setCheckoutToken] = useState<string | null>(null)

  async function checkout() {
    if (isPaying) {
      return
    }
    doApiRequest(`/tickets/initiate_checkout/?format=json`, {
      method: 'POST',
      body: { tickets: condensedTickets },
    })
      .then((resp) => resp.json())
      .then((res) => {
        if (!res.success) {
          // eslint-disable-next-line no-console
          console.error(res.detail)
          return
        }
        setCheckoutToken(res.detail)
        setIsPaying(true)
      })
  }

  return (
    <div className="columns">
      <div className="column">
        {isPaying ? (
          <PaymentForm token={checkoutToken} />
        ) : (
          <ul>
            {condensedTickets.map((ticket) => {
              return (
                <TicketCard key={ticket.id}>
                  <Thumbnail url={ticket.event.image_url} />
                  <Body>
                    <EventTitle>{ticket.event.name}</EventTitle>
                    <ClubName>{ticket.event.club_name}</ClubName>
                    Type: {ticket.type}, Quantity: {ticket.count}
                  </Body>
                </TicketCard>
              )
            })}
          </ul>
        )}
      </div>
      <div className="column is-one-third">
        <Card $bordered $background="white" className="card">
          <div style={{ display: 'flex' }}>
            <div style={{ flex: 1 }}>
              <div>
                <CardHeader>
                  <CardTitle className="is-size-5">Summary</CardTitle>
                </CardHeader>
              </div>
            </div>
          </div>
          {condensedTickets?.map((ticket) => (
            <div key={ticket.event.id}>
              <p>
                {ticket.event.name} x{ticket.count} - {ticket.price}
              </p>
            </div>
          ))}
        </Card>
        {isPaying ? (
          <button
            type="submit"
            className="button is-primary mt-4 is-pulled-right"
          >
            Pay
          </button>
        ) : (
          <>
            <button
              type="submit"
              className="button is-primary mt-4 is-pulled-right"
              onClick={() => checkout()}
            >
              Check Out
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default CartTickets
