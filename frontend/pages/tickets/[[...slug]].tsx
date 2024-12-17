import { css } from '@emotion/react'
import { Center, Container, Icon, Metadata } from 'components/common'
import { Form, Formik } from 'formik'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import React, { ReactElement, useState } from 'react'
import { toast } from 'react-toastify'
import styled from 'styled-components'
import { doApiRequest } from 'utils'

import { BaseLayout } from '~/components/BaseLayout'
import AuthPrompt from '~/components/common/AuthPrompt'
import { BetaTag } from '~/components/common/BetaTag'
import CSVTagInput from '~/components/common/CSVTagInput'
import ManageBuyer from '~/components/Tickets/ManageBuyer'
import { createBasePropFetcher } from '~/utils/getBaseProps'

import {
  ALLBIRDS_GRAY,
  GREEN,
  HOVER_GRAY,
  MEDIUM_GRAY,
  WHITE,
} from '../../constants/colors'
import {
  ANIMATION_DURATION,
  BORDER_RADIUS,
  mediaMaxWidth,
  SM,
} from '../../constants/measurements'

type CardProps = {
  readonly hovering?: boolean
  className?: string
}

const Card = styled.div<CardProps>`
  padding: 10px;
  margin-top: 1rem;
  box-shadow: 0 0 0 transparent;
  transition: all ${ANIMATION_DURATION}ms ease;
  border-radius: ${BORDER_RADIUS};
  box-shadow: 0 0 0 ${WHITE};
  background-color: ${({ hovering }) => (hovering ? HOVER_GRAY : WHITE)};
  border: 1px solid ${ALLBIRDS_GRAY};
  justify-content: space-between;
  height: auto;
  cursor: pointer;

  &:hover,
  &:active,
  &:focus {
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.2);
  }

  ${mediaMaxWidth(SM)} {
    width: calc(100%);
    padding: 8px;
  }
`

const TicketStatBox = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  margin: 1rem 0;
  color: ${WHITE};
  background-color: ${GREEN};
  border-radius: ${BORDER_RADIUS};
  border: 1px solid ${ALLBIRDS_GRAY};
  box-shadow: 0 0 0 ${WHITE};
`

const Title = styled.h1`
  font-weight: 600;
  font-size: 2rem;
  margin: 1rem 0;
`

const Subtitle = styled.h2`
  font-weight: 600;
  font-size: 1.5rem;
  margin: 0;
`

const HelperText = styled.p`
  font-size: 0.8rem;
  font-style: italic;
  color: ${MEDIUM_GRAY};
  margin: 0.5rem 0;
`

const Text = styled.h1`
  font-weight: 400;
  font-size: 1rem;
  margin: 0.5rem 0rem;
`

type TicketProps = InferGetServerSidePropsType<typeof getServerSideProps>

// TODO: Add auth handling gracefully.

const Ticket: React.FC<TicketProps> = ({
  baseProps,
  tickets,
  buyers,
  event,
  home,
}): ReactElement => {
  if (home) {
    return (
      <Center>
        Welcome to Ticketing! Please browse events with available tickets{' '}
        <a href="/events">here</a>.
      </Center>
    )
  } else if (!tickets || !tickets.totals || !tickets.available) {
    return <Center>No tickets found with given user permissions.</Center>
  } else if (!baseProps.auth.authenticated) {
    return (
      <BaseLayout {...baseProps} authRequired>
        <Metadata title="Checkout" />
        <AuthPrompt title="Please sign in for ticketing." />{' '}
      </BaseLayout>
    )
  }

  const { totals, available } = tickets
  const tickTypes = {}

  // For given ticket type, get the total and available tickets, as well as buyers
  for (const ticket of totals) {
    tickTypes[ticket.type] = {
      // TODO: right now grabbing no ids
      id: ticket.id,
      type: ticket.type,
      total: ticket.count,
      price: ticket.price,
      available: 0,
      buyers: [],
    }
  }

  for (const ticket of available) {
    tickTypes[ticket.type].available = ticket.count
  }

  // Public should be able to access info about general tickets metrics, not specific buyers.
  if (buyers.buyers) {
    for (const buyer of buyers.buyers) {
      tickTypes[buyer.type].buyers.push(buyer)
    }
  }
  return (
    <>
      <BaseLayout {...baseProps}>
        <Metadata title="Events" />
        <Container>
          <BetaTag>
            <Title>All Tickets for {event.name}</Title>
          </BetaTag>
          {Object.values(tickTypes).map((ticket, i) => (
            <TicketCard
              key={i}
              event={event.id}
              ticket={ticket as Ticket}
              buyersPerm={buyers.buyers != null}
            />
          ))}
        </Container>
      </BaseLayout>
    </>
  )
}

export type Buyer = {
  id: string
  fullname: string
  owner__email: string
  owner_id: number
  type: string
  attended: boolean
}

type Ticket = {
  id: string
  type: string
  total: number
  price: number
  available: number
  buyers: Buyer[]
}

type TicketCardProps = {
  ticket: Ticket
  event: string
  buyersPerm: boolean
}

const TicketCard = ({ ticket, event, buyersPerm }: TicketCardProps) => {
  const [viewBuyers, setViewBuyers] = useState(false)

  // PennKeys to issue tickets to
  const [ticketRecipients, setTicketRecipients] = useState<string[]>([])
  const [errorPennKeys, setErrorPennKeys] = useState<string[]>([])

  async function handleIssueTickets(data, { setSubmitting }) {
    try {
      const resp = await doApiRequest(
        `/events/${event}/issue_tickets/?format=json`,
        {
          method: 'POST',
          body: {
            tickets: ticketRecipients.map((t) => ({
              ticket_type: ticket.type,
              username: t,
            })),
          },
        },
      )
      const contents = await resp.json()
      if (contents.success) {
        toast.info(contents.detail, { hideProgressBar: true })
      } else {
        // eslint-disable-next-line no-console
        console.error(contents.errors)
        setErrorPennKeys(contents.errors)
        toast.error(
          contents.detail ?? 'Something went wrong with issuing tickets',
          {
            hideProgressBar: true,
            style: { color: WHITE },
          },
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Subtitle
          style={{
            marginTop: '0px',
            paddingTop: '0px',
            color: 'black',
            opacity: 0.95,
          }}
        >
          {ticket.type}
        </Subtitle>
        <TicketStatBox>
          <progress
            className="progress is-primary"
            value={ticket.total - ticket.available}
            max={ticket.total}
          >
            {(ticket.total - ticket.available) / ticket.total}
          </progress>
          <Subtitle>
            {ticket.total - ticket.available} / {ticket.total}
          </Subtitle>
          <Text>tickets purchased</Text>
        </TicketStatBox>
        {buyersPerm && (
          <>
            <Card>
              <Formik
                initialValues={{ action: 'add' }}
                onSubmit={handleIssueTickets}
              >
                {({ isSubmitting }) => (
                  <Form>
                    <Subtitle>Issue Tickets</Subtitle>
                    <HelperText>
                      Issue Tickets by entering pennkeys below, separated by
                      commas or spaces
                    </HelperText>
                    <CSVTagInput
                      invalidTags={errorPennKeys}
                      placeholder="Enter pennkeys here, separated by commas or spaces"
                      onChange={(newValue) => setTicketRecipients(newValue)}
                    />
                    <button
                      disabled={isSubmitting}
                      className="button is-primary"
                      style={{
                        marginTop: '10px',
                      }}
                      type="submit"
                    >
                      Issue Tickets
                    </button>
                  </Form>
                )}
              </Formik>
            </Card>
            <Card>
              <Text
                onClick={() => {
                  setViewBuyers(!viewBuyers)
                }}
              >
                View Buyers{' '}
                {ticket.total && `(${ticket.total - ticket.available})`}{' '}
                {ticket.buyers && (
                  <span>
                    <Icon name={viewBuyers ? 'chevron-up' : 'chevron-down'} />
                  </span>
                )}
              </Text>

              {viewBuyers && ticket.buyers && (
                <div
                  css={css`
                    display: grid;
                    grid-template-columns: 1fr 4fr 4fr;
                  `}
                >
                  <span
                    css={css`
                      font-weight: bold;
                    `}
                    title="Attendance"
                  >
                    Attend.
                  </span>
                  <span
                    css={css`
                      font-weight: bold;
                    `}
                  >
                    Buyer
                  </span>
                  <span
                    css={css`
                      font-weight: bold;
                    `}
                  >
                    Type
                  </span>
                  {ticket.buyers.map((buyer) => (
                    <ManageBuyer
                      key={buyer.id}
                      buyer={buyer}
                      onAttendedChange={(value: boolean) => {
                        doApiRequest(`/tickets/${buyer.id}/?format=json`, {
                          method: 'PATCH',
                          body: { attended: value },
                        })
                      }}
                    />
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </Card>
  )
}

const getBaseProps = createBasePropFetcher()

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { query, req } = ctx
  const headers = req ? { cookie: req.headers.cookie } : undefined
  if (!query || !query.slug) {
    return { props: { home: true, tickets: {}, event: {}, buyers: {} } }
  }
  const id = query.slug[0]
  try {
    const [ticketsReq, eventReq, buyersReq] = await Promise.all([
      doApiRequest(`/events/${id}/tickets/?format=json`, { headers }),
      doApiRequest(`/events/${id}/?format=json`, { headers }),
      doApiRequest(`/events/${id}/buyers/?format=json`, { headers }),
    ])

    const [baseProps, tickets, event, buyers] = await Promise.all([
      getBaseProps(ctx),
      ticketsReq.json(),
      eventReq.json(),
      buyersReq.json(),
    ])

    return {
      props: {
        home: false,
        baseProps,
        tickets,
        event,
        buyers,
      },
    }
  } catch (error) {
    return { props: { home: true, tickets: {}, event: {}, buyers: {} } }
  }
}

export default Ticket
