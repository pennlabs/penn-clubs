import { useState, useEffect } from 'react'
import s from 'styled-components'

import { doApiRequest, getApiUrl } from '../../../utils'
import Head from '../../../components/Header/Head'
import {
  Title,
  Text,
  Container,
} from '../../../components/common'
import { WHITE, FLYER_BLUE, FLYER_NAVY } from '../../../constants/colors'

const Image = s.img`
  height: 86px;
  width: auto;
  max-width: 242px;
  margin-right: 1rem;
  object-fit: contain;
`

const BigTitle = s.h1`
  font-size: 50px;
  font-weight: 600;
  margin-top: 1rem;
  margin-bottom: 1rem;
  color: ${FLYER_NAVY};
`

const Center = s.div`
  text-align: center;
`

const Gradient = s.div`
  width: 100%;
  height: 100%;
  background-image: linear-gradient(to bottom, ${FLYER_BLUE}, ${FLYER_NAVY});
  -webkit-print-color-adjust: exact;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
`

const Margin = s.div`
  margin: 4rem;
`

const CenterContainer = s.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ccc;
  border-right: none;
`

const PrintPage = s.div`
  margin: 3rem auto;
  @media print {
    margin: 0px;
    padding: 0px;
  }
  width: 11in;
  height: 8in;
  clear: both;
  background-color: white;
  display: flex;

  page-break-after: always;

  @page {
    size: letter landscape;
  }
`

const Flyer = ({ authenticated, query, userInfo, favorites, updateFavorites, subscriptions, updateSubscriptions }) => {
  const [clubs, setClubs] = useState(null)

  useEffect(() => {
    Promise.all(query.club.split(',').map(club => {
      return doApiRequest(`/clubs/${club}/?format=json`).then(resp => resp.json())
    })).then(setClubs)
  }, [query])

  if (clubs === null) {
    return (
      <Container>
        <div className="has-text-centered">
          <Title>Loading...</Title>
          <Text>Loading club flyer(s)...</Text>
        </div>
      </Container>
    )
  }

  if (!clubs.length) {
    return (
      <Container>
        <div className="has-text-centered">
          <Title>404 Not Found</Title>
          <Text>The club you are looking for does not exist.</Text>
        </div>
      </Container>
    )
  }

  return (
    <>
      <Head />
      {clubs.map(club => {
        const { image_url: image } = club
        return (<>
          <PrintPage>
            <div className="columns is-mobile is-marginless">
              <div className="column is-paddingless">
                <CenterContainer>
                  <Margin>
                    {image && <Image src={image} />}
                    <BigTitle>{club.name}</BigTitle>
                    <Text>{club.description}</Text>
                  </Margin>
                </CenterContainer>
              </div>
              <div className="column is-paddingless">
                <Gradient>
                  <Center>
                    <Title style={{ color: WHITE }}>For more info, or to bookmark or subscribe to the {club.name} mailing list:</Title>
                    <Image src={getApiUrl(`/clubs/${club.code}/qr/`)} style={{ height: 400, marginRight: 0 }} />
                    <Text style={{ color: WHITE }}>Or visit:<br /><i>https://pennclubs.com/club/{club.code}/fair/</i></Text>
                  </Center>
                </Gradient>
              </div>
            </div>
          </PrintPage>
        </>)
      })}
    </>
  )
}

Flyer.getInitialProps = async ({ query }) => {
  return { query }
}

export default Flyer
