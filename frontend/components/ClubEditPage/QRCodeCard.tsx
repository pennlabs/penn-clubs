import Link from 'next/link'
import { ReactElement } from 'react'
import styled from 'styled-components'

import { CLUB_FLYER_ROUTE } from '../../constants/routes'
import { Club } from '../../types'
import { getApiUrl } from '../../utils'
import { OBJECT_NAME_SINGULAR } from '../../utils/branding'
import { Icon, Text } from '../common'
import BaseCard from './BaseCard'

const QRCode = styled.img`
  display: block;
  width: 150px;
  padding: 15px;
  margin-bottom: 15px;
`

type QRCodeCardProps = {
  club: Club
}

export function QRCodeCardTicketing({ id }: { id: string }): ReactElement {
  return (
    <BaseCard title="QR Code">
      <QRCode src={getApiUrl(`/tickets/${id}/qr`)} alt="qr code" />
      <div className="buttons">
        <a
          href={getApiUrl(`/tickets/${id}/qr`)}
          download={`${id}.png`}
          className="button is-success"
        >
          <Icon alt="qr" name="download" />
          Download QR Code
        </a>
      </div>
    </BaseCard>
  )
}

export default function QRCodeCard({ club }: QRCodeCardProps): ReactElement {
  return (
    <BaseCard title="QR Code">
      <Text>
        When scanned, gives mobile-friendly access to your{' '}
        {OBJECT_NAME_SINGULAR} page and bookmark/subscribe actions.
      </Text>
      <QRCode src={getApiUrl(`/clubs/${club.code}/qr`)} alt="qr code" />
      <div className="buttons">
        <a
          href={getApiUrl(`/clubs/${club.code}/qr`)}
          download={`${club.code}.png`}
          className="button is-success"
        >
          <Icon alt="qr" name="download" />
          Download QR Code
        </a>
        <Link
          legacyBehavior
          href={CLUB_FLYER_ROUTE()}
          as={CLUB_FLYER_ROUTE(club.code)}
        >
          <a target="_blank" className="button is-success">
            <Icon alt="flyer" name="external-link" /> View Flyer
          </a>
        </Link>
      </div>
    </BaseCard>
  )
}
