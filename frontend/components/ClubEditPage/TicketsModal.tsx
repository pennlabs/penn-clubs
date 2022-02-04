import React, { ReactElement, useEffect, useState } from 'react'
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
import { Club, ClubEvent } from '../../types'
import {
  apiSetFavoriteStatus,
  apiSetSubscribeStatus,
  doApiRequest,
} from '../../utils'
import CoverPhoto from '../EventPage/CoverPhoto'

const ModalContainer = styled.div`
  text-align: left;
  position: relative;
`
const ModalBody = styled.div`
  padding: 5%;
`

const ActionButtons = ({ club: code }): ReactElement | null => {
  const [isBookmarked, setBookmarked] = useState<boolean | null>(null)
  const [isSubscribed, setSubscribed] = useState<boolean | null>(null)

  useEffect(() => {
    doApiRequest(`/clubs/${code}/?format=json`)
      .then((resp) => resp.json())
      .then((data: Club) => {
        setSubscribed(data.is_subscribe)
        setBookmarked(data.is_favorite)
      })
  }, [code])

  if (isSubscribed == null || isBookmarked == null) {
    return null
  }

  return (
    <>
      <button
        className="button is-success is-small"
        disabled={isBookmarked}
        onClick={() =>
          apiSetFavoriteStatus(code, true).then(() => setBookmarked(true))
        }
      >
        <Icon name="bookmark" /> {isBookmarked ? 'Bookmarked' : 'Bookmark'}
      </button>
      <button
        className="button is-success is-small"
        disabled={isSubscribed}
        onClick={() =>
          apiSetSubscribeStatus(code, true).then(() => setSubscribed(true))
        }
      >
        <Icon name="bell" /> {isSubscribed ? 'Subscribed' : 'Subscribe'}
      </button>
    </>
  )
}

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

const TicketsModal = (props: { event: ClubEvent }): ReactElement => {
  const { event } = props
  const {
    large_image_url,
    image_url,
    club,
    club_name,
    start_time,
    end_time,
    name,
    url,
    id,
    description,
  } = event

  const [tickets, setTickets] = useState([
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
      const quantities = tickets.map((ticket) => {
        return { type: ticket.name, count: ticket.count }
      })
      doApiRequest(`/events/${id}/tickets/?format=json`, {
        method: 'PUT',
        body: {
          name: name,
          quantities: quantities,
        },
      })
    }
  }

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
          pariatur
        </Text>
        <Line />
        <h1 style={{ marginBottom: '20px' }}>Tickets</h1>
        <div style={{ marginBottom: '20px' }}>
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
        </div>
        <div style={{ marginBottom: '20px' }}>
          <button className="button is-primary" onClick={addNewTicket}>
            Add a new ticket
          </button>
        </div>
        <div>
          <button onClick={submit} className="button is-primary">
            Submit
          </button>
        </div>
      </ModalBody>
    </ModalContainer>
  )
}

export default TicketsModal
