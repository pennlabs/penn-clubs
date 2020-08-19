import React from 'react'

import { Container, Metadata, Title } from '../components/common'
import { WHITE } from '../constants/colors'
import renderPage from '../renderPage'
import { doApiRequest } from '../utils'

class Directory extends React.Component<unknown, { clubs: JSX.Element[] }> {
  constructor(props) {
    super(props)
    this.state = { clubs: [] }
  }

  async componentWillMount() {
    const clubsRequest = await doApiRequest('/clubs/?format=json')
    const clubsResponse = await clubsRequest.json()
    const clubsList: JSX.Element = []

    clubsResponse.forEach((club) => {
      clubsList.push(<li style={{ 'margin-bottom': '8px' }}>{club.name}</li>)
    })

    this.setState({ clubs: clubsList })
  }

  render() {
    return (
      <>
        <Container background={WHITE}>
          <Metadata title="Clubs Directory" />
          <Title style={{ paddingTop: '2.5vw', paddingBottom: '2rem' }}>
            Clubs Directory
          </Title>
          <ul
            style={{
              'list-style-type': 'circle',
              '-webkit-column-count': '2',
              '-moz-column-count': '2',
              'column-count': '2',
            }}
          >
            {this.state.clubs}
          </ul>
        </Container>
      </>
    )
  }
}

export default renderPage(Directory)
