import { css } from '@emotion/react'
import { useRouter } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'

import { EmptyState, Modal, Subtitle, Text } from '~/components/common'
import { TicketCard } from '~/components/Tickets/TicketCard'
import { BORDER, BORDER_RADIUS, mediaMaxWidth, SM, WHITE } from '~/constants'
import { CountedEventTicket, EventTicket } from '~/types'
import { doApiRequest } from '~/utils'

import { ModalContent } from '../ClubPage/Actions'

const Summary: React.FC<{ tickets: CountedEventTicket[] }> = ({ tickets }) => {
  return (
    <>
      <Subtitle>Summary</Subtitle>
      <div
        css={css`
          padding: 12px;
          background: ${WHITE};
          border: 1px solid ${BORDER};
          border-radius: ${BORDER_RADIUS};
        `}
      >
        <div
          css={css`
            display: grid;
            grid-template-columns: 2fr 4fr 4fr 2fr 2fr;
          `}
        >
          <span
            css={css`
              font-weight: bold;
            `}
          >
            Qty
          </span>
          <span
            css={css`
              font-weight: bold;
            `}
          >
            Event
          </span>
          <span
            css={css`
              font-weight: bold;
            `}
          >
            Type
          </span>
          <span
            css={css`
              font-weight: bold;
            `}
          >
            Price
          </span>
          <span
            css={css`
              font-weight: bold;
            `}
          >
            Total
          </span>
          {tickets.map((ticket) => (
            <>
              <span key={`count-${ticket.id}`}>{ticket.count} x </span>
              <span key={`name-${ticket.id}`}>{ticket.event.name}</span>
              <span key={`type-${ticket.id}`}>({ticket.type})</span>
              <span key={`price-${ticket.id}`}>${ticket.price}</span>
              <span key={`cost-${ticket.id}`}>
                ${(Number(ticket.price) * (ticket.count ?? 1)).toFixed(2)}
              </span>
            </>
          ))}
        </div>
        <hr
          css={css`
            margin-top: 12px;
            margin-bottom: 12px;
            border-top: 1px solid ${BORDER};
          `}
        />
        <div
          css={css`
            display: flex;
            justify-content: space-between;
          `}
        >
          <span>Total</span>
          <span>
            $
            {tickets
              .map((ticket) => Number(ticket.price) * (ticket.count ?? 1))
              .reduce((acc, curr) => acc + curr, 0)
              .toFixed(2)}
          </span>
        </div>
      </div>
    </>
  )
}

export interface CartTicketsProps {
  tickets: EventTicket[]
  soldOut: CountedEventTicket[]
}

/**
 * Combines an array of tickets into a list of unique ticket types with counts
 * @param tickets - Original array of tickets
 * @returns Array of tickets condensed into unique types
 */
const combineTickets = (tickets: EventTicket[]): CountedEventTicketStatus[] =>
  Object.values(
    tickets.reduce(
      (acc, ticket) => ({
        ...acc,
        [`${ticket.event.id}_${ticket.type}`]: {
          ...ticket,
          pendingEdit: false,
          count: (acc[`${ticket.event.id}_${ticket.type}`]?.count ?? 0) + 1,
        },
      }),
      {},
    ),
  )

const useCheckout = (paid: boolean) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const [paymentParams, setPaymentParams] = useState<Record<string, string>>({})
  const [cybersourceUrl, setCybersourceUrl] = useState<string>('')
  const navigate = useRouter()

  const initiateCheckout = async () => {
    setIsProcessing(true)
    try {
      const res = await doApiRequest(
        `/tickets/initiate_checkout/?format=json`,
        {
          method: 'POST',
          body: null,
        },
      )
      const data = await res.json()

      if (!data.success) {
        toast.error(data.detail)
        setIsProcessing(false)
        return
      }

      if (data.sold_free_tickets) {
        toast.success('Free tickets purchased successfully!')
        setTimeout(() => {
          navigate.push('/settings#Tickets')
        }, 500)
        setIsProcessing(false)
        return
      }

      // For paid tickets, set up form and submit to CyberSource
      setCybersourceUrl(data.cybersource_url)
      setPaymentParams(data.payment_params)
    } catch (error) {
      toast.error('An error occurred initiating checkout. Please try again.')
      setIsProcessing(false)
    }
  }

  // Submit form when params are set
  useEffect(() => {
    if (
      cybersourceUrl &&
      Object.keys(paymentParams).length > 0 &&
      formRef.current
    ) {
      formRef.current.submit()
    }
  }, [cybersourceUrl, paymentParams])

  return {
    isProcessing,
    checkout: initiateCheckout,
    formRef,
    paymentParams,
    cybersourceUrl,
  }
}

interface CountedEventTicketStatus extends CountedEventTicket {
  pendingEdit: boolean
}

const CartTickets: React.FC<CartTicketsProps> = ({ tickets, soldOut }) => {
  const [removeModal, setRemoveModal] =
    useState<CountedEventTicketStatus | null>(null)
  const [countedTickets, setCountedTickets] = useState<
    CountedEventTicketStatus[]
  >([])

  const atLeastOnePaid = tickets.some((ticket) => parseFloat(ticket.price) > 0)
  const { isProcessing, checkout, formRef, paymentParams, cybersourceUrl } =
    useCheckout(atLeastOnePaid)

  useEffect(() => {
    setCountedTickets(combineTickets(tickets))
  }, [tickets])

  useEffect(() => {
    soldOut
      .filter((ticket) => ticket.count !== 0)
      .forEach(
        (ticket) => {
          toast.error(
            `${ticket.event.name} - ${ticket.type} is no longer available and ${ticket.count} ticket${ticket.count && ticket.count > 1 ? 's have' : ' has'} been removed from your cart.`,
            { autoClose: false },
          )
        },
        [soldOut],
      )
  }, [])

  function handleInitiateCheckout() {
    if (countedTickets.length === 0) {
      return
    }
    checkout()
  }

  function handleUpdateTicket(
    ticket: CountedEventTicketStatus,
    newCount?: number,
    propogateCount?: (count: number) => void,
  ) {
    let reqPromise

    if (!ticket.count || newCount === ticket.count) {
      return
    }

    function flipPendingEdit(value: boolean) {
      setCountedTickets(
        countedTickets.map((t) =>
          t.id === ticket.id ? { ...t, pendingEdit: value } : t,
        ),
      )
    }
    flipPendingEdit(true)
    if (newCount && newCount > ticket.count) {
      reqPromise = doApiRequest(
        `/events/${ticket.event.id}/showings/${ticket.showing.id}/add_to_cart/`,
        {
          method: 'POST',
          body: {
            quantities: [
              {
                type: ticket.type,
                count: newCount - ticket.count,
              },
            ],
          },
        },
      )
    } else {
      reqPromise = doApiRequest(
        `/events/${ticket.event.id}/showings/${ticket.showing.id}/remove_from_cart/`,
        {
          method: 'POST',
          body: {
            quantities: [
              {
                type: ticket.type,
                // If count is not provided, remove all tickets
                count: newCount ? ticket.count! - newCount : ticket.count,
              },
            ],
          },
        },
      )
    }
    reqPromise
      .then((resp) => resp.json())
      .then((res) => {
        if (!res.success) {
          toast.error(res.detail)
          propogateCount?.(ticket.count ?? 0)
          flipPendingEdit(false)
          return
        }
        flipPendingEdit(false)
        toast.success(res.detail)
        // TODO: a less naive approach to updating the cart
        setCountedTickets(
          countedTickets
            .map((t) =>
              t.id === ticket.id ? { ...t, count: newCount ?? 0 } : t,
            )
            .filter((t) => t.count !== 0),
        )
      })
  }

  if (countedTickets.length === 0) {
    return (
      <div
        css={css`
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          padding: 1rem;
          background: ${WHITE};
          border: 1px solid ${BORDER};
          border-radius: ${BORDER_RADIUS};

          ${mediaMaxWidth(SM)} {
            flex-direction: column;
          }
        `}
      >
        <EmptyState name="empty_cart_two" />
        <div
          style={{
            padding: '1rem',
          }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Subtitle>Your cart is empty</Subtitle>
          <Text $isGray>
            To add tickets to your cart, visit the event page and select the
            tickets you wish to purchase. If you believe this is an error,
            please contact support at
            <a href="mailto:contact@pennlabs.org" className="ml-1">
              contact@pennlabs.org
            </a>
            .
          </Text>
        </div>
      </div>
    )
  }
  return (
    <>
      {/* Hidden form for CyberSource Secure Acceptance redirect */}
      <form
        ref={formRef}
        action={cybersourceUrl}
        method="POST"
        style={{ display: 'none' }}
      >
        {Object.entries(paymentParams).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
      </form>
      <div>
        <Modal show={removeModal !== null}>
          <ModalContent>
            <Subtitle>Remove Ticket</Subtitle>
            <p>
              Are you sure you want to remove this ticket for{' '}
              {removeModal?.event.name}?
            </p>
            <div className="buttons">
              <button
                className="button is-danger"
                onClick={() => {
                  handleUpdateTicket(removeModal!)
                  setRemoveModal(null)
                }}
              >
                Remove
              </button>
              <button
                className="button"
                onClick={() => {
                  setRemoveModal(null)
                }}
              >
                Cancel
              </button>
            </div>
          </ModalContent>
        </Modal>
        <div>
          {countedTickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              hideActions
              removable
              editable={!ticket.pendingEdit && !isProcessing}
              onChange={(count, propogateCount) => {
                handleUpdateTicket(ticket, count, propogateCount)
              }}
              onRemove={() => {
                setRemoveModal(ticket)
              }}
            />
          ))}
        </div>
        <Summary tickets={countedTickets} />
        <button
          className={`button is-primary is-fullwidth mt-4 ${isProcessing ? 'is-loading' : ''}`}
          onClick={() => {
            handleInitiateCheckout()
          }}
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Proceed to Checkout'}
        </button>
      </div>
    </>
  )
}

export default CartTickets
