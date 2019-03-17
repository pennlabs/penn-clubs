import fetch from 'isomorphic-unfetch'
import React from 'react'
import Select from 'react-select'
import PropTypes from 'prop-types'
import Header from '../components/Header'
import Footer from '../components/Footer'


class Splash extends React.Component {
  constructor() {
    super()
    this.state = {
      size: [],
      type: [],
      name: '',
      clubs: []
    }
    console.log(this.props)
  }

  static async getInitialProps() {
    const clubRequest = await fetch('https://clubs.pennlabs.org/clubs')
    const clubResponse = await clubRequest.json()
    return { clubs: clubResponse }
  }

  filterSize(size) {
    const clubs = this.state.clubs
    this.setState({ size })
    clubs.filter(club => club.size == size);
  }

  render() {
    console.log(this.state)
    const {
      clubs,
      size,
      type,
      name,
    } = this.state
    const sizeOptions = [
      { value: 'small', label: 'less than 20 members' },
      { value: 'mid', label: '20 to 50 members' },
      { value: 'large', label: 'more than 50 members' }]
    const typeOptions = [
      { value: 'engineering', label: 'Engineering' },
      { value: 'business', label: 'Business' },
      { value: 'food', label: 'Food' },
      { value: 'service', label: 'Community Service' },
      { value: 'cultural', label: 'Cultural' },
      { value: 'performingarts', label: 'Performing Arts' }]
    return (
      <div>
        <Header />
        <div className="container">
          <input
            placeholder="Start your club search."
            style={{
              width: '100%',
              padding: '.5rem',
              fontSize: '1rem',
              fontWeight: '400',
              marginTop: '0.5rem',
              borderRadius: '5px',
              border: '1px solid #cccccc',
            }}
            type="text"
            value={name}
            onChange={e => this.setState({ name: e.value })}
            />
          <Select
            closeOnSelect={false}
            value={size}
            options={sizeOptions}
            onChange={size => this.setState({ size })}
            isMulti
            placeholder="Any Size"
            simpleValue
          />
          <Select
            closeOnSelect={false}
            value={type}
            options={typeOptions}
            onChange={type => this.setState({ type })}
            isMulti
            placeholder="Any Type"
            simpleValue
          />
          <br />
          <p style={{ marginTop: '1rem', marginBottom: '0.3rem' }}>
            Filter by:
            <a href="/"><span style={{ marginLeft: '0.5rem', marginRight: '0.5rem' }} className="badge badge-secondary">General Membership</span></a>
            <a href="/"><span style={{ marginRight: '0.5rem' }} className="badge badge-secondary">Open Applications</span></a>
            <a href="/"><span style={{ marginRight: '0.5rem' }} className="badge badge-secondary">Recently Founded</span></a>
          </p>
          <div>
            { clubs.map(club => (
              <a href={`/club?club=${club.id}`} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ width: '80%' }}>
                  <div className="card-body">
                    <h5 className="card-title">{club.name}</h5>
                    <h6 className="card-subtitle mb-2 text-muted">{club.subtitle}</h6>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    )
  }
}

Splash.propTypes = {
  clubs: PropTypes.shape({
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
  }).isRequired,
  tags: PropTypes.shape({
    name: PropTypes.string.isRequired,
    link: PropTypes.string.isRequired,
  }).isRequired,
}

export default Splash
