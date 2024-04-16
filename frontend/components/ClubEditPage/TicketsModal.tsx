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
  changePrice,
  deleteTicket,
  deletable,
  index,
}): ReactElement => {
  const [name, setName] = useState(ticket.name)
  const [count, setCount] = useState(ticket.count)
  const [price, setPrice] = useState(ticket.price)

  const handleNameChange = (e) => {
    setName(e.target.value)
    changeName(e.target.value, index)
  }

  const handleCountChange = (e) => {
    const rounded = Math.round(parseFloat(e.target.value))
    setCount(rounded.toString())
    changeCount(rounded.toString(), index)
  }

  const handlePriceChange = (e) => {
    const rounded = Math.round(parseFloat(e.target.value) * 100) / 100
    setPrice(rounded.toString())
    changePrice(rounded.toString(), index)
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
        <Input
          type="number"
          className="input"
          value={price}
          placeholder="Ticket Price"
          onChange={handlePriceChange}
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
  price: string | null // Free if null
}

const TicketsModal = (props: { event: ClubEvent }): ReactElement => {
  const { event } = props
  const { large_image_url, image_url, club_name, name, id } = event

  const [submitting, setSubmitting] = useState(false)

  const [tickets, setTickets] = useState<Ticket[]>([
    { name: 'Regular Ticket', count: null, price: null },
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

  const handlePriceChange = (price, i) => {
    const ticks = [...tickets]
    ticks[i].price = price
    setTickets(ticks)
  }

  const deleteTicket = (i) => {
    const ticks = [...tickets]
    ticks.splice(i, 1)
    setTickets(ticks)
  }

  const addNewTicket = () => {
    const ticks = [...tickets]
    ticks.push({ name: '', count: null, price: null })
    setTickets(ticks)
  }

  const submit = () => {
    if (typeof name === 'string' && tickets.length > 0) {
      const quantities = tickets
        .filter((ticket) => ticket.count != null)
        .map((ticket) => {
          return {
            type: ticket.name,
            count: parseInt(ticket.count || ''),
            price: parseFloat(ticket.price || ''),
          }
        })
      doApiRequest(`/events/${id}/tickets/?format=json`, {
        method: 'PUT',
        body: {
          quantities,
        },
      }).then((res) => {
        if (res.ok) {
          notify(<>Tickets Created!</>, 'success')
          setSubmitting(false)
        } else {
          notify(<>Error creating tickets</>, 'error')
          setSubmitting(false)
        }
      })
    }
  }

  const disableSubmit = tickets.some(
    (ticket) =>
      typeof ticket.name !== 'string' ||
      ticket.count === null ||
      !Number.isInteger(parseInt(ticket.count || '0')) ||
      parseInt(ticket.count || '0') < 0 ||
      ticket.price === null ||
      !Number.isFinite(parseFloat(ticket.price || '0')) ||
      parseFloat(ticket.price || '0') < 0,
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
        <Text>Create new tickets for this event.</Text>
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
              changePrice={handlePriceChange}
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
