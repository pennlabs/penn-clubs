import renderPage from '../renderPage.js'
import { doApiRequest, titleize, getRoleDisplay } from '../utils'
import { CLUBS_GREY_LIGHT, CLUBS_RED } from '../colors'
import { Link, Router } from '../routes'
import React from 'react'
import Form from '../components/Form'
import TabView from '../components/TabView'

class ClubForm extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      club: null,
      invites: [],
      isEdit: typeof this.props.club_id !== 'undefined',
      inviteEmails: ''
    }
    this.submit = this.submit.bind(this)
    this.notify = this.notify.bind(this)
    this.sendInvites = this.sendInvites.bind(this)
  }

  notify(msg) {
    this.setState({
      message: msg
    }, () => window.scrollTo(0, 0))
  }

  formatError(err) {
    return Object.keys(err).map((a) => <div key={a}><b>{titleize(a)}:</b> {err[a]}</div>)
  }

  toggleClubActive() {
    doApiRequest(`/clubs/${this.state.club.id}/?format=json`, {
      method: 'PATCH',
      body: {
        active: !this.state.club.active
      }
    }).then((resp) => {
      if (resp.ok) {
        this.notify(`Successfully ${this.state.club.active ? 'deactivated' : 'activated'} this club.`)
        this.componentDidMount()
      } else {
        resp.json().then((err) => {
          this.notify(this.formatError(err))
        })
      }
    })
  }

  deleteClub() {
    if (confirm(`Are you absolutely sure you want to delete ${this.state.club.name}?`)) {
      doApiRequest(`/clubs/${this.state.club.id}/?format=json`, {
        method: 'DELETE'
      }).then((resp) => {
        if (!resp.ok) {
          resp.json().then((err) => {
            this.notify(this.formatError(err))
          })
        } else {
          Router.pushRoute('/')
        }
      })
    }
  }

  deleteMembership(member) {
    if (confirm(`Are you sure you want to kick ${member} from ${this.state.club.name}?`)) {
      doApiRequest(`/clubs/${this.state.club.id}/members/${member}/?format=json`, {
        method: 'DELETE'
      }).then((resp) => {
        if (resp.ok) {
          this.notify(`${member} has been kicked out!`)
          this.componentDidMount()
        } else {
          resp.json().then((err) => {
            this.notify(this.formatError(err))
          })
        }
      })
    }
  }

  deleteInvite(id) {
    doApiRequest(`/clubs/${this.state.club.id}/invites/${id}/?format=json`, {
      method: 'DELETE'
    }).then((resp) => {
      if (resp.ok) {
        this.notify('Invitation has been removed!')
        this.componentDidMount()
      } else {
        resp.json().then((err) => {
          this.notify(this.formatError(err))
        })
      }
    })
  }

  sendInvites() {
    doApiRequest(`/clubs/${this.state.club.id}/invite/?format=json`, {
      method: 'POST',
      body: {
        emails: this.state.inviteEmails
      }
    }).then((resp) => resp.json()).then((data) => {
      this.notify(this.formatError(data))
      this.componentDidMount()
    })
  }

  submit(data) {
    var req = null
    if (this.state.isEdit) {
      req = doApiRequest(`/clubs/${this.state.club.id}/?format=json`, {
        method: 'PATCH',
        body: data
      })
    } else {
      req = doApiRequest('/clubs/?format=json', {
        method: 'POST',
        body: data
      })
    }
    req.then((resp) => {
      if (resp.ok) {
        this.notify('Club has been successfully saved.')
        resp.json().then((info) => {
          if (!this.state.isEdit) {
            Router.replaceRoute('club-edit', { club: info.id }, { shallow: true })
          }
          this.setState({
            isEdit: true,
            club: info
          })
        })
      } else {
        resp.json().then((err) => {
          this.notify(this.formatError(err))
        })
      }
    })
  }

  componentDidMount() {
    if (this.state.isEdit) {
      const club_id = this.state.club !== null && this.state.club.id ? this.state.club.id : this.props.club_id
      doApiRequest(`/clubs/${club_id}/?format=json`)
        .then((resp) => resp.json())
        .then((data) => this.setState({
          club: data
        }))
      doApiRequest(`/clubs/${club_id}/invites/?format=json`)
        .then((resp) => resp.json())
        .then((data) => this.setState({
          invites: data
        }))
    }
  }

  render() {
    const { tags } = this.props
    const { club, invites } = this.state

    if (this.state.isEdit && club === null) {
      return <div />
    }

    if (this.state.isEdit && !club.id) {
      return <div className='has-text-centered' style={{ margin: 30 }}>
        <div className='title is-h1'>404 Not Found</div>
      </div>
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
            help: !this.state.isEdit && 'Your club URL will be generated from your club name, and cannot be changed upon creation. Your club name can still be changed afterwards.'
          },
          {
            name: 'subtitle',
            type: 'text',
            required: true,
            help: 'This text will be shown next to your club name in list and card views.'
          },
          {
            name: 'description',
            placeholder: 'Type your club description here!',
            type: 'html'
          },
          {
            name: 'tags',
            type: 'multiselect',
            placeholder: 'Select tags relevant to your club!',
            choices: tags,
            converter: (a) => ({ value: a.id, label: a.name }),
            reverser: (a) => ({ id: a.value, name: a.label })
          },
          {
            name: 'image_url',
            type: 'url',
            label: 'Club Logo Image URL'
          },
          {
            name: 'founded',
            type: 'date',
            label: 'Date Founded'
          }
        ]
      },
      {
        name: 'Contact',
        type: 'group',
        fields: [
          {
            name: 'email',
            type: 'email'
          },
          {
            name: 'website',
            type: 'url'
          },
          {
            name: 'facebook',
            type: 'url'
          },
          {
            name: 'twitter',
            type: 'url'
          },
          {
            name: 'instagram',
            type: 'url'
          },
          {
            name: 'linkedin',
            type: 'url'
          },
          {
            name: 'github',
            type: 'url'
          }
        ]
      },
      {
        name: 'Admission',
        type: 'group',
        fields: [
          {
            name: 'application_required',
            label: 'Is an application required to join your organization?',
            type: 'checkbox'
          },
          {
            name: 'application_available',
            label: 'Are you currently accepting applications at this time?',
            type: 'checkbox'
          },
          {
            name: 'how_to_get_involved',
            type: 'textarea'
          }
        ]
      }
    ]

    const tabs = [
      {
        name: 'info',
        label: 'Information',
        content: <div>
          <Form fields={fields} defaults={club} onSubmit={this.submit} />
        </div>
      },
      {
        name: 'member',
        label: 'Membership',
        content: <div>
          <table className='table is-fullwidth'>
            <thead>
              <tr>
                <th>Name</th>
                <th>Title (Permissions)</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {club && club.members.length ? club.members.map((a) => <tr key={a.username}>
                <td>{a.name}</td>
                <td>{a.title} ({getRoleDisplay(a.role)})</td>
                <td>{a.email}</td>
                <td className='buttons'>
                  <button className='button is-small is-primary'>
                    <i className='fa fa-fw fa-edit'></i> Edit
                  </button>
                  <button className='button is-small is-danger' onClick={() => this.deleteMembership(a.username)}>
                    <i className='fa fa-fw fa-times'></i> Kick
                  </button>
                </td>
              </tr>) : <tr><td colSpan='4' className='has-text-grey'>There are no members in this club.</td></tr>}
            </tbody>
          </table>
          {invites && !!invites.length && <div className='card' style={{ marginBottom: 20 }}>
            <div className='card-header'>
              <p className='card-header-title'>Pending Invites ({ invites.length })</p>
            </div>
            <div className='card-content'>
              <table className='table is-fullwidth'>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invites.map((item) => <tr key={item.email}>
                    <td>{item.email}</td>
                    <td>
                      <button className='button is-small is-danger' onClick={() => this.deleteInvite(item.id)}><i className='fa fa-fw fa-times'></i> Remove</button>
                    </td>
                  </tr>)}
                </tbody>
              </table>
            </div>
          </div>}
          <div className='card'>
            <div className='card-header'>
              <p className='card-header-title'>Invite Members</p>
            </div>
            <div className='card-content'>
              <p>Enter an email address or a list of email addresses separated by commas or newlines in the box below. All emails listed will be sent an invite to join the club. The invite process will go more smoothly if you use Penn email addresses, but normal email addresses will work provided that the recipient has a PennKey account. We will not send an invite if the account associated with an email is already in the club.</p>
              <br />
              <textarea value={this.state.inviteEmails} onChange={(e) => this.setState({ inviteEmails: e.target.value })} className='textarea' placeholder='Enter email addresses here!'></textarea>
              <br />
              <button className='button is-primary' onClick={this.sendInvites}><i className='fa fa-fw fa-envelope' style={{ marginRight: 5 }}></i> Send Invite(s)</button>
            </div>
          </div>
        </div>,
        disabled: !this.state.isEdit
      },
      {
        name: 'events',
        label: 'Events',
        disabled: !this.state.isEdit,
        content: <div>
          Coming Soon!
        </div>
      },
      {
        name: 'qa',
        label: 'Q & A',
        disabled: !this.state.isEdit,
        content: <div>
          Coming Soon!
        </div>
      },
      {
        name: 'files',
        label: 'Files',
        disabled: !this.state.isEdit,
        content: <div>
          Coming Soon!
        </div>
      },
      {
        name: 'settings',
        label: 'Settings',
        content: <div>
          <div className='card' style={{ marginBottom: 20 }}>
            <div className='card-header'>
              <p className='card-header-title'>{club && club.active ? 'Deactivate' : 'Reactivate'} Club</p>
            </div>
            <div className='card-content'>
              {club && club.active
                ? <p>Mark this organization as inactive. This will hide the club from various listings and indicate to the public that the club is no longer active.</p>
                : <p>Reactivate this club, indicating to the public that this club is currently active and running.</p>}
              <p>Only owners of the organization may perform this action.</p>
              <br />
              <div className='buttons'>
                <a className={'button is-medium ' + (club && club.active ? 'is-danger' : 'is-success')} onClick={() => this.toggleClubActive()}>
                  {club && club.active ? <span><i className="fa fa-fw fa-bomb"></i> Deactivate</span> : <span><i className="fa fa-fw fa-plus"></i> Reactivate</span>}
                </a>
              </div>
            </div>
          </div>
          <div className='card'>
            <div className='card-header'>
              <p className='card-header-title'>Delete Club</p>
            </div>
            <div className='card-content'>
              <p>Remove this club entry from Penn Clubs. <b className='has-text-danger'>This action is permanant and irreversible!</b> All club history and membership information will be permanantly lost. In almost all cases, you want to deactivate this club instead.</p>
              <br />
              <div className='buttons'>
                {club && !club.active ? <a className='button is-danger is-medium' onClick={() => this.deleteClub()}>
                  <i className="fa fa-fw fa-bomb"></i> Delete Club
                </a> : <b>You must deactivate this club before enabling this button.</b>}
              </div>
            </div>
          </div>
        </div>,
        disabled: !this.state.isEdit
      }
    ]

    return (
      <div style={{ padding: '30px 50px', maxWidth: 1200, margin: '0 auto' }}>
        <h1 className='title is-size-2-desktop is-size-3-mobile'>
          <span style={{ color: CLUBS_GREY_LIGHT }}>{club ? 'Editing' : 'Creating'} Club: </span> {club ? club.name : 'New Club'}
          {(club && club.active) || !this.state.isEdit || <span style={{ color: CLUBS_RED }}>{' '}(Inactive)</span>}
          {club && <Link route='club-view' params={{ club: club.id }}>
            <a className='button is-pulled-right is-secondary is-medium' style={{ fontWeight: 'normal' }}>View Club</a>
          </Link>}
        </h1>
        {this.state.message && <div className="notification is-primary">
          <button className="delete" onClick={() => this.setState({ message: null })}></button>
          {this.state.message}
        </div>}
        <TabView tabs={tabs} />
      </div>
    )
  }
}

ClubForm.getInitialProps = async({ query }) => {
  const tagsRequest = await doApiRequest('/tags/?format=json')
  const tagsResponse = await tagsRequest.json()
  return { club_id: query.club, tags: tagsResponse }
}

export default renderPage(ClubForm)
