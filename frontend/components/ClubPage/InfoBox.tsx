import { ReactElement } from 'react'

import { Club, ClubRecruitingCycle } from '../../types'
import { getSizeDisplay, isClubFieldShown } from '../../utils'
import { Icon, StrongText, Text } from '../common'

const iconStyles = {
  opacity: 0.5,
  marginRight: '5px',
}

const infoStyles = {
  marginBottom: '5px',
}

const applicationTextMap = {
  5: 'Application and Interview Required',
  4: 'Application Required',
  3: 'Audition Required',
  2: 'Tryout Required',
  1: 'Open Membership',
}
const defaultApplicationText = 'Open Membership'

const recruitingTextMap = {
  [ClubRecruitingCycle.Both]: 'Both Semesters',
  [ClubRecruitingCycle.Open]: 'Open Recruitment',
  [ClubRecruitingCycle.Unknown]: 'Unknown Recruitment Cycle',
  [ClubRecruitingCycle.Fall]: 'Fall Semester',
  [ClubRecruitingCycle.Spring]: 'Spring Semester',
}

type InfoBoxProps = {
  club: Club
}

const InfoBox = (props: InfoBoxProps): ReactElement<any> | null => {
  const data = [
    {
      field: 'size',
      icon: 'user',
      alt: 'members',
      text: `${
        props.club.membership_count ?? props.club.members.length
      } Registered (${getSizeDisplay(props.club.size)})`,
    },
    {
      field: 'accepting_members',
      icon: props.club.accepting_members ? 'check-circle' : 'x-circle',
      text: props.club.accepting_members
        ? 'Currently Accepting Members'
        : 'Not Currently Accepting Members',
    },
    {
      field: 'application_required',
      icon: 'edit',
      text:
        applicationTextMap[props.club.application_required] ||
        defaultApplicationText,
    },
    {
      field: 'recruiting_cycle',
      icon: 'clock',
      text: recruitingTextMap[props.club.recruiting_cycle],
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
    return null
  }

  return (
    <>
      {' '}
      <StrongText>Basic Info</StrongText>
      {infoFields}
    </>
  )
}

export default InfoBox
