import React, { ReactElement, useEffect, useState } from 'react'
import { toast, TypeOptions } from 'react-toastify'
import styled from 'styled-components'

import {
  ALLBIRDS_GRAY,
  CLUBS_GREY,
  FOCUS_GRAY,
  WHITE,
} from '../../constants/colors'
import { BORDER_RADIUS } from '../../constants/measurements'
import { BODY_FONT } from '../../constants/styles'
import { ClubEvent } from '../../types'
import { SearchInput } from '../SearchBar'

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

const TicketTransferModal = (props: {
  event: ClubEvent | null
}): ReactElement => {
  const [searchInput, setSearchInput] = useState<SearchInput>({})

  const search = () => {
    /*
    return doApiRequest('/users?search=bfranklin')
      .then((resp) => resp.json())
      .then(() => {})
    */
  }
  useEffect(() => {
    search()
  }, [])
  /*    
      <CoverPhoto
        image={large_image_url ?? image_url}
        fallback={
          <p>{club_name != null ? club_name.toLocaleUpperCase() : 'Event'}</p>
        }
      />

      <Title>{name}</Title>
      */

  return (
    <ModalContainer>
      <ModalBody></ModalBody>
    </ModalContainer>
  )
}

export default TicketTransferModal
