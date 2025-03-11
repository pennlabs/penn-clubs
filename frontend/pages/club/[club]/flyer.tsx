import { Center, Container, Metadata, Text, Title } from 'components/common'
import { NextPageContext } from 'next'
import { ReactElement, useEffect, useState } from 'react'
import styled from 'styled-components'
import { Club } from 'types'
import { doApiRequest, getApiUrl } from 'utils'
import { DOMAIN, OBJECT_URL_SLUG } from 'utils/branding'

import { CLUBS_NAVY } from '~/constants/colors'

const Image = styled.img`
  padding: 0;
  margin: 0;
  object-fit: contain;
`

const LogoImage = styled(Image)`
  max-height: 500px;
`

const ErrorPane = styled.div`
  position: fixed;
  top: 15px;
  right: 15px;
  padding: 15px;
  background-color: rgba(255, 132, 153, 0.95);
  z-index: 1;
  overflow-y: auto;
  max-height: 300px;
  @media print {
    visibility: hidden;
  }
  & ul {
    list-style-type: circle;
    padding-left: 30px;
  }
`

const BigTitle = styled.h1`
  font-size: 50px;
  font-weight: 600;
  margin-top: 1rem;
  margin-bottom: 1rem;
  color: ${CLUBS_NAVY};
`

const MediumTitle = styled.h2`
  font-size: 32px;
  font-weight: 500;
  color: ${CLUBS_NAVY};
`

const Gradient = styled.div`
  width: 370px;
  height: 370px;
  padding: 1.5rem;
  margin: 1rem auto;
`

const Margin = styled.div`
  margin: 4rem;
`

const CenterContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
`

const PrintPage = styled.div`
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
  position: relative;

  page-break-after: always;

  @page {
    size: letter landscape;
  }
`

const AboutText = styled.div`
  position: absolute;
  bottom: 7px;
  right: 7px;
  font-size: 0.7em;
  color: #aaa;
  -webkit-print-color-adjust: exact;
`

const truncate = (str: string, len = 54): string => {
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
    if (smallParenString.length <= len + 3) {
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
  const suffixMatch = /^(.*)\s*at the University of Pennsylvania\s*$/i.exec(str)
  if (suffixMatch) {
    const smallString = suffixMatch[1]
    if (smallString.length <= len + 3) {
      return smallString
    }
  }

  return `${str.substring(0, len)}...`
}

const Flyer = ({ club }: { club: string }): ReactElement<any> => {
  const [clubs, setClubs] = useState<Club[] | null>(null)
  const [count, setCount] = useState<number>(0)
  const [failedClubs, setFailedClubs] = useState<string[]>([])
  const [showErrorPane, setShowErrorPane] = useState<boolean>(false)

  useEffect(() => {
    const fetchClub = (club, tries): Promise<Club | null> => {
      const url = `/clubs/${club}/?format=json`
      return doApiRequest(url, {
        referrerPolicy: 'no-referrer',
        cache: tries === 1 ? 'reload' : 'default',
      }).then((resp): Promise<Club | null> | null => {
        if (resp.ok) {
          setCount((prevCount) => prevCount + 1)
          return resp.json()
        } else if (resp.status === 502 && tries > 0) {
          // If we get a Gateway Timeout, wait a while and try one more time
          return new Promise((resolve) => {
            setTimeout(resolve.bind(null), 5000 * Math.random())
          }).then(() => fetchClub(club, tries - 1))
        } else {
          setCount((prevCount) => prevCount + 1)
          setFailedClubs((prevFailed) => prevFailed.concat(club))
          return null
        }
      })
    }

    Promise.all(club.split(',').map((c) => fetchClub(c, 3))).then((clubs) =>
      setClubs(clubs.filter((c) => c != null) as Club[]),
    )
  }, [club])

  const totalClubCount = club.split(',').length

  if (clubs === null) {
    return (
      <Container>
        <div className="has-text-centered">
          <Title>Loading...</Title>
          <Text>
            Loading club flyer(s){' '}
            <i>
              ({count}/{totalClubCount}, {failedClubs.length} failed)
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
      <Metadata />
      {!!failedClubs.length && (
        <ErrorPane onClick={() => setShowErrorPane((val) => !val)}>
          {showErrorPane ? (
            <>
              <b>Failed to load clubs:</b>
              <ul>
                {failedClubs.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </>
          ) : (
            <b>Failed to load {failedClubs.length} club(s)</b>
          )}
        </ErrorPane>
      )}
      {clubs.map((club) => {
        if (club === null) {
          return null
        }
        const { image_url: image } = club
        return (
          <PrintPage key={club.code}>
            <div className="columns is-mobile is-marginless">
              <div className="column is-paddingless">
                <CenterContainer>
                  <Margin>
                    {image && <LogoImage src={image} />}
                    <BigTitle>{truncate(club.name, image ? 52 : 100)}</BigTitle>
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
                      <Text style={{ color: CLUBS_NAVY }}>
                        <b>Or visit:</b>
                        <br />
                        <i>
                          https://{DOMAIN}/{OBJECT_URL_SLUG}/{club.code}
                          /fair/
                        </i>
                      </Text>
                    </Center>
                  </Margin>
                </CenterContainer>
              </div>
            </div>
            <AboutText>Powered by Penn Labs</AboutText>
          </PrintPage>
        )
      })}
    </>
  )
}

Flyer.getInitialProps = async ({
  query,
}: NextPageContext): Promise<{ club: string }> => {
  return { club: typeof query.club === 'string' ? query.club : '' }
}

export default Flyer
