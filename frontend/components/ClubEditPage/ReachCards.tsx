import Link from 'next/link'
import { ReactElement } from 'react'
import styled from 'styled-components'

import { CLUB_FLYER_ROUTE } from '../../constants/routes'
import { Club } from '../../types'
import { getApiUrl } from '../../utils'
import { Icon } from '../common'
import { ADMIN_CANVAS, ADMIN_NAVY } from './adminTheme'
import EnableSubscriptionCard from './EnableSubscriptionCard'
import PotentialMemberCard from './PotentialMemberCard'

const Box = styled.div`
  background: white;
  border-radius: 10px;
  margin-bottom: 16px;
  min-width: 0;
  overflow: visible;
  padding: 20px 24px 24px;
  position: relative;
  z-index: 2;

  &:last-child {
    margin-bottom: 0;
  }
`

const Title = styled.h3`
  color: ${ADMIN_NAVY};
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.3;
  margin: 0 0 16px;
`

const QR = styled.img`
  background: ${ADMIN_CANVAS};
  border-radius: 10px;
  display: block;
  margin: 0 0 12px;
  padding: 12px;
  width: 140px;
`

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
`

const GhostLink = styled.a`
  align-items: center;
  background: white;
  border: 1px solid #e4e4e4;
  border-radius: 999px;
  color: ${ADMIN_NAVY};
  display: inline-flex;
  font-size: 13px;
  font-weight: 500;
  gap: 6px;
  padding: 7px 12px;
  text-decoration: none;

  &:hover {
    background: #f7f8fb;
    color: ${ADMIN_NAVY};
    text-decoration: none;
  }
`

type Props = {
  club: Club
  notify: (message: ReactElement<any> | string, type?: string) => void
  onUpdate: () => void
}

export default function ReachCards({
  club,
  notify,
  onUpdate,
}: Props): ReactElement<any> {
  return (
    <>
      <Box>
        <Title>QR Code</Title>
        <QR
          src={getApiUrl(`/clubs/${club.code}/qr`)}
          alt={`${club.name} QR code`}
        />
        <Actions>
          <GhostLink
            href={getApiUrl(`/clubs/${club.code}/qr`)}
            download={`${club.code}.png`}
          >
            <Icon name="download" alt="" size="0.9rem" />
            Download QR
          </GhostLink>
          <Link
            href={CLUB_FLYER_ROUTE()}
            as={CLUB_FLYER_ROUTE(club.code)}
            passHref
            legacyBehavior
          >
            <GhostLink target="_blank">
              <Icon name="external-link" alt="" size="0.9rem" />
              View flyer
            </GhostLink>
          </Link>
        </Actions>
        <EnableSubscriptionCard
          framed={false}
          club={club}
          notify={notify}
          onUpdate={onUpdate}
        />
      </Box>
      {club.enables_subscription && (
        <Box>
          <PotentialMemberCard
            framed={false}
            club={club}
            source="subscription"
          />
        </Box>
      )}
    </>
  )
}
