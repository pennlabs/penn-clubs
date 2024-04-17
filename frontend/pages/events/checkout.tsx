import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import React from 'react'

import { BaseLayout } from '~/components/BaseLayout'
import { Container, Metadata, Title } from '~/components/common'
import CartTickets from '~/components/TicketsPage/CartTickets'
import { SNOW } from '~/constants'
import { EventTicket } from '~/types'
import { doApiRequest } from '~/utils'
import { createBasePropFetcher } from '~/utils/getBaseProps'

const getBaseProps = createBasePropFetcher()

export const getServerSideProps = (async (ctx) => {
  const data = {
    headers: ctx.req ? { cookie: ctx.req.headers.cookie } : undefined,
  }

  const [baseProps, initialCart] = await Promise.all([
    getBaseProps(ctx),
    doApiRequest('/tickets?format=json', data).then(
      (resp) => resp.json() as Promise<EventTicket[]>,
    ),
  ])

  return {
    props: {
      baseProps,
      initialCart,
    },
  }
}) satisfies GetServerSideProps

type Props = InferGetServerSidePropsType<typeof getServerSideProps>

const TicketsCheckoutPage: React.FC<Props> = ({ baseProps, initialCart }) => {
  return (
    <BaseLayout {...baseProps} authRequired>
      <Metadata title="Checkout" />
      <Container background={SNOW} fullHeight>
        <Title>Checkout</Title>
        <CartTickets tickets={initialCart} />
      </Container>
    </BaseLayout>
  )
}

export default TicketsCheckoutPage
