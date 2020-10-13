import { ReactElement } from 'react'

import { Club } from '../../types'
import { getSizeDisplay } from '../../utils'
import { Icon, Text } from '../common'

const iconStyles = {
  opacity: 0.5,
  marginRight: '5px',
}

const infoStyles = {
  marginBottom: '5px',
}

const applicationTextMap = {
  3: 'Application Required for All Roles',
  2: 'Application Required for Some',
  1: 'No Application Required',
}
const defaultApplicationText = 'No Application Required'

type InfoBoxProps = {
  club: Club
}

const InfoBox = (props: InfoBoxProps): ReactElement => {
  const data = [
    {
      icon: 'user',
      alt: 'members',
      text:
        props.club.membership_count > 0
          ? `${props.club.membership_count} Members`
          : ' ' + getSizeDisplay(props.club.size),
    },
    {
      icon: props.club.accepting_members ? 'check-circle' : 'x-circle',
      text: props.club.accepting_members
        ? ' Currently Accepting Members'
        : ' Not Currently Accepting Members',
    },
    {
      icon: 'edit',
      text:
        ' ' + applicationTextMap[props.club.application_required] ||
        defaultApplicationText,
    },
  ]

  return (
    <>
      {data.map(({ icon, text }) => (
        <Text style={infoStyles} key={text}>
          <Icon name={icon} style={iconStyles} alt={text} />
          {text}
        </Text>
      ))}
    </>
  )
}

export default InfoBox
