import Link from 'next/link'
import { CSSProperties, ReactElement, useEffect, useState } from 'react'
import Linkify from 'react-linkify'
import s from 'styled-components'

import { BORDER, MEDIUM_GRAY, WHITE } from '../../constants/colors'
import { CLUB_EDIT_ROUTE } from '../../constants/routes'
import { Club, MembershipRank, UserInfo } from '../../types'
import { BookmarkIcon, Modal, SubscribeIcon } from '../common'

const Wrapper = s.span`
  display: flex;
  flex-direction: row;
  align-items: right;
  justify-content: flex-end;
  margin-bottom: 0.8rem;
  line-height: 1;
`

const BookmarkCountWrapper = s.div`
  margin-left: 2px;
  color: ${MEDIUM_GRAY};
`

const ActionWrapper = s.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;

  padding-top: 5px;
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  margin-bottom: 0.8rem;

  background-color: ${WHITE};
  border-radius: 14px;
  border: 1px solid ${BORDER};
  line-height: 1;
  height: 30px;
`

const ActionDiv = s.div`
  display: inline-block;
  opacity: 0.1;
  margin-left: 0.5rem;
  margin-right: 0.5rem;
  line-height: 1;
  margin-top: -1px;
`

const ActionButton = s.button`
  font-size: 0.8em;
  margin-right: 20px;
`

type ActionsProps = {
  club: Club
  userInfo: UserInfo
  style?: CSSProperties
  className?: string
  updateRequests: (code: string) => Promise<void>
}

const ModalContent = s.div`
  text-align: left;
  padding: 15px;

  & h1 {
    font-size: 1.3em;
    font-weight: bold;
  }

  & p {
    margin-bottom: 1em;
  }
`

const Quote = s.p`
  border-left: 3px solid #ccc;
  padding: 3px 12px;
  font-style: italic;
  color: #888;
`

const Actions = ({
  club,
  userInfo,
  style,
  updateRequests,
  className,
}: ActionsProps): ReactElement => {
  const { code, favorite_count: favoriteCount } = club
  const isRequested = club.is_request

  // inClub is set to the membership object if the user is in the club, otherwise false
  const inClub = club.is_member !== false ? { role: club.is_member } : false

  // a user can edit a club if they are either a superuser or in the club and
  // at least an officer
  const canEdit =
    (inClub && inClub.role <= MembershipRank.Officer) ||
    (userInfo && userInfo.is_superuser)

  const [favCount, setFavCount] = useState<number>(favoriteCount || 0)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [isSubmitDisabled, setSubmitDisabled] = useState<boolean>(false)
  const [isSubmitted, setSubmitted] = useState<boolean>(false)
  const requestMembership = () => {
    if (!isRequested) {
      setShowModal(true)
    } else {
      updateRequests(code)
    }
  }

  useEffect(() => {
    if (showModal) {
      setSubmitDisabled(false)
    }
  }, [showModal])

  return (
    <>
      <div className={className} style={style}>
        <Wrapper>
          {!inClub && club.members.length > 0 && (
            <ActionButton
              className="button is-success"
              onClick={requestMembership}
            >
              {isRequested ? 'Withdraw Request' : 'Request Membership'}
            </ActionButton>
          )}
          {canEdit && (
            <Link href={CLUB_EDIT_ROUTE()} as={CLUB_EDIT_ROUTE(code)}>
              <ActionButton className="button is-success">
                Manage Club
              </ActionButton>
            </Link>
          )}

          <ActionWrapper>
            <BookmarkIcon
              club={club}
              onFavorite={(status) => {
                setFavCount(favCount + (status ? 1 : -1))
              }}
              padding="0"
            />
            <BookmarkCountWrapper>{favCount}</BookmarkCountWrapper>
            <ActionDiv>|</ActionDiv>
            <SubscribeIcon padding="0" club={club} />
          </ActionWrapper>
        </Wrapper>
      </div>
      <Modal
        marginBottom={false}
        show={showModal}
        closeModal={() => setShowModal(false)}
      >
        <ModalContent>
          <h1>Confirm Membership Request</h1>
          <p>
            This feature is intended for existing club members to quickly add
            themselves to Penn Clubs.
          </p>
          <p>
            If you are not a member, you can read the "how to get involved"
            section for more details!
          </p>
          <Quote>
            <Linkify>
              {club.how_to_get_involved ||
                'There is currently no information about how to get involved with this club.'}
            </Linkify>
          </Quote>
          <p>
            If you are an existing member of this club, use the button below to
            confirm your membership request.
          </p>
          <p className="has-text-danger">
            If you are not an existing member of this club, please <b>do not</b>{' '}
            press the button below. This <b>is not</b> the application process
            for {club.name}.
          </p>
          {isSubmitted ? (
            <p className="has-text-success">
              <b>Success!</b> Your membership request has been submitted. An
              email has been sent to club officers asking them to confirm your
              membership. Click anywhere outside this popup to close it.
            </p>
          ) : (
            <button
              className="button is-warning"
              disabled={isSubmitDisabled}
              onClick={(e) => {
                setSubmitDisabled(true)
                e.preventDefault()
                updateRequests(code).then(() => {
                  setSubmitted(true)
                })
              }}
            >
              Confirm
            </button>
          )}
        </ModalContent>
      </Modal>
    </>
  )
}

export const DesktopActions = s(Actions)`
  @media (max-width: 768px) {
    display: none !important;
  }
`

export const MobileActions = s(Actions)`
  @media (min-width: 769px) {
    display: none !important;
  }
`
