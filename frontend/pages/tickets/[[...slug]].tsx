import { NextPageContext } from 'next'
import { ReactElement } from 'react'
import renderPage from 'renderPage'
import { doApiRequest, isClubFieldShown } from 'utils'


const Ticket = ({totals, available, buyers}): ReactElement => {
  console.log(totals)
  return <div>
         hi
      </div>
}

Ticket.getInitialProps = async ({ query }): Promise<any> => {
  const id = query.slug[0]
  return doApiRequest(`/events/${id}/tickets?format=json`, {
    method: 'GET',
  })
    .then((resp) => resp.json())
    .then((res) => {
     return res
    })
  
    
}



export default renderPage(Ticket)
