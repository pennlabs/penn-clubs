import { Field } from 'formik'
import moment from 'moment'
import React, { ReactElement, useState, useEffect, useMemo } from 'react'
import { doApiRequest, getApiUrl } from '~/utils'
import Table from '../common/Table'

import styled from 'styled-components'

import { LIGHT_GRAY } from '../../constants'
import { Club, ClubEvent, ClubEventType } from '../../types'
import { stripTags } from '../../utils'
import {
  FAIR_NAME,
  OBJECT_EVENT_TYPES,
  OBJECT_NAME_SINGULAR,
} from '../../utils/branding'
import { Device, Icon, Line, Modal, Text } from '../common'
import EventModal from '../EventPage/EventModal'
import {
  DateTimeField,
  FileField,
  RichTextField,
  SelectField,
  TextField,
} from '../FormComponents'
import { ModelForm } from '../ModelForm'
import BaseCard from './BaseCard'
import TicketsModal from './TicketsModal'


export default function TicketsViewCard( {club }): ReactElement {

  console.log(club.events)

  const [selectedEvent, setSelectedEvent] = useState(null)
  

  useEffect(() => {
    doApiRequest(`/events/${club.code}/applications/?format=json`, {
      method: 'GET',
    })
      .then((resp) => resp.json())
      .then((res) => {
       console.log(res)
      })
  }, [])


  const eventsTableFields = [
    
    { label: 'Event Name', name: 'name' },
    {
      label: 'View',
      name : 'view',
      render: (id) => (
        <button
          className="button is-primary"
          onClick={(e) => {
            console.log(id)
            setSelectedEvent(
              id
            )
          }}
        >
          View
        </button>
      ),
    },
    
  ]

  const columns = useMemo(
    () =>
      club.events.map(({ label, name }) => ({
        Header: label ?? name,
        accessor: name,
      })),
    [eventsTableFields],
  )

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
