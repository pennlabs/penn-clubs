import fetch from 'isomorphic-unfetch'
import renderPage from '../renderPage.js'
import { CLUBS_GREY, CLUBS_BLUE, CLUBS_GREY_LIGHT } from '../colors'
import { getDefaultClubImageURL, getSizeDisplay, doApiRequest, ROLE_OFFICER, EMPTY_DESCRIPTION } from '../utils'
import React from 'react'
import { Link } from '../routes'
import TabView from '../components/TabView'

class Club extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      club: null
    }
  }

  componentDidMount() {
    doApiRequest(`/clubs/${this.props.query.club}/?format=json`)
      .then((resp) => resp.json())
      .then((data) => this.setState({ club: data }))
  }

  render() {
    const { club } = this.state
    const { userInfo } = this.props

    if (!club) {
      return <div />
    }

    if (!club.id) {
      return <div className='has-text-centered' style={{ margin: 30 }}>
        <h1 className='title is-h1'>404 Not Found</h1>
        <p>The club you are looking for does not exist.</p>
      </div>
    }

    const inClub = userInfo && (userInfo.membership_set.filter((a) => a.id === club.id) || [false])[0]
    const canEdit = (inClub && inClub.role <= ROLE_OFFICER) || (userInfo && userInfo.is_superuser)

    return (
      <div style={{ padding: '30px 50px' }}>
        <div className="is-flex" style={{ justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center', paddingRight: 10 }}>
          <h1 className='title is-size-1-desktop is-size-3-mobile' style={{ color: CLUBS_GREY, marginBottom: 10 }} >
            {club.name} {club.active || <span className='has-text-grey'>(Inactive)</span>}
          </h1>
          <span style={{ fontSize: '1.5em' }}>
            {club.favorite_count} <i className={(this.props.favorites.includes(club.id) ? 'fa' : 'far') + ' fa-heart'} style={{ cursor: 'pointer' }} onClick={() => this.props.updateFavorites(club.id) ? club.favorite_count++ : club.favorite_count--}></i>
            {canEdit && <Link route='club-edit' params={{ club: club.id }}><a className='button is-success' style={{ marginLeft: 15 }}>Edit Club</a></Link>}
          </span>
        </div>
        <div style={{ marginBottom: 20 }}>
          {club.tags.map(tag => <span key={tag.id} className="tag is-rounded" style={{ backgroundColor: CLUBS_BLUE, color: '#fff', margin: 3 }}>{tag.name}</span>)}
        </div>
        <div className="columns">
          <div className="column is-6">
            <img src={club.image_url || getDefaultClubImageURL()} style={{ width: '100%', maxHeight: 600, borderRadius: 3, marginBottom: 10, objectFit: 'contain' }}/>
            <div className="columns">
              <div className="column is-6" style={{ backgroundColor: '#f2f2f2', borderRadius: 3, margin: '5px 5px 5px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <b className="is-size-6 is-size-7-mobile"> Membership </b>
                  <span className="tag is-rounded has-text-dark" style={{ backgroundColor: '#ccc', color: '#fff', fontSize: '.7rem', margin: 2 }}>{getSizeDisplay(club.size)} </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <b className="is-size-6"> Requires Application </b>
                  <span className="tag is-rounded has-text-dark" style={{ backgroundColor: '#ccc', color: '#fff', fontSize: '.7rem', margin: 2 }}>{club.application_required ? 'Yes' : 'No'} </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <b className="is-size-6"> Currently Recruiting </b>
                  <span className="tag is-rounded has-text-dark" style={{ backgroundColor: '#ccc', color: '#fff', fontSize: '.7rem', margin: 2 }}>{club.accepting_applications ? 'Yes' : 'No'} </span>
                </div>
              </div>
              <div className="column is-6" style={{ backgroundColor: '#f2f2f2', borderRadius: 3, margin: '5px 0 5px 5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-evenly', padding: '10px 0px 10px 0px' }}>
                  {[
                    {
                      name: 'facebook',
                      label: 'Facebook',
                      icon: 'fab fa-facebook-square'
                    },
                    {
                      name: 'email',
                      label: 'Email',
                      prefix: 'mailto:',
                      icon: 'fa fa-at'
                    },
                    {
                      name: 'website',
                      label: 'Website',
                      icon: 'fa fa-link'
                    },
                    {
                      name: 'github',
                      label: 'GitHub',
                      icon: 'fab fa-github'
                    },
                    {
                      name: 'linkedin',
                      label: 'LinkedIn',
                      icon: 'fab fa-linkedin'
                    },
                    {
                      name: 'instagram',
                      label: 'Instagram',
                      icon: 'fab fa-instagram'
                    },
                    {
                      name: 'twitter',
                      label: 'Twitter',
                      icon: 'fab fa-twitter'
                    }
                  ].map((data, idx) => {
                    data.index = idx
                    return data
                  }).sort((a, b) => {
                    if (club[a.name] && club[b.name]) {
                      return a - b
                    }
                    if (club[a.name]) {
                      return -1
                    }
                    if (club[b.name]) {
                      return 1
                    }
                    return a - b
                  }).slice(0, 3).map((item) => <div key={item.name} className="has-text-centered">
                    <a href={club[item.name] ? (item.prefix || '') + club[item.name] : undefined} style={{
                      color: club[item.name] ? CLUBS_GREY : '#ccc',
                      cursor: club[item.name] ? 'pointer' : 'inherit'
                    }}>
                      <span className="icon">
                        <i className={'fa-3x ' + item.icon} style={{ height: '100%' }}></i>
                      </span>
                      <h6>{item.label}</h6>
                    </a>
                  </div>)}
                </div>
              </div>
            </div>
          </div>
          <div className="column is-6">
            <TabView tabs={[
              {
                name: 'description',
                content: <div>
                  <div style={{ whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: club.description || EMPTY_DESCRIPTION }} />
                  {club.how_to_get_involved && <div>
                    <div style={{ marginTop: 20 }}><b>Getting Involved</b></div>
                    <div>{ club.how_to_get_involved }</div>
                  </div>}
                </div>
              },
              {
                name: 'members',
                content: <div>
                  {club.members.length ? club.members.map((a, i) => <div className='media' key={i}>
                    <div className="media-left">
                      <figure className="has-background-light image is-48x48">
                      </figure>
                    </div>
                    <div className='media-content'>
                      <p className='title is-4'>{a.name || 'No Name'}</p>
                      <p className='subtitle is-6'>{a.email ? <span><a href={'mailto:' + a.email}>{a.email}</a> ({a.title})</span> : a.title}</p>
                    </div>
                  </div>) : <p>There are no members in this club.</p>}
                </div>
              },
              {
                name: 'events',
                content: <div>Coming Soon!</div>
              },
              {
                name: 'qa',
                label: 'Q & A',
                content: <div>Coming Soon!</div>
              },
              {
                name: 'files',
                content: <div>Coming Soon!</div>
              }
            ]} />
          </div>
        </div>
      </div>
    )
  }
}

Club.getInitialProps = async(props) => {
  var { query } = props
  return { query: query }
}

export default renderPage(Club)
