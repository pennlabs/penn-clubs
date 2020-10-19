import { ReactElement } from 'react'

import { Club } from '../../types'
import { getSizeDisplay, isClubFieldShown } from '../../utils'
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
      field: 'size',
      icon: 'user',
      alt: 'members',
      text: `${props.club.membership_count} Registered (${getSizeDisplay(
        props.club.size,
      )})`,
    },
    {
      field: 'accepting_members',
      icon: props.club.accepting_members ? 'check-circle' : 'x-circle',
      text: props.club.accepting_members
        ? ' Currently Accepting Members'
        : ' Not Currently Accepting Members',
    },
    {
      field: 'application_required',
      icon: 'edit',
      text:
        ' ' + applicationTextMap[props.club.application_required] ||
        defaultApplicationText,
    },
  ]

  const infoFields = data
    .filter(({ field }) => isClubFieldShown(field))
    .map(({ icon, text }) => (
      <Text style={infoStyles} key={text}>
        <Icon name={icon} style={iconStyles} alt={text} />
        {text}
      </Text>
    ))

  if (infoFields.length <= 0) {
    return <Text style={infoStyles}>No Information</Text>
  }

  return <>{infoFields}</>
}

export default InfoBox
