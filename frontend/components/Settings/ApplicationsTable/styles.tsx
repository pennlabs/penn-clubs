import styled from 'styled-components'

import { Text } from '~/components/common'
import {
  ALLBIRDS_GRAY,
  BORDER,
  CLUBS_BLUE,
  CLUBS_LIGHT_BLUE,
  CLUBS_NAVY,
  LIGHT_GRAY,
  MEDIUM_GRAY,
} from '~/constants/colors'
import { BORDER_RADIUS } from '~/constants/measurements'

// shared by the application tracker and the submissions list

export const Blurb = styled(Text)`
  font-size: 0.9375rem;
  margin-bottom: 1.25rem;
`

/** Filter chips on the left, search on the right, on one line. */
export const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`

export const Search = styled.div`
  margin-left: auto;
  position: relative;

  & input {
    padding-left: 2.25rem;
    min-width: 15rem;
  }

  & span {
    position: absolute;
    left: 0.7rem;
    top: 50%;
    transform: translateY(-50%);
    color: ${LIGHT_GRAY};
    pointer-events: none;
  }
`

export const Chip = styled.button<{ $on?: boolean }>`
  height: 2.2em;
  padding: 0 0.85em;
  border-radius: ${BORDER_RADIUS};
  border: 1px solid ${({ $on }) => ($on ? 'transparent' : '#dbdbdb')};
  background: ${({ $on }) => ($on ? CLUBS_LIGHT_BLUE : 'white')};
  color: ${({ $on }) => ($on ? CLUBS_BLUE : '#4a4a4a')};
  font-weight: ${({ $on }) => ($on ? 600 : 500)};
  font-size: 0.8125rem;
  cursor: pointer;
`

export const Scroll = styled.div`
  overflow-x: auto;
`

/**
 * Fixed layout so a column never resizes when the filter changes the mix of
 * action buttons in a cell. Widths are declared once, in Cols below.
 */
export const Table = styled.table`
  width: 100%;
  min-width: 56rem;
  table-layout: fixed;
  border-collapse: collapse;
  background: white;
  color: #363636;
  font-size: 0.875rem;

  & th,
  & td {
    border-bottom: 1px solid #dbdbdb;
    padding: 0.65em 0.75em;
    vertical-align: middle;
    text-align: left;
  }

  & thead th {
    border-bottom-width: 2px;
    font-size: 0.6875rem;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: ${MEDIUM_GRAY};
    white-space: nowrap;
  }

  & tbody tr:hover {
    background: #fafcff;
  }
`

export const AppCell = styled.span`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
`

export const AppName = styled.span`
  font-weight: 600;
  color: ${CLUBS_NAVY};
`

export const ClubName = styled.span`
  font-size: 0.8125rem;
  color: ${MEDIUM_GRAY};
`

export const NoneCell = styled.span`
  color: ${LIGHT_GRAY};
`

export const Tag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  max-width: 100%;
  height: 2em;
  padding: 0 0.75em;
  border-radius: ${BORDER_RADIUS};
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.5;
  white-space: nowrap;
  background: ${ALLBIRDS_GRAY};
  color: ${MEDIUM_GRAY};

  & svg {
    margin: 0;
  }
`

/**
 * A committee's name has no length limit, and this table is table-layout:
 * fixed, so an unclipped tag doesn't get pushed onto a new line the way it
 * would in normal flow -- it just draws past the cell edge, over whatever is
 * in the next column. min-width: 0 is what lets a flex child shrink below
 * its content size at all; without it text-overflow never gets a chance to
 * apply.
 */
export const TagLabel = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

/**
 * The committee a submission belongs to. A label, not a link — the Edit button
 * in the same row already goes to that committee's form.
 */
export const CommitteeTag = styled(Tag)`
  background: ${CLUBS_LIGHT_BLUE};
  color: ${CLUBS_BLUE};
`

export const DangerTag = styled(Tag)`
  background: #feecf0;
  color: #cc0f35;
`

export const WarningTag = styled(Tag)`
  background: #fffaeb;
  color: #946c00;
`

export const InfoTag = styled(Tag)`
  background: #eff5fb;
  color: #296fa8;
`

export const SuccessTag = styled(Tag)`
  background: #effaf5;
  color: #257953;
`

/** Status tag with the submitted date beneath it. */
export const StatusCell = styled.span`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.2rem;
`

export const Deadline = styled.span`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  white-space: nowrap;
`

export const Relative = styled.span<{ $tone?: string }>`
  font-weight: 600;
  color: ${({ $tone }) => $tone ?? '#363636'};
`

export const Absolute = styled.span`
  font-size: 0.75rem;
  color: ${LIGHT_GRAY};
`

export const Progress = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: ${MEDIUM_GRAY};
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`

export const Track = styled.span`
  width: 64px;
  height: 5px;
  border-radius: 3px;
  background: #e6e9f2;
  overflow: hidden;
  flex: none;
`

export const Fill = styled.span<{ $pct: number; $done: boolean }>`
  display: block;
  height: 100%;
  border-radius: 3px;
  width: ${({ $pct }) => $pct}%;
  background: ${({ $done }) => ($done ? '#3eaa6d' : CLUBS_BLUE)};
`

export const Actions = styled.span`
  display: flex;
  gap: 0.25rem;
  justify-content: flex-end;
  white-space: nowrap;
`

/**
 * Rows inside one application are separated with a hairline; the last row of
 * each application keeps the full rule, so a two-committee application still
 * reads as one block.
 */
export const Row = styled.tr<{ $last?: boolean }>`
  & > td {
    border-bottom-color: ${({ $last }) => ($last ? '#dbdbdb' : '#f1f3f7')};
  }
`

export const Disclosure = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid ${ALLBIRDS_GRAY};
  color: ${MEDIUM_GRAY};
  cursor: pointer;
  user-select: none;
`

export const DiscTitle = styled.span`
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
`

export const PastTable = styled.div`
  margin-top: 1rem;
`

export const Empty = styled.div`
  background: white;
  border: 1px solid ${BORDER};
  border-radius: ${BORDER_RADIUS};
  padding: 2.5rem;
  text-align: center;
`
