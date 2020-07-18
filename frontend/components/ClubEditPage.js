import Link from 'next/link'
import { Component } from 'react'

import BaseCard from '../components/ClubEditPage/BaseCard'
import EventsCard from '../components/ClubEditPage/EventsCard'
import FilesCard from '../components/ClubEditPage/FilesCard'
import InviteCard from '../components/ClubEditPage/InviteCard'
import MemberExperiencesCard from '../components/ClubEditPage/MemberExperiencesCard'
import MembersCard from '../components/ClubEditPage/MembersCard'
import QRCodeCard from '../components/ClubEditPage/QRCodeCard'
import { CLUB_ROUTE, HOME_ROUTE } from '../constants/routes'
import { ClubApplicationRequired, ClubSize } from '../types'
import { doApiRequest, formatResponse, getApiUrl } from '../utils'
import ClubMetadata from './ClubMetadata'
import { Container, Empty, Icon, InactiveTag, Text, Title } from './common'
import AuthPrompt from './common/AuthPrompt'
import Form, { ModelForm } from './Form'
import TabView from './TabView'

class ClubForm extends Component {
  constructor(props) {
    super(props)

    this.applications = [
      {
        value: ClubApplicationRequired.None,
        label: 'No Application Required',
      },
      {
        value: ClubApplicationRequired.Some,
        label: 'Application Required For Some Positions',
      },
      {
        value: ClubApplicationRequired.All,
        label: 'Application Required For All Positions',
      },
    ]

    this.sizes = [
      {
        value: ClubSize.Small,
        label: '< 20',
      },
      {
        value: ClubSize.Medium,
        label: '21-50',
      },
      {
        value: ClubSize.Large,
        label: '51-100',
      },
      {
        value: ClubSize.VeryLarge,
        label: '> 100',
      },
    ]

    const isEdit = typeof this.props.clubId !== 'undefined'

    this.state = {
      club: isEdit ? null : {},
      isEdit: isEdit,
      editMember: null,
      subscriptions: [],
    }
    this.submit = this.submit.bind(this)
    this.notify = this.notify.bind(this)
    this.deleteClub = this.deleteClub.bind(this)
  }

  notify(msg) {
    this.setState(
      {
        message: msg,
      },
      () => window.scrollTo(0, 0),
    )
  }

  toggleClubActive() {
    doApiRequest(`/clubs/${this.state.club.code}/?format=json`, {
      method: 'PATCH',
      body: {
        active: !this.state.club.active,
      },
    }).then((resp) => {
      if (resp.ok) {
        this.notify(
          `Successfully ${
            this.state.club.active ? 'deactivated' : 'activated'
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

  deleteClub() {
    doApiRequest(`/clubs/${this.state.club.code}/?format=json`, {
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

  submit(data) {
    const photo = data.image
    delete data.image

    var req = null
    if (this.state.isEdit) {
      req = doApiRequest(`/clubs/${this.state.club.code}/?format=json`, {
        method: 'PATCH',
        body: data,
      })
    } else {
      req = doApiRequest('/clubs/?format=json', {
        method: 'POST',
        body: data,
      })
    }
    req.then((resp) => {
      if (resp.ok) {
        resp.json().then((info) => {
          if (!this.state.isEdit) {
            this.props.router.push(
              '/club/[club]/edit',
              `/club/${info.id}/edit`,
              { shallow: true },
            )
            this.setState({
              isEdit: true,
              club: info,
            })
          }

          if (photo && photo.get('file') instanceof File) {
            doApiRequest(`/clubs/${this.state.club.code}/upload/?format=json`, {
              method: 'POST',
              body: photo,
            }).then((resp) => {
              if (resp.ok) {
                this.notify('Club and images have been successfully saved.')
              } else {
                this.notify('Failed to upload club image file!')
              }
            })
          } else {
            this.notify('Club has been successfully saved.')
          }
        })
      } else {
        resp.json().then((err) => {
          this.notify(formatResponse(err))
        })
      }
    })
  }

  componentDidMount() {
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
      doApiRequest(`/clubs/${clubId}/subscription/?format=json`)
        .then((resp) => resp.json())
        .then((data) =>
          this.setState({
            subscriptions: data,
          }),
        )
    }
  }

  render() {
    const { authenticated, userInfo, schools, majors, years, tags } = this.props
    const { club, invites, isEdit, message } = this.state

    if (authenticated === false) {
      return (
        <AuthPrompt>
          <ClubMetadata club={club} />
        </AuthPrompt>
      )
    }

    if (
      authenticated &&
      club &&
      club.code &&
      isEdit &&
      !userInfo.is_superuser &&
      !userInfo.membership_set.some((m) => m.code === club.code && m.role <= 10)
    ) {
      return (
        <AuthPrompt title="Oh no!" hasLogin={false}>
          <ClubMetadata club={club} />
          You do not have permission to edit the page for{' '}
          {club.name || 'this club'}. To get access, contact{' '}
          <a href="mailto:contact@pennclubs.com">contact@pennclubs.com</a>.
        </AuthPrompt>
      )
    }

    if (authenticated === null || (isEdit && club === null)) {
      return <div />
    }

    if (isEdit && !club.code) {
      return (
        <div className="has-text-centered" style={{ margin: 30 }}>
          <div className="title is-h1">404 Not Found</div>
        </div>
      )
    }

    const fields = [
      {
        name: 'General',
        type: 'group',
        fields: [
          {
            name: 'name',
            type: 'text',
            required: true,
            help:
              !this.state.isEdit &&
              'Your club URL will be generated from your club name, and cannot be changed upon creation. Your club name can still be changed afterwards.',
          },
          {
            name: 'subtitle',
            type: 'text',
            required: true,
            help:
              'This text will be shown next to your club name in list and card views.',
          },
          {
            name: 'description',
            placeholder: 'Type your club description here!',
            type: 'html',
          },
          {
            name: 'tags',
            type: 'multiselect',
            placeholder: 'Select tags relevant to your club!',
            choices: tags,
            converter: (a) => ({ value: a.id, label: a.name }),
            reverser: (a) => ({ id: a.value, name: a.label }),
          },
          {
            name: 'image',
            apiName: 'file',
            accept: 'image/*',
            type: 'file',
            label: 'Club Logo',
          },
          {
            name: 'size',
            type: 'select',
            required: true,
            choices: this.sizes,
            converter: (a) => this.sizes.find((x) => x.value === a),
            reverser: (a) => a.value,
          },
          {
            name: 'founded',
            type: 'date',
            label: 'Date Founded',
          },
        ],
      },
      {
        name: 'Contact',
        type: 'group',
        description: (
          <Text>
            Contact information entered here will be shown on your club page.
          </Text>
        ),
        fields: [
          {
            name: 'email',
            type: 'email',
          },
          {
            name: 'website',
            type: 'url',
          },
          {
            name: 'facebook',
            type: 'url',
          },
          {
            name: 'twitter',
            type: 'url',
          },
          {
            name: 'instagram',
            type: 'url',
          },
          {
            name: 'linkedin',
            type: 'url',
          },
          {
            name: 'github',
            type: 'url',
          },
          {
            name: 'youtube',
            type: 'url',
          },
          {
            name: 'listserv',
            type: 'text',
          },
        ],
      },
      {
        name: 'Admission',
        type: 'group',
        description: (
          <Text>
            Some of these fields will be used to adjust club ordering on the
            home page. Click{' '}
            <Link href="/rank">
              <a>here</a>
            </Link>{' '}
            for more details.
          </Text>
        ),
        fields: [
          {
            name: 'application_required',
            label: 'Is an application required to join your organization?',
            required: true,
            type: 'select',
            choices: this.applications,
            converter: (a) => this.applications.find((x) => x.value === a),
            reverser: (a) => a.value,
          },
          {
            name: 'accepting_members',
            label: 'Are you currently accepting applications at this time?',
            type: 'checkbox',
          },
          {
            name: 'how_to_get_involved',
            type: 'textarea',
          },
          {
            name: 'target_years',
            type: 'multiselect',
            placeholder: 'Select graduation years relevant to your club!',
            choices: years,
            converter: (a) => ({ value: a.id, label: a.name }),
            reverser: (a) => ({ id: a.value, name: a.label }),
          },
          {
            name: 'target_schools',
            type: 'multiselect',
            placeholder: 'Select schools relevant to your club!',
            choices: schools,
            converter: (a) => ({ value: a.id, label: a.name }),
            reverser: (a) => ({ id: a.value, name: a.label }),
          },
          {
            name: 'target_majors',
            type: 'multiselect',
            placeholder: 'Select majors relevant to your club!',
            choices: majors,
            converter: (a) => ({ value: a.id, label: a.name }),
            reverser: (a) => ({ id: a.value, name: a.label }),
          },
        ],
      },
    ]

    let tabs = []
    if (club.code) {
      tabs = [
        {
          name: 'info',
          label: 'Information',
          content: (
            <Form fields={fields} defaults={club} onSubmit={this.submit} />
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
          name: 'subscriptions',
          label: 'Subscriptions',
          content: (
            <>
              <BaseCard title="Subscribers">
                <table className="table is-fullwidth">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Grad Year</th>
                      <th>School</th>
                      <th>Major</th>
                      <th>Subscribed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {this.state.subscriptions.map((item, i) => (
                      <tr key={i}>
                        <td>{item.name || <Empty>None</Empty>}</td>
                        <td>{item.email || <Empty>None</Empty>}</td>
                        <td>{item.graduation_year || <Empty>None</Empty>}</td>
                        <td>
                          {item.school && item.school.length ? (
                            item.school.map((a) => a.name).join(', ')
                          ) : (
                            <Empty>None</Empty>
                          )}
                        </td>
                        <td>
                          {item.major && item.major.length ? (
                            item.major.map((a) => a.name).join(', ')
                          ) : (
                            <Empty>None</Empty>
                          )}
                        </td>
                        <td>
                          <TimeAgo date={item.created_at} />
                        </td>
                      </tr>
                    ))}
                    {!!this.state.subscriptions.length || (
                      <tr>
                        <td colSpan="5" className="has-text-grey">
                          No one has subscribed to this club yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="buttons">
                  <a
                    href={getApiUrl(
                      `/clubs/${club.code}/subscription/?format=xlsx`,
                    )}
                    className="button is-link"
                  >
                    <Icon alt="download" name="download" /> Download Subscriber
                    List
                  </a>
                </div>
              </BaseCard>
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
          content: (
            <>
              <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-header">
                  <p className="card-header-title">Student Questions</p>
                </div>
                <div className="card-content">
                  <p className="mb-3">
                    You can see a list of questions that prospective club
                    members have asked below. Answering any of these questions
                    will make them publically available and show your name as
                    the person who answered the question.
                  </p>
                  <ModelForm
                    empty={
                      <Empty>
                        No students have asked any questions yet. Check back
                        later!
                      </Empty>
                    }
                    baseUrl={`/clubs/${club.code}/questions/`}
                    allowCreation={false}
                    initialData={club.questions}
                    fields={[
                      {
                        name: 'question',
                        type: 'textarea',
                        disabled: true,
                      },
                      {
                        name: 'answer',
                        type: 'textarea',
                      },
                      {
                        name: 'approved',
                        type: 'checkbox',
                        disabled: true,
                        label:
                          'Is this question and response shown to the public?',
                      },
                    ]}
                  />
                </div>
              </div>
            </>
          ),
        },
        {
          name: 'settings',
          label: 'Settings',
          content: (
            <>
              <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-header">
                  <p className="card-header-title">
                    {club && club.active ? 'Deactivate' : 'Reactivate'} Club
                  </p>
                </div>
                <div className="card-content">
                  {club && club.active ? (
                    <Text>
                      Mark this organization as inactive. This will hide the
                      club from various listings and indicate to the public that
                      the club is no longer active.
                    </Text>
                  ) : (
                    <Text>
                      Reactivate this club, indicating to the public that this
                      club is currently active and running.
                    </Text>
                  )}
                  <Text>
                    Only owners of the organization may perform this action.
                  </Text>
                  <div className="buttons">
                    <a
                      className={
                        'button is-medium ' +
                        (club && club.active ? 'is-danger' : 'is-success')
                      }
                      onClick={() => this.toggleClubActive()}
                    >
                      {club && club.active ? (
                        <span>
                          <Icon name="trash" alt="deactivate" /> Deactivate
                        </span>
                      ) : (
                        <span>
                          <Icon name="plus" alt="Reactivate" /> Reactivate
                        </span>
                      )}
                    </a>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="card-header">
                  <p className="card-header-title">Delete Club</p>
                </div>
                <div className="card-content">
                  <Text>
                    Remove this club entry from Penn Clubs.{' '}
                    <b className="has-text-danger">
                      This action is permanent and irreversible!
                    </b>{' '}
                    All club history and membership information will be
                    permanently lost. In almost all cases, you want to
                    deactivate this club instead.
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
                        You must deactivate this club before enabling this
                        button.
                      </b>
                    )}
                  </div>
                </div>
              </div>
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
              as={isViewButton ? CLUB_ROUTE(club.code) : HOME_ROUTE}
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
            before being displayed to the public.
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
            <Form fields={fields} defaults={club} onSubmit={this.submit} />
          </div>
        )}
      </Container>
    )
  }
}

export default ClubForm
