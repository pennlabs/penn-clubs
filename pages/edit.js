import renderPage from '../renderPage.js'
import { doApiRequest, titleize, getRoleDisplay } from '../utils'
import { CLUBS_GREY_LIGHT } from '../colors'
import { Link, Router } from '../routes'
import React from 'react'
import Form from '../components/Form'

class ClubForm extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      currentTab: 'info',
      club: null,
      isEdit: typeof this.props.club_id !== 'undefined'
    }
    this.submit = this.submit.bind(this)
    this.notify = this.notify.bind(this)
  }

  notify(msg) {
    this.setState({
      message: msg
    }, () => window.scrollTo(0, 0))
  }

  submit(data) {
    var req = null
    if (this.state.isEdit) {
      req = doApiRequest(`/clubs/${this.props.club_id}/?format=json`, {
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
        if (this.state.isEdit) {
          this.notify('Club has been successfully saved.')
        } else {
          resp.json().then((info) => {
            Router.pushRoute('club-view', { club: info.id })
          })
        }
      } else {
        resp.json().then((err) => {
          this.notify(Object.keys(err).map((a) => <div key={a}><b>{titleize(a)}:</b> {err[a]}</div>))
        })
      }
    })
  }

  componentDidMount() {
    if (this.state.isEdit) {
      doApiRequest(`/clubs/${this.props.club_id}/?format=json`)
        .then((resp) => resp.json())
        .then((data) => this.setState({
          club: data, currentTab: window.location.hash.substring(1) || this.state.currentTab
        }))
    }
  }

  render() {
    const { tags } = this.props
    const { club } = this.state

    if (this.state.isEdit && club === null) {
      return <div>Loading...</div>
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
            label: 'URL to Club Logo Image'
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
          {club && <Link route='club-view' params={{ club: club.id }}>
            <a className='button is-pulled-right is-secondary is-medium'>View Club</a>
          </Link>}
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
              </tr>
            </thead>
            <tbody>
              {club && club.members && club.members.map((a) => <tr key={a.username}><td>{a.name}</td><td>{a.title} ({getRoleDisplay(a.role)})</td><td>{a.email}</td></tr>)}
            </tbody>
          </table>
        </div>,
        disabled: !this.state.isEdit
      },
      {
        name: 'settings',
        label: 'Settings',
        content: <div>
          <div className='card'>
            <div className='card-header'>
              <p className='card-header-title'>Deactivate Club</p>
            </div>
            <div className='card-content'>
              <p>Mark an organization as inactive. This will hide the club from various parts of Penn Clubs and indicate to the public that the club is no longer active. Only owners of the organization may do this.</p>
              <p><b>Coming Soon!</b></p>
              <br />
              <div className='buttons'>
                <a className='button is-danger is-medium' disabled={true}><i className="fa fa-fw fa-bomb"></i>{' '}Deactivate</a>
              </div>
            </div>
          </div>
        </div>,
        disabled: !this.state.isEdit
      }
    ]

    return (
      <div style={{ padding: '30px 50px' }}>
        <h1 className='title is-size-2-desktop is-size-3-mobile'><span style={{ color: CLUBS_GREY_LIGHT }}>{club ? 'Editing' : 'Creating'} Club: </span> {club ? club.name : 'New Club'}</h1>
        {this.state.message && <div className="notification is-primary">{this.state.message}</div>}
        <div className='tabs'>
          <ul>
            {tabs.filter((a) => !a.disabled).map((a) => <li className={a.name === this.state.currentTab ? 'is-active' : undefined} key={a.name}><a onClick={() => {
              this.setState({ currentTab: a.name })
              window.location.hash = "#" + a.name
            }}>{a.label}</a></li>)}
          </ul>
        </div>
        {tabs.filter((a) => a.name === this.state.currentTab)[0].content}
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
