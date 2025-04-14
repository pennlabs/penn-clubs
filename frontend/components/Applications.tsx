import { NextPageContext } from 'next'
import Link from 'next/link'
import React, { ReactElement } from 'react'
import LazyLoad from 'react-lazy-load'
import styled from 'styled-components'
import { Application } from 'types'
import { doBulkLookup } from 'utils'

import { Text } from '~/components/common'
import { ClubName } from '~/components/EventPage/common'
import DateInterval from '~/components/EventPage/DateInterval'
import {
  ALLBIRDS_GRAY,
  ANIMATION_DURATION,
  BORDER_RADIUS,
  CLUBS_GREY_LIGHT,
  HOVER_GRAY,
  mediaMaxWidth,
  SM,
  WHITE,
} from '~/constants'

const CardWrapper = styled.div`
  ${mediaMaxWidth(SM)} {
    padding-top: 0;
    padding-bottom: 1rem;
  }
`

const DescriptionWrapper = styled.p`
  margin-top: 0.2rem;
  color: ${CLUBS_GREY_LIGHT};
  border-top: 1.5px solid rgba(0, 0, 0, 0.05);
  width: 100%;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 5;
  overflow: hidden;
`

const Description = (text) => (
  <div>
    {text.length > 255 ? (
      <div>{`${text.substring(0, 255)} ...`}</div>
    ) : (
      <p>{text}</p>
    )}
  </div>
)

const MainInfo = styled.div`
  display: flex;
  flex-direction: row;
`
type CardProps = {
  readonly $hovering?: boolean
  className?: string
}

const Card = styled.div<CardProps>`
  padding: 10px;
  box-shadow: 0 0 0 transparent;
  transition: all ${ANIMATION_DURATION}ms ease;
  border-radius: ${BORDER_RADIUS};
  box-shadow: 0 0 0 ${WHITE};
  background-color: ${({ $hovering }) => ($hovering ? HOVER_GRAY : WHITE)};
  border: 1px solid ${ALLBIRDS_GRAY};
  justify-content: space-between;
  height: auto;
  cursor: pointer;

  &:hover,
  &:active,
  &:focus {
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.2);
  }

  ${mediaMaxWidth(SM)} {
    width: calc(100%);
    padding: 8px;
  }
`

const Image = styled.img`
  max-height: 100%;
  max-width: 150px;
  border-radius: 4px;
  overflow: hidden;
`

const AppsContainer = styled.div`
  display: flex;
  flex-direction: row;
  min-height: 60vh;
`

function ApplicationsPage({ whartonApplications }): ReactElement<any> {
  if ('detail' in whartonApplications) {
    return <Text>{whartonApplications.detail}</Text>
  }

  return (
    <AppsContainer>
      <div className="columns is-multiline is-desktop is-tablet">
        {whartonApplications != null && whartonApplications.length > 0 ? (
          <div>
            <Text>
              Note: only current Wharton applications are displayed on this
              page{' '}
            </Text>
            {whartonApplications.map((application) => (
              <CardWrapper className={'column is-half-desktop'}>
                <Link href={application.external_url} target="_blank">
                  <Card className="card">
                    <MainInfo>
                      <div>
                        <ClubName>{application.name}</ClubName>
                        <DateInterval
                          start={application.application_start_time}
                          end={application.application_end_time}
                        />
                      </div>
                      <div>
                        {application.club_image_url != null &&
                          application.club_image_url !== '' && (
                            <LazyLoad>
                              <Image src={application.club_image_url} />
                            </LazyLoad>
                          )}
                      </div>
                    </MainInfo>
                    {application.description &&
                      application.description.length && (
                        <DescriptionWrapper
                          dangerouslySetInnerHTML={{
                            __html: application.description,
                          }}
                        ></DescriptionWrapper>
                      )}
                  </Card>
                </Link>
              </CardWrapper>
            ))}
          </div>
        ) : (
          <Text>No Wharton applications are currently available.</Text>
        )}
      </div>
    </AppsContainer>
  )
}

type BulkResp = {
  whartonapplications: Application[]
}

ApplicationsPage.getInitialProps = async (ctx: NextPageContext) => {
  const data: BulkResp = (await doBulkLookup(
    ['whartonapplications'],
    ctx,
  )) as BulkResp

  return {
    whartonApplications: data.whartonapplications,
    fair: ctx.query.fair != null ? parseInt(ctx.query.fair as string) : null,
  }
}

export default ApplicationsPage
