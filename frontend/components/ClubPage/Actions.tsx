import Link from 'next/link'
import {
  CSSProperties,
  ReactElement,
  useContext,
  useEffect,
  useState,
} from 'react'
import styled from 'styled-components'

import { BORDER, MEDIUM_GRAY, WHITE } from '../../constants/colors'
import { CLUB_APPLY_ROUTE, CLUB_EDIT_ROUTE } from '../../constants/routes'
import { Club, ClubApplicationRequired, QuestionAnswer } from '../../types'
import { apiCheckPermission, apiSetLikeStatus, doApiRequest } from '../../utils'
import {
  FIELD_PARTICIPATION_LABEL,
  OBJECT_NAME_SINGULAR,
  OBJECT_NAME_TITLE_SINGULAR,
  SHOW_APPLICATIONS,
  SHOW_MEMBERSHIP_REQUEST,
  SITE_NAME,
} from '../../utils/branding'
import { logException, logMessage } from '../../utils/sentry'
import {
  BookmarkIcon,
  Contact,
  Icon,
  Modal,
  SubscribeIcon,
  Title,
} from '../common'
import { AuthCheckContext } from '../contexts'

const Wrapper = styled.span`
  display: flex;
  flex-direction: row;
  align-items: right;
  justify-content: flex-end;
  margin-bottom: 0.8rem;
  line-height: 1;
  gap: 20px;
`

const BookmarkCountWrapper = styled.div`
  margin-left: 2px;
  color: ${MEDIUM_GRAY};
`

const ActionWrapper = styled.div`
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

const ActionDiv = styled.div`
  display: inline-block;
  opacity: 0.1;
  margin-left: 0.5rem;
  margin-right: 0.5rem;
  line-height: 1;
  margin-top: -1px;
`

const ActionButton = styled.a`
  font-size: 0.8em;
`

type ActionsProps = {
  club: Club
  authenticated: boolean
  style?: CSSProperties
  className?: string
  updateRequests: (code: string) => Promise<void>
}

export const ModalContent = styled.div`
  text-align: left;
  padding: 15px;

  & h1 {
    font-size: 1.3em;
    font-weight: bold;
  }

  & p {
    margin-bottom: 1em;
  }

  & input {
    box-sizing: border-box;
  }
`

const Quote = styled.div`
  & p {
    margin-bottom: 0;
  }

  border-left: 3px solid #ccc;
  padding: 3px 12px;
  color: #888;
  margin-bottom: 1em;
`

/**
 * A button that can be used to request membership to the club.
 * Assumes that the user is already in the club and is adding themselves on Penn Clubs.
 */
export const RequestMembershipButton = ({
  club,
  updateRequests,
}: {
  club: Club
  updateRequests: (code: string) => Promise<void>
}): ReactElement<any> => {
  const authCheck = useContext(AuthCheckContext)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [isSubmitDisabled, setSubmitDisabled] = useState<boolean>(false)
  const [isSubmitted, setSubmitted] = useState<boolean | null>(null)

  useEffect(() => {
    if (showModal) {
      setSubmitDisabled(false)
      setSubmitted(null)
    }
  }, [showModal])

  const isRequested = club.is_request
  const isMembershipOpen =
    club.application_required === ClubApplicationRequired.Open

  const requestMembership = () => {
    if (!isRequested) {
      authCheck(() => {
        setShowModal(true)
      })
    } else {
      updateRequests(club.code)
    }
  }

  return (
    <>
      <ActionButton className="button is-success" onClick={requestMembership}>
        {isRequested
          ? 'Withdraw Request'
          : isMembershipOpen
            ? 'Request Membership'
            : "I'm a Member"}
      </ActionButton>
      <Modal
        marginBottom={false}
        show={showModal}
        closeModal={() => setShowModal(false)}
      >
        <ModalContent>
          <Title>Confirm Membership Request</Title>
          {isMembershipOpen ? (
            <p>
              You can use this feature to request to be added on {SITE_NAME} for
              this {OBJECT_NAME_SINGULAR}.
            </p>
          ) : (
            <p>
              This feature is intended for existing {OBJECT_NAME_SINGULAR}{' '}
              members to quickly add themselves to {SITE_NAME}.
            </p>
          )}
          <p>
            If you would like to join this {OBJECT_NAME_SINGULAR}, you can read
            the "{FIELD_PARTICIPATION_LABEL}" section for more details!
          </p>
          <Quote>
            {club.how_to_get_involved && club.how_to_get_involved.length > 0 ? (
              <div
                dangerouslySetInnerHTML={{ __html: club.how_to_get_involved }}
              />
            ) : (
              `There is currently no information about how to participate in this ${OBJECT_NAME_SINGULAR}.`
            )}
          </Quote>
          <p>
            If you{' '}
            {!isMembershipOpen ? 'are a member of' : 'would like to join'} this{' '}
            {OBJECT_NAME_SINGULAR}, use the button below to confirm your
            membership request.
          </p>
          {!isMembershipOpen && (
            <p className="has-text-danger">
              If you are not an existing member of this {OBJECT_NAME_SINGULAR},
              please <b>do not</b> press the button below. This <b>is not</b>{' '}
              the application process for {club.name}.
            </p>
          )}
          {isSubmitted === true ? (
            <p className="has-text-success">
              <b>Success!</b> Your membership request has been submitted. An
              email has been sent to {OBJECT_NAME_SINGULAR} officers asking them
              to confirm your membership. Click anywhere outside this popup to
              close it.
            </p>
          ) : isSubmitted === false ? (
            <p className="has-text-danger">
              <b>Oh no!</b> An error occured and we could not send your
              membership request. Please email <Contact /> for assistance.
            </p>
          ) : (
            <button
              className="button is-warning"
              disabled={isSubmitDisabled}
              onClick={async (e) => {
                setSubmitDisabled(true)
                e.preventDefault()
                try {
                  await updateRequests(club.code)

                  // sanity check
                  const resp = await doApiRequest(
                    `/requests/membership/${club.code}/?format=json`,
                  )

                  if (resp.ok) {
                    setSubmitted(true)
                  } else {
                    setSubmitted(false)
                    const data = await resp.text()
                    logMessage(
                      `${resp.status} when performing membership request sanity check: ${data}`,
                    )
                  }
                } catch (e) {
                  setSubmitted(false)
                  logException(e)
                }
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

const Actions = ({
  club,
  style,
  updateRequests,
  className,
}: ActionsProps): ReactElement<any> => {
  const { code, favorite_count: favoriteCount } = club

  // inClub is set to true if the user is in the club, otherwise false
  const inClub = club.is_member !== false

  // a user can edit a club if they are either a superuser or in the club and
  // at least an officer
  const canEdit = apiCheckPermission(`clubs.manage_club:${code}`)

  const [favCount, setFavCount] = useState<number>(favoriteCount ?? 0)

  const isMembershipOpen =
    club.application_required === ClubApplicationRequired.Open

  return (
    <>
      <div className={className} style={style}>
        <Wrapper>
          {SHOW_MEMBERSHIP_REQUEST &&
            club.members.length > 0 &&
            isMembershipOpen &&
            club.accepting_members && (
              <RequestMembershipButton
                club={club}
                updateRequests={updateRequests}
              />
            )}
          {SHOW_APPLICATIONS && !isMembershipOpen && !inClub && (
            <Link
              legacyBehavior
              href={CLUB_APPLY_ROUTE()}
              as={CLUB_APPLY_ROUTE(code)}
              passHref
            >
              <ActionButton className="button is-success">
                <Icon name="edit" /> Apply
              </ActionButton>
            </Link>
          )}
          {canEdit && (
            <Link
              legacyBehavior
              href={CLUB_EDIT_ROUTE()}
              as={CLUB_EDIT_ROUTE(code)}
              passHref
            >
              <ActionButton className="button is-success">
                Manage {OBJECT_NAME_TITLE_SINGULAR}
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
            {club.enables_subscription && (
              <>
                <ActionDiv>|</ActionDiv>
                <SubscribeIcon padding="0" club={club} />
              </>
            )}
          </ActionWrapper>
        </Wrapper>
      </div>
    </>
  )
}

const QuestionFollowUpWrapper = styled.div`
  display: flex;
  align-items: center;
`

type followUpActionProps = {
  code: string
  question: QuestionAnswer
}

export const QuestionFollowUpAction = ({
  code,
  question,
}: followUpActionProps): ReactElement<any> => {
  const [liked, setLiked] = useState<boolean>(question.user_liked)
  const [likesCount, setLikesCount] = useState<number>(question.likes)

  const authCheck = useContext(AuthCheckContext)
  const updateLike = () => {
    authCheck(() => {
      apiSetLikeStatus(code, question.id, !liked)
      setLikesCount(likesCount + (!liked ? 1 : -1))
      setLiked(!liked)
    })
  }

  return (
    <QuestionFollowUpWrapper>
      <button
        onClick={() => updateLike()}
        className={
          liked ? 'button is-small is-primary is-light' : 'button is-small'
        }
      >
        Helpful 👍
      </button>
      <span className="is-light is-size-7 ml-2">
        ~{likesCount} people found this question helpful~
      </span>
    </QuestionFollowUpWrapper>
  )
}

export const ActionBar = styled(Actions)`
  display: flex;
  justify-content: flex-start;
`
