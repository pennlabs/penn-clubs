export const selectComponents = {
  IndicatorSeparator: () => null,
}

export const selectMenuStyles = {
  container: (style) => ({ ...style, width: '100%' }),
  control: (style, state) => ({
    ...style,
    minHeight: 38,
    borderRadius: 10,
    borderColor: state.isFocused ? '#4954f4' : '#d8d8d8',
    boxShadow: 'none',
    backgroundColor: '#f3f3f3',
    fontSize: '0.875rem',
  }),
  valueContainer: (style) => ({
    ...style,
    padding: '2px 8px',
  }),
  dropdownIndicator: (style) => ({
    ...style,
    padding: '8px 10px',
    color: '#757575',
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
  menu: (style) => ({
    ...style,
    marginTop: 0,
    marginBottom: 0,
    borderRadius: 6,
    border: '1px solid #dbdbdb',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
    zIndex: 30,
  }),
  menuList: (style) => ({
    ...style,
    paddingTop: 0,
    paddingBottom: 0,
  }),
  menuPortal: (style) => ({ ...style, zIndex: 30 }),
  option: (style, state) => ({
    ...style,
    fontSize: '0.875rem',
    backgroundColor: state.isSelected
      ? '#4954f4'
      : state.isFocused
        ? '#eef0fe'
        : '#fff',
    color: state.isSelected ? '#fff' : '#1f2049',
  }),
}

export const selectMenuPortalTarget =
  typeof document !== 'undefined' ? document.body : undefined
