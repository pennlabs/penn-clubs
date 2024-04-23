import { Buyer } from '~/pages/tickets/[[...slug]]'

type BuyerProps = {
  buyer: Buyer
}

const ManageBuyer = ({ buyer }: BuyerProps) => {
  return (
    <>
      <li style={{ marginLeft: '16px' }}>
        {buyer.fullname} - {buyer.type}
      </li>
    </>
  )
}

export default ManageBuyer
