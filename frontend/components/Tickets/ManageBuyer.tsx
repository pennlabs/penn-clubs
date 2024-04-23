import { useState } from 'react'

import { Buyer } from '~/pages/tickets/[[...slug]]'

import { Checkbox } from '../common'

type BuyerProps = {
  buyer: Buyer
  onAttendedChange: (bool) => void
}

const ManageBuyer = ({ buyer, onAttendedChange }: BuyerProps) => {
  const [attended, setAttended] = useState(false) // Change to buyer.attended once backend is updated
  return (
    <>
      <span>
        <Checkbox
          checked={attended}
          onChange={(e) => {
            e.stopPropagation()
            onAttendedChange(!attended)
            setAttended(!attended)
          }}
        />
      </span>
      <span>{buyer.fullname}</span>
      <span>{buyer.type}</span>
    </>
  )
}

export default ManageBuyer
