import { NextPageContext } from 'next'

import renderPage from '~/renderPage'
import { ClubEventType, EventTicket } from '~/types'

function TicketsCheckoutPage({ initialCart }) {
  return <div>Hello!</div>
}

const testCart: EventTicket[] = [
  {
    event: {},
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
