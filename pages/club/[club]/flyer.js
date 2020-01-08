import { useState, useEffect } from 'react'
import s from 'styled-components'

import { doApiRequest, getApiUrl } from '../../../utils'
import Head from '../../../components/Header/Head'
import {
  Title,
  Text,
  Container,
} from '../../../components/common'
import { FLYER_BLUE, FLYER_NAVY, FLYER_PINK } from '../../../constants/colors'

const Image = s.img`
  padding: 0;
  margin: 0;
  object-fit: contain;
`

const BigTitle = s.h1`
  font-size: 50px;
  font-weight: 600;
  margin-top: 1rem;
  margin-bottom: 1rem;
  color: ${FLYER_NAVY};
`

const MediumTitle = s.h2`
  font-size: 32px;
  font-weight: 500;
  color: ${FLYER_NAVY};
`

const Center = s.div`
  text-align: center;
`

const Gradient = s.div`
  width: 370px;
  height: 370px;
  background-image: linear-gradient(to bottom, ${FLYER_BLUE}, ${FLYER_PINK});
  -webkit-print-color-adjust: exact;
  padding: 1.5rem;
  margin: 1rem auto;
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
  text-align: center;
`

const PrintPage = s.div`
  margin: 3rem auto;
  @media print {
    margin: 0px;
    padding: 0px;
  }
  border: 1px solid #ccc;
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
                  </Margin>
                </CenterContainer>
              </div>
              <div className="column is-paddingless">
                <CenterContainer>
                  <Margin>
                    <Center>
                      <MediumTitle>For more info, or to bookmark or subscribe to the {club.name} mailing list:</MediumTitle>
                      <Gradient>
                        <Image src={getApiUrl(`/clubs/${club.code}/qr/`)} />
                      </Gradient>
                      <Text style={{ color: FLYER_NAVY }}><b>Or visit:</b><br /><i>https://pennclubs.com/club/{club.code}/fair/</i></Text>
                    </Center>
                  </Margin>
                </CenterContainer>
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
