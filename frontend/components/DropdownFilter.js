import s from 'styled-components'
import {
  CLUBS_GREY,
  CLUBS_GREY_LIGHT,
  CLUBS_BLUE,
  CLUBS_RED,
  BORDER,
  LIGHT_GRAY,
  WHITE,
  CLUBS_NAVY,
} from '../constants/colors'
import {
  mediaMaxWidth,
  MD,
  SEARCH_BAR_MOBILE_HEIGHT,
  NAV_HEIGHT,
  ANIMATION_DURATION,
} from '../constants/measurements'
import { logEvent } from '../utils/analytics'
import { Icon } from './common'

const checkboxColorMap = {
  Tags: CLUBS_BLUE,
  Size: CLUBS_NAVY,
  Application: CLUBS_RED,
}

const Line = s.hr`
  background-color: ${BORDER};
  height: 2px;
  margin: 0;
  margin-top: 30px;
  padding: 0;

  ${mediaMaxWidth(MD)} {
    display: none !important;
  }
`

const DropdownHeader = s.div`
  display: flex;
  justify-content: space-between;
  padding: 7px 3px;
  cursor: pointer;

  ${mediaMaxWidth(MD)} {
    display: inline-flex;
    padding: 4px 8px;
    margin-right: 6px;
    border-radius: 16px;
    font-size: 80%;
    color: ${LIGHT_GRAY};
  }
`

const TableRow = s.tr`
  padding-top: 3px;
  cursor: pointer;
`

const TableWrapper = s.div`
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: all ${ANIMATION_DURATION}ms ease;

  ${({ active }) => active && 'max-height: 150vh; opacity: 1;'}

  ${mediaMaxWidth(MD)} {
    position: fixed;
    left: 0;
    width: 100%;
    top: calc(${SEARCH_BAR_MOBILE_HEIGHT} + ${NAV_HEIGHT});
    background: ${WHITE};
    height: calc(100vh - ${SEARCH_BAR_MOBILE_HEIGHT} - ${NAV_HEIGHT});
    ${({ active }) =>
      active &&
      `
      overflow-y: auto;
      max-height: calc(100vh - ${SEARCH_BAR_MOBILE_HEIGHT} - ${NAV_HEIGHT});`}
  }
`

const TableContainer = s.div`
  ${mediaMaxWidth(MD)} {
    padding: 1rem;
  }
`

const Chevron = s(Icon)`
  cursor: pointer;
  color: ${CLUBS_GREY};
  transform: rotate(0deg) translateY(0);
  transition: transform ${ANIMATION_DURATION}ms ease;
  ${({ open }) => open && 'transform: rotate(180deg) translateY(-4px);'}

  ${mediaMaxWidth(MD)} {
    margin-top: .1em !important;
    margin-left: .1em !important;
    color: ${LIGHT_GRAY};
    ${({ open }) => open && 'transform: rotate(180deg)'}
  }
`

const DropdownHeaderText = s.p`
  opacity: 0.8;
  font-weight: 600;
  margin-bottom: 0;
`

// TODO: export out into seperate component?
export const FilterHeader = ({ active, name, toggleActive }) => (
  <>
    <Line />
    <DropdownHeader onClick={() => toggleActive()}>
      <DropdownHeaderText active={active}>{name}</DropdownHeaderText>
      <Chevron
        name="chevron-down"
        alt="toggle dropdown"
        open={active}
        size="1rem"
      />
    </DropdownHeader>
  </>
)

const DropdownFilter = ({
  selected,
  name,
  options,
  updateTag,
  active,
  toggleActive,
}) => {
  /**
   * Returns if the supplied tag is in the list of selected tags
   *
   * @param {{value: string}} tag
   */
  const isSelected = tag => {
    const { value } = tag
    return Boolean(selected.find(tag => tag.value === value))
  }

  const color = checkboxColorMap[name]

  return (
    <>
      <FilterHeader active={active} name={name} toggleActive={toggleActive} />
      <TableWrapper active={active}>
        <TableContainer>
          <table>
            <tbody>
              {options.map(tag => (
                <TableRow
                  key={tag.label}
                  onClick={() => {
                    logEvent('filter', name)
                    updateTag(tag, name)
                  }}
                >
                  <td
                    className="icon"
                    style={{
                      color: color || CLUBS_GREY_LIGHT,
                    }}
                  >
                    <Icon
                      style={{ transform: 'none', fill: color }}
                      name={isSelected(tag) ? 'check-box' : 'box'}
                      alt={isSelected(tag) ? 'selected' : 'not selected'}
                    />
                    &nbsp;
                  </td>
                  <td style={{ color: CLUBS_GREY_LIGHT }}>
                    <p style={{ marginBottom: '3px' }}>
                      {tag.label}
                      {typeof tag.count !== 'undefined' && (
                        <span className="has-text-grey"> ({tag.count})</span>
                      )}
                    </p>
                  </td>
                </TableRow>
              ))}
            </tbody>
          </table>
        </TableContainer>
      </TableWrapper>
    </>
  )
}

export default DropdownFilter
