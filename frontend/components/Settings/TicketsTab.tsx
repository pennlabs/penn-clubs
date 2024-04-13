import Link from 'next/link'
import { ReactElement, useEffect, useState } from 'react'
import styled from 'styled-components'

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
} from '../../constants/measurements'
import { UserInfo } from '../../types'
import { doApiRequest } from '../../utils'
import {
  Center,
  EmptyState,
  Icon,
  Loading,
  Modal,
  Text,
  Title,
} from '../common'
import { Collapsible } from '../SearchBar'
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

const TicketsTab = ({ className, userInfo }: TicketsTabProps): ReactElement => {
  const [tickets, setTickets] = useState<any>(null)
  const [show, setShow] = useState<boolean>(false)
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

  if (tickets == null) {
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
        </Modal>
      )}
      <TitleWrapper>
        <Title>Browse Your Tickets</Title>
      </TitleWrapper>
      {Object.entries(groupedTickets).map((group: [string, any[]]) => (
        <Collapsible
          name={group[1][0].event.name + ' - ' + group[1][0].event.club_name}
          key={group[0]}
        >
          {group[1].map((ticket) => (
            <Card className="card" key={ticket.id}>
              <div style={{ flex: 1 }}>
                <Description>
                  {ticket.type} | {ticket.event.start_time}
                </Description>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <Link href="/events">View QR Code</Link>
                  </div>
                  <div style={{ cursor: 'pointer' }} onClick={showModal}>
                    Transfer Ownership <Icon name="send" />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </Collapsible>
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
