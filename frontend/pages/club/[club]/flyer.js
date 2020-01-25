import { useState, useEffect } from 'react'
import s from 'styled-components'

import { doApiRequest, getApiUrl } from '../../../utils'
import Head from '../../../components/Header/Head'
import { Title, Text, Container, Center } from '../../../components/common'
import { FLYER_BLUE, FLYER_NAVY, FLYER_PINK } from '../../../constants/colors'

const Image = s.img`
  padding: 0;
  margin: 0;
  object-fit: contain;
`

const LogoImage = s(Image)`
  max-height: 500px;
`

const ErrorPane = s.div`
  position: fixed;
  top: 15px;
  right: 15px;
  padding: 15px;
  background-color: rgba(255, 132, 153, 0.95);
  @media print {
    visibility: hidden;
  }
  & ul {
    list-style-type: circle;
    padding-left: 30px;
  }
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
  overflow: hidden;

  page-break-after: always;

  @page {
    size: letter landscape;
  }
`

const truncate = (str, len = 54) => {
  if (str.length <= len + 3) {
    return str
  }

  // take words before or in parentheses if too long
  const parenMatch = /^(.*)\s*\((.*)\)\s*$/.exec(str)
  if (parenMatch) {
    const smallString = parenMatch[1]
    if (smallString.length <= len + 3) {
      return smallString
    }
    const smallParenString = parenMatch[2]
    if (smallParenString <= len + 3) {
      return smallParenString
    }
  }

  // remove prefix if exists and string too long
  const prefixMatch = /^University of Pennsylvania\s*(.*)\s*$/i.exec(str)
  if (prefixMatch) {
    const smallString = prefixMatch[1]
    if (smallString.length <= len + 3) {
      return smallString
    }
  }

  // remove suffix if it exists and string is too long
  const suffixMatch = /^(.*)\s*at the University of Pennsylvania$/i.exec(str)
  if (suffixMatch) {
    const smallString = prefixMatch[1]
    if (smallString.length <= len + 3) {
      return smallString
    }
  }

  return `${str.substring(0, len)}...`
}

const Flyer = ({
  authenticated,
  query,
  userInfo,
  favorites,
  updateFavorites,
  subscriptions,
  updateSubscriptions,
}) => {
  const [clubs, setClubs] = useState(null)
  const [count, setCount] = useState(0)
  const [failedClubs, setFailedClubs] = useState([])

  useEffect(() => {
    const fetchClub = (club, tries) => {
      const url = `/clubs/${club}/?format=json`
      return doApiRequest(url).then(resp => {
        if (resp.ok) {
          setCount(prevCount => prevCount + 1)
          return resp.json()
        } else if (resp.status === 502 && tries > 0) {
          // If we get a Gateway Timeout, wait a while and try one more time
          return new Promise(resolve => {
            setTimeout(resolve.bind(null), 5000 * Math.random())
          }).then(() => fetchClub(club, tries - 1))
        } else {
          setCount(prevCount => prevCount + 1)
          setFailedClubs(prevFailed => prevFailed.concat(club))
          return null
        }
      })
    }

    Promise.all(query.club.split(',').map(c => fetchClub(c, 3))).then(setClubs)
  }, [query])

  const totalClubCount = query.club.split(',').length

  if (clubs === null) {
    return (
      <Container>
        <div className="has-text-centered">
          <Title>Loading...</Title>
          <Text>
            Loading club flyer(s){' '}
            <i>
              ({count}/{totalClubCount})
            </i>
            ...
          </Text>
          <progress
            className="progress"
            value={count}
            max={totalClubCount}
          ></progress>
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
      {!!failedClubs.length && (
        <ErrorPane>
          <b>Failed to load clubs:</b>
          <ul>
            {failedClubs.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </ErrorPane>
      )}
      {clubs.map(club => {
        if (club === null) {
          return null
        }
        const { image_url: image } = club
        return (
          <>
            <PrintPage>
              <div className="columns is-mobile is-marginless">
                <div className="column is-paddingless">
                  <CenterContainer>
                    <Margin>
                      {image && <LogoImage src={image} />}
                      <BigTitle>
                        {truncate(club.name, image ? 52 : 100)}
                      </BigTitle>
                    </Margin>
                  </CenterContainer>
                </div>
                <div className="column is-paddingless">
                  <CenterContainer>
                    <Margin>
                      <Center>
                        <MediumTitle>
                          For more info, or to bookmark or subscribe to the{' '}
                          {truncate(club.name)} mailing list:
                        </MediumTitle>
                        <Gradient>
                          <Image src={getApiUrl(`/clubs/${club.code}/qr/`)} />
                        </Gradient>
                        <Text style={{ color: FLYER_NAVY }}>
                          <b>Or visit:</b>
                          <br />
                          <i>https://pennclubs.com/club/{club.code}/fair/</i>
                        </Text>
                      </Center>
                    </Margin>
                  </CenterContainer>
                </div>
              </div>
            </PrintPage>
          </>
        )
      })}
    </>
  )
}

Flyer.getInitialProps = async ({ query }) => {
  return { query }
}

export default Flyer
