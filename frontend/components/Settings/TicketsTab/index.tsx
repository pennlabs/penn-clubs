import Link from 'next/link'
import { ReactElement, useEffect, useState } from 'react'
import styled from 'styled-components'

import { TicketCard } from '~/components/Tickets/TicketCard'
import {
  ALLBIRDS_GRAY,
  CLUBS_GREY_LIGHT,
  H1_TEXT,
  HOVER_GRAY,
  WHITE,
} from '~/constants'

import {
  ANIMATION_DURATION,
  BORDER_RADIUS,
  CARD_HEADING,
  mediaMaxWidth,
  SM,
} from '../../../constants/measurements'
import { UserInfo } from '../../../types'
import { doApiRequest } from '../../../utils'
import QRCodeCard, { QRCodeType } from '../../ClubEditPage/QRCodeCard'
import { Center, EmptyState, Loading, Modal, Text, Title } from '../../common'
import TicketTransferModal from '../TicketTransferModal'
import { toast } from 'react-toastify'

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

export enum ModalType {
  NONE,
  TRANSFER,
  QR_CODE,
}

const TicketsTab = ({ className, userInfo }: TicketsTabProps): ReactElement => {
  const [tickets, setTickets] = useState<any>(null)
  const [shownModal, setShownModal] = useState<ModalType>(ModalType.NONE)
  const [expandedEvents, setExpandedEvents] = useState(new Set())
  const [selectedTicket, setSelectedTicket] = useState<string | undefined>()

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

  const viewModal = (id: string, type: ModalType) => {
    setShownModal(type)
    setSelectedTicket(id)
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

  const handleSuccessfulTransfer = (id) => {
    setTickets(tickets.filter((ticket) => ticket.id !== id))
    setShownModal(ModalType.NONE)
    setSelectedTicket(undefined)
    toast.success('Ticket successfully transferred!')
  }

  return tickets.length ? (
    <div>
      <Modal
        width="50vw"
        show={shownModal === ModalType.QR_CODE}
        closeModal={() => setShownModal(ModalType.NONE)}
        marginBottom={false}
      >
        {selectedTicket && (
          <ModalContainer>
            <ModalBody>
              <QRCodeCard id={selectedTicket ?? ''} type={QRCodeType.TICKET} />
            </ModalBody>
          </ModalContainer>
        )}
      </Modal>
      <Modal
        width="50vw"
        show={shownModal === ModalType.TRANSFER}
        closeModal={() => setShownModal(ModalType.NONE)}
        marginBottom={false}
      >
        <ModalContainer>
          <ModalBody>
            <TicketTransferModal
              onSuccessfulTransfer={handleSuccessfulTransfer}
              id={selectedTicket ?? ''}
            />
          </ModalBody>
        </ModalContainer>
      </Modal>
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
                onClick={() => {
                  if (group[1].length !== 1) {
                    toggleGroup(group[0])
                  }
                }}
                viewModal={(type) => viewModal(ticket.id, type)}
                indexProps={{
                  index: i,
                  length: group[1].length,
                }}
              />
            ))
          ) : (
            <TicketCard
              key={i}
              collapsed={group[1].length}
              ticket={group[1][0]}
              onClick={() => {
                if (group[1].length !== 1) {
                  toggleGroup(group[0])
                }
              }}
              viewModal={(type) => viewModal(group[1][0].id, type)}
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
