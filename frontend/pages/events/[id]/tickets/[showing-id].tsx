import { css } from '@emotion/react'
import { Center, Container, Icon, Metadata } from 'components/common'
import { CLUBS_GREY, FOCUS_GRAY } from 'constants/colors'
import { BODY_FONT } from 'constants/styles'
import { Form, Formik } from 'formik'
import moment from 'moment-timezone'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { ReactElement, useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import styled from 'styled-components'

import { BaseLayout } from '~/components/BaseLayout'
import AuthPrompt from '~/components/common/AuthPrompt'
import { BetaTag } from '~/components/common/BetaTag'
import CSVTagInput from '~/components/common/CSVTagInput'
import { createBasePropFetcher } from '~/utils/getBaseProps'

import ManageBuyer from '../../../../components/Tickets/ManageBuyer'
import {
  ALLBIRDS_GRAY,
  GREEN,
  HOVER_GRAY,
  MEDIUM_GRAY,
  WHITE,
} from '../../../../constants/colors'
import {
  ANIMATION_DURATION,
  BORDER_RADIUS,
  mediaMaxWidth,
  SM,
} from '../../../../constants/measurements'
import { doApiRequest } from '../../../../utils'
import { TICKETING_PAYMENT_ENABLED } from '../../../../utils/branding'

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

const Input = styled.input`
  border: 1px solid ${ALLBIRDS_GRAY};
  outline: none;
  color: ${CLUBS_GREY};
  width: 100%;
  font-size: 1em;
  padding: 8px 10px;
  margin: 0px 5px 0px 0px;
  background: ${WHITE};
  border-radius: ${BORDER_RADIUS};
  font-family: ${BODY_FONT};
  &:hover,
  &:active,
  &:focus {
    background: ${FOCUS_GRAY};
  }
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
  eventShowing,
  home,
}): ReactElement<any> => {
  const router = useRouter()
  const createSectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (router.query.action === 'create' && createSectionRef.current) {
      createSectionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }, [router.query])

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
            <Title>
              All Tickets for {event.name} at{' '}
              {moment(eventShowing.start_time).format('MMMM Do YYYY')}
            </Title>
          </BetaTag>
          {eventShowing.ticket_drop_time &&
            new Date(eventShowing.ticket_drop_time) > new Date() && (
              <Text>
                Tickets have not dropped yet. Visit the{' '}
                <Link href={`/club/${event.club}/edit/events`}>event page</Link>{' '}
                to change the current drop time of{' '}
                {moment(eventShowing.ticket_drop_time)
                  .tz('America/New_York')
                  .format('MMMM Do YYYY')}
                .
              </Text>
            )}
          {Object.values(tickTypes).map((ticket, i) => (
            <TicketCard
              key={i}
              event={event.id}
              ticket={ticket as Ticket}
              buyersPerm={buyers.buyers != null}
            />
          ))}
          {buyers.buyers != null && (
            <div ref={createSectionRef}>
              <CreateTicketsSection
                eventId={event.id}
                showingId={eventShowing.id}
              />
            </div>
          )}
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

type NewTicket = {
  name: string
  count: string | null
  price: string | null
  groupDiscount: string | null
  groupNumber: string | null
  buyable: boolean
}

type CreateTicketItemProps = {
  ticket: NewTicket
  onChange?: (ticket: NewTicket) => void
  onDelete?: () => void
}

const CreateTicketItem: React.FC<CreateTicketItemProps> = ({
  ticket,
  onChange,
  onDelete,
}) => {
  const [openGroupDiscount, setOpenGroupDiscount] = useState(
    !!(ticket.groupDiscount && ticket.groupNumber),
  )

  const resetGroupDiscount = () => {
    onChange?.({
      ...ticket,
      groupDiscount: null,
      groupNumber: null,
    })
    setOpenGroupDiscount(!openGroupDiscount)
  }

  return (
    <div
      style={{
        padding: '10px 0px',
        display: 'flex',
        flexDirection: 'column',
        borderBottom: `1px solid ${ALLBIRDS_GRAY}`,
        marginBottom: '10px',
      }}
    >
      <div
        style={{ display: 'flex', justifyContent: 'space-between', gap: '5px' }}
      >
        <Input
          type="text"
          value={ticket.name ?? ''}
          placeholder="Ticket Type Name (e.g., General Admission)"
          onChange={(e) => onChange?.({ ...ticket, name: e.target.value })}
          required
        />
        <Input
          type="number"
          value={ticket.count ?? ''}
          placeholder="Quantity Available"
          onChange={(e) => onChange?.({ ...ticket, count: e.target.value })}
          required
          min="0"
        />
        <Input
          type="number"
          value={ticket.price ?? ''}
          placeholder="Price (0.00 for free)"
          onChange={(e) => onChange?.({ ...ticket, price: e.target.value })}
          required
          min="0"
          step="0.01"
          disabled={!TICKETING_PAYMENT_ENABLED}
        />
        <button
          className="button is-danger is-small"
          disabled={!onDelete}
          onClick={onDelete}
        >
          <Icon name="x" alt="delete" />
        </button>
      </div>
      <div
        style={{
          marginTop: '10px',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
        }}
      >
        <button
          className="button is-info is-small"
          onClick={() => onChange?.({ ...ticket, buyable: !ticket.buyable })}
        >
          {ticket.buyable ? 'Disable Buying' : 'Enable Buying'}
        </button>
        {openGroupDiscount ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Input
              style={{ maxWidth: '70px' }}
              type="number"
              className="input is-small"
              value={ticket.groupDiscount ?? ''}
              placeholder="% Discount"
              min="1"
              max="100"
              onChange={(e) =>
                onChange?.({ ...ticket, groupDiscount: e.target.value })
              }
            />
            <span>for</span>
            <Input
              style={{ maxWidth: '70px' }}
              type="number"
              className="input is-small"
              value={ticket.groupNumber ?? ''}
              placeholder="# People"
              min="2"
              onChange={(e) =>
                onChange?.({ ...ticket, groupNumber: e.target.value })
              }
            />
            <button
              className="button is-danger is-small"
              onClick={resetGroupDiscount}
              title="Remove Group Discount"
            >
              <Icon name="x" />
            </button>
          </div>
        ) : (
          <button
            className="button is-info is-small"
            onClick={() => setOpenGroupDiscount(true)}
          >
            Add Group Discount
          </button>
        )}
      </div>
    </div>
  )
}

const CreateTicketsSection = ({
  eventId,
  showingId,
}: {
  eventId: number
  showingId: number
}) => {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newTickets, setNewTickets] = useState<NewTicket[]>([
    {
      name: '',
      count: null,
      price: '0.00',
      groupDiscount: null,
      groupNumber: null,
      buyable: true,
    },
  ])

  useEffect(() => {
    if (router.query.action === 'create') {
      setIsOpen(true)
    }
  }, [router.query])

  const addNewTicket = () => {
    setNewTickets([
      ...newTickets,
      {
        name: '',
        count: null,
        price: '0.00',
        groupDiscount: null,
        groupNumber: null,
        buyable: true,
      },
    ])
  }

  const submitTickets = async () => {
    setIsSubmitting(true)
    const quantities = newTickets
      .filter((ticket) => ticket.name && ticket.count != null) // Ensure name and count are set
      .map((ticket) => {
        const usingGroupPricing = ticket.groupDiscount && ticket.groupNumber
        return {
          type: ticket.name,
          count: parseInt(ticket.count ?? '0'),
          price: parseFloat(ticket.price ?? '0'),
          groupDiscount: usingGroupPricing
            ? parseFloat(ticket.groupDiscount!)
            : null,
          groupNumber: usingGroupPricing ? parseInt(ticket.groupNumber!) : null,
          buyable: ticket.buyable,
        }
      })

    try {
      const res = await doApiRequest(
        `/events/${eventId}/showings/${showingId}/tickets/?format=json`,
        {
          method: 'PUT',
          body: {
            quantities,
          },
        },
      )
      if (res.ok) {
        toast.success('Tickets Created!')
        setIsOpen(false)
        window.location.reload()
      } else {
        const errorData = await res.json()
        toast.error(
          `Error creating tickets: ${errorData.detail || res.statusText}`,
        )
      }
    } catch (error) {
      toast.error('An unexpected error occurred while creating tickets.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Basic validation check
  const disableSubmit = newTickets.some(
    (ticket) =>
      !ticket.name ||
      ticket.count === null ||
      !Number.isInteger(parseInt(ticket.count || '0')) ||
      parseInt(ticket.count || '0') < 0 ||
      ticket.price === null ||
      !Number.isFinite(parseFloat(ticket.price || '0')) ||
      parseFloat(ticket.price || '0') < 0 ||
      ((ticket.groupDiscount !== null || ticket.groupNumber !== null) &&
        (ticket.groupDiscount === null ||
          !Number.isFinite(parseFloat(ticket.groupDiscount)) ||
          parseFloat(ticket.groupDiscount) <= 0 ||
          parseFloat(ticket.groupDiscount) > 100 ||
          ticket.groupNumber === null ||
          !Number.isInteger(parseInt(ticket.groupNumber)) ||
          parseInt(ticket.groupNumber) < 2)),
  )

  return (
    <Card className="mt-4">
      <Subtitle
        onClick={() => setIsOpen(!isOpen)}
        style={{
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        Create New Ticket Types
        <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} />
      </Subtitle>
      {isOpen && (
        <div style={{ marginTop: '1rem' }}>
          <HelperText>
            Define the types and quantities of tickets available for this event
            date. Submitting will overwrite any existing ticket types.
          </HelperText>
          {newTickets.map((ticket, index) => (
            <CreateTicketItem
              key={index}
              ticket={ticket}
              onDelete={
                newTickets.length > 1
                  ? () => {
                      setNewTickets((prev) =>
                        prev.filter((_, i) => i !== index),
                      )
                    }
                  : undefined
              }
              onChange={(updatedTicket) => {
                setNewTickets((prev) =>
                  prev.map((t, i) => (i === index ? updatedTicket : t)),
                )
              }}
            />
          ))}
          <button
            className="button is-info is-small mt-3"
            onClick={addNewTicket}
          >
            Add Another Ticket Type
          </button>
          <hr />
          <button
            onClick={submitTickets}
            disabled={disableSubmit || isSubmitting}
            className={`button is-primary ${isSubmitting ? 'is-loading' : ''}`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Ticket Setup'}
          </button>
        </div>
      )}
    </Card>
  )
}

const getBaseProps = createBasePropFetcher()

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { req } = ctx
  const eventId = ctx.params?.id
  const showingId = ctx.params?.['showing-id']
  if (typeof eventId !== 'string' || typeof showingId !== 'string') {
    return {
      props: {
        home: true,
        tickets: {},
        event: {},
        eventShowing: {},
        buyers: {},
      },
    }
  }
  const headers = req ? { cookie: req.headers.cookie } : undefined
  try {
    const [ticketsReq, eventReq, eventShowingReq, buyersReq] =
      await Promise.all([
        doApiRequest(
          `/events/${eventId}/showings/${showingId}/tickets/?format=json`,
          { headers },
        ),
        doApiRequest(`/events/${eventId}/?format=json`, { headers }),
        doApiRequest(`/events/${eventId}/showings/${showingId}/?format=json`, {
          headers,
        }),
        doApiRequest(
          `/events/${eventId}/showings/${showingId}/buyers/?format=json`,
          {
            headers,
          },
        ),
      ])

    const [baseProps, tickets, event, eventShowing, buyers] = await Promise.all(
      [
        getBaseProps(ctx),
        ticketsReq.ok ? ticketsReq.json() : { totals: [], available: [] }, // Handle potential 404/error
        eventReq.json(),
        eventShowingReq.json(),
        buyersReq.ok ? buyersReq.json() : { buyers: null }, // Handle potential 403/error
      ],
    )

    return {
      props: {
        home: false,
        baseProps,
        tickets,
        event,
        eventShowing,
        buyers,
      },
    }
  } catch (error) {
    return {
      props: {
        home: true,
        tickets: {},
        event: {},
        eventShowing: {},
        buyers: {},
      },
    }
  }
}

export default Ticket
