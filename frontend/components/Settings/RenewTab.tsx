import Link from 'next/link'
import { ReactElement, useEffect, useState } from 'react'
import s from 'styled-components'

import { mediaMaxWidth, mediaMinWidth, SM } from '../../constants/measurements'
import { Club, MembershipRank, UserInfo } from '../../types'
import { doApiRequest, formatResponse } from '../../utils'
import { Center, EmptyState, Loading, Text } from '../common'
import RenewTabCards from './RenewTabCards'
import RenewTabTable from './RenewTabTable'

const ClubTable = s(RenewTabTable)`
  ${mediaMaxWidth(SM)} {
    display: none !important;
  }
`

const ClubCards = s(RenewTabCards)`
  ${mediaMinWidth(SM)} {
    display: none !important;
  }
`

type ClubTabProps = {
  className?: string
  userInfo: UserInfo
  notify: (msg: ReactElement | string) => void
}

export type UserMembership = {
  club: Club
  role: MembershipRank
  title: string
  active: boolean
  public: boolean
}

export default ({
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
        notify(`Your privacy setting for ${club.name} has been changed.`)
      } else {
        resp.json().then((err) => {
          notify(formatResponse(err))
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
        notify(`Your activity setting for ${club.name} has been changed.`)
      } else {
        resp.json().then((err) => {
          notify(formatResponse(err))
        })
      }
    })
  }

  function leaveClub(club: Club) {
    const { username } = userInfo
    if (
      confirm(
        `Are you sure you want to leave ${club.name}? You cannot add yourself back into the club.`,
      )
    ) {
      doApiRequest(`/clubs/${club.code}/members/${username}`, {
        method: 'DELETE',
      }).then((resp) => {
        if (!resp.ok) {
          resp.json().then((err) => {
            notify(formatResponse(err))
          })
        } else {
          notify(`You have left ${club.name}.`)
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
          You are not listed as an officer for any clubs yet. If you would like
          to request access, please send your name, PennKey, and club to
          <Link href="mailto:contact@pennclubs.com">
            <a>contact@pennclubs.com</a>
          </Link>
          .
        </Text>
      </Center>
    </>
  )
}
