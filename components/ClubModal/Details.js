import React from 'react'
import { CLUBS_GREY } from '../../colors'
import s from 'styled-components'

const Details = s.div`
  border-radius: 3px;
  background-color: #f2f2f2;
  height: 100px;
  width: 330px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
`

const Detail = s.div`
  display: flex;
  justify-content: space-between;
`

const DetailTag = s.span`
  margin: 3px;
  color: ${CLUBS_GREY};
  background-color: #ccc;
  font-size: .7em;
`

export default ({ size, application_required, accepting_applications }) => (
  <Details>
    <Detail>
      <b style={{ color: CLUBS_GREY }} className="is-size-6">Membership:</b>
      <DetailTag className="tag is-rounded">{size}</DetailTag>
    </Detail>

    <Detail>
      <b style={{ color: CLUBS_GREY }} className="is-size-6">Requires Application:</b>
      <DetailTag className="tag is-rounded">
        {application_required ? 'Yes' : 'No'}
      </DetailTag>
    </Detail>

    <Detail>
      <b style={{ color: CLUBS_GREY }} className="is-size-6">Currently Recruiting:</b>
      <DetailTag className="tag is-rounded">
        {accepting_applications ? 'Yes' : 'No'}
      </DetailTag>
    </Detail>
  </Details>
)
