import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import React from 'react'

import { BaseLayout } from '~/components/BaseLayout'
import { Container, Metadata, Title } from '~/components/common'
import AuthPrompt from '~/components/common/AuthPrompt'
import CartTickets from '~/components/Tickets/CartTickets'
import { SNOW } from '~/constants'
import { CountedEventTicket, EventTicket } from '~/types'
import { doApiRequest } from '~/utils'
import { createBasePropFetcher } from '~/utils/getBaseProps'

const getBaseProps = createBasePropFetcher()

type CartTicketsResponse = {
  tickets: EventTicket[]
  sold_out: CountedEventTicket[]
}
export const getServerSideProps = (async (ctx) => {
  const data = {
    headers: ctx.req ? { cookie: ctx.req.headers.cookie } : undefined,
  }

  const [baseProps, { tickets: initialCart, sold_out }] = await Promise.all([
    getBaseProps(ctx),
    doApiRequest('/tickets/cart?format=json', data).then(
      (resp) => resp.json() as Promise<CartTicketsResponse>,
    ),
  ])

  return {
    props: {
      baseProps,
      initialCart: initialCart ?? [],
      soldOut: sold_out || [],
    },
  }
}) satisfies GetServerSideProps

type Props = InferGetServerSidePropsType<typeof getServerSideProps>

const TicketsCheckoutPage: React.FC<Props> = ({
  baseProps,
  initialCart,
  soldOut,
}) => {
  if (!baseProps.auth.authenticated) {
    return (
      <BaseLayout {...baseProps} authRequired>
        <Metadata title="Checkout" />
        <AuthPrompt title="Please sign in for ticketing." />{' '}
      </BaseLayout>
    )
  }

  return (
    <BaseLayout {...baseProps} authRequired>
      <Metadata title="Checkout" />
      <Container background={SNOW} fullHeight>
        <Title>Checkout</Title>
        <CartTickets tickets={initialCart} soldOut={soldOut} />
      </Container>
    </BaseLayout>
  )
}

export default TicketsCheckoutPage
