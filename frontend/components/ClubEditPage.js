import moment from 'moment'
import Link from 'next/link'
import { Component, useState } from 'react'
import Select from 'react-select'
import TimeAgo from 'react-timeago'
import s from 'styled-components'

import { CLUB_FLYER_ROUTE, CLUB_ROUTE, HOME_ROUTE } from '../constants/routes'
import { ClubApplicationRequired, ClubSize, MembershipRank } from '../types'
import {
  doApiRequest,
  formatResponse,
  getApiUrl,
  getRoleDisplay,
  stripTags,
} from '../utils'
import ClubMetadata from './ClubMetadata'
import {
  Container,
  Device,
  Empty,
  Icon,
  InactiveTag,
  Text,
  Title,
} from './common'
import AuthPrompt from './common/AuthPrompt'
import Form, { ModelForm } from './Form'
import TabView from './TabView'

const Card = ({ children, title }) => (
  <div className="card" style={{ marginBottom: 20 }}>
    <div className="card-header">
      <p className="card-header-title">{title}</p>
    </div>
    <div className="card-content">{children}</div>
  </div>
)

const QRCode = s.img`
  display: block;
  width: 150px;
  padding: 15px;
  margin-bottom: 15px;
`

const EventBox = s.div`
  text-align: left;
  font-family: 'HelveticaNeue', 'Helvetica';
  user-select: none;
  pointer-events: none;

  background-color: white;
  ${({ type }) =>
    type === 'android'
      ? `
    box-shadow: 1px 1px 3px #ccc;
    border-radius: 5px;
    font-size: 0.9em;
    margin: 5px;
    margin-top: 0px;

    padding: 5px;

    display: flex;
    flex-direction: row;
    font-family: Roboto;
    color: black;

    & .img-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 1;
      float: left;
    }

    & .text {
      flex: 1;
      display: flex;
      text-align: center;
      align-items: center;
      justify-content: space-between;
      flex-direction: column;
      font-size: inherit;
      padding-left: 5px;
      padding-right: 5px;
    }

    & .title {
      width: 100%;
      font-weight: bold;
      font-size: inherit;
      align-self: flex-start;
      margin-bottom: 0;
    }

    & .date {
      padding-top: 5px;
      width: 100%;
      align-self: flex-end;
    }

    & .desc {
      width: 100%;
      font-size: inherit;
    }

    & .img-wrapper img {
      width: 100%;
      display: block;
      height: 100px;
      background-color: #eee;
    }
  `
      : `
    margin: 15px;
    box-shadow: 1px 1px 10px #ccc;
    border-radius: 15px;
    font-size: 1.5em;
  
    & .img-wrapper {
      background-color: #eee;
      border-radius: 15px 15px 0 0;
      overflow: hidden;
    }

    & .img-wrapper img {
      border: 1px solid white;
      height: 175px;
      display: block;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      width: 100%;
    }

    & .text {
      padding: 15px;
      padding-top: 5px;
    }

    & .title {
      font-size: 18px;
      word-wrap: break-word;
    }

    & .desc, & .date {
      color: #888;
      font-size: 14px;
    }
  `}

  & .desc, & .date {
    display: block;
    word-wrap: break-word;
  }

  & .date {
    margin-top: 5px;    
  }
`

const DevicesWrapper = s.div`
  margin-top: 1em;
  & .marvel-device {
    margin: 0 auto;
    display: block;
  }
`

const Devices = ({ contents }) => {
  const [deviceType, setDeviceType] = useState('none')

  return (
    <>
      <span className="field has-addons is-pulled-right">
        {['None', 'iOS', 'Android'].map((type) => (
          <p key={type} className="control">
            <button
              onClick={() => setDeviceType(type.toLowerCase())}
              className={`button ${
                deviceType === type.toLowerCase() ? 'is-link' : ''
              }`}
            >
              <span>{type}</span>
            </button>
          </p>
        ))}
      </span>
      <DevicesWrapper className="is-clearfix">
        {deviceType === 'ios' ? (
          <Device style={{ zoom: 0.8 }} type="iphone">
            <DeviceEventPreview type="ios" deviceContents={contents} />
          </Device>
        ) : deviceType === 'android' ? (
          <Device type="android">
            <DeviceEventPreview type="android" deviceContents={contents} />
          </Device>
        ) : null}
      </DevicesWrapper>
    </>
  )
}

const DeviceEventPreview = ({ deviceContents, type }) => {
  const time =
    deviceContents && deviceContents.start_time
      ? moment(deviceContents.start_time)
      : moment()

  const endTime =
    deviceContents && deviceContents.end_time
      ? moment(deviceContents.end_time)
      : moment().add(moment.duration({ hours: 1, minutes: 20 }))

  const img = deviceContents.image && deviceContents.image.get('image')

  return (
    <div
      style={{
        backgroundColor: type === 'android' ? '#fafafa' : 'white',
        height: '100%',
      }}
    >
      <img
        src={`/static/img/phone_header_${type}.png`}
        style={{ width: '100%' }}
      />
      <EventBox className="is-clearfix" type={type}>
        <div className="img-wrapper">
          <img
            src={
              img instanceof File
                ? URL.createObjectURL(img)
                : (deviceContents._original &&
                    deviceContents._original.image_url) ||
                  deviceContents.image_url ||
                  null
            }
          />
        </div>
        <div className="text">
          <b className="title">{deviceContents.name || 'Your Title'}</b>
          <span className="desc">
            {deviceContents.description
              ? stripTags(deviceContents.description) || 'Your Description'
              : 'Your Description'}
          </span>
          <span className="date">
            {type === 'android' ? (
              <>
                {time.format('h:mm A')} - {endTime.format('h:mm A')}
              </>
            ) : (
              <>Today at {time.format('h:mma')}</>
            )}
          </span>
        </div>
      </EventBox>
    </div>
  )
}

class ClubForm extends Component {
  constructor(props) {
    super(props)

    this.roles = [
      {
        value: MembershipRank.Member,
        label: 'Member',
      },
      {
        value: MembershipRank.Officer,
        label: 'Officer',
      },
      {
        value: MembershipRank.Owner,
        label: 'Owner',
      },
    ]

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

    this.types = [
      {
        value: 1,
        label: 'Recruitment',
      },
    ]

    const isEdit = typeof this.props.clubId !== 'undefined'

    this.state = {
      club: isEdit ? null : {},
      invites: [],
      isEdit: isEdit,
      inviteEmails: '',
      inviteRole: this.roles[0],
      inviteTitle: 'Member',
      editMember: null,
      subscriptions: [],
      deviceContents: {},
      fileAlert: null,
    }
    this.submit = this.submit.bind(this)
    this.notify = this.notify.bind(this)
    this.sendInvites = this.sendInvites.bind(this)
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

  deleteInvite(id) {
    doApiRequest(`/clubs/${this.state.club.code}/invites/${id}/?format=json`, {
      method: 'DELETE',
    }).then((resp) => {
      if (resp.ok) {
        this.notify('Invitation has been removed!')
        this.componentDidMount()
      } else {
        resp.json().then((err) => {
          this.notify(formatResponse(err))
        })
      }
    })
  }

  resendInvite(id) {
    doApiRequest(
      `/clubs/${this.state.club.code}/invites/${id}/resend/?format=json`,
      {
        method: 'PUT',
      },
    )
      .then((resp) => resp.json())
      .then((resp) => {
        this.notify(resp.detail)
      })
  }

  sendInvites() {
    doApiRequest(`/clubs/${this.state.club.code}/invite/?format=json`, {
      method: 'POST',
      body: {
        emails: this.state.inviteEmails,
        role: this.state.inviteRole.value,
        title: this.state.inviteTitle,
      },
    })
      .then((resp) => resp.json())
      .then((data) => {
        this.notify(formatResponse(data))
        this.componentDidMount()
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
      doApiRequest(`/clubs/${clubId}/invites/?format=json`)
        .then((resp) => resp.json())
        .then((data) =>
          this.setState({
            invites: data,
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
    const { club, invites, isEdit, message, deviceContents } = this.state

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

    const eventTableFields = [
      {
        name: 'name',
        label: 'Name',
      },
      {
        name: 'start_time',
        label: 'Start Time',
        converter: (a) => <TimeAgo date={a} />,
      },
      {
        name: 'type',
        label: 'Type',
        converter: (a) =>
          (this.types.find((v) => v.value === a) || { label: 'Unknown' }).label,
      },
    ]

    const eventFields = [
      {
        name: 'name',
        type: 'text',
        required: true,
        help:
          !this.state.isEdit &&
          'Provide a descriptive name for the planned event.',
      },
      {
        name: 'location',
        placeholder: 'Provide the event location',
        type: 'text',
      },
      {
        name: 'url',
        type: 'url',
      },
      {
        name: 'image',
        type: 'file',
      },
      {
        name: 'start_time',
        required: true,
        placeholder: 'Provide a start time for the event',
        type: 'datetime-local',
      },
      {
        name: 'end_time',
        required: true,
        placeholder: 'Provide an end time for the event',
        type: 'datetime-local',
      },
      {
        name: 'type',
        type: 'select',
        required: true,
        choices: this.types,
        converter: (a) => this.types.find((x) => x.value === a),
        reverser: (a) => a.value,
      },
      {
        name: 'description',
        placeholder: 'Type your event description here!',
        type: 'html',
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
              <Card title="Members">
                <ModelForm
                  keyField="username"
                  deleteVerb="Kick"
                  noun="Member"
                  allowCreation={false}
                  confirmDeletion={true}
                  baseUrl={`/clubs/${this.state.club.code}/members/`}
                  fields={[
                    {
                      name: 'title',
                      type: 'text',
                    },
                    {
                      name: 'role',
                      type: 'select',
                      choices: this.roles,
                      converter: (a) => this.roles.find((x) => x.value === a),
                      reverser: (a) => a.value,
                    },
                  ]}
                  tableFields={[
                    {
                      name: 'name',
                    },
                    {
                      name: 'title',
                      label: 'Title (Permissions)',
                      converter: (a, all) =>
                        `${a} (${getRoleDisplay(all.role)})`,
                    },
                    {
                      name: 'email',
                    },
                  ]}
                  currentTitle={(obj) => `${obj.name} (${obj.email})`}
                />
                <div style={{ marginTop: '1em' }}>
                  <a
                    href={getApiUrl(`/clubs/${club.code}/members/?format=xlsx`)}
                    className="button is-link"
                  >
                    <Icon alt="download" name="download" /> Download Member List
                  </a>
                </div>
              </Card>
              {invites && !!invites.length && (
                <div className="card" style={{ marginBottom: 20 }}>
                  <div className="card-header">
                    <p className="card-header-title">
                      Pending Invites ({invites.length})
                    </p>
                  </div>
                  <div className="card-content">
                    <table className="table is-fullwidth">
                      <thead>
                        <tr>
                          <th>Email</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invites.map((item) => (
                          <tr key={item.email}>
                            <td>{item.email}</td>
                            <td>
                              <button
                                className="button is-small is-link"
                                onClick={() => this.resendInvite(item.id)}
                              >
                                <Icon name="mail" alt="resend invite" /> Resend
                              </button>{' '}
                              <button
                                className="button is-small is-danger"
                                onClick={() => this.deleteInvite(item.id)}
                              >
                                <Icon name="x" alt="remove invite" /> Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <div className="card">
                <div className="card-header">
                  <p className="card-header-title">Invite Members</p>
                </div>
                <div className="card-content">
                  <Text>
                    Enter an email address or a list of email addresses
                    separated by commas or newlines in the box below. All emails
                    listed will be sent an invite to join the club. The invite
                    process will go more smoothly if you use Penn email
                    addresses, but normal email addresses will work provided
                    that the recipient has a PennKey account. We will not send
                    an invite if the account associated with an email is already
                    in the club.
                  </Text>
                  <div className="field">
                    <textarea
                      value={this.state.inviteEmails}
                      onChange={(e) =>
                        this.setState({ inviteEmails: e.target.value })
                      }
                      className="textarea"
                      placeholder="Enter email addresses here!"
                    ></textarea>
                  </div>
                  <div className="field">
                    <label className="label">Permissions</label>
                    <div className="control">
                      <Select
                        options={this.roles}
                        value={this.state.inviteRole}
                        onChange={(opt) => this.setState({ inviteRole: opt })}
                      />
                    </div>
                    <p className="help">
                      Owners have full control over the club, officers can
                      perform editing, and members have read-only permissions.
                    </p>
                  </div>
                  <div className="field">
                    <label className="label">Title</label>
                    <div className="control">
                      <input
                        className="input"
                        value={this.state.inviteTitle}
                        onChange={(e) =>
                          this.setState({ inviteTitle: e.target.value })
                        }
                      />
                    </div>
                    <p className="help">
                      The title is shown on the member listing and will not
                      affect user permissions.
                    </p>
                  </div>
                  <button
                    className="button is-primary"
                    onClick={this.sendInvites}
                  >
                    <Icon name="mail" alt="send invites" />
                    &nbsp; Send Invite(s)
                  </button>
                </div>
              </div>
            </>
          ),
          disabled: !isEdit,
        },
        {
          name: 'subscriptions',
          label: 'Subscriptions',
          content: (
            <>
              <Card title="Subscribers">
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
              </Card>
            </>
          ),
        },
        {
          name: 'resources',
          label: 'Resources',
          content: (
            <>
              <Card title="QR Code">
                <Text>
                  When scanned, gives mobile-friendly access to your club page
                  and bookmark/subscribe actions.
                </Text>
                <QRCode
                  src={getApiUrl(`/clubs/${club.code}/qr`)}
                  alt="qr code"
                />
                <div className="buttons">
                  <a
                    href={getApiUrl(`/clubs/${club.code}/qr`)}
                    download={`${club.code}.png`}
                    className="button is-success"
                  >
                    <Icon alt="qr" name="download" />
                    Download QR Code
                  </a>
                  <Link
                    href={CLUB_FLYER_ROUTE()}
                    as={CLUB_FLYER_ROUTE(club.code)}
                  >
                    <a target="_blank" className="button is-success">
                      <Icon alt="flyer" name="external-link" /> View Flyer
                    </a>
                  </Link>
                </div>
              </Card>
              <Card title="Member Experiences">
                <Text>
                  Provide more information on what being in your organization is
                  like from a member's point of view.
                </Text>
                <ModelForm
                  baseUrl={`/clubs/${club.code}/testimonials/`}
                  initialData={club.testimonials}
                  fields={[
                    {
                      name: 'text',
                      type: 'textarea',
                      hasLabel: false,
                    },
                  ]}
                />
              </Card>
              <Card title="Events">
                <Text>Manage events for this club.</Text>
                <ModelForm
                  baseUrl={`/clubs/${club.code}/events/`}
                  fields={eventFields}
                  tableFields={eventTableFields}
                  noun="Event"
                  currentTitle={(obj) => obj.name}
                  onChange={(obj) => this.setState({ deviceContents: obj })}
                />
                <Devices contents={deviceContents} />
              </Card>
              <Card title="Files">
                <table className="table is-fullwidth">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {club && club.files && club.files.length ? (
                      club.files.map((a) => (
                        <tr key={a.name}>
                          <td>{a.name}</td>
                          <td>
                            <div className="buttons">
                              <button
                                className="button is-small is-danger"
                                onClick={() =>
                                  doApiRequest(
                                    `/clubs/${club.code}/assets/${a.id}/?format=json`,
                                    { method: 'DELETE' },
                                  ).then(() =>
                                    this.setState({
                                      fileAlert: 'File has been deleted!',
                                    }),
                                  )
                                }
                              >
                                <Icon name="x" alt="delete file" /> Delete
                              </button>
                              <a
                                href={`/api/clubs/${club.code}/assets/${a.id}/`}
                                target="_blank"
                                className="button is-small is-primary"
                              >
                                <Icon name="download" alt="download file" />{' '}
                                Download
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="2" className="has-text-grey">
                          There are no uploaded files for this club.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {this.state.fileAlert && (
                  <div className="notification is-primary">
                    {this.state.fileAlert}
                  </div>
                )}
                <Form
                  fields={[{ name: 'file', type: 'file' }]}
                  onSubmit={(data) => {
                    doApiRequest(
                      `/clubs/${club.code}/upload_file/?format=json`,
                      {
                        method: 'POST',
                        body: data.file,
                      },
                    )
                      .then((resp) => resp.json())
                      .then((resp) => {
                        this.setState({ fileAlert: resp.detail })
                      })
                  }}
                />
              </Card>
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
