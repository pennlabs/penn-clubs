import { ReactElement } from 'react'

import { Advisor, Club } from '../../types'
import { formatPhoneNumber } from '../../utils'
import { ProfilePic } from '../common'
import { StyledCard } from './MemberCard'

type Props = {
  club: Club
}

type AdvisorCardProps = {
  info: Advisor
}

const AdvisorCard = ({ info }: AdvisorCardProps): ReactElement => {
  return (
    <StyledCard $bordered>
      <div className="columns">
        <div className="column is-narrow is-hidden-mobile">
          <ProfilePic
            isCentered={false}
            user={{ name: info.name, image: null }}
            isRound
          />
        </div>
        <div className="column has-text-left">
          <b className="is-block is-size-5">{info.name}</b>
          <div>
            <i>{info.title}</i>
            {info.department && info.department.length > 0 && (
              <> - {info.department}</>
            )}
          </div>
          <div>
            {info.email && info.email.length ? (
              <a href={`mailto:${info.email}`}>{info.email}</a>
            ) : (
              'No Email'
            )}{' '}
            -{' '}
            {info.phone && info.phone.length ? (
              <a href={`tel:${info.phone}`}>{formatPhoneNumber(info.phone)}</a>
            ) : (
              'No Phone'
            )}
          </div>
        </div>
      </div>
    </StyledCard>
  )
}

const AdvisorList = ({ club }: Props): ReactElement => {
  return (
    <>
      {club.advisor_set.map((advisor, i) => (
        <AdvisorCard key={i} info={advisor} />
      ))}
    </>
  )
}

export default AdvisorList
