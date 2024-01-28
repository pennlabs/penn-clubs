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
      badges: [],
      image_url: null,
      club: null,
      description: 'This is a description of the event',
      start_time: '2020-04-20T12:00:00Z',
      end_time: '2020-04-20T14:00:00Z',
      is_ics_event: false,
      large_image_url: null,
      ticketed: 'true',
      location: 'Houston Hall',
      pinned: false,
      type: ClubEventType.OTHER,
      url: 'https://pennclubs.com',
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
