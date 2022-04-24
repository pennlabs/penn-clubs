import { NextPageContext } from 'next'

import { Container, Metadata, Title } from '~/components/common'
import CartTickets from '~/components/TicketsPage/CartTickets'
import { SNOW } from '~/constants'
import renderPage from '~/renderPage'
import { ClubEventType, EventTicket } from '~/types'

interface Props {
  initialCart: EventTicket[]
}

function TicketsCheckoutPage({ initialCart }: Props) {
  return (
    <>
      <Metadata title="Checkout Tickets" />
      <Container background={SNOW}>
        <Title>Checkout Tickets</Title>
        <CartTickets tickets={testCart} />
      </Container>
    </>
  )
}

const testCart: EventTicket[] = [
  {
    event: {
      id: 12345,
      name: 'Awesome Event Name',
      club_name: 'UPenn Natalist Society',
    },
    id: '497f6eca-6276-4993-bfeb-53cbbbba6f08',
    type: ClubEventType.OTHER,
    owner: 'James Adams',
  },
]

TicketsCheckoutPage.getInitialProps = async (ctx: NextPageContext) => {
  // const initialCart = await doApiRequest('/cart/')
  return {
    initialCart: testCart,
  }
}

export default renderPage(TicketsCheckoutPage)
