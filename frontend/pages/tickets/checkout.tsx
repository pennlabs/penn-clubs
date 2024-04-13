import { NextPageContext } from 'next'

import { Container, Metadata, Title } from '~/components/common'
import CartTickets from '~/components/TicketsPage/CartTickets'
import { SNOW } from '~/constants'
import renderPage from '~/renderPage'
import { EventTicket } from '~/types'
import { doApiRequest } from '~/utils'

interface Props {
  initialCart: EventTicket[]
}

function TicketsCheckoutPage({ initialCart }: Props) {
  return (
    <>
      <Metadata title="Checkout" />
      <Container background={SNOW} fullHeight>
        <Title>Checkout</Title>
        <CartTickets tickets={initialCart} />
      </Container>
    </>
  )
}

TicketsCheckoutPage.getInitialProps = async ({ req }: NextPageContext) => {
  const data = {
    headers: req ? { cookie: req.headers.cookie } : undefined,
  }
  const request = await doApiRequest('/tickets?format=json', data)
  const initialCart = await request.json()
  return {
    initialCart,
  }
}

export default renderPage(TicketsCheckoutPage)
