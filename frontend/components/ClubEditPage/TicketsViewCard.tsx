
import React, { ReactElement } from 'react'
import { doApiRequest } from '~/utils'
import Table from '../common/Table'
import BaseCard from './BaseCard'


export default function TicketsViewCard( {club }): ReactElement {


  const GetTicketsHolders = (id) => {
    doApiRequest(`/events/${id}/tickets?format=json`, {
      method: 'GET',
    })
      .then((resp) => resp.json())
      .then((res) => {
       console.log(res)
      })
  } 


  const eventsTableFields = [
    
    { label: 'Event Name', name: 'name' },
    {
      label: 'View',
      name : 'view',
      render: (id) => (
        <button
          className="button is-primary"
          onClick={() => {
            console.log()
            GetTicketsHolders(id);
          }}
        >
          View
        </button>
      ),
    },
    
  ]

  return (
    <BaseCard title="Tickets">
                <Table
                  data={club.events.map((item, index) =>
                    item.id ? { ...item, id: item.id } : { ...item, id: index },
                  )}
                  columns={eventsTableFields}
                  searchableColumns={['name']}
                  filterOptions={[]}
                  focusable={true}
                />
     
    </BaseCard>
  )
}
