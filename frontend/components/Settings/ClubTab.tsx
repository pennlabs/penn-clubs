import Link from 'next/link'
import { ReactElement, useEffect, useState } from 'react'
import { TypeOptions } from 'react-toastify'
import styled from 'styled-components'

import { mediaMaxWidth, mediaMinWidth, SM } from '../../constants/measurements'
import { Club, MembershipRank, UserInfo } from '../../types'
import { doApiRequest, formatResponse } from '../../utils'
import { OBJECT_NAME_PLURAL, OBJECT_NAME_SINGULAR } from '../../utils/branding'
import { Center, EmptyState, Loading, Text } from '../common'
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

type ClubTabProps = {
  className?: string
  userInfo: UserInfo
  notify: (msg: ReactElement | string, type?: TypeOptions) => void
}

export type UserMembership = {
  club: Club
  role: MembershipRank
  title: string
  active: boolean
  public: boolean
}

const ClubTab = ({
  className,
  userInfo,
  notify,
}: ClubTabProps): ReactElement => {
  const [memberships, setMemberships] = useState<UserMembership[] | null>(null)

  const reloadMemberships = () => {
    doApiRequest('/memberships/?format=json')
      .then((resp) => resp.json())
      .then(setMemberships)
  }

  function togglePublic(club: Club) {
    const { username } = userInfo
    doApiRequest(`/clubs/${club.code}/members/${username}/?format=json`, {
      method: 'PATCH',
      body: {
        public:
          !memberships?.find((ms) => ms.club.code === club.code)?.public ||
          false,
      },
    }).then((resp) => {
      if (resp.ok) {
        notify(
          `Your privacy setting for ${club.name} has been changed.`,
          'success',
        )
      } else {
        resp.json().then((err) => {
          notify(formatResponse(err), 'error')
        })
      }
    })
  }

  function toggleActive(club: Club) {
    const { username } = userInfo
    doApiRequest(`/clubs/${club.code}/members/${username}/?format=json`, {
      method: 'PATCH',
      body: {
        active:
          !memberships?.find((ms) => ms.club.code === club.code)?.active ||
          false,
      },
    }).then((resp) => {
      if (resp.ok) {
        notify(
          `Your activity setting for ${club.name} has been changed.`,
          'success',
        )
      } else {
        resp.json().then((err) => {
          notify(formatResponse(err), 'error')
        })
      }
    })
  }

  function leaveClub(club: Club) {
    const { username } = userInfo
    if (
      confirm(
        `Are you sure you want to leave ${club.name}? You cannot add yourself back into the ${OBJECT_NAME_SINGULAR}.`,
      )
    ) {
      doApiRequest(`/clubs/${club.code}/members/${username}`, {
        method: 'DELETE',
      }).then((resp) => {
        if (!resp.ok) {
          resp.json().then((err) => {
            notify(formatResponse(err), 'error')
          })
        } else {
          notify(`You have left ${club.name}.`, 'success')
          reloadMemberships()
        }
      })
    }
  }

  useEffect(reloadMemberships, [])

  if (memberships === null) {
    return <Loading />
  }

  return memberships.length ? (
    <>
      <ClubTable
        className={className}
        memberships={memberships}
        togglePublic={togglePublic}
        toggleActive={toggleActive}
        leaveClub={leaveClub}
      />
      <ClubCards
        className={className}
        memberships={memberships}
        togglePublic={togglePublic}
        toggleActive={toggleActive}
        leaveClub={leaveClub}
      />
    </>
  ) : (
    <>
      <EmptyState name="button" />
      <Center>
        <Text isGray>
          No memberships yet! Browse {OBJECT_NAME_PLURAL}{' '}
          <Link href="/">
            <a>here</a>
          </Link>
          .
        </Text>
      </Center>
    </>
  )
}

export default ClubTab
