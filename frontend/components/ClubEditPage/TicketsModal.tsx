import React, { ReactElement, useState } from 'react'
import { toast, TypeOptions } from 'react-toastify'
import styled from 'styled-components'

import { Icon, Line, Text, Title } from '../../components/common'
import {
  ALLBIRDS_GRAY,
  CLUBS_GREY,
  FOCUS_GRAY,
  WHITE,
} from '../../constants/colors'
import { BORDER_RADIUS } from '../../constants/measurements'
import { BODY_FONT } from '../../constants/styles'
import { ClubEvent } from '../../types'
import { doApiRequest } from '../../utils'
import CoverPhoto from '../EventPage/CoverPhoto'

const ModalContainer = styled.div`
  text-align: left;
  position: relative;
`
const ModalBody = styled.div`
  padding: 2rem;
`
const SectionContainer = styled.div`
  margin-bottom: 1.5rem;
`

const Input = styled.input`
  border: 1px solid ${ALLBIRDS_GRAY};
  outline: none;
  color: ${CLUBS_GREY};
  width: 100%;
  font-size: 1em;
  padding: 8px 10px;
  margin: 0px 5px 0px 0px;
  background: ${WHITE};
  border-radius: ${BORDER_RADIUS};
  font-family: ${BODY_FONT};
  &:hover,
  &:active,
  &:focus {
    background: ${FOCUS_GRAY};
  }
`

const notify = (
  msg: ReactElement | string,
  type: TypeOptions = 'info',
): void => {
  toast[type](msg)
}

const TicketItem = ({
  ticket,
  changeName,
  changeCount,
  deleteTicket,
  deletable,
  index,
}): ReactElement => {
  const [name, setName] = useState(ticket.name)
  const [count, setCount] = useState(ticket.count)

  const handleNameChange = (e) => {
    setName(e.target.value)
    changeName(e.target.value, index)
  }

  const handleCountChange = (e) => {
    setCount(e.target.value)
    changeCount(e.target.value, index)
  }

  return (
    <div style={{ padding: '5px 0px' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
      >
        <Input
          type="text"
          className="input"
          value={name}
          placeholder="New Ticket"
          onChange={handleNameChange}
        />
        <Input
          type="number"
          className="input"
          value={count}
          placeholder="Ticket Count"
          onChange={handleCountChange}
        />
        <button
          className="button is-danger"
          disabled={!deletable}
          onClick={deleteTicket}
        >
          <Icon name="x" alt="delete" />
        </button>
      </div>
    </div>
  )
}

type Ticket = {
  name: string
  count: string | null
}

const TicketsModal = (props: { event: ClubEvent }): ReactElement => {
  const { event } = props
  const { large_image_url, image_url, club_name, name, id } = event

  const [submitting, setSubmitting] = useState(false)

  const [tickets, setTickets] = useState<Ticket[]>([
    { name: 'Regular Ticket', count: null },
  ])

  const handleNameChange = (name, i) => {
    const ticks = [...tickets]
    ticks[i].name = name
    setTickets(ticks)
  }

  const handleCountChange = (count, i) => {
    const ticks = [...tickets]
    ticks[i].count = count
    setTickets(ticks)
  }

  const deleteTicket = (i) => {
    const ticks = [...tickets]
    ticks.splice(i, 1)
    setTickets(ticks)
  }

  const addNewTicket = () => {
    const ticks = [...tickets]
    ticks.push({ name: '', count: null })
    setTickets(ticks)
  }

  const submit = () => {
    if (typeof name === 'string' && tickets.length > 0) {
      const quantities = tickets
        .filter((ticket) => ticket.count != null)
        .map((ticket) => {
          return { type: ticket.name, count: parseInt(ticket.count || '') }
        })
      doApiRequest(`/events/${id}/tickets/?format=json`, {
        method: 'PUT',
        body: {
          quantities,
        },
      })
      notify(<>Tickets Created!</>, 'success')
      setSubmitting(false)
    }
  }

  const disableSubmit = tickets.some(
    (ticket) =>
      typeof ticket.name !== 'string' ||
      ticket.count === null ||
      !Number.isInteger(parseInt(ticket.count || '0')),
  )

  return (
    <ModalContainer>
      <CoverPhoto
        image={large_image_url ?? image_url}
        fallback={
          <p>{club_name != null ? club_name.toLocaleUpperCase() : 'Event'}</p>
        }
      />
      <ModalBody>
        <Title>{name}</Title>
        <Text>
          Create new tickets for this event. To be filled with actual
          instructions. Lorem ipsum dolor sit amet, consectetur adipiscing elit,
          sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
          enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi
          ut aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur.
        </Text>
        <Line />
        <SectionContainer>
          <h1>Tickets</h1>
        </SectionContainer>
        <SectionContainer>
          {tickets.map((ticket, index) => (
            <TicketItem
              ticket={ticket}
              index={index}
              deletable={tickets.length !== 1}
              changeName={handleNameChange}
              changeCount={handleCountChange}
              deleteTicket={deleteTicket}
            />
          ))}
        </SectionContainer>
        <SectionContainer>
          <button className="button is-info" onClick={addNewTicket}>
            New Ticket Class
          </button>
        </SectionContainer>
        <div>
          {submitting ? (
            <>
              <p className="help is-danger mb-3">
                Are you sure you want to create these tickets? Ticket classes
                and quantities are final and you will not be able to change them
                moving forward.
              </p>
              <button
                onClick={submit}
                disabled={disableSubmit}
                className="button is-primary mr-3"
              >
                Yes
              </button>
              <button
                onClick={() => {
                  setSubmitting(false)
                }}
                disabled={disableSubmit}
                className="button is-danger"
              >
                No
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setSubmitting(true)
              }}
              disabled={disableSubmit}
              className="button is-primary"
            >
              Submit
            </button>
          )}
        </div>
      </ModalBody>
    </ModalContainer>
  )
}

export default TicketsModal
