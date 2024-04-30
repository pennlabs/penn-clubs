import { ReactElement, useEffect, useState } from 'react'

import { doApiRequest } from '~/utils'

import BaseCard from '../ClubEditPage/BaseCard'

type TicketTransferModalProps = {
  id: string
  onSuccessfulTransfer: (id: string) => void
}

const TicketTransferModal = ({
  id,
  onSuccessfulTransfer,
}: TicketTransferModalProps): ReactElement => {
  const [recipient, setRecipient] = useState<string | undefined>()
  const [recipientError, setRecipientError] = useState<string | undefined>()

  useEffect(() => {
    setRecipientError(undefined)
  }, [id])

  function transferTicket() {
    if (!recipient) {
      setRecipientError('Recipient PennKey is required')
      return
    }
    setRecipientError(undefined)
    doApiRequest(`/tickets/${id}/transfer/?format=json`, {
      method: 'POST',
      body: { username: recipient },
    }).then(async (resp) => {
      if (resp.ok) {
        onSuccessfulTransfer(id)
      } else {
        setRecipientError((await resp.json()).detail)
      }
    })
  }

  return (
    <BaseCard title="Ticket Transfer">
      <p className="has-text-info" style={{ marginBottom: '10px' }}>
        Recipient must have a Penn Clubs account.
      </p>
      <input
        className="input"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        onKeyUp={(e) => {
          if (e.key === 'Enter') {
            transferTicket()
          }
        }}
        placeholder="Recipient PennKey"
      />
      {recipientError && <p className="has-text-danger">{recipientError}</p>}
      <button
        className="button is-success"
        onClick={transferTicket}
        style={{ marginTop: '15px' }}
      >
        Transfer Ticket
      </button>
    </BaseCard>
  )
}

export default TicketTransferModal
