import { ReactElement } from 'react'
import s from 'styled-components'

import { Container, Metadata, Title } from '../components/common'
import { WHITE } from '../constants/colors'
import renderPage from '../renderPage'
import { Club } from '../types'
import { doApiRequest } from '../utils'

type Props = {
  clubs: Club[]
}

const DirectoryList = s.ul`
  list-style-type: circle;
  -webkit-column-count: 2;
  -moz-column-count: 2;
  column-count: 2;

  & li {
    margin-bottom: 8px;
  }
`

const Directory = ({ clubs }: Props): ReactElement => {
  return (
    <>
      <Container background={WHITE}>
        <Metadata title="Clubs Directory" />
        <Title style={{ paddingTop: '2.5vw', paddingBottom: '2rem' }}>
          Clubs Directory
        </Title>
        <DirectoryList>
          {clubs.map((club) => (
            <li key={club.code}>{club.name}</li>
          ))}
        </DirectoryList>
      </Container>
    </>
  )
}

Directory.getInitialProps = async () => {
  const request = await doApiRequest(
    '/clubs/?bypass=true&ordering=name&format=json',
  )
  const response = await request.json()

  return { clubs: response }
}

export default renderPage(Directory)
