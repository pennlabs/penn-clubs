import { useState } from 'react'
import { toast } from 'react-toastify'

import { Buyer } from '~/pages/events/[id]/tickets/[showing-id]'

import { Checkbox } from '../common'

type BuyerProps = {
  buyer: Buyer
  onAttendedChange: (bool) => void
}

const ManageBuyer = ({ buyer, onAttendedChange }: BuyerProps) => {
  const [attended, setAttended] = useState(buyer.attended)
  return (
    <>
      <span>
        <Checkbox
          checked={attended}
          onChange={(e) => {
            e.stopPropagation()
            if (attended) {
              toast(
                <div style={{ display: 'inline-flex', width: '300px' }}>
                  <p>
                    Are you sure you want to mark {buyer.fullname} as not
                    attended?
                  </p>
                  <button
                    className="button"
                    style={{ marginRight: '10px', alignSelf: 'center' }}
                    onClick={() => {
                      onAttendedChange(!attended)
                      setAttended(!attended)
                      toast.dismiss()
                    }}
                  >
                    Yes
                  </button>
                  <p
                    style={{
                      cursor: 'pointer',
                      position: 'absolute',
                      right: '4px',
                      top: '0px',
                    }}
                    onClick={() => {
                      toast.dismiss()
                    }}
                  >
                    x
                  </p>
                </div>,
                { autoClose: false },
              )
            } else {
              onAttendedChange(!attended)
              setAttended(!attended)
            }
          }}
        />
      </span>
      <span>{buyer.fullname}</span>
      <span>{buyer.type}</span>
    </>
  )
}

export default ManageBuyer
