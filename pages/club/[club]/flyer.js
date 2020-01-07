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
`

const PrintPage = s.div`
  margin: 0px;
  padding: 0px;
  width: 11in;
  height: 8in;
  clear: both;
  background-color: white;
  border: 1px solid #ccc;
  display: flex;

  @page {
    size: letter landscape;
  }
`

const Flyer = ({ authenticated, query, userInfo, favorites, updateFavorites, subscriptions, updateSubscriptions }) => {
  const [club, setClub] = useState(null)

  useEffect(() => {
    doApiRequest(`/clubs/${query.club}/?format=json`)
      .then(resp => resp.json())
      .then(data => setClub(data))
  }, [query])

  if (!club) return null
  if (!club.code) {
    return (
      <Container>
        <div className="has-text-centered">
          <Title>404 Not Found</Title>
          <Text>The club you are looking for does not exist.</Text>
        </div>
      </Container>
    )
  }

  const { image_url: image } = club

  return (
    <>
      <Head />
      <PrintPage>
        <div className="columns is-mobile">
          <div className="column">
            <CenterContainer>
              <Margin>
                {image && <Image src={image} />}
                <BigTitle>{club.name}</BigTitle>
                <Text>{club.description}</Text>
              </Margin>
            </CenterContainer>
          </div>
          <div className="column">
            <Gradient>
              <Center>
                <Title style={{ color: WHITE }}>For more info, or to bookmark or subscribe to the {club.name} mailing list:</Title>
                <Image src={getApiUrl(`/clubs/${club.code}/qr/`)} style={{ width: 400, height: 400 }} />
                <Text style={{ color: WHITE }}>Or visit:<br /><i>https://pennclubs.com/club/{club.code}/fair/</i></Text>
              </Center>
            </Gradient>
          </div>
        </div>
      </PrintPage>
    </>
  )
}

Flyer.getInitialProps = async ({ query }) => {
  return { query }
}

export default Flyer
