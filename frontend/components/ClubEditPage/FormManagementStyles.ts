import styled from 'styled-components'

import { ALLBIRDS_GRAY, CLUBS_BLUE, MD, mediaMaxWidth, SNOW } from '~/constants'

/**
 * Layout primitives shared by the club-edit pages that manage question-based
 * forms (applications and subscription forms). Both screens present the same
 * shape — a titled header with a right-aligned tool slot, a list of clickable
 * form rows, and modal bodies — so the styles live here rather than being
 * duplicated per page.
 */

export const StyledHeader = styled.div.attrs({ className: 'is-clearfix' })`
  margin-bottom: 20px;
  color: ${CLUBS_BLUE};
  font-size: 18px;
  & > .info {
    float: left;
  }
  .tools {
    float: right;
    margin: 0;
    margin-left: auto;
    & > div {
      margin-left: 20px;
      display: inline-block;
    }
  }

  ${mediaMaxWidth(MD)} {
    .tools {
      margin-top: 20px;
    }
  }
`

export const FormWrapper = styled.div`
  border-bottom: 1px solid ${ALLBIRDS_GRAY};
  padding: 12px;
  cursor: pointer;

  &:hover,
  &:active,
  &:focus {
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.2);
    background-color: ${SNOW};
  }
`

export const ModalContainer = styled.div`
  text-align: left;
  padding: 20px;
`

/**
 * Flips the scroll container so its horizontal scrollbar sits above the table.
 * The content inside MUST be counter-rotated by a second wrapper, or it renders
 * upside down — see ApplicationsPage's TableWrapper. Prefer TableScroll below
 * unless you specifically want the scrollbar on top.
 */
export const ScrollWrapper = styled.div`
  transform: rotateX(180deg);
  -ms-transform: rotateX(180deg); /* IE 9 */
  -webkit-transform: rotateX(180deg);
  overflow-y: auto;
  margin-top: 1rem;
`

/** Plain horizontal scroll container for wide tables. */
export const TableScroll = styled.div`
  overflow-x: auto;
  margin-top: 1rem;
`
