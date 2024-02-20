import Link from 'next/link'
import { ReactElement, useEffect, useState } from 'react'
import { TypeOptions } from 'react-toastify'
import styled from 'styled-components'

import { mediaMaxWidth, mediaMinWidth, SM } from '../../constants/measurements'
import { Club, MembershipRank, UserInfo } from '../../types'
import { doApiRequest, formatResponse } from '../../utils'
import {
  OBJECT_NAME_PLURAL,
  OBJECT_NAME_SINGULAR,
  OBJECT_NAME_TITLE_SINGULAR,
  SHOW_LEAVE_CONFIRMATION,
} from '../../utils/branding'
import { ModalContent } from '../ClubPage/Actions'
import { Center, EmptyState, Icon, Loading, Modal, Text } from '../common'
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
  const [showModal, setShowModal] = useState<Club | null>(null)

  const reloadMemberships = async () => {
    return doApiRequest('/memberships/?format=json')
      .then((resp) => resp.json())
      .then(setMemberships)
  }

  async function togglePublic(club: Club) {
    const { username } = userInfo
    return doApiRequest(
      `/clubs/${club.code}/members/${username}/?format=json`,
      {
        method: 'PATCH',
        body: {
          public:
            !memberships?.find((ms) => ms.club.code === club.code)?.public ||
            false,
        },
      },
    ).then((resp) => {
      if (resp.ok) {
        resp.json().then((data) => {
          notify(
            `Your privacy setting for ${club.name} has been changed to ${
              data.public ? 'visible' : 'hidden'
            }.`,
            'success',
          )
          setMemberships((mships): UserMembership[] | null => {
            return (
              mships?.map((mship) =>
                mship.club.code === club.code
                  ? { ...mship, public: data.public }
                  : mship,
              ) ?? null
            )
          })
        })
      } else {
        resp.json().then((err) => {
          notify(formatResponse(err), 'error')
        })
      }
    })
  }

  async function toggleActive(club: Club, state?: boolean) {
    const { username } = userInfo
    return doApiRequest(
      `/clubs/${club.code}/members/${username}/?format=json`,
      {
        method: 'PATCH',
        body: {
          active:
            state ??
            !memberships?.find((ms) => ms.club.code === club.code)?.active ??
            false,
        },
      },
    ).then((resp) => {
      if (resp.ok) {
        resp.json().then((data) => {
          notify(
            `Your activity setting for ${club.name} has been changed to ${data.active}.`,
            'success',
          )
          setMemberships((mships): UserMembership[] | null => {
            return (
              mships?.map((mship) =>
                mship.club.code === club.code
                  ? { ...mship, active: data.active }
                  : mship,
              ) ?? null
            )
          })
        })
      } else {
        resp.json().then((err) => {
          notify(formatResponse(err), 'error')
        })
      }
    })
  }

  function leaveClub(club: Club) {
    if (SHOW_LEAVE_CONFIRMATION) {
      setShowModal(club)
    } else {
      actualLeaveClub(club)
    }
  }

  function actualLeaveClub(selectedClub?: Club) {
    const club = selectedClub ?? showModal
    if (club == null) {
      return
    }
    const { username } = userInfo
    doApiRequest(`/clubs/${club.code}/members/${username}`, {
      method: 'DELETE',
    })
      .then((resp) => {
        if (!resp.ok) {
          resp.json().then((err) => {
            notify(formatResponse(err), 'error')
          })
        } else {
          notify(`You have left ${club.name}.`, 'success')
          reloadMemberships()
        }
      })
      .finally(() => {
        setShowModal(null)
      })
  }

  useEffect(() => {
    reloadMemberships()
  }, [])

  if (memberships == null) {
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
      {showModal != null && (
        <Modal
          marginBottom={false}
          show={true}
          closeModal={() => setShowModal(null)}
        >
          <ModalContent className="is-clearfix">
            <h1>Confirm Leave</h1>
            <p>
              Are you sure you want to leave {showModal.name}? You cannot add
              yourself back into the {OBJECT_NAME_SINGULAR}.
            </p>
            <p>
              If you would like to appear on the alumni page of this{' '}
              {OBJECT_NAME_SINGULAR}, we recommend that you set your membership
              to inactive instead of leaving the {OBJECT_NAME_SINGULAR}.
            </p>
            <div className="buttons is-pulled-right">
              <button
                className="button is-light"
                onClick={() => actualLeaveClub()}
              >
                <Icon name="trash" /> Leave {OBJECT_NAME_TITLE_SINGULAR}
              </button>
              <button
                className="button is-primary"
                onClick={async () => {
                  await toggleActive(showModal, false)
                  setShowModal(null)
                }}
              >
                <Icon name="log-out" /> Set Inactive
              </button>
            </div>
          </ModalContent>
        </Modal>
      )}
    </>
  ) : (
    <>
      <EmptyState name="button" />
      <Center>
        <Text isGray>
          No memberships yet! Browse {OBJECT_NAME_PLURAL}{' '}
          <Link legacyBehavior href="/">
            <a>here</a>
          </Link>
          .
        </Text>
      </Center>
    </>
  )
}

export default ClubTab
