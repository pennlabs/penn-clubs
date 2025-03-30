import { DateTime, Settings } from 'luxon'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import styled from 'styled-components'

import { BaseLayout } from '~/components/BaseLayout'
import {
  Metadata,
  Modal,
  StrongText,
  Subtitle,
  Tag,
  Text,
  Title,
} from '~/components/common'
import {
  BORDER,
  BORDER_RADIUS,
  CLUBS_BLUE,
  CLUBS_LIGHT_BLUE,
  mediaMaxWidth,
  PHONE,
  WHITE,
} from '~/constants'
import { ClubEvent, EventGroup, TicketAvailability } from '~/types'
import { doApiRequest, EMPTY_DESCRIPTION } from '~/utils'
import { createBasePropFetcher } from '~/utils/getBaseProps'

Settings.defaultZone = 'America/New_York'

const getBaseProps = createBasePropFetcher()

export const getServerSideProps = (async (ctx) => {
  const code = ctx.params?.code
  if (typeof code !== 'string') {
    return {
      notFound: true,
    }
  }
  const data = {
    headers: ctx.req ? { cookie: ctx.req.headers.cookie } : undefined,
  }

  const [baseProps, eventGroup] = await Promise.all([
    getBaseProps(ctx),
    doApiRequest(`/eventgroups/${code}/?format=json`, data).then((resp) => {
      if (!resp.ok) {
        return null
      }
      return resp.json() as Promise<EventGroup>
    }),
  ])

  if (!eventGroup) {
    return {
      notFound: true,
    }
  }
  return {
    props: {
      baseProps,
      eventGroup,
    },
  }
}) satisfies GetServerSideProps<{ baseProps: any; eventGroup: EventGroup }>

type EventGroupPageProps = InferGetServerSidePropsType<
  typeof getServerSideProps
>

const MainWrapper = styled.main`
  margin: 0 auto;
  padding: 20px;
  max-width: 1200px;
`

const GridWrapper = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 30px;

  ${mediaMaxWidth(PHONE)} {
    grid-template-columns: 1fr;
  }
`

const Card = styled.div`
  background-color: ${WHITE};
  padding: 20px;
  border-radius: ${BORDER_RADIUS};
  border: 1px solid ${BORDER};
  margin-bottom: 20px;
`

const Right = styled.div`
  & img {
    border-radius: ${BORDER_RADIUS};
    margin-bottom: 20px;
    max-width: 100%;
    border: 1px solid ${BORDER};
    width: 100%;
    object-fit: cover;
    aspect-ratio: 16 / 9;
  }
`

const Divider = styled.hr`
  background-color: ${BORDER};
  height: 1px;
  border: 0;
  margin: 20px 0;
`

const GetTicketItem: React.FC<{
  ticketType: string
  price: number
  available: number
  onCountChange: (type: string, count: number) => void
  initialCount?: number
}> = ({ ticketType, price, available, onCountChange, initialCount = 0 }) => {
  const [count, setCount] = useState(initialCount)

  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(
      0,
      Math.min(Math.round(parseFloat(e.target.value)), available),
    )
    setCount(value)
    onCountChange(ticketType, value)
  }

  return (
    <div
      style={{
        padding: '5px 0px',
        borderBottom: '1px solid #e0e0e0',
        borderTop: '1px solid #e0e0e0',
        opacity: available === 0 ? 0.6 : 1,
        pointerEvents: available === 0 ? 'none' : 'auto',
      }}
      id={ticketType}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0px 16px',
        }}
      >
        <p style={{ fontSize: '18px' }}>
          {ticketType} - ${price.toFixed(2)} {available === 0 && '(Sold Out)'}
        </p>
        <input
          type="number"
          pattern="[0-9]*"
          className="input"
          min={0}
          max={available}
          value={count}
          step={1}
          placeholder="0"
          onChange={handleCountChange}
          style={{ flex: '0 0 auto', maxWidth: '64px' }}
          disabled={available === 0}
        />
      </div>
    </div>
  )
}

const EventPage: React.FC<EventGroupPageProps> = ({
  baseProps,
  eventGroup,
}) => {
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<ClubEvent | null>(
    eventGroup.events.length > 0 ? eventGroup.events[0] : null,
  )
  const [ticketAvailability, setTicketAvailability] =
    useState<TicketAvailability | null>(null)
  const [ticketOrder, setTicketOrder] = useState<Record<string, number>>({})
  const [isLoadingTickets, setIsLoadingTickets] = useState(false)

  useEffect(() => {
    if (selectedEvent?.ticketed) {
      setIsLoadingTickets(true)
      setTicketAvailability(null)
      setTicketOrder({})
      doApiRequest(
        `/eventgroups/${eventGroup.code}/events/${selectedEvent.id}/tickets/?format=json`,
      )
        .then((resp) => (resp.ok ? resp.json() : Promise.reject(resp)))
        .then((data: TicketAvailability) => {
          setTicketAvailability(data)
          const initialOrder = data.totals.reduce((acc, curr) => {
            acc[curr.type] = 0
            return acc
          }, {})
          setTicketOrder(initialOrder)
        })
        .catch(() => toast.error('Failed to load ticket availability.'))
        .finally(() => setIsLoadingTickets(false))
    } else {
      setTicketAvailability(null)
      setTicketOrder({})
    }
  }, [selectedEvent])

  const handleTicketCountChange = (type: string, count: number) => {
    setTicketOrder((prev) => ({ ...prev, [type]: count }))
  }

  const handlePurchase = () => {
    if (!selectedEvent) return

    const orderToSend = Object.entries(ticketOrder)
      .filter(([, count]) => count > 0)
      .map(([type, count]) => ({ type, count }))

    if (orderToSend.length === 0) {
      toast.warn('Please select at least one ticket.')
      return
    }

    doApiRequest(`/events/${selectedEvent.id}/add_to_cart/`, {
      method: 'POST',
      body: {
        quantities: orderToSend,
      },
    })
      .then((resp) => (resp.ok ? resp.json() : Promise.reject(resp)))
      .then((res) => {
        if (res.success) {
          toast.success('Tickets added to cart')
          setShowTicketModal(false)
        } else {
          throw new Error(res.detail || 'Failed to add tickets to cart.')
        }
      })
      .catch((err) => {
        toast.error(
          err.message || 'An error occurred while adding tickets to cart.',
        )
      })
  }

  const totalAvailableTickets =
    ticketAvailability?.available.reduce((sum, t) => sum + t.count, 0) ?? 0

  const image =
    eventGroup.image_url ??
    (eventGroup.club
      ? `/api/clubs/${eventGroup.club}/image/`
      : '/default-club.png')

  const clubApproved = !!eventGroup.club

  const startTime = selectedEvent
    ? DateTime.fromISO(selectedEvent.start_time)
    : null
  const endTime = selectedEvent
    ? DateTime.fromISO(selectedEvent.end_time)
    : null
  const ticketDropTime = selectedEvent?.ticket_drop_time
    ? DateTime.fromISO(selectedEvent.ticket_drop_time)
    : null
  const notDroppedYet = ticketDropTime && ticketDropTime > DateTime.now()
  const eventEnded = endTime && endTime < DateTime.now()

  const historicallyApproved = !clubApproved

  return (
    <>
      <Modal
        show={showTicketModal}
        closeModal={() => setShowTicketModal(false)}
        marginBottom={false}
      >
        {selectedEvent?.ticketed && (
          <>
            <Subtitle style={{ marginLeft: '12px', marginBottom: '20px' }}>
              Get Tickets for {startTime?.toFormat('LLL d, t')}
            </Subtitle>
            {isLoadingTickets && <Text>Loading ticket info...</Text>}
            {ticketAvailability && ticketAvailability.totals.length > 0
              ? ticketAvailability.totals.map((ticketInfo) => {
                  const availableCount =
                    ticketAvailability.available.find(
                      (t) => t.type === ticketInfo.type,
                    )?.count ?? 0
                  return (
                    <GetTicketItem
                      key={ticketInfo.type}
                      ticketType={ticketInfo.type}
                      price={ticketInfo.price}
                      available={availableCount}
                      onCountChange={handleTicketCountChange}
                      initialCount={ticketOrder[ticketInfo.type] ?? 0}
                    />
                  )
                })
              : !isLoadingTickets && (
                  <Text>No ticket types defined for this event time.</Text>
                )}
            <button
              className="button is-primary my-4"
              disabled={
                isLoadingTickets ||
                totalAvailableTickets === 0 ||
                eventEnded ||
                notDroppedYet ||
                Object.values(ticketOrder).every((count) => count === 0)
              }
              onClick={handlePurchase}
            >
              {eventEnded
                ? 'Event Ended'
                : notDroppedYet
                  ? 'Tickets Not Available Yet'
                  : totalAvailableTickets === 0
                    ? 'Sold Out'
                    : 'Add to Cart'}
            </button>
          </>
        )}
      </Modal>

      <BaseLayout {...baseProps}>
        <Metadata
          title={eventGroup.name}
          description={eventGroup.description ?? undefined}
          image={image}
        />
        <MainWrapper>
          <GridWrapper>
            <div>
              <Title>{eventGroup.name}</Title>
              <Subtitle>
                Hosted by{' '}
                {eventGroup.club ? (
                  <Link href={`/club/${eventGroup.club}`}>
                    {eventGroup.club_name || eventGroup.club}
                  </Link>
                ) : (
                  'Unknown Club'
                )}
              </Subtitle>
              <div>
                {eventGroup.badges?.map((badge) => (
                  <Tag key={badge.id}>{badge.label}</Tag>
                ))}
              </div>
              <Card>
                <div
                  className="content"
                  dangerouslySetInnerHTML={{
                    __html: eventGroup.description || EMPTY_DESCRIPTION,
                  }}
                />
              </Card>
              <Card>
                <StrongText>
                  {eventGroup.events.length === 1
                    ? 'Event Time & Location'
                    : 'Event Times & Locations'}
                </StrongText>
                {eventGroup.events.length === 0 && (
                  <Text>No specific times listed for this event group.</Text>
                )}
                {eventGroup.events.length === 1 &&
                  (() => {
                    const singleEvent = eventGroup.events[0]
                    const evStartTime = DateTime.fromISO(singleEvent.start_time)
                    const evEndTime = DateTime.fromISO(singleEvent.end_time)
                    return (
                      <div style={{ marginTop: '10px' }}>
                        <Text className="has-text-weight-medium">
                          {evStartTime.toFormat('DDDD')}
                        </Text>
                        <Text>
                          {evStartTime.toFormat('t')} -{' '}
                          {evEndTime.toFormat('t')}
                        </Text>
                        {singleEvent.location && (
                          <Text>
                            <i>{singleEvent.location}</i>
                          </Text>
                        )}
                        {singleEvent.ticketed && (
                          <Tag
                            style={{
                              backgroundColor: '#eee',
                              color: '#555',
                              marginTop: '5px',
                            }}
                          >
                            Tickets Required
                          </Tag>
                        )}
                      </div>
                    )
                  })()}
                {eventGroup.events.length > 1 &&
                  eventGroup.events.map((ev) => {
                    const evStartTime = DateTime.fromISO(ev.start_time)
                    const evEndTime = DateTime.fromISO(ev.end_time)
                    const isSelected = selectedEvent?.id === ev.id
                    return (
                      <div
                        key={ev.id}
                        onClick={() => setSelectedEvent(ev)}
                        style={{
                          padding: '10px',
                          margin: '5px 0',
                          border: isSelected
                            ? `2px solid ${CLUBS_BLUE}`
                            : `1px solid ${BORDER}`,
                          borderRadius: '4px',
                          cursor: 'pointer',
                          backgroundColor: isSelected
                            ? CLUBS_LIGHT_BLUE
                            : 'transparent',
                          transition:
                            'background-color 0.2s ease, border-color 0.2s ease',
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyPress={(e) =>
                          e.key === 'Enter' && setSelectedEvent(ev)
                        }
                      >
                        <Text className="has-text-weight-medium">
                          {evStartTime.toFormat('DDDD')}
                        </Text>
                        <Text>
                          {evStartTime.toFormat('t')} -{' '}
                          {evEndTime.toFormat('t')}
                        </Text>
                        {ev.location && (
                          <Text>
                            <i>{ev.location}</i>
                          </Text>
                        )}
                        {ev.ticketed && (
                          <Tag
                            style={{
                              backgroundColor: '#eee',
                              color: '#555',
                              marginTop: '5px',
                            }}
                          >
                            Tickets Required
                          </Tag>
                        )}
                      </div>
                    )
                  })}
              </Card>
            </div>

            <Right>
              <img src={image} alt={`${eventGroup.name} Event Image`} />
              {selectedEvent?.ticketed && (
                <Card>
                  <StrongText>Tickets</StrongText>
                  {isLoadingTickets && <Text>Loading availability...</Text>}
                  {!isLoadingTickets && ticketAvailability && (
                    <>
                      {notDroppedYet && ticketDropTime && (
                        <>
                          <Text>
                            Tickets will be available for purchase on{' '}
                            {ticketDropTime?.toFormat('LLL')}.
                          </Text>
                          <Divider />
                        </>
                      )}
                      <Text
                        className="has-text-weight-medium"
                        style={{
                          color:
                            totalAvailableTickets === 0 ? 'red' : 'inherit',
                        }}
                      >
                        {totalAvailableTickets > 0
                          ? `${totalAvailableTickets} tickets available`
                          : 'Sold out'}
                      </Text>
                      {ticketAvailability.totals.map((ticketInfo) => {
                        const availableCount =
                          ticketAvailability.available.find(
                            (t) => t.type === ticketInfo.type,
                          )?.count ?? 0
                        return (
                          <Text key={ticketInfo.type}>
                            {ticketInfo.type}: {availableCount} available /{' '}
                            {ticketInfo.count} total (
                            {`$${ticketInfo.price.toFixed(2)}`})
                          </Text>
                        )
                      })}
                    </>
                  )}
                  <button
                    className="button is-primary is-fullwidth mt-4"
                    disabled={
                      isLoadingTickets ||
                      !selectedEvent ||
                      totalAvailableTickets === 0 ||
                      eventEnded ||
                      notDroppedYet ||
                      historicallyApproved
                    }
                    onClick={() => setShowTicketModal(true)}
                  >
                    {historicallyApproved
                      ? 'Club Not Approved'
                      : eventEnded
                        ? 'Event Ended'
                        : notDroppedYet
                          ? 'Tickets Not Available Yet'
                          : totalAvailableTickets === 0
                            ? 'Sold Out'
                            : 'Get Tickets'}
                  </button>
                </Card>
              )}
              {(eventGroup.events.length === 1
                ? selectedEvent?.ticketed
                : selectedEvent) && (
                <Card>
                  <StrongText>
                    {eventGroup.events.length === 1
                      ? 'Details'
                      : 'Selected Time Details'}
                  </StrongText>
                  <Text>
                    {startTime && endTime ? (
                      startTime.hasSame(endTime, 'day') ? (
                        <>
                          {startTime.toFormat('cccc, LLLL d, yyyy')} <br />{' '}
                          {startTime.toFormat('t')} - {endTime.toFormat('t')}
                        </>
                      ) : (
                        <>
                          {startTime.toFormat('cccc, LLLL d, yyyy t')} -{' '}
                          {endTime.toFormat('cccc, LLLL d, yyyy t')}
                        </>
                      )
                    ) : (
                      'Time not specified'
                    )}
                  </Text>
                  {selectedEvent && selectedEvent.location && (
                    <>
                      <StrongText style={{ marginTop: '10px' }}>
                        Location
                      </StrongText>
                      <Text>{selectedEvent.location}</Text>
                    </>
                  )}
                </Card>
              )}
            </Right>
          </GridWrapper>
        </MainWrapper>
      </BaseLayout>
    </>
  )
}

export default EventPage
