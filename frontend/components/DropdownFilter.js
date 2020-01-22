import s from 'styled-components'
import {
  CLUBS_GREY,
  CLUBS_GREY_LIGHT,
  CLUBS_BLUE,
  CLUBS_RED,
  CLUBS_YELLOW,
  BORDER,
  LIGHT_GRAY,
  WHITE,
} from '../constants/colors'
import {
  mediaMinWidth,
  mediaMaxWidth,
  MD,
  SEARCH_BAR_MOBILE_HEIGHT,
  NAV_HEIGHT,
  ANIMATION_DURATION,
} from '../constants/measurements'
import { logEvent } from '../utils/analytics'
import { Icon } from './common'

// Helper map for getting icon posftix from icon name
const colorToColorNameMap = {
  [CLUBS_BLUE]: '-blue',
  [CLUBS_RED]: '-red',
  [CLUBS_YELLOW]: '-yellow',
}

const checkboxColorMap = {
  Type: CLUBS_BLUE,
  Size: CLUBS_RED,
  Application: CLUBS_YELLOW,
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
    display: inline-block;
    width: auto;
    border: 2px solid ${BORDER};
    padding: 4px 8px;
    margin-right: 6px;
    border-radius: 16px;
    font-size: 80%;
    color: ${LIGHT_GRAY};

    ${({ active, color }) => active && `background: ${color || CLUBS_YELLOW};`}
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

const DropdownHeaderIcon = s.span`
  cursor: pointer;
  color: ${CLUBS_GREY};
  transform: rotate(0deg) translateY(0);
  transition: transform ${ANIMATION_DURATION}ms ease;

  ${({ active }) => active && 'transform: rotate(180deg) translateY(-4px);'}

  ${mediaMaxWidth(MD)} {
    display: none !important;
  }
`

const DropdownHeaderText = s.p`
  opacity: 0.8;
  font-weight: 600;
  margin-bottom: 0;

  ${mediaMaxWidth(MD)} {
    color: rgba(0, 0, 0, 0.5);
    opacity: 1;
  }
`

const CloseWrapper = s.div`
  float: right;
  ${mediaMinWidth(MD)} {
    display: none !important;
  }
`

export const CloseButton = ({ onClick }) => (
  <CloseWrapper>
    <DropdownHeader
      style={{ marginRight: 0 }}
      onClick={onClick}
      color={LIGHT_GRAY}
    >
      <DropdownHeaderText>
        <Icon name="x" alt="&#215;" />
      </DropdownHeaderText>
    </DropdownHeader>
  </CloseWrapper>
)

const Chevron = ({ active }) => (
  <DropdownHeaderIcon className="icon" active={active}>
    <Icon name="chevron-down" alt="toggle dropdown" />
  </DropdownHeaderIcon>
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
  const iconPostfix = colorToColorNameMap[color] || ''

  return (
    <>
      <Line />
      <DropdownHeader
        onClick={() => toggleActive()}
        active={active}
        color={color}
      >
        <DropdownHeaderText>{name}</DropdownHeaderText>
        <Chevron active={active} />
      </DropdownHeader>
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
                      style={{ transform: 'none' }}
                      name={
                        isSelected(tag)
                          ? `check-box${iconPostfix}`
                          : `box${iconPostfix}`
                      }
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
