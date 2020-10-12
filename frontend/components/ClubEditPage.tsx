import Link from 'next/link'
import { SingletonRouter } from 'next/router'
import React, { Component, ReactElement } from 'react'

import ClubEditCard from '../components/ClubEditPage/ClubEditCard'
import EventsCard from '../components/ClubEditPage/EventsCard'
import FilesCard from '../components/ClubEditPage/FilesCard'
import InviteCard from '../components/ClubEditPage/InviteCard'
import MemberExperiencesCard from '../components/ClubEditPage/MemberExperiencesCard'
import MembersCard from '../components/ClubEditPage/MembersCard'
import QRCodeCard from '../components/ClubEditPage/QRCodeCard'
import {
  CLUB_EDIT_ROUTE,
  CLUB_RENEW_ROUTE,
  CLUB_ROUTE,
  DIRECTORY_ROUTE,
  HOME_ROUTE,
} from '../constants/routes'
import {
  Club,
  Major,
  MembershipRank,
  School,
  Tag,
  UserInfo,
  Year,
} from '../types'
import { doApiRequest, formatResponse } from '../utils'
import {
  OBJECT_NAME_SINGULAR,
  OBJECT_NAME_TITLE_SINGULAR,
} from '../utils/branding'
import AnalyticsCard from './ClubEditPage/AnalyticsCard'
import DeleteClubCard from './ClubEditPage/DeleteClubCard'
import EnableSubscriptionCard from './ClubEditPage/EnableSubscriptionCard'
import PotentialMemberCard from './ClubEditPage/PotentialMemberCard'
import QuestionsCard from './ClubEditPage/QuestionsCard'
import RenewCard from './ClubEditPage/RenewCard'
import ClubMetadata from './ClubMetadata'
import {
  Contact,
  Container,
  InactiveTag,
  Loading,
  Metadata,
  Title,
} from './common'
import AuthPrompt from './common/AuthPrompt'
import TabView from './TabView'

type ClubFormProps = {
  clubId: string | undefined
  authenticated: boolean | null
  userInfo: UserInfo
  schools: School[]
  majors: Major[]
  years: Year[]
  tags: Tag[]
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
  }

  notify(msg: string | ReactElement): void {
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
        // if the club is not active, redirect to the renewal page instead of the edit page
        if (!club.active) {
          this.props.router.push(
            CLUB_RENEW_ROUTE(),
            CLUB_RENEW_ROUTE(club.code),
          )
          return
        } else {
          this.props.router.push(
            CLUB_EDIT_ROUTE(),
            CLUB_EDIT_ROUTE(club.code),
            {
              shallow: true,
            },
          )
        }
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

    let metadata
    if (club) {
      metadata = <ClubMetadata club={club} />
    } else {
      metadata = <Metadata title="Create Club" />
    }

    if (authenticated === false) {
      return <AuthPrompt>{metadata}</AuthPrompt>
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
            The {OBJECT_NAME_SINGULAR} you are looking for does not exist.
            Perhaps it was recently moved or deleted?
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
          {metadata}
          You do not have permission to edit the page for{' '}
          {(club && club.name) || `this ${OBJECT_NAME_SINGULAR}`}. To get
          access, contact <Contact />.
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
          label: `Edit ${OBJECT_NAME_TITLE_SINGULAR} Page`,
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
              <InviteCard club={club} />
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
              <MembersCard club={club} />
            </>
          ),
          disabled: !isEdit,
        },
        {
          name: 'events',
          label: 'Events',
          content: (
            <>
              <EventsCard club={club} />
            </>
          ),
        },
        {
          name: 'recruitment',
          label: 'Recruitment',
          content: (
            <>
              <QRCodeCard club={club} />
              <EnableSubscriptionCard
                notify={this.notify}
                club={club}
                onUpdate={this.componentDidMount.bind(this)}
              />
              {club.enables_subscription && (
                <PotentialMemberCard club={club} source="subscription" />
              )}
            </>
          ),
        },
        {
          name: 'resources',
          label: 'Resources',
          content: (
            <>
              <MemberExperiencesCard club={club} />
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
              <DeleteClubCard
                onDelete={this.componentDidMount.bind(this)}
                notify={this.notify}
                club={club}
              />
            </>
          ),
          disabled: !isEdit,
        },
        {
          name: 'analytics',
          label: 'Analytics',
          content: (
            <>
              <AnalyticsCard club={club} />
            </>
          ),
        },
      ]
    }

    const nameOrDefault = (club && club.name) || 'New Club'
    const showInactiveTag = !(club && club.active) && isEdit

    const isViewButton = isEdit && club

    return (
      <Container>
        {metadata}
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
          <>
            <p className="mb-3">
              Clubs that you create from this form will enter an approval
              process before being displayed to the public. After your club has
              been approved by the Office of Student Affairs, it will appear on
              the Penn Clubs website.
            </p>
            <p>
              <b>Before creating your club,</b> please check to see if it
              already exists on the{' '}
              <Link href={DIRECTORY_ROUTE} as={DIRECTORY_ROUTE}>
                <a>directory page</a>
              </Link>
              . If your club already exists, please email <Contact /> to gain
              access instead of filling out this form.
            </p>
          </>
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
