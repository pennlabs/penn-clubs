import { NextPageContext } from 'next'
import Link from 'next/link'
import React, { ReactElement } from 'react'
import styled from 'styled-components'
import { Application } from 'types'
import { doBulkLookup } from 'utils'

import { Card, Text } from '~/components/common'
import { ClubName } from '~/components/EventPage/common'
import DateInterval from '~/components/EventPage/DateInterval'
import { mediaMaxWidth, mediaMinWidth, PHONE, WHITE } from '~/constants'

const ApplicationCardContainer = styled.div`
  ${mediaMinWidth(PHONE)} {
    max-width: 18em;
    margin: 1rem;
  }
  ${mediaMaxWidth(PHONE)} {
    margin: 1rem 0;
  }
  float: left;
  cursor: pointer; !important
`

const Image = styled.img`
  max-height: 100%;
  max-width: 150px;
  border-radius: 4px;
  overflow: hidden;
`

function ApplicationsPage({ whartonapplications }): ReactElement {
  if ('detail' in whartonapplications) {
    return <Text>{whartonapplications.detail}</Text>
  }

  return (
    <>
      {whartonapplications != null && whartonapplications.length > 0 ? (
        whartonapplications.map((application) => (
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
        ))
      ) : (
        <Text>No applications are currently available.</Text>
      )}
    </>
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
    ...data,
    fair: ctx.query.fair != null ? parseInt(ctx.query.fair as string) : null,
  }
}

export default ApplicationsPage
