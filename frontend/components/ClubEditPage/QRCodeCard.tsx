import Link from 'next/link'
import { PropsWithChildren } from 'react'
import styled from 'styled-components'

import { CLUB_FLYER_ROUTE } from '../../constants/routes'
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

export enum QRCodeType {
  CLUB = 'club',
  TICKET = 'tickets',
}

const QRCodeCard: React.FC<
  PropsWithChildren<{
    id: string
    type: QRCodeType
  }>
> = ({ id, type, children }) => {
  return (
    <BaseCard title="QR Code">
      {type === QRCodeType.CLUB && (
        <Text>
          When scanned, gives mobile-friendly access to your{' '}
          {OBJECT_NAME_SINGULAR} page and bookmark/subscribe actions.
        </Text>
      )}
      <QRCode src={getApiUrl(`/${type}/${id}/qr`)} alt="qr code" />
      <div className="buttons">
        <a
          href={getApiUrl(`/${type}/${id}/qr`)}
          download={`${id}.png`}
          className="button is-success"
        >
          <Icon alt="qr" name="download" />
          Download QR Code
        </a>
      </div>
      {type === QRCodeType.CLUB && (
        <Link
          legacyBehavior
          href={CLUB_FLYER_ROUTE()}
          as={CLUB_FLYER_ROUTE(id)}
        >
          <a target="_blank" className="button is-success">
            <Icon alt="flyer" name="external-link" /> View Flyer
          </a>
        </Link>
      )}
      {children}
    </BaseCard>
  )
}
export default QRCodeCard
