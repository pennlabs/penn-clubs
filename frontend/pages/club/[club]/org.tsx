import ClubMetadata from 'components/ClubMetadata'
import { Container, Icon, Loading, Text, Title } from 'components/common'
import { NextPageContext } from 'next'
import Link from 'next/link'
import { ReactElement, useEffect, useState } from 'react'
import renderPage from 'renderPage'
import styled from 'styled-components'
import { Club } from 'types'
import { doApiRequest } from 'utils'
import { OBJECT_NAME_PLURAL } from 'utils/branding'

import { CLUB_ORG_ROUTE, CLUB_ROUTE, CLUBS_RED } from '~/constants'

const Subtitle = styled(Title)`
  font-size: 1.5em;
  font-weight: normal;
  margin-top: 1em;
  margin-bottom: 0.5em;
`

const OrgChildWrapper = styled.div`
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

const ErrorText = styled.p`
  color: ${CLUBS_RED};
`

type OrgTree =
  | {
      name: string
      code: string
      children: OrgTree[]
      isParent: boolean
    }
  | { detail: string }

const OrgChild = (tree: OrgTree): ReactElement => {
  if ('detail' in tree) {
    return <ErrorText>{tree.detail}</ErrorText>
  }

  const { name, code, children, isParent } = tree

  return (
    <OrgChildWrapper>
      <div className="entry">
        {(!children || !children.length) && (
          <>
            <Icon name={children ? 'leaf' : 'refresh'} alt="leaf" />{' '}
          </>
        )}
        {!isParent ? (
          <Link
            legacyBehavior
            href={CLUB_ORG_ROUTE()}
            as={CLUB_ORG_ROUTE(code)}
          >
            <a>{name}</a>
          </Link>
        ) : (
          name
        )}
        <Link legacyBehavior href={CLUB_ROUTE()} as={CLUB_ROUTE(code)}>
          <a target="_blank" className="is-pulled-right">
            <Icon name="external-link" alt="view" />
          </a>
        </Link>
      </div>
      {children && children.map((a, i: number) => <OrgChild key={i} {...a} />)}
    </OrgChildWrapper>
  )
}

type Props = {
  club: Club
}

const OrganizationPage = ({ club }: Props): ReactElement => {
  const [children, setChildren] = useState<OrgTree | null>(null)
  const [parents, setParents] = useState<OrgTree | null>(null)

  useEffect(() => {
    doApiRequest(`/clubs/${club.code}/children/?format=json`)
      .then((res) => res.json())
      .then((res) => {
        setChildren(res)
      })

    doApiRequest(`/clubs/${club.code}/parents/?format=json`)
      .then((res) => res.json())
      .then((res) => {
        setParents(res)
      })
  }, [club])

  return (
    <>
      <ClubMetadata club={club} />
      <Container paddingTop>
        <div className="is-clearfix">
          <div className="is-pulled-left">
            <Title>{club.name}</Title>
          </div>
          <Link legacyBehavior href={CLUB_ROUTE()} as={CLUB_ROUTE(club.code)}>
            <a className="button is-pulled-right is-secondary is-medium">
              Back
            </a>
          </Link>
        </div>
        <Text>
          This page shows the parent and child relationships between {club.name}{' '}
          and other {OBJECT_NAME_PLURAL}.
        </Text>
        <hr />
        <Subtitle>Children of {club.name}</Subtitle>
        {children ? <OrgChild isParent={true} {...children} /> : <Loading />}
        <Subtitle>Parents of {club.name}</Subtitle>
        {parents ? <OrgChild isParent={true} {...parents} /> : <Loading />}
      </Container>
    </>
  )
}

OrganizationPage.getInitialProps = async ({ query, req }: NextPageContext) => {
  const data = {
    headers: req ? { cookie: req.headers.cookie } : undefined,
  }
  const clubReq = await doApiRequest(`/clubs/${query.club}/?format=json`, data)
  const clubRes = await clubReq.json()

  return { club: clubRes }
}

export default renderPage(OrganizationPage)
