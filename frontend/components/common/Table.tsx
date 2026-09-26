import {
  ReactElement,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd'
import { createPortal } from 'react-dom'
import Select from 'react-select'
import {
  useFilters,
  useGlobalFilter,
  usePagination,
  useSortBy,
  useTable,
} from 'react-table'
import styled from 'styled-components'

import {
  ALLBIRDS_GRAY,
  BORDER,
  CLUBS_GREY,
  FOCUS_GRAY,
  HOVER_GRAY,
  SNOW,
  WHITE,
} from '../../constants/colors'
import { BORDER_RADIUS, MD, mediaMaxWidth } from '../../constants/measurements'
import { BODY_FONT } from '../../constants/styles'
import { titleize } from '../../utils'
import { Icon } from '.'

const TABLE_LINE = '#dbdbdb'

const styles = {
  control: ({ background, ...base }) => {
    return {
      ...base,
      border: `1px solid ${BORDER}`,
      boxShadow: 'none',
      width: '100%',
    }
  },
  option: ({ background, ...base }, { isFocused, isSelected }) => {
    const isEmphasized = isFocused || isSelected
    return {
      ...base,
      background: isEmphasized ? FOCUS_GRAY : background,
      color: CLUBS_GREY,
    }
  },
}

const FocusableTr = styled.tr`
  cursor: pointer;
  &:hover,
  &:active,
  &:focus {
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.2);
    background-color: ${SNOW};
  }
`

type Option = {
  label: string
  key: any
}

type FilterOption = {
  options: Option[]
  label: string
  filterFunction: (a, b) => boolean
}

type Row = { [key: string]: any }

type tableProps = {
  columns: Row[]
  data: Row[]
  searchableColumns: string[]
  filterOptions?: FilterOption[]
  focusable?: boolean
  hideSearch?: boolean
  onClick?: (row: any, event: any) => void
  draggable?: boolean
  onDragEnd?: (result: any) => void | null | undefined
  initialPage?: number
  setInitialPage?: (page: number) => void
  initialPageSize?: number
  onFilteredDataChange?: (rows: Row[]) => void
}

const Styles = styled.div`
  width: 100%;
  font-size: 0.875rem;
  margin-bottom: 1rem;
`

const SearchWrapper = styled.div`
  overflow: visible;
  margin: 0px;
  min-width: 14rem;
  ${mediaMaxWidth(MD)} {
    width: 100%;
    margin: 0;
  }
`

const Toolbar = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  background: ${WHITE};
  border-bottom: 1px solid ${TABLE_LINE};
  padding: 0.75rem;
`

const ToolbarLeft = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
`

const Input = styled.input`
  border: 1px solid ${ALLBIRDS_GRAY};
  outline: none;
  color: ${CLUBS_GREY};
  width: 100%;
  font-size: 0.875rem;
  padding: 8px 10px;
  background: ${WHITE};
  border-radius: ${BORDER_RADIUS};
  font-family: ${BODY_FONT};

  &:hover,
  &:active,
  &:focus {
    background: ${FOCUS_GRAY};
  }
`

const ColumnsWrap = styled.div`
  position: relative;
  flex-shrink: 0;
  margin-left: auto;
`

const ColumnsButton = styled.button`
  appearance: none;
  background: ${WHITE};
  border: 1px solid ${TABLE_LINE};
  border-radius: 6px;
  color: #24292f;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-family: ${BODY_FONT};
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0.45rem 0.7rem;

  &:hover {
    background: ${HOVER_GRAY};
  }
`

const ColumnsMenu = styled.div<{ $top: number; $left: number }>`
  position: fixed;
  top: ${({ $top }) => $top}px;
  left: ${({ $left }) => $left}px;
  z-index: 1100;
  min-width: 14rem;
  background: ${WHITE};
  border: 1px solid ${TABLE_LINE};
  border-radius: 6px;
  padding: 0.4rem 0;
`

const ColumnsItem = styled.label<{ $locked?: boolean }>`
  align-items: center;
  color: #24292f;
  cursor: ${({ $locked }) => ($locked ? 'default' : 'pointer')};
  display: flex;
  font-size: 0.875rem;
  gap: 0.5rem;
  opacity: ${({ $locked }) => ($locked ? 0.7 : 1)};
  padding: 0.4rem 0.85rem;

  &:hover {
    background: ${HOVER_GRAY};
  }

  input {
    margin: 0;
  }
`

const TableFrame = styled.div`
  background: ${WHITE};
  border: 1px solid ${TABLE_LINE};
  border-radius: 6px;
  box-shadow: none;
  overflow: hidden;
`

const TableScroll = styled.div`
  overflow-x: auto;
  width: 100%;

  table.table {
    background: ${WHITE};
    margin-bottom: 0;
    min-width: 100%;
    width: max-content;
  }

  table.table th,
  table.table td {
    border-color: ${TABLE_LINE};
    font-size: 0.875rem;
    vertical-align: middle;
    white-space: nowrap;
  }

  table.table thead th {
    background: ${WHITE};
    color: #57606a;
    font-weight: 600;
    user-select: none;
  }

  table.table thead th[data-sortable='true'] {
    cursor: pointer;
  }
`

const EmptyCell = styled.td`
  color: #57606a;
  font-size: 0.875rem;
  padding: 1rem 0.75rem !important;
`

const SortPair = styled.span<{ $active?: boolean }>`
  display: inline-flex;
  flex-direction: column;
  margin-left: 0.4rem;
  vertical-align: middle;
  color: ${({ $active }) => ($active ? '#24292f' : '#c4c4c4')};
  line-height: 0;
`

const Footer = styled.div`
  align-items: center;
  background: ${WHITE};
  border-top: 1px solid ${TABLE_LINE};
  display: flex;
  flex-wrap: wrap;
  font-size: 0.875rem;
  gap: 0.75rem;
  justify-content: space-between;
  padding: 0.75rem;
`

const FooterLeft = styled.div`
  align-items: center;
  color: #57606a;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`

const FooterRight = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
`

const FooterButton = styled.button`
  appearance: none;
  background: ${WHITE};
  border: 1px solid ${TABLE_LINE};
  border-radius: 6px;
  color: #24292f;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  font-family: ${BODY_FONT};
  font-size: 0.875rem;
  height: 2rem;
  justify-content: center;
  min-width: 2rem;
  padding: 0 0.45rem;

  &:hover:not(:disabled) {
    background: ${HOVER_GRAY};
  }

  &:disabled {
    cursor: default;
    opacity: 0.45;
  }
`

const FooterSelect = styled.select`
  appearance: auto;
  background: ${WHITE};
  border: 1px solid ${TABLE_LINE};
  border-radius: 6px;
  color: #24292f;
  font-family: ${BODY_FONT};
  font-size: 0.875rem;
  height: 2rem;
  padding: 0 0.45rem;
`

const PAGE_SIZES = [10, 25, 50, 100]

function isLockedColumn(name?: string, label?: string): boolean {
  return (
    (name || '').toLowerCase() === 'actions' ||
    (label || '').toLowerCase() === 'actions'
  )
}

function columnLabel(column: Row): string {
  return titleize(column.label ?? column.name ?? '')
}

const SortIndicator = ({
  isSorted,
  isSortedDesc,
}: {
  isSorted: boolean
  isSortedDesc?: boolean
}): ReactElement<any> => {
  return (
    <SortPair $active={isSorted} aria-hidden="true">
      <Icon
        name="chevron-up"
        size="0.55rem"
        style={{
          opacity: isSorted && !isSortedDesc ? 1 : 0.35,
          display: 'block',
        }}
      />
      <Icon
        name="chevron-down"
        size="0.55rem"
        style={{
          marginTop: '-2px',
          opacity: isSorted && isSortedDesc ? 1 : 0.35,
          display: 'block',
        }}
      />
    </SortPair>
  )
}

const Table = ({
  columns,
  data,
  searchableColumns,
  filterOptions,
  focusable,
  onClick,
  hideSearch = false,
  draggable = false,
  onDragEnd,
  initialPage = 0,
  setInitialPage,
  initialPageSize = 10,
  onFilteredDataChange,
}: tableProps): ReactElement<any> => {
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [tableData, setTableData] = useState<Row[]>([])
  const [selectedFilter, setSelectedFilter] = useState<any>({})
  const [hiddenColumns, setHiddenColumns] = useState<Record<string, boolean>>(
    {},
  )
  const [columnsOpen, setColumnsOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const columnsRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const searchedData = data.filter((item) => {
      if (!searchQuery || searchQuery.length < 3) {
        return true
      }
      return searchableColumns.some((searchId) => {
        const raw = item[searchId]
        const value = raw == null ? '' : String(raw)
        const strings = value.split(' ')
        return strings.some((string) =>
          string.toLowerCase().startsWith(searchQuery.toLowerCase()),
        )
      })
    })
    const filteredData = searchedData.filter((item) => {
      let valid = true
      if (filterOptions) {
        for (const filter in selectedFilter) {
          const original = filterOptions.filter((i) => i.label === filter)[0]
          if (
            selectedFilter[filter] != null &&
            !original.filterFunction(selectedFilter[filter].value, item)
          )
            valid = false
        }
      }
      return valid
    })
    setTableData(filteredData)
    if (onFilteredDataChange) {
      onFilteredDataChange(filteredData)
    }
  }, [searchQuery, selectedFilter, data])

  const visibleColumnDefs = useMemo(
    () =>
      columns.filter((column) => {
        if (isLockedColumn(column.name, column.label)) {
          return true
        }
        return !hiddenColumns[column.name]
      }),
    [columns, hiddenColumns],
  )

  const memoColumns = useMemo(
    () =>
      visibleColumnDefs.map(({ label, name }) => ({
        Header: label ?? name,
        accessor: name,
        disableSortBy: isLockedColumn(name, label),
      })),
    [visibleColumnDefs],
  )

  const filterTypes = useMemo(
    () => ({
      text: (rows, id, filterValue) => {
        return rows.filter((row) => {
          const rowValue = row.values[id]
          return rowValue !== undefined
            ? String(rowValue)
                .toLowerCase()
                .startsWith(String(filterValue).toLowerCase())
            : true
        })
      },
    }),
    [],
  )

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    nextPage,
    pageCount,
    previousPage,
    gotoPage,
    setPageSize,
    pageOptions,
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns: memoColumns,
      data: tableData,
      autoResetSortBy: false,
      filterTypes,
      initialState: { pageIndex: initialPage, pageSize: initialPageSize },
    },
    useFilters,
    useGlobalFilter,
    useSortBy,
    usePagination,
  )

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
  }

  const components = {
    IndicatorSeparator: () => null,
  }

  const handleFilterChange = (newFilter) => {
    const newFilters = { ...selectedFilter }
    newFilters[newFilter.label] = newFilter.value
    setSelectedFilter(newFilters)
  }

  const updateMenuPos = () => {
    const button = columnsRef.current
    if (!button) {
      return
    }
    const rect = button.getBoundingClientRect()
    const width = 224
    const left = Math.min(
      Math.max(8, rect.right - width),
      window.innerWidth - width - 8,
    )
    setMenuPos({
      top: rect.bottom + 4,
      left,
    })
  }

  useLayoutEffect(() => {
    if (!columnsOpen) {
      return
    }
    updateMenuPos()
    const onReposition = () => updateMenuPos()
    window.addEventListener('resize', onReposition)
    window.addEventListener('scroll', onReposition, true)
    return () => {
      window.removeEventListener('resize', onReposition)
      window.removeEventListener('scroll', onReposition, true)
    }
  }, [columnsOpen])

  useEffect(() => {
    if (!columnsOpen) {
      return
    }
    const onDocClick = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        columnsRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return
      }
      setColumnsOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setColumnsOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [columnsOpen])

  const toggleColumn = (name: string, label?: string) => {
    if (isLockedColumn(name, label)) {
      return
    }
    setHiddenColumns((current) => ({
      ...current,
      [name]: !current[name],
    }))
  }

  const renderCells = (row: { original: Row; id: string }) =>
    visibleColumnDefs.map((column, i) => (
      <td key={column.name ?? i}>
        {column.render
          ? column.render(row.original.id, row.id)
          : row.original[column.name]}
      </td>
    ))

  const handlePageSize = (size: number) => {
    setPageSize(size)
    const nextPageCount = Math.max(1, Math.ceil(tableData.length / size))
    if (pageIndex >= nextPageCount) {
      gotoPage(0)
    }
  }

  const pageSizeOptions = PAGE_SIZES.includes(pageSize)
    ? PAGE_SIZES
    : [...PAGE_SIZES, pageSize].sort((a, b) => a - b)
  const rangeStart = tableData.length === 0 ? 0 : pageIndex * pageSize + 1
  const rangeEnd = Math.min((pageIndex + 1) * pageSize, tableData.length)

  if (setInitialPage != null && data.length > 0) {
    setInitialPage(pageIndex)
  }

  const emptyMessage =
    data.length === 0
      ? 'No items'
      : 'No matches were found. Please change your filters.'
  const emptyRow = (
    <tr>
      <EmptyCell colSpan={Math.max(1, visibleColumnDefs.length)}>
        {emptyMessage}
      </EmptyCell>
    </tr>
  )

  return (
    <Styles>
      <TableFrame>
        <Toolbar>
          <ToolbarLeft>
            {!hideSearch && (
              <SearchWrapper>
                <Input
                  className="input"
                  value={searchQuery}
                  placeholder={`Search ${
                    tableData.length < 1 ? data.length : tableData.length
                  } entries`}
                  onChange={handleSearchChange}
                />
              </SearchWrapper>
            )}
            {filterOptions &&
              filterOptions.map((filterOption) => (
                <div key={filterOption.label} style={{ minWidth: 160 }}>
                  <Select
                    value={
                      selectedFilter[filterOption.label]
                        ? {
                            label: selectedFilter[filterOption.label].label,
                            value: selectedFilter[filterOption.label].key,
                          }
                        : null
                    }
                    styles={styles}
                    components={components}
                    onChange={(value) =>
                      handleFilterChange({
                        value: value || null,
                        label: filterOption.label ? filterOption.label : null,
                      })
                    }
                    isClearable={true}
                    placeholder={`Filter by ${titleize(filterOption.label)}`}
                    options={filterOption.options.map((option) => {
                      return { value: option.key, label: option.label }
                    })}
                  />
                </div>
              ))}
          </ToolbarLeft>
          <ColumnsWrap ref={columnsRef}>
            <ColumnsButton
              type="button"
              aria-expanded={columnsOpen}
              aria-haspopup="menu"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                setColumnsOpen((open) => !open)
              }}
            >
              <Icon name="list" alt="" size="0.9rem" />
              Columns
              <Icon name="chevron-down" alt="" size="0.75rem" />
            </ColumnsButton>
            {columnsOpen &&
              typeof document !== 'undefined' &&
              createPortal(
                <ColumnsMenu
                  ref={menuRef}
                  role="menu"
                  $top={menuPos.top}
                  $left={menuPos.left}
                >
                  {columns.map((column) => {
                    const locked = isLockedColumn(column.name, column.label)
                    const checked = locked || !hiddenColumns[column.name]
                    return (
                      <ColumnsItem key={column.name} $locked={locked}>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={locked}
                          onChange={() =>
                            toggleColumn(column.name, column.label)
                          }
                        />
                        {columnLabel(column)}
                      </ColumnsItem>
                    )
                  })}
                </ColumnsMenu>,
                document.body,
              )}
          </ColumnsWrap>
        </Toolbar>
        <TableScroll>
          <table className="table is-fullwidth" {...getTableProps()}>
            <thead>
              {headerGroups.map((headerGroup) => (
                <tr {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map((column) => {
                    const sortable = column.canSort
                    return (
                      <th
                        {...(sortable
                          ? column.getHeaderProps(column.getSortByToggleProps())
                          : column.getHeaderProps())}
                        data-sortable={sortable ? 'true' : 'false'}
                      >
                        {titleize(column.render('Header') as string)}
                        {sortable && (
                          <SortIndicator
                            isSorted={column.isSorted}
                            isSortedDesc={column.isSortedDesc}
                          />
                        )}
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>
            {draggable ? (
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="droppableTable">
                  {(provided) => (
                    <tbody
                      {...getTableBodyProps()}
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                    >
                      {page.length > 0
                        ? page.map((row, index) => {
                            prepareRow(row)
                            return focusable != null && focusable ? (
                              <FocusableTr
                                key={row.id}
                                {...row.getRowProps()}
                                onClick={(e) => {
                                  if (onClick != null) {
                                    onClick(row, e)
                                  }
                                }}
                              >
                                {renderCells(row)}
                              </FocusableTr>
                            ) : (
                              <Draggable draggableId={row.id} index={index}>
                                {(provided) => (
                                  <tr
                                    key={row.id}
                                    {...row.getRowProps()}
                                    style={{}}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    ref={provided.innerRef}
                                  >
                                    {renderCells(row)}
                                  </tr>
                                )}
                              </Draggable>
                            )
                          })
                        : emptyRow}
                      {provided.placeholder}
                    </tbody>
                  )}
                </Droppable>
              </DragDropContext>
            ) : (
              <tbody {...getTableBodyProps()}>
                {page.length > 0
                  ? page.map((row) => {
                      prepareRow(row)
                      return focusable != null && focusable ? (
                        <FocusableTr
                          key={row.id}
                          {...row.getRowProps()}
                          onClick={(e) => {
                            if (onClick != null) {
                              onClick(row, e)
                            }
                          }}
                        >
                          {renderCells(row)}
                        </FocusableTr>
                      ) : (
                        <tr key={row.id} {...row.getRowProps()} style={{}}>
                          {renderCells(row)}
                        </tr>
                      )
                    })
                  : emptyRow}
              </tbody>
            )}
          </table>
        </TableScroll>
        <Footer>
          <FooterLeft>
            <span>
              {rangeStart}–{rangeEnd} of {tableData.length}
            </span>
            <label>
              Rows per page{' '}
              <FooterSelect
                value={pageSize}
                onChange={(e) => handlePageSize(Number(e.target.value))}
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </FooterSelect>
            </label>
          </FooterLeft>
          <FooterRight>
            <FooterButton
              type="button"
              onClick={() => gotoPage(0)}
              disabled={!canPreviousPage}
              aria-label="First page"
            >
              <Icon name="chevrons-left" />
            </FooterButton>
            <FooterButton
              type="button"
              onClick={() => previousPage()}
              disabled={!canPreviousPage}
              aria-label="Previous page"
            >
              <Icon name="chevron-left" />
            </FooterButton>
            <FooterSelect
              value={pageIndex}
              onChange={(e) => gotoPage(Number(e.target.value))}
              aria-label="Current page"
            >
              {(pageOptions.length > 0 ? pageOptions : [0]).map(
                (idx: number): ReactElement<any> => (
                  <option key={idx} value={idx}>
                    Page {idx + 1}
                  </option>
                ),
              )}
            </FooterSelect>
            <FooterButton
              type="button"
              onClick={() => nextPage()}
              disabled={!canNextPage}
              aria-label="Next page"
            >
              <Icon name="chevron-right" />
            </FooterButton>
            <FooterButton
              type="button"
              onClick={() => gotoPage(pageCount - 1)}
              disabled={!canNextPage}
              aria-label="Last page"
            >
              <Icon name="chevrons-right" />
            </FooterButton>
          </FooterRight>
        </Footer>
      </TableFrame>
    </Styles>
  )
}

export default Table
