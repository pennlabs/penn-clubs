import Link from 'next/link'
import { SingletonRouter } from 'next/router'
import { Component, ReactElement } from 'react'

import BaseCard from '../components/ClubEditPage/BaseCard'
import ClubEditCard from '../components/ClubEditPage/ClubEditCard'
import EventsCard from '../components/ClubEditPage/EventsCard'
import FilesCard from '../components/ClubEditPage/FilesCard'
import InviteCard from '../components/ClubEditPage/InviteCard'
import MemberExperiencesCard from '../components/ClubEditPage/MemberExperiencesCard'
import MembersCard from '../components/ClubEditPage/MembersCard'
import QRCodeCard from '../components/ClubEditPage/QRCodeCard'
import { CLUB_ROUTE, HOME_ROUTE } from '../constants/routes'
import { Club, MembershipRank, UserInfo } from '../types'
import { doApiRequest, formatResponse } from '../utils'
import PotentialMemberCard from './ClubEditPage/PotentialMemberCard'
import QuestionsCard from './ClubEditPage/QuestionsCard'
import RenewCard from './ClubEditPage/RenewCard'
import ClubMetadata from './ClubMetadata'
import {
  Contact,
  Container,
  Icon,
  InactiveTag,
  Loading,
  Text,
  Title,
} from './common'
import AuthPrompt from './common/AuthPrompt'
import TabView from './TabView'

type ClubFormProps = {
  clubId: string | undefined
  authenticated: boolean | null
  userInfo: UserInfo
  schools: any[]
  majors: any[]
  years: any[]
  tags: any[]
  router: SingletonRouter
}

type ClubFormState = {
  club: Club | null
  isEdit: boolean
  message: ReactElement | string | null
}

class ClubForm extends Component<ClubFormProps, ClubFormState> {
  constructor(props: ClubFormProps) {
    super(props)

    const isEdit = typeof this.props.clubId !== 'undefined'

    this.state = {
      club: null,
      isEdit: isEdit,
      message: null,
    }
    this.submit = this.submit.bind(this)
    this.notify = this.notify.bind(this)
    this.deleteClub = this.deleteClub.bind(this)
  }

  notify(msg): void {
    this.setState(
      {
        message: msg,
      },
      () => window.scrollTo(0, 0),
    )
  }

  toggleClubActive(): void {
    const { club } = this.state

    if (club === null) {
      return
    }

    doApiRequest(`/clubs/${club.code}/?format=json`, {
      method: 'PATCH',
      body: {
        active: !club.active,
      },
    }).then((resp) => {
      if (resp.ok) {
        this.notify(
          `Successfully ${
            club.active ? 'deactivated' : 'activated'
          } this club.`,
        )
        this.componentDidMount()
      } else {
        resp.json().then((err) => {
          this.notify(formatResponse(err))
        })
      }
    })
  }

  deleteClub(): void {
    const { club } = this.state

    if (club === null) {
      return
    }

    doApiRequest(`/clubs/${club.code}/?format=json`, {
      method: 'DELETE',
    }).then((resp) => {
      if (resp.ok) {
        this.notify('Successfully deleted club.')
        this.componentDidMount()
      } else {
        resp.json().then((err) => {
          this.notify(formatResponse(err))
        })
      }
    })
  }

  submit({
    message,
    club,
    isEdit,
  }: {
    message: ReactElement | string | null
    club?: Club
    isEdit?: boolean
  }): void {
    if (typeof club !== 'undefined' && typeof isEdit !== 'undefined') {
      if (!this.state.isEdit && isEdit) {
        this.props.router.push('/club/[club]/edit', `/club/${club.code}/edit`, {
          shallow: true,
        })
      }
      this.setState({
        isEdit: isEdit,
        club: club,
      })
    }
    if (message) {
      this.notify(message)
    }
  }

  componentDidMount(): void {
    if (this.state.isEdit) {
      const clubId =
        this.state.club !== null && this.state.club.code
          ? this.state.club.code
          : this.props.clubId
      doApiRequest(`/clubs/${clubId}/?format=json`)
        .then((resp) => resp.json())
        .then((data) =>
          this.setState({
            club: data,
          }),
        )
    }
  }

  render(): ReactElement {
    const { authenticated, userInfo, schools, years, majors, tags } = this.props
    const { club, isEdit, message } = this.state

    if (authenticated === false) {
      return (
        <AuthPrompt>
          <ClubMetadata club={club} />
        </AuthPrompt>
      )
    }

    const isOfficer =
      club &&
      club.code &&
      (club.is_member === false
        ? false
        : club.is_member <= MembershipRank.Officer)

    if (authenticated === null || (isEdit && club === null)) {
      return <Loading />
    }

    if (isEdit && (!club || !club.code)) {
      return (
        <div className="has-text-centered" style={{ margin: 30 }}>
          <div className="title is-h1">404 Not Found</div>
          <p>
            The club you are looking for does not exist. Perhaps it was recently
            moved or deleted?
          </p>
          <p>
            If you believe this is an error, please contact <Contact />.
          </p>
        </div>
      )
    }

    if (authenticated && isEdit && !userInfo.is_superuser && !isOfficer) {
      return (
        <AuthPrompt title="Oh no!" hasLogin={false}>
          <ClubMetadata club={club} />
          You do not have permission to edit the page for{' '}
          {(club && club.name) || 'this club'}. To get access, contact{' '}
          <Contact />.
        </AuthPrompt>
      )
    }

    let tabs: {
      name: string
      label: string
      content: ReactElement
      disabled?: boolean
    }[] = []

    if (club && club.code) {
      tabs = [
        {
          name: 'info',
          label: 'Information',
          content: (
            <ClubEditCard
              isEdit={this.state.isEdit}
              schools={schools}
              years={years}
              majors={majors}
              tags={tags}
              club={club}
              onSubmit={this.submit}
            />
          ),
        },
        {
          name: 'member',
          label: 'Membership',
          content: (
            <>
              <MembersCard club={club} />
              <InviteCard club={club} />
            </>
          ),
          disabled: !isEdit,
        },
        {
          name: 'recruitment',
          label: 'Recruitment',
          content: (
            <>
              <PotentialMemberCard club={club} source="subscription" />
              <PotentialMemberCard
                club={club}
                source="membershiprequests"
                actions={[
                  {
                    name: 'Accept',
                    onClick: (id: string): Promise<void> => {
                      return doApiRequest(
                        `/clubs/${club.code}/membershiprequests/${id}/accept/?format=json`,
                        { method: 'POST' },
                      ).then(() => undefined)
                    },
                  },
                ]}
              />
            </>
          ),
        },
        {
          name: 'resources',
          label: 'Resources',
          content: (
            <>
              <QRCodeCard club={club} />
              <MemberExperiencesCard club={club} />
              <EventsCard club={club} />
              <FilesCard club={club} />
            </>
          ),
        },
        {
          name: 'questions',
          label: 'Questions',
          content: <QuestionsCard club={club} />,
        },
        {
          name: 'settings',
          label: 'Settings',
          content: (
            <>
              <RenewCard club={club} />
              <BaseCard title="Delete Club">
                <Text>
                  Remove this club entry from Penn Clubs.{' '}
                  <b className="has-text-danger">
                    This action is permanent and irreversible!
                  </b>{' '}
                  All club history and membership information will be
                  permanently lost. In almost all cases, you want to deactivate
                  this club instead.
                </Text>
                <div className="buttons">
                  {club && !club.active ? (
                    <a
                      className="button is-danger is-medium"
                      onClick={() => this.deleteClub()}
                    >
                      <Icon name="trash" alt="delete" /> Delete Club
                    </a>
                  ) : (
                    <b>
                      <b>{club.name}</b> must be deactivated before performing
                      this action. To deactivate your club, contact <Contact />.
                    </b>
                  )}
                </div>
              </BaseCard>
            </>
          ),
          disabled: !isEdit,
        },
      ]
    }

    const nameOrDefault = (club && club.name) || 'New Club'
    const showInactiveTag = !(club && club.active) && isEdit

    const isViewButton = isEdit && club

    return (
      <Container>
        <ClubMetadata club={club} />
        <Title>
          {nameOrDefault}
          {showInactiveTag && <InactiveTag />}
          {
            <Link
              href={isViewButton ? CLUB_ROUTE() : HOME_ROUTE}
              as={isViewButton && club ? CLUB_ROUTE(club.code) : HOME_ROUTE}
            >
              <a
                className="button is-pulled-right is-secondary is-medium"
                style={{ fontWeight: 'normal' }}
              >
                {isViewButton ? 'View Club' : 'Back'}
              </a>
            </Link>
          }
        </Title>
        {!isEdit && (
          <p>
            Clubs that you create from this form will enter an approval process
            before being displayed to the public. After your club has been
            approved by the Office of Student Affairs, it will appear on the
            Penn Clubs website.
          </p>
        )}
        {message && (
          <div className="notification is-primary">
            <button
              className="delete"
              onClick={() => this.setState({ message: null })}
            />
            {message}
          </div>
        )}
        {isEdit ? (
          <TabView tabs={tabs} />
        ) : (
          <div style={{ marginTop: '1em' }}>
            <ClubEditCard
              isEdit={this.state.isEdit}
              schools={schools}
              years={years}
              majors={majors}
              tags={tags}
              club={club === null ? {} : club}
              onSubmit={this.submit}
            />
          </div>
        )}
      </Container>
    )
  }
}

export default ClubForm
