import renderPage from '../../../renderPage'
import { doApiRequest } from '../../../utils'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Title, Loading, WideContainer, Icon } from '../../../components/common'
import s from 'styled-components'

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

const OrgChild = ({ name, code, children, isParent }) => {
  return (
    <OrgChildWrapper>
      <div className="entry">
        {(!children || !children.length) && (
          <>
            <Icon name={children ? 'leaf' : 'refresh'} alt="leaf" />{' '}
          </>
        )}
        {!isParent ? (
          <Link href="/club/[club]/org" as={`/club/${code}/org`}>
            <a>{name}</a>
          </Link>
        ) : (
          name
        )}
        <Link href="/club/[club]" as={`/club/${code}`}>
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
      .then(res => res.json())
      .then(res => {
        setChildren(res)
      })

    doApiRequest(`/clubs/${query.club}/parents/?format=json`)
      .then(res => res.json())
      .then(res => {
        setParents(res)
      })
  }, [query])

  return (
    <WideContainer>
      <Title>{club.name}</Title>
      <hr />
      <Subtitle>Children of {club.name}</Subtitle>
      {children ? <OrgChild isParent={true} {...children} /> : <Loading />}
      <Subtitle>Parents of {club.name}</Subtitle>
      {parents ? <OrgChild isParent={true} {...parents} /> : <Loading />}
    </WideContainer>
  )
}

Organization.getInitialProps = async ({ query }) => {
  const clubReq = await doApiRequest(`/clubs/${query.club}/?format=json`)
  const clubRes = await clubReq.json()

  return { query, club: clubRes }
}

export default renderPage(Organization)
