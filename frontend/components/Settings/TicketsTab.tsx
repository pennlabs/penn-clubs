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

// remove later, for testing
const ticks = [
  { event: 'Champions league', class: 'General Admission', club: 'Uefa' },
  { event: 'Champions league', class: 'General Admission', club: 'Uefa' },
  { event: 'Champions league', class: 'General Admission', club: 'Uefa' },
  { event: 'Champions league', class: 'General Admission', club: 'Uefa' },
]

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
    // getTickets()
    // remove later
    setTickets(ticks)
  }, [])

  if (tickets == null) {
    return <Loading />
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
        </Modal>
      )}
      <TitleWrapper>
        <Title>Browse Your Tickets</Title>
      </TitleWrapper>
      {tickets.map((ticket) => (
        <Card className="card">
          <div style={{ display: 'flex' }}>
            <div>
              <img
                style={{ marginRight: '1rem', height: '60px' }}
                src="/static/img/events_calendar.png"
              />
            </div>
            <div>
              <div>
                <CardHeader>
                  <CardTitle className="is-size-5">{ticket.event}</CardTitle>
                </CardHeader>
              </div>
              <Description>{ticket.class}</Description>
            </div>
          </div>
          <ActionWrapper>
            <div style={{ flex: 1 }}></div>
            <div style={{ flex: 1 }}>
              <div
                className="is-pulled-right"
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  width: '100%',
                }}
              >
                <div>
                  <Link href="/events">
                    <a>View QR Code</a>
                  </Link>
                </div>
                <div style={{ cursor: 'pointer' }} onClick={showModal}>
                  Transfer Ownership <Icon name="send" />
                </div>
              </div>
            </div>
          </ActionWrapper>
        </Card>
      ))}
    </div>
  ) : (
    <>
      <EmptyState name="empty_cart" />
      <Center>
        <Text isGray>
          No tickets yet! Browse events to find tickets{' '}
          <Link href="/events">
            <a>here</a>
          </Link>
          .
        </Text>
      </Center>
    </>
  )
}

export default TicketsTab
