import { DateTime, Settings } from 'luxon'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import styled from 'styled-components'

import { BaseLayout } from '~/components/BaseLayout'
import {
  Icon,
  Metadata,
  Modal,
  StrongText,
  Subtitle,
  Text,
  Title,
} from '~/components/common'
import { BetaTag } from '~/components/common/BetaTag'
import {
  ALLBIRDS_GRAY,
  BODY_FONT,
  BORDER,
  BORDER_RADIUS,
  CLUBS_BLUE,
  CLUBS_GREY,
  CLUBS_LIGHT_BLUE,
  FOCUS_GRAY,
  mediaMaxWidth,
  mediaMinWidth,
  PHONE,
  WHITE,
} from '~/constants'
import { Club, ClubEvent, EventShowing, TicketAvailability } from '~/types'
import { doApiRequest, EMPTY_DESCRIPTION } from '~/utils'
import { APPROVAL_AUTHORITY } from '~/utils/branding'
import { createBasePropFetcher } from '~/utils/getBaseProps'

Settings.defaultZone = 'America/New_York'

const getBaseProps = createBasePropFetcher()

export const getServerSideProps = (async (ctx) => {
  const id = ctx.params?.id
  if (typeof id !== 'string') {
    return {
      notFound: true,
    }
  }
  const data = {
    headers: ctx.req ? { cookie: ctx.req.headers.cookie } : undefined,
  }

  const [baseProps, event] = await Promise.all([
    getBaseProps(ctx),
    doApiRequest(`/events/${id}/?format=json`, data).then((resp) => {
      if (!resp.ok) {
        return null
      }
      return resp.json() as Promise<ClubEvent>
    }),
  ])
  if (!event) {
    return {
      notFound: true,
    }
  }

  let club: Club | null = null
  if (event.club) {
    // Fetch Club data only if event.club is not null
    club = await doApiRequest(`/clubs/${event.club}/?format=json`, data).then(
      (resp) => {
        if (!resp.ok) {
          return null // Club fetch failed
        }
        return resp.json() as Promise<Club>
      },
    )

    // If fetching the specified club failed, return notFound
    if (!club) {
      return {
        notFound: true,
      }
    }
  }

  return {
    props: {
      baseProps,
      club,
      event,
    },
  }
}) satisfies GetServerSideProps

type EventPageProps = InferGetServerSidePropsType<typeof getServerSideProps>

const MainWrapper = styled.main`
  margin: 0 auto;
  width: 100vw;
  max-width: 1400px;
  padding: 20px;
`

const GridWrapper = styled.div`
  display: grid;
  ${mediaMinWidth(PHONE)} {
    grid-template-columns: 2fr 1fr;
  }
  ${mediaMaxWidth(PHONE)} {
    grid-template-columns: 1fr;
  }
  gap: 24px;
`

const Tag = styled.div`
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  background-color: ${CLUBS_LIGHT_BLUE};
  color: ${CLUBS_BLUE};
  font-size: 0.8rem;
  font-weight: 600;
  margin-right: 5px;
  margin-bottom: 5px;
`

const Right = styled.div`
  img {
    width: 100%;
    border-radius: 12px;
    box-shadow: 0 0 12px #00000033;
    margin-bottom: 20px;
  }
`

const Card = styled.div`
  margin-top: 20px;
  border-radius: 8px;
  border: 1px solid ${BORDER};
  background-color: #fff;
  padding: 20px;
  p {
    margin: 0.2rem;
  }
`

const Divider = styled.hr`
  width: 100%;
  margin: 20px 0;
  background-color: ${BORDER};
  height: 1px;
  border: 0;
`

const Input = styled.input`
  border: 1px solid ${ALLBIRDS_GRAY};
  outline: none;
  color: ${CLUBS_GREY};
  flex: 0 0 auto;
  font-size: 1em;
  padding: 8px 10px;
  margin: 0px 5px 0px 0px;
  background: ${WHITE};
  border-radius: ${BORDER_RADIUS};
  min-width: 50px;
  font-family: ${BODY_FONT};
  &:hover,
  &:active,
  &:focus {
    background: ${FOCUS_GRAY};
  }
`

const ShowingSelector = styled.div<{ isSelected: boolean }>`
  padding: 10px;
  margin: 5px 0;
  border: ${(props) =>
    props.isSelected ? `2px solid ${CLUBS_BLUE}` : `1px solid ${BORDER}`};
  border-radius: 4px;
  cursor: pointer;
  background-color: ${(props) =>
    props.isSelected ? CLUBS_LIGHT_BLUE : 'transparent'};
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
  &:hover {
    background-color: ${FOCUS_GRAY};
  }
`

type TicketOrderEntry = {
  type: string
  price: string
  available: string
  total: string
  count: number
}

type TicketItemProps = {
  ticketType: string
  price: number
  available: number
  onCountChange: (type: string, count: number) => void
  initialCount?: number
}

const GetTicketItem: React.FC<TicketItemProps> = ({
  ticketType,
  price,
  available,
  onCountChange,
  initialCount = 0,
}) => {
  const [count, setCount] = useState(initialCount)

  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(
      0,
      Math.min(Math.round(parseFloat(e.target.value)), available),
    )
    setCount(value)
    onCountChange(ticketType, value)
  }

  useEffect(() => {
    setCount(0)
  }, [available, ticketType])

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
        <Input
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

const EventPage: React.FC<EventPageProps> = ({ baseProps, club, event }) => {
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [selectedShowing, setSelectedShowing] = useState<EventShowing | null>(
    event.showings && event.showings.length > 0 ? event.showings[0] : null,
  )
  const [ticketAvailability, setTicketAvailability] =
    useState<TicketAvailability | null>(null)
  const [ticketOrder, setTicketOrder] = useState<Record<string, number>>({})
  const [isLoadingTickets, setIsLoadingTickets] = useState(false)

  useEffect(() => {
    if (selectedShowing && event.ticketed) {
      setIsLoadingTickets(true)
      setTicketAvailability(null)
      setTicketOrder({})

      const fetchUrl = `/events/${event.id}/showings/${selectedShowing.id}/tickets/`

      doApiRequest(fetchUrl)
        .then((resp) => (resp.ok ? resp.json() : Promise.reject(resp)))
        .then((data: TicketAvailability) => {
          setTicketAvailability(data)
          const initialOrder = data.totals.reduce(
            (acc, curr) => {
              acc[curr.type] = 0
              return acc
            },
            {} as Record<string, number>,
          )
          setTicketOrder(initialOrder)
        })
        .catch(() => toast.error('Failed to load ticket availability.'))
        .finally(() => setIsLoadingTickets(false))
    } else {
      setTicketAvailability(null)
      setTicketOrder({})
    }
  }, [selectedShowing, event.id, event.ticketed, club?.code])

  const handleTicketCountChange = (type: string, count: number) => {
    setTicketOrder((prev) => ({ ...prev, [type]: count }))
  }

  const handlePurchase = () => {
    if (!selectedShowing) return

    const orderToSend = Object.entries(ticketOrder)
      .filter(([, count]) => count > 0)
      .map(([type, count]) => ({ type, count }))

    if (orderToSend.length === 0) {
      toast.warn('Please select at least one ticket.')
      return
    }

    if (!club) {
      toast.error(
        'Cannot purchase tickets for events not associated with a club.',
      )
      return
    }

    const purchaseUrl = `/clubs/${club.code}/events/${event.id}/showings/${selectedShowing.id}/add_to_cart/`

    doApiRequest(purchaseUrl, {
      method: 'POST',
      body: {
        quantities: orderToSend,
      },
    })
      .then((resp) => resp.json())
      .then((res) => {
        if (res.success) {
          toast.success('Tickets added to cart!')
          setShowTicketModal(false)
        } else {
          throw new Error(res.detail || 'Failed to add tickets to cart.')
        }
      })
      .catch((err) => {
        toast.error(
          err instanceof Error
            ? err.message
            : 'An error occurred while adding tickets to cart.',
          { style: { color: WHITE } },
        )
      })
  }

  const totalAvailableTicketsForShowing =
    ticketAvailability?.available.reduce((sum, t) => sum + t.count, 0) ?? 0

  const image = event.image_url ?? club?.image_url ?? '/default-club.png'

  const startTime = selectedShowing
    ? DateTime.fromISO(selectedShowing.start_time)
    : null
  const endTime = selectedShowing
    ? DateTime.fromISO(selectedShowing.end_time)
    : null
  const ticketDropTime = selectedShowing?.ticket_drop_time
    ? DateTime.fromISO(selectedShowing.ticket_drop_time)
    : null

  const notDroppedYet = ticketDropTime ? ticketDropTime > DateTime.now() : false
  const eventEnded = endTime ? endTime < DateTime.now() : false

  const historicallyApproved = club
    ? club.approved !== true && !club.is_ghost
    : false

  const isShowingTicketed =
    event.ticketed && ticketAvailability && ticketAvailability.totals.length > 0

  return (
    <>
      <Modal
        show={showTicketModal}
        closeModal={() => setShowTicketModal(false)}
        marginBottom={false}
      >
        <BetaTag>
          <Subtitle style={{ marginLeft: '12px', marginBottom: '20px' }}>
            Get Tickets for {startTime?.toFormat('LLL d, yyyy, t')}
          </Subtitle>
        </BetaTag>
        {isLoadingTickets && <Text>Loading ticket info...</Text>}
        {!isLoadingTickets &&
          ticketAvailability &&
          ticketAvailability.totals.length > 0 &&
          ticketAvailability.totals.map((ticketInfo) => {
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
          })}
        {!isLoadingTickets &&
          (!ticketAvailability || ticketAvailability.totals.length === 0) && (
            <Text>No ticket types defined for this event time.</Text>
          )}
        <button
          className="button is-primary my-4"
          disabled={
            isLoadingTickets ||
            totalAvailableTicketsForShowing === 0 ||
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
              : totalAvailableTicketsForShowing === 0
                ? 'Sold Out'
                : 'Add to Cart'}
        </button>
      </Modal>
      <BaseLayout {...baseProps}>
        <Metadata
          title={event.name}
          description={event.description || club?.description || undefined}
          image={image}
        />
        <MainWrapper>
          {club && !club.active && !club.is_ghost && (
            <div className="notification is-info is-light">
              <Icon name="alert-circle" style={{ marginTop: '-3px' }} />
              This event is hosted by a club that has not been approved by the{' '}
              {APPROVAL_AUTHORITY} and is therefore not visible to the public
              yet.
            </div>
          )}
          <GridWrapper>
            <div>
              <Title>{event.name}</Title>
              <Subtitle>
                Hosted by{' '}
                {club?.code ? (
                  <Link href={`/club/${club.code}`}>{club.name}</Link>
                ) : (
                  (club?.name ?? 'an independent group')
                )}
              </Subtitle>
              <div>
                {event.badges?.map((badge) => (
                  <Tag key={badge.id} style={{ backgroundColor: badge.color }}>
                    {badge.label}
                  </Tag>
                ))}
              </div>
              <Card>
                <StrongText>Description</StrongText>
                <div
                  className="content"
                  dangerouslySetInnerHTML={{
                    __html: event.description || EMPTY_DESCRIPTION,
                  }}
                />
                <Divider />
                {club && <StrongText>About {club.name}</StrongText>}
                <div
                  className="content"
                  dangerouslySetInnerHTML={{
                    __html: club?.description || EMPTY_DESCRIPTION,
                  }}
                />
              </Card>

              {event.showings && event.showings.length > 0 && (
                <Card>
                  <StrongText>
                    {event.showings.length === 1
                      ? 'Event Time & Location'
                      : 'Select an Event Time & Location'}
                  </StrongText>
                  {event.showings.map((showing) => {
                    const showStartTime = DateTime.fromISO(showing.start_time)
                    const showEndTime = DateTime.fromISO(showing.end_time)
                    const isSelected = selectedShowing?.id === showing.id

                    return (
                      <ShowingSelector
                        key={showing.id}
                        isSelected={isSelected}
                        onClick={() => setSelectedShowing(showing)}
                        role="button"
                        tabIndex={0}
                        onKeyPress={(e) =>
                          e.key === 'Enter' && setSelectedShowing(showing)
                        }
                      >
                        <Text className="has-text-weight-medium">
                          {showStartTime.toFormat('cccc, LLLL d, yyyy')}
                        </Text>
                        <Text>
                          {showStartTime.toFormat('t')} -{' '}
                          {showEndTime.toFormat('t')}
                        </Text>
                        {showing.location && (
                          <Text>
                            <i>{showing.location}</i>
                          </Text>
                        )}
                        {showing.ticketed && (
                          <Tag
                            style={{
                              backgroundColor: '#eee',
                              color: '#555',
                              marginTop: '5px',
                              fontSize: '0.7rem',
                              padding: '0.3rem 0.6rem',
                            }}
                          >
                            Tickets May Be Required
                          </Tag>
                        )}
                      </ShowingSelector>
                    )
                  })}
                </Card>
              )}
              {(!event.showings || event.showings.length === 0) && (
                <Card>
                  <Text>No specific times listed for this event.</Text>
                </Card>
              )}
            </div>

            <Right>
              <img src={image} alt={`${event.name} Event Image`} />

              {selectedShowing && selectedShowing.ticketed && (
                <Card>
                  <StrongText>Tickets for Selected Time</StrongText>
                  {isLoadingTickets && <Text>Loading availability...</Text>}
                  {!isLoadingTickets && ticketAvailability && (
                    <>
                      {notDroppedYet && ticketDropTime && (
                        <>
                          <Text>
                            Tickets available on:{' '}
                            {ticketDropTime?.toFormat('LLL')}.
                          </Text>
                          <Divider />
                        </>
                      )}
                      <Text
                        className="has-text-weight-medium"
                        style={{
                          color:
                            totalAvailableTicketsForShowing === 0
                              ? 'red'
                              : 'inherit',
                        }}
                      >
                        {totalAvailableTicketsForShowing > 0
                          ? `${totalAvailableTicketsForShowing} tickets available`
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
                  {!isLoadingTickets &&
                    (!ticketAvailability ||
                      ticketAvailability.totals.length === 0) && (
                      <Text>
                        No tickets defined or available for this specific time.
                      </Text>
                    )}
                  <button
                    className="button is-primary is-fullwidth mt-4"
                    disabled={
                      isLoadingTickets ||
                      totalAvailableTicketsForShowing === 0 ||
                      eventEnded ||
                      notDroppedYet ||
                      historicallyApproved ||
                      !isShowingTicketed
                    }
                    onClick={() => setShowTicketModal(true)}
                  >
                    {historicallyApproved
                      ? 'Club Not Approved'
                      : eventEnded
                        ? 'Event Ended'
                        : notDroppedYet
                          ? 'Tickets Not Available Yet'
                          : !club
                            ? 'Tickets Unavailable'
                            : totalAvailableTicketsForShowing === 0 ||
                                !isShowingTicketed
                              ? 'Sold Out / Unavailable'
                              : 'Get Tickets'}
                  </button>
                </Card>
              )}

              {selectedShowing && (
                <Card>
                  <StrongText>
                    {event.showings?.length === 1
                      ? 'Event Details'
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
                  {selectedShowing.location && (
                    <>
                      <StrongText style={{ marginTop: '10px' }}>
                        Location
                      </StrongText>
                      <Text>{selectedShowing.location}</Text>
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
