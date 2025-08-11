import { ReactElement } from 'react'

import { Club, ClubRecruitingCycle } from '../../types'
import {
  getSizeDisplay,
  hasAdminPermissions,
  isClubFieldShown,
} from '../../utils'
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
  const isAdmin = hasAdminPermissions()

  const data = [
    // Admin-only fields
    ...(isAdmin
      ? [
          // ...(props.club.status?.name
          //   ? [
          //       {
          //         field: 'status',
          //         icon: 'activity',
          //         text: `Status: ${props.club.status.name}`,
          //       },
          //     ]
          //   : []),
          ...(props.club.type?.name
            ? [
                {
                  field: 'type',
                  icon: 'tag',
                  text: `Type: ${props.club.type.name}`,
                },
              ]
            : []),
          ...(props.club.designation?.name
            ? [
                {
                  field: 'designation',
                  icon: 'star',
                  text: `Designation: ${props.club.designation.name}`,
                },
              ]
            : []),
          ...(props.club.eligibility?.length
            ? [
                {
                  field: 'eligibility',
                  icon: 'clipboard',
                  text: `Eligibility: ${props.club.eligibility.map((e) => e?.name).join(', ')}`,
                },
              ]
            : []),
        ]
      : []),
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
      text: `Currently Accepting: ${props.club.accepting_members ? 'Yes' : 'No'}`,
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
      icon: 'calendar',
      text: recruitingTextMap[props.club.recruiting_cycle],
    },
    ...(props.club.classification?.name
      ? [
          {
            field: 'classification',
            icon: 'key',
            text: `Classification: ${props.club.classification.name}`,
          },
        ]
      : []),
    ...(props.club.affiliations?.length
      ? [
          {
            field: 'affiliations',
            icon: 'award',
            text: `Affiliations: ${props.club.affiliations.map((affiliation) => affiliation.label).join(', ')}`,
          },
        ]
      : []),
  ]

  const infoFields = data
    .filter(
      ({ field, text }) =>
        isClubFieldShown(field) && text !== null && text !== undefined,
    )
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
