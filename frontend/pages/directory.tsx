import { ReactElement } from 'react'

import { Container, Metadata, Title } from '../components/common'
import { WHITE } from '../constants/colors'
import renderPage from '../renderPage'
import { Club } from '../types'
import { doApiRequest } from '../utils'

type Props = {
  clubs: Club[]
}

const Directory = ({ clubs }: Props): ReactElement => {
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
          {clubs.map((club) => (
            <li style={{ 'margin-bottom': '8px' }} key={club.code}>
              {club.name}
            </li>
          ))}
        </ul>
      </Container>
    </>
  )
}

Directory.getInitialProps = async () => {
  const request = await doApiRequest('/clubs/?bypass=true&format=json')
  const response = await request.json()

  return { clubs: response }
}

export default renderPage(Directory)
