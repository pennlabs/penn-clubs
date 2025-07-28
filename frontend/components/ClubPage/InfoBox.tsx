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
  const { club } = props

  const getStatusText = () => {
    if (club.active) {
      if (club.approved === true) return 'Active & Approved'
      if (club.approved === false) return 'Active & Pending Approval'
      if (club.approved === null) return 'Active & Under Review'
    }
    return 'Inactive'
  }

  const data = [
    {
      field: 'status',
      icon: club.active ? 'check-circle' : 'x-circle',
      text: getStatusText(),
    },
    {
      field: 'student_types',
      icon: 'user',
      text: `Student Types: ${club.student_types.map((type) => type.name).join(', ') || 'Not Available'}`,
    },
    {
      field: 'affiliations',
      icon: 'tag',
      text: `Affiliations: ${club.affiliations.map((aff) => aff.label).join(', ') || 'Not Available'}`,
    },
    {
      field: 'eligibility',
      icon: 'check-circle',
      text: `Eligibility: ${club.eligibility ?? 'Not Available'}`,
    },
    {
      field: 'designation',
      icon: 'award',
      text: 'Designation: Not Available', // TODO: add designation
    },
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
      text: recruitingTextMap[club.recruiting_cycle],
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
      <StrongText>Organizational Profile</StrongText>
      {infoFields}
    </>
  )
}

export default InfoBox
