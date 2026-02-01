import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'
import { toast } from 'react-toastify'

import { BaseLayout } from '~/components/BaseLayout'
import { Container, Metadata, Title } from '~/components/common'
import AuthPrompt from '~/components/common/AuthPrompt'
import { BetaTag } from '~/components/common/BetaTag'
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
  const router = useRouter()
  const { success, error, cancelled } = router.query

  useEffect(() => {
    // Handle payment result from CyberSource redirect
    if (success === 'true') {
      toast.success('Payment successful! Your tickets have been purchased.')
      // Redirect to tickets page after showing success message
      setTimeout(() => {
        router.push('/settings#Tickets')
      }, 1500)
    } else if (error) {
      // Display error message from payment failure
      const errorMessage = Array.isArray(error) ? error.join('') : error
      toast.error(errorMessage, { autoClose: false })
      // Clean up URL
      router.replace('/events/checkout', undefined, { shallow: true })
    } else if (cancelled === 'true') {
      toast.info('Payment was cancelled. Your cart has been preserved.')
      // Clean up URL
      router.replace('/events/checkout', undefined, { shallow: true })
    }
  }, [success, error, cancelled, router])

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
        <BetaTag>
          <Title>Checkout</Title>
        </BetaTag>
        {success === 'true' ? (
          <div className="notification is-success">
            <p>
              <strong>Payment successful!</strong> Redirecting to your
              tickets...
            </p>
          </div>
        ) : (
          <CartTickets tickets={initialCart} soldOut={soldOut} />
        )}
      </Container>
    </BaseLayout>
  )
}

export default TicketsCheckoutPage
