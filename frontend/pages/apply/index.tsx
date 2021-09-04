import { NextPageContext } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { ReactElement } from 'react'
import renderPage from 'renderPage'
import styled from 'styled-components'
import { Application } from 'types'
import { doBulkLookup } from 'utils'

import { Card, Container, Title } from '~/components/common'
import { ClubName } from '~/components/EventPage/common'
import DateInterval from '~/components/EventPage/DateInterval'
import {
  BG_GRADIENT,
  mediaMaxWidth,
  mediaMinWidth,
  PHONE,
  WHITE,
} from '~/constants'

const ApplicationCardContainer = styled.div`
  ${mediaMinWidth(PHONE)} {
    max-width: 18em;
    margin: 1rem;
  }
  ${mediaMaxWidth(PHONE)} {
    margin: 1rem 0;
  }
  float: left;
`

const Image = styled.img`
  max-height: 100%;
  max-width: 150px;
  border-radius: 4px;
  overflow: hidden;
`

function ApplyDashboard({ userInfo, whartonapplications }): ReactElement {
  const router = useRouter()

  return (
    <>
      <Container background={BG_GRADIENT} style={{ height: '6rem' }}>
        <Title style={{ marginTop: '1rem', color: WHITE, opacity: 0.95 }}>
          Wharton Club Applications
        </Title>
      </Container>
      <Container>
        {whartonapplications.map((application) => (
          <Link href={application.external_url}>
            <ApplicationCardContainer>
              <Card bordered hoverable background={WHITE}>
                {application.club_image_url != null &&
                  application.club_image_url !== '' && (
                    <Image src={application.club_image_url} />
                  )}
                <DateInterval
                  start={application.application_start_time}
                  end={application.application_end_time}
                />
                <ClubName>{application.name}</ClubName>
              </Card>
            </ApplicationCardContainer>
          </Link>
        ))}
      </Container>
    </>
  )
}

type BulkResp = {
  whartonapplications: Application[]
}

ApplyDashboard.getInitialProps = async (ctx: NextPageContext) => {
  const data: BulkResp = (await doBulkLookup(
    ['whartonapplications'],
    ctx,
  )) as BulkResp
  return {
    ...data,
    fair: ctx.query.fair != null ? parseInt(ctx.query.fair as string) : null,
  }
}

export default renderPage(ApplyDashboard)
