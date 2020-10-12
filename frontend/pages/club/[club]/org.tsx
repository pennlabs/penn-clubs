import { NextPageContext } from 'next'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import s from 'styled-components'

import ClubMetadata from '../../../components/ClubMetadata'
import { Icon, Loading, Title, WideContainer } from '../../../components/common'
import { CLUB_ORG_ROUTE, CLUB_ROUTE } from '../../../constants'
import renderPage from '../../../renderPage'
import { doApiRequest } from '../../../utils'

const Subtitle = s(Title)`
  font-size: 1.5em;
  font-weight: normal;
  margin-top: 1em;
  margin-bottom: 0.5em;
`

const OrgChildWrapper = s.div`
  margin-left: 1em;

  & .entry {
    display: block;
    border-radius: 3px;
    border: 1px solid #ccc;
    margin-bottom: 0.5em;
    padding: 5px 8px;
  }

  & .entry a {
    vertical-align: middle;
  }

  & .entry:hover {
    background-color: #eee;  
  }
`

const ErrorText = s.p`
  color: red;
`

const OrgChild = ({ name, code, children, isParent, detail }) => {
  if (detail) {
    return <ErrorText>{detail}</ErrorText>
  }

  return (
    <OrgChildWrapper>
      <div className="entry">
        {(!children || !children.length) && (
          <>
            <Icon name={children ? 'leaf' : 'refresh'} alt="leaf" />{' '}
          </>
        )}
        {!isParent ? (
          <Link href={CLUB_ORG_ROUTE()} as={CLUB_ORG_ROUTE(code)}>
            <a>{name}</a>
          </Link>
        ) : (
          name
        )}
        <Link href={CLUB_ROUTE()} as={CLUB_ROUTE(code)}>
          <a target="_blank" className="is-pulled-right">
            <Icon name="external-link" alt="view" />
          </a>
        </Link>
      </div>
      {children && children.map((a, i) => <OrgChild key={i} {...a} />)}
    </OrgChildWrapper>
  )
}

const Organization = ({ query, club }) => {
  const [children, setChildren] = useState(null)
  const [parents, setParents] = useState(null)

  useEffect(() => {
    doApiRequest(`/clubs/${query.club}/children/?format=json`)
      .then((res) => res.json())
      .then((res) => {
        setChildren(res)
      })

    doApiRequest(`/clubs/${query.club}/parents/?format=json`)
      .then((res) => res.json())
      .then((res) => {
        setParents(res)
      })
  }, [query])

  return (
    <>
      <ClubMetadata club={club} />
      <WideContainer>
        <div className="is-clearfix">
          <Title className="is-pulled-left">{club.name}</Title>
          <Link href={CLUB_ROUTE()} as={CLUB_ROUTE(club.code)}>
            <a className="button is-pulled-right is-secondary is-medium">
              Back
            </a>
          </Link>
        </div>
        <hr />
        <Subtitle>Children of {club.name}</Subtitle>
        {children ? <OrgChild isParent={true} {...children} /> : <Loading />}
        <Subtitle>Parents of {club.name}</Subtitle>
        {parents ? <OrgChild isParent={true} {...parents} /> : <Loading />}
      </WideContainer>
    </>
  )
}

Organization.getInitialProps = async ({ query, req }: NextPageContext) => {
  const data = {
    headers: req ? { cookie: req.headers.cookie } : undefined,
  }
  const clubReq = await doApiRequest(`/clubs/${query.club}/?format=json`, data)
  const clubRes = await clubReq.json()

  return { query, club: clubRes }
}

export default renderPage(Organization)
