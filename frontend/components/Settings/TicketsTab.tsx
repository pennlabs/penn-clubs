import Link from 'next/link'
import { ReactElement, useEffect, useState } from 'react'
import { TypeOptions } from 'react-toastify'
import styled from 'styled-components'

import { mediaMaxWidth, mediaMinWidth, SM } from '../../constants/measurements'
import { Club, MembershipRank, UserInfo } from '../../types'
import { doApiRequest, formatResponse } from '../../utils'
import {
  OBJECT_NAME_PLURAL,
  OBJECT_NAME_SINGULAR,
  OBJECT_NAME_TITLE_SINGULAR,
  SHOW_LEAVE_CONFIRMATION,
} from '../../utils/branding'
import { ModalContent } from '../ClubPage/Actions'
import { Center, EmptyState, Icon, Loading, Modal, Text } from '../common'
import ClubTabCards from './ClubTabCards'
import ClubTabTable from './ClubTabTable'

const ClubTable = styled(ClubTabTable)`
  ${mediaMaxWidth(SM)} {
    display: none !important;
  }
`

const ClubCards = styled(ClubTabCards)`
  ${mediaMinWidth(SM)} {
    display: none !important;
  }
`

type TicketsTabProps = {
  className?: string
  userInfo: UserInfo
}

// remove later, for testing
const ticks = [
  { event: 'champions league', class: 'regular' },
  { event: 'champions league', class: 'regular' },
  { event: 'champions league', class: 'regular' },
  { event: 'champions league', class: 'regular' },
]

const TicketsTab = ({ className, userInfo }: TicketsTabProps): ReactElement => {
  const [tickets, setTickets] = useState<any>(null)

  const getTickets = () => {
    return doApiRequest('/tickets?format=json')
      .then((resp) => resp.json())
      .then(setTickets)
  }
  useEffect(() => {
    //getTickets()
    //remove later
    setTickets(ticks)
  }, [])

  if (tickets == null) {
    return <Loading />
  }

  return tickets.length ? (
    <>{'hi'}</>
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
