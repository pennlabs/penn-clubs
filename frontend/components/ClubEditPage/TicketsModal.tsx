import { useRouter } from 'next/router'
import React, { ReactElement, useState } from 'react'
import { toast, TypeOptions } from 'react-toastify'
import styled from 'styled-components'

import { TICKETING_PAYMENT_ENABLED } from '~/utils/branding'

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

type TicketItemProps = {
  ticket: Ticket
  club: Club
  onChange?: (ticket: Ticket) => void
  onDelete?: () => void
  deletable: boolean
}

const TicketItem: React.FC<TicketItemProps> = ({
  ticket: propTicket,
  club,
  onChange,
  onDelete,
  deletable,
}) => {
  const [ticket, setTicket] = useState(propTicket)
  const [openGroupDiscount, setOpenGroupDiscount] = useState(false)

  const resetGroupDiscount = () => {
    setTicket({
      ...ticket,
      groupDiscount: null,
      groupNumber: null,
    })
    onChange?.({
      ...ticket,
      groupDiscount: null,
      groupNumber: null,
    })
    setOpenGroupDiscount(!openGroupDiscount)
  }

  return (
    <div
      style={{ padding: '5px 0px', display: 'flex', flexDirection: 'column' }}
    >
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
          value={ticket.name ?? ''}
          placeholder="New Ticket"
          onChange={(e) => {
            setTicket({ ...ticket, name: e.target.value })
            onChange?.({ ...ticket, name: e.target.value })
          }}
        />
        <Input
          type="number"
          className="input"
          value={ticket.count ?? ''}
          placeholder="Ticket Count"
          onChange={(e) => {
            const count = e.target.value
            setTicket({ ...ticket, count })
            onChange?.({ ...ticket, count })
          }}
        />
        {ticket.buyable && (
          <Input
            type="number"
            className="input"
            value={ticket.price ?? ''}
            placeholder="Ticket Price"
            disabled={!TICKETING_PAYMENT_ENABLED && !club.beta}
            onChange={(e) => {
              const price = e.target.value
              setTicket({ ...ticket, price })
              onChange?.({ ...ticket, price })
            }}
          />
        )}
        <button
          className="button is-danger"
          disabled={!deletable}
          onClick={() => onDelete?.()}
        >
          <Icon name="x" alt="delete" />
        </button>
      </div>
      <div style={{ height: '12px' }} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'end',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <button
            className="button is-info is-small mr-2"
            onClick={() => setTicket({ ...ticket, buyable: !ticket.buyable })}
          >
            {ticket.buyable ? 'Disable Buying' : 'Enable Buying'}
          </button>
          {openGroupDiscount ? (
            <>
              <div style={{ maxWidth: '75px' }}>
                <Input
                  type="number"
                  className="input is-small"
                  value={ticket.groupDiscount ?? ''}
                  placeholder="100"
                  onChange={(e) => {
                    const groupDiscount = e.target.value
                    setTicket({ ...ticket, groupDiscount })
                    onChange?.({ ...ticket, groupDiscount })
                  }}
                />
              </div>
              <Text style={{ padding: '0 12px' }}>% Discount for</Text>
              <div>
                <Input
                  type="number"
                  className="input is-small"
                  value={ticket.groupNumber ?? ''}
                  placeholder="Group Number"
                  onChange={(e) => {
                    const groupNumber = e.target.value
                    setTicket({ ...ticket, groupNumber })
                    onChange?.({ ...ticket, groupNumber })
                  }}
                />
              </div>
              <button
                className="button is-info is-small"
                onClick={resetGroupDiscount}
              >
                Delete Discount
              </button>
            </>
          ) : (
            <>
              <button
                className="button is-info is-small"
                onClick={resetGroupDiscount}
              >
                Add Group Discount
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

type Ticket = {
  name: string
  count: string | null
  price: string | null // Free if null
  groupDiscount: string | null // If null, no group discount
  groupNumber: string | null // If null, no group discount
  buyable: boolean
}

const TicketsModal = ({
  event,
  club,
  closeModal,
  onSuccessfulSubmit,
}: {
  event: ClubEvent
  club: Club
  closeModal: () => void
  onSuccessfulSubmit: () => void
}): ReactElement => {
  const { large_image_url, image_url, club_name, name, id } = event

  const [submitting, setSubmitting] = useState(false)

  const router = useRouter()

  const [tickets, setTickets] = useState<Ticket[]>([
    {
      name: 'Regular Ticket',
      count: null,
      price: '0.00',
      groupDiscount: null,
      groupNumber: null,
      buyable: true,
    },
  ])

  const addNewTicket = () => {
    const ticks = [...tickets]
    setTickets([
      ...ticks,
      {
        name: '',
        count: null,
        price: '0.00',
        groupDiscount: null,
        groupNumber: null,
        buyable: true,
      },
    ])
  }

  const submit = () => {
    if (typeof name === 'string' && tickets.length > 0) {
      const quantities = tickets
        .filter((ticket) => ticket.count != null)
        .map((ticket) => {
          const usingGroupPricing = ticket.groupDiscount && ticket.groupNumber
          return {
            type: ticket.name,
            count: parseInt(ticket.count ?? '0'),
            price: parseFloat(ticket.price ?? '0'),
            groupDiscount: usingGroupPricing
              ? parseFloat(ticket.groupDiscount!)
              : null,
            groupNumber: usingGroupPricing
              ? parseFloat(ticket.groupNumber!)
              : null,
            buyable: ticket.buyable,
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
          onSuccessfulSubmit()
          setTimeout(() => {
            router.push(`/tickets/${id}`)
          }, 500)
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
      parseFloat(ticket.price || '0') < 0 ||
      (ticket.groupNumber != null && parseFloat(ticket.price || '0') < 0),
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
          Create new tickets for this event. For our beta, only free tickets
          will be supported for now: stay tuned for payments integration!
        </Text>
        <Line />
        <SectionContainer>
          <h1>Tickets</h1>
        </SectionContainer>
        <SectionContainer>
          {tickets.map((ticket, index) => (
            <TicketItem
              key={index}
              ticket={ticket}
              club={club}
              deletable={tickets.length > 1}
              onChange={(newTicket) => {
                setTickets((t) =>
                  t.map((t, i) => (i === index ? newTicket : t)),
                )
              }}
              onDelete={() => {
                setTickets((t) => t.filter((_, i) => i !== index))
              }}
            />
          ))}
        </SectionContainer>
        <SectionContainer>
          <button className="button is-info" onClick={addNewTicket}>
            New Ticket Class
          </button>
        </SectionContainer>
        {!event.ticket_drop_time && (
          <SectionContainer>
            <p className="help">
              You can optionally add a time in which after when tickets will be
              available{' '}
              <label
                htmlFor="ticket_drop_time"
                onClick={(e) => {
                  setSubmitting(false)
                  closeModal()
                }}
              >
                within the event's edit page
              </label>
              . Please note that this cannot be changed once any tickets are
              sold.
            </p>
          </SectionContainer>
        )}
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
