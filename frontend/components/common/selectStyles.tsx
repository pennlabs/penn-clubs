import { components } from 'react-select'

const Chevron = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

export const selectComponents = {
  IndicatorSeparator: () => null,
  DropdownIndicator: (props) => (
    <components.DropdownIndicator {...props}>
      <Chevron />
    </components.DropdownIndicator>
  ),
}

type SelectLook = {
  background?: string
  minHeight?: number
  radius?: number
  fontSize?: string
}

const makeSelectStyles = ({
  background = '#f3f3f3',
  minHeight = 38,
  radius = 10,
  fontSize = '0.875rem',
}: SelectLook = {}) => ({
  container: (style) => ({ ...style, width: '100%' }),
  control: (style, state) => ({
    ...style,
    minHeight,
    height: minHeight,
    borderRadius: radius,
    borderColor: state.isFocused ? '#4954f4' : '#d8d8d8',
    boxShadow: 'none',
    backgroundColor: background,
    fontSize,
  }),
  valueContainer: (style) => ({
    ...style,
    padding: '0 8px',
    height: minHeight - 2,
  }),
  dropdownIndicator: (style) => ({
    ...style,
    padding: '0 10px',
    color: '#757575',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }),
  indicatorsContainer: (style) => ({
    ...style,
    height: minHeight - 2,
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
  singleValue: (style) => ({
    ...style,
    color: '#1f2049',
    margin: 0,
  }),
  menu: (style) => ({
    ...style,
    marginTop: 4,
    marginBottom: 0,
    borderRadius: 6,
    border: '1px solid #dbdbdb',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
    zIndex: 80,
  }),
  menuList: (style) => ({
    ...style,
    paddingTop: 0,
    paddingBottom: 0,
  }),
  menuPortal: (style) => ({ ...style, zIndex: 80 }),
  option: (style, state) => ({
    ...style,
    fontSize,
    backgroundColor: state.isSelected
      ? '#4954f4'
      : state.isFocused
        ? '#eef0fe'
        : '#fff',
    color: state.isSelected ? '#fff' : '#1f2049',
  }),
})

export const selectMenuStyles = makeSelectStyles()

export const selectMenuStylesWhite = makeSelectStyles({
  background: '#fff',
})

export const selectCompactStyles = makeSelectStyles({
  background: '#fff',
  minHeight: 32,
  radius: 8,
  fontSize: '0.8125rem',
})

export const selectMenuPortalTarget =
  typeof document !== 'undefined' ? document.body : undefined
