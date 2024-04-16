import moment from 'moment-timezone'
import Link from 'next/link'
import { ReactElement, useEffect, useState } from 'react'
import styled from 'styled-components'

import {
  ALLBIRDS_GRAY,
  CLUBS_BLUE,
  CLUBS_GREY_LIGHT,
  H1_TEXT,
  HOVER_GRAY,
  HUB_SNOW,
  WHITE,
} from '~/constants'

import {
  ANIMATION_DURATION,
  BORDER_RADIUS,
  CARD_HEADING,
  mediaMaxWidth,
  SM,
} from '../../constants/measurements'
import { UserInfo } from '../../types'
import { doApiRequest } from '../../utils'
import { QRCodeCardTicketing } from '../ClubEditPage/QRCodeCard'
import {
  Center,
  EmptyState,
  Icon,
  Loading,
  Modal,
  Text,
  Title,
} from '../common'
import TicketTransferModal from './TicketTransferModal'

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`

const CardTitle = styled.strong`
  line-height: 1.2;
  color: ${H1_TEXT};
  font-weight: ${CARD_HEADING};
`

const ActionWrapper = styled.div`
  width: 100%;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1.5px solid rgba(0, 0, 0, 0.05);
  width: 100%;
  display: flex;
  justify-content: space-between;

  & > :not(:first-child) {
    margin-left: 5px;
  }
`

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

const ModalContainer = styled.div`
  text-align: left;
  position: relative;
`
const ModalBody = styled.div`
  padding: 2rem;
`
const SectionContainer = styled.div`
  margin-bottom: 1.5rem;
`

const Description = styled.p`
  margin-bottom: 0.5rem;
  color: ${CLUBS_GREY_LIGHT};
  width: 100%;
`
const TitleWrapper = styled.div`
  margin-top: 1.5rem;
  color: ${CLUBS_GREY_LIGHT};
  width: 100%;
`

type TicketsTabProps = {
  className?: string
  userInfo: UserInfo
}

const formatTime = (startTime: string, endTime: string) => {
  const date = new Date(startTime)
  // return the month and date
  const dayDuration = new Date(endTime).getDate() - date.getDate()
  const timezone = moment.tz.guess()
  const startFormatted = moment(startTime)
    .tz(timezone)
    .format(dayDuration === 0 ? 'h:mmA' : 'MMM D, h:mmA')
  const endFormatted = moment(endTime)
    .tz(timezone)
    .format(dayDuration === 0 ? 'h:mmA z' : 'MMM D, h:mmA z')

  return {
    month: date.toLocaleString('default', { month: 'short' }),
    day: date.getDate(),
    timeRange: `${startFormatted} — ${endFormatted}`,
    dayDuration,
  }
}

const TicketCard = ({
  collapsed = 0,
  ticket,
  showModal,
  props,
  onClick,
  viewQRCode,
}: {
  collapsed?: number
  ticket: any
  showModal: () => void
  props?: any
  onClick?: () => void
  viewQRCode?: () => void
}) => {
  const datetimeData = formatTime(
    ticket.event.start_time,
    ticket.event.end_time,
  )
  function generateBoxShadow(collapsed) {
    let boxShadow = ''
    boxShadow += '0 1px 6px rgba(0, 0, 0, 0.2),\n'
    for (let i = 1; i <= collapsed; i++) {
      boxShadow += `${i * 10}px -${i * 10}px 0 -1px ${HUB_SNOW}, ${i * 10}px -${i * 10}px rgba(0, 0, 0, 0.1)${
        i !== collapsed ? ',\n' : ''
      }`
    }
    return boxShadow
  }
  return (
    <Card
      className="card"
      style={{
        ...props,
        display: 'flex',
        cursor: 'pointer',
        ...(collapsed !== 0
          ? {
              boxShadow: generateBoxShadow(collapsed),
            }
          : {}),
        margin: collapsed !== 0 ? '4rem 0' : '1rem 0',
      }}
      onClick={(e) => {
        onClick?.()
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '16px',
          background: CLUBS_BLUE,
          borderRadius: '8px',
          color: WHITE,
          width: '80px',
        }}
      >
        <Title
          style={{
            marginBottom: 0,
            color: WHITE,
            display: 'flex',
            alignItems: 'top',
          }}
        >
          {datetimeData.day}
          {datetimeData.dayDuration !== 0 && (
            <div
              style={{
                fontSize: '12px',
                position: 'relative',
                right: 0,
                top: 0,
              }}
            >
              {datetimeData.dayDuration < 0 ? '-' : '+'}{' '}
              {Math.abs(datetimeData.dayDuration)}
            </div>
          )}
        </Title>
        <Description
          style={{
            color: WHITE,
            width: '100%',
            textAlign: 'center',
            marginBottom: 0,
          }}
        >
          {datetimeData.month}
        </Description>
      </div>
      <div style={{ width: '20px' }} />
      <div style={{ flex: 1 }}>
        <Description
          style={{
            fontWeight: 600,
          }}
        >
          {ticket.event.name}
        </Description>
        <Description>{ticket.event.club_name}</Description>
        <Description>
          {ticket.type} | {datetimeData.timeRange}
        </Description>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <button
            className="button is-primary"
            style={{
              backgroundColor: CLUBS_BLUE,
              padding: '16px',
              border: '1px solid ' + CLUBS_BLUE,
              cursor: 'pointer',
            }}
            onClick={(e) => {
              e.stopPropagation()
              viewQRCode?.()
            }}
          >
            QR Code
            <Icon
              name="qr-code"
              size="2rem"
              style={{
                color: WHITE,
              }}
            />
          </button>
        </div>
        <div style={{ width: '12px' }} />
        <button
          className="button is-primary"
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation()
            showModal?.()
          }}
        >
          Transfer Ownership
          <Icon
            name="swap-horiz"
            size="2rem"
            style={{
              color: WHITE,
            }}
          />
        </button>
      </div>
    </Card>
  )
}

const TicketsTab = ({ className, userInfo }: TicketsTabProps): ReactElement => {
  const [tickets, setTickets] = useState<any>(null)
  const [show, setShow] = useState<boolean>(false)
  const [expandedEvents, setExpandedEvents] = useState(new Set())
  const [qrCodeModal, setQRCodeModal] = useState<string | undefined>()

  const showModal = () => setShow(true)
  const hideModal = () => setShow(false)

  const getTickets = () => {
    return doApiRequest('/tickets?format=json')
      .then((resp) => resp.json())
      .then(setTickets)
  }
  useEffect(() => {
    getTickets()
  }, [])

  if (tickets === null) {
    return <Loading />
  }

  // Group by event
  const groupedTickets = tickets.reduce((acc, ticket) => {
    if (!acc[ticket.event.id]) {
      acc[ticket.event.id] = []
    }
    acc[ticket.event.id].push(ticket)
    return acc
  }, {})

  const viewQRCode = (id: string) => {
    showModal()
    setQRCodeModal(id)
  }

  const toggleGroup = (key) => {
    const newExpandedEvents = new Set(expandedEvents)
    if (expandedEvents.has(key)) {
      newExpandedEvents.delete(key)
    } else {
      newExpandedEvents.add(key)
    }
    setExpandedEvents(newExpandedEvents)
  }

  return tickets.length ? (
    <div>
      {show && (
        <Modal
          width="50vw"
          show={show}
          closeModal={hideModal}
          marginBottom={false}
        >
          <TicketTransferModal event={null} />
          {qrCodeModal && (
            <ModalContainer>
              <ModalBody>
                <QRCodeCardTicketing id={qrCodeModal ?? ''} />
              </ModalBody>
            </ModalContainer>
          )}
        </Modal>
      )}
      <TitleWrapper>
        <Title>Browse Your Tickets</Title>
      </TitleWrapper>
      {Object.entries(groupedTickets).map((group: [string, any[]], i) => (
        <div key={i}>
          {expandedEvents.has(group[0] || group[1].length === 1) && (
            <a
              style={{
                display: 'flex',
                justifyContent: 'end',
              }}
              onClick={() => toggleGroup(group[0])}
            >
              Uncollapse
            </a>
          )}

          {expandedEvents.has(group[0]) || group[1].length === 1 ? (
            group[1].map((ticket, i) => (
              <TicketCard
                key={i}
                ticket={ticket}
                showModal={showModal}
                onClick={() => {
                  if (group[1].length !== 1) {
                    toggleGroup(group[0])
                  }
                }}
                viewQRCode={() => viewQRCode(ticket.id)}
              />
            ))
          ) : (
            <TicketCard
              key={i}
              collapsed={Math.min(3, group[1].length)}
              ticket={group[1][0]}
              showModal={showModal}
              onClick={() => {
                if (group[1].length !== 1) {
                  toggleGroup(group[0])
                }
              }}
              viewQRCode={() => viewQRCode(group[1][0].id)}
            />
          )}
        </div>
      ))}
    </div>
  ) : (
    <>
      <EmptyState name="empty_cart" />
      <Center>
        <Text isGray>
          No tickets yet! Browse events to find tickets{' '}
          <Link href="/events">here</Link>.
        </Text>
      </Center>
    </>
  )
}

export default TicketsTab
