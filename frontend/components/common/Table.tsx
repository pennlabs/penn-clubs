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

import { CLUBS_GREY, HOVER_GRAY, SNOW, WHITE } from '../../constants/colors'
import { MD, mediaMaxWidth } from '../../constants/measurements'
import { BODY_FONT } from '../../constants/styles'
import { titleize } from '../../utils'
import { Icon } from '.'
import {
  selectCompactStyles,
  selectComponents,
  selectMenuPortalTarget,
  selectMenuStyles,
} from './selectStyles'

const TABLE_LINE = '#d8d8d8'
const TABLE_RULE = '#eaeef2'
const TABLE_HEAD = '#f6f8fa'
const SHEET_HEAD = '#e9ecf6'
const SHEET_SELECTED = '#eef0ff'
const SHEET_PILL = '#e4e4e4'

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
  variant?: 'boxed' | 'sheet'
  isRowSelected?: (row: Row) => boolean
  fillParent?: boolean
  resizable?: boolean
}

const Styles = styled.div<{ $fill?: boolean }>`
  width: 100%;
  font-size: 0.875rem;
  margin-bottom: 0;

  ${({ $fill }) =>
    $fill &&
    `
    display: flex;
    flex: 1;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  `}
`

const SearchWrapper = styled.div<{ $sheet?: boolean }>`
  overflow: visible;
  margin: 0px;
  min-width: ${({ $sheet }) => ($sheet ? '11rem' : '14rem')};
  position: relative;
  ${mediaMaxWidth(MD)} {
    width: ${({ $sheet }) => ($sheet ? 'auto' : '100%')};
    margin: 0;
  }
`

const SearchIcon = styled.span`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #9aa0a6;
  pointer-events: none;
  display: inline-flex;
`

const Toolbar = styled.div<{ $sheet?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${({ $sheet }) => ($sheet ? 'flex-start' : 'space-between')};
  gap: 0.75rem;
  flex-shrink: 0;
  flex-wrap: wrap;
  background: ${({ $sheet }) => ($sheet ? 'transparent' : WHITE)};
  border-bottom: ${({ $sheet }) =>
    $sheet ? '0' : `1px solid ${TABLE_LINE}`};
  padding: ${({ $sheet }) => ($sheet ? '0 0 12px' : '0.65rem 0.85rem')};
`

const ToolbarLeft = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
`

const Input = styled.input<{ $sheet?: boolean }>`
  border: 1px solid ${({ $sheet }) => ($sheet ? SHEET_PILL : TABLE_LINE)};
  outline: none;
  color: ${CLUBS_GREY};
  width: 100%;
  font-size: 0.875rem;
  padding: ${({ $sheet }) => ($sheet ? '8px 34px 8px 14px' : '8px 10px')};
  background: ${WHITE};
  border-radius: ${({ $sheet }) => ($sheet ? '999px' : '8px')};
  box-shadow: none;
  font-family: ${BODY_FONT};

  &:hover,
  &:active,
  &:focus {
    background: ${WHITE};
    border-color: #c4c4c4;
    box-shadow: none;
  }
`

const ColumnsWrap = styled.div<{ $sheet?: boolean }>`
  position: relative;
  flex-shrink: 0;
  margin-left: ${({ $sheet }) => ($sheet ? '0' : 'auto')};
`

const ColumnsButton = styled.button<{ $sheet?: boolean }>`
  appearance: none;
  background: ${WHITE};
  border: 1px solid ${({ $sheet }) => ($sheet ? SHEET_PILL : TABLE_LINE)};
  border-radius: ${({ $sheet }) => ($sheet ? '999px' : '8px')};
  color: #24292f;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-family: ${BODY_FONT};
  font-size: 0.875rem;
  font-weight: 500;
  padding: ${({ $sheet }) => ($sheet ? '8px 14px' : '0.45rem 0.7rem')};

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

const TableFrame = styled.div<{ $sheet?: boolean; $fill?: boolean }>`
  background: ${({ $sheet }) => ($sheet ? 'transparent' : WHITE)};
  border: ${({ $sheet }) => ($sheet ? '0' : `1px solid ${TABLE_LINE}`)};
  border-radius: ${({ $sheet }) => ($sheet ? '0' : '8px')};
  box-shadow: none;
  overflow: ${({ $sheet }) => ($sheet ? 'visible' : 'hidden')};

  ${({ $fill }) =>
    $fill &&
    `
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  `}
`

const ResizeHandle = styled.div`
  position: absolute;
  top: 0;
  right: -10px;
  width: 20px;
  height: 100%;
  cursor: col-resize;
  user-select: none;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;

  &::after {
    content: '';
    width: 4px;
    height: 18px;
    border-radius: 999px;
    background: #c5c8d8;
    pointer-events: none;
  }

  &:hover::after,
  &:active::after {
    background: #4954f4;
  }
`

const TableScroll = styled.div<{
  $sheet?: boolean
  $fill?: boolean
  $resizable?: boolean
}>`
  overflow: auto;
  max-height: ${({ $fill }) => ($fill ? 'none' : '36rem')};
  ${({ $fill }) => $fill && 'flex: 1; min-height: 0;'}
  width: 100%;
  scrollbar-width: thin;
  scrollbar-color: #c4c4c4 #f3f3f3;

  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f3f3f3;
    border-radius: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c4c4c4;
    border-radius: 8px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }

  &::-webkit-scrollbar-corner {
    background: #f3f3f3;
  }

  table.table {
    background: ${({ $sheet }) => ($sheet ? 'transparent' : WHITE)};
    border: 0;
    border-collapse: collapse;
    margin-bottom: 0;
    min-width: 100%;
    table-layout: ${({ $resizable }) => ($resizable ? 'fixed' : 'auto')};
    width: ${({ $resizable }) => ($resizable ? 'max-content' : '100%')};
  }

  table.table th,
  table.table td {
    border: 0 !important;
    border-bottom: ${({ $sheet }) =>
      $sheet ? '0' : `1px solid ${TABLE_RULE}`} !important;
    color: #1f2049;
    font-size: 0.875rem;
    padding: ${({ $sheet }) => ($sheet ? '11px 16px' : '10px 14px')};
    text-align: left;
    vertical-align: middle;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  table.table thead th {
    background: ${({ $sheet }) => ($sheet ? SHEET_HEAD : TABLE_HEAD)};
    border-bottom: ${({ $sheet }) =>
      $sheet ? '0' : `1px solid ${TABLE_LINE}`} !important;
    color: ${({ $sheet }) => ($sheet ? '#1f2049' : '#57606a')};
    font-weight: 600;
    overflow: visible;
    position: sticky;
    top: 0;
    user-select: none;
    z-index: 1;
    text-align: left;
  }

  table.table thead:hover ${ResizeHandle} {
    opacity: 1;
  }

  table.table thead th:first-child {
    border-radius: ${({ $sheet }) => ($sheet ? '8px 0 0 8px' : '0')};
  }

  table.table thead th:last-child {
    border-radius: ${({ $sheet }) => ($sheet ? '0 8px 8px 0' : '0')};
  }

  table.table tbody tr:last-child td {
    border-bottom: 0 !important;
  }

  table.table thead th[data-sortable='true'] {
    cursor: pointer;
  }

  table.table tbody tr:hover td {
    background: ${({ $sheet }) => ($sheet ? '#f7f8fb' : TABLE_HEAD)};
  }

  table.table tbody tr[data-selected='true'] td {
    background: ${SHEET_SELECTED};
  }

  table.table tbody tr[data-selected='true']:hover td {
    background: ${SHEET_SELECTED};
  }

  table.table th[data-column='select'],
  table.table td[data-column='select'] {
    padding-left: 14px;
    padding-right: 10px;
    text-align: center;
    width: 52px;
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

const Footer = styled.div<{ $sheet?: boolean }>`
  align-items: center;
  background: ${({ $sheet }) => ($sheet ? 'transparent' : TABLE_HEAD)};
  border-top: ${({ $sheet }) =>
    $sheet ? '0' : `1px solid ${TABLE_LINE}`};
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  font-size: 0.8125rem;
  gap: 12px 16px;
  justify-content: space-between;
  min-height: 48px;
  padding: ${({ $sheet }) => ($sheet ? '10px 0 0' : '8px 14px')};
`

const FooterLeft = styled.div`
  align-items: center;
  color: #57606a;
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
`

const FooterRight = styled.div`
  align-items: center;
  display: inline-flex;
  flex-shrink: 0;
`

const Pager = styled.div`
  display: inline-flex;
  align-items: center;
  height: 32px;
  border: 1px solid ${TABLE_LINE};
  border-radius: 8px;
  overflow: hidden;
  background: ${WHITE};
`

const FooterButton = styled.button`
  appearance: none;
  background: ${WHITE};
  border: 0;
  border-right: 1px solid ${TABLE_LINE};
  border-radius: 0;
  color: #24292f;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  font-family: ${BODY_FONT};
  font-size: 0.8125rem;
  height: 32px;
  justify-content: center;
  min-width: 32px;
  padding: 0 8px;

  &:last-child {
    border-right: 0;
  }

  &:hover:not(:disabled) {
    background: ${HOVER_GRAY};
  }

  &:disabled {
    cursor: default;
    opacity: 0.4;
  }
`

const FooterSelect = styled.select.attrs({ className: 'table-footer-select' })`
  &&& {
    appearance: none;
    -webkit-appearance: none;
    width: auto;
    min-width: 4.25rem;
    min-height: 32px;
    height: 32px;
    margin: 0;
    padding: 0 1.5rem 0 8px;
    background-color: ${WHITE};
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23757575' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>");
    background-repeat: no-repeat;
    background-position: right 8px center;
    background-size: 12px;
    border: 1px solid ${TABLE_LINE};
    border-radius: 8px;
    box-shadow: none;
    color: #24292f;
    font-family: ${BODY_FONT};
    font-size: 0.8125rem;
  }
`

const PagerSelect = styled(FooterSelect)`
  &&& {
    border: 0;
    border-right: 1px solid ${TABLE_LINE};
    border-radius: 0;
    height: 32px;
    min-height: 32px;
  }
`

const PAGE_SIZES = [10, 25, 50, 100]

function isLockedColumn(name?: string, label?: unknown): boolean {
  const n = (name || '').toLowerCase()
  const l = typeof label === 'string' ? label.toLowerCase() : ''
  return n === 'actions' || l === 'actions' || n === 'select'
}

function columnLabel(column: Row): string {
  const raw = column.label
  if (typeof raw === 'string' && raw.trim()) {
    return titleize(raw)
  }
  return titleize(column.name ?? '')
}

function renderHeader(header: unknown): ReactElement<any> | string {
  if (header == null) {
    return ''
  }
  if (typeof header === 'string' || typeof header === 'number') {
    return titleize(String(header))
  }
  return header as ReactElement<any>
}

const sheetFilterStyles = {
  ...selectMenuStyles,
  container: (style) => ({ ...style, width: 148 }),
  control: (style, state) => ({
    ...style,
    minHeight: 36,
    height: 36,
    borderRadius: 999,
    borderColor: state.isFocused ? '#4954f4' : SHEET_PILL,
    boxShadow: 'none',
    backgroundColor: '#fff',
    fontSize: '0.875rem',
  }),
  valueContainer: (style) => ({
    ...style,
    padding: '0 8px',
  }),
  dropdownIndicator: (style) => ({
    ...style,
    padding: '6px 10px',
    color: '#757575',
  }),
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
        fitSize
        size="0.55rem"
        style={{
          opacity: isSorted && !isSortedDesc ? 1 : 0.35,
          display: 'block',
        }}
      />
      <Icon
        name="chevron-down"
        fitSize
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
  variant = 'boxed',
  isRowSelected,
  fillParent = false,
  resizable = false,
}: tableProps): ReactElement<any> => {
  const sheet = variant === 'sheet'
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [tableData, setTableData] = useState<Row[]>([])
  const [selectedFilter, setSelectedFilter] = useState<any>({})
  const [hiddenColumns, setHiddenColumns] = useState<Record<string, boolean>>(
    {},
  )
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  const resizeDrag = useRef<{
    name: string
    startX: number
    startWidth: number
    moved: boolean
  } | null>(null)
  const [columnsOpen, setColumnsOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const columnsRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!resizable) {
      return
    }
    const onMove = (event: MouseEvent) => {
      const drag = resizeDrag.current
      if (!drag) {
        return
      }
      const next = Math.max(64, drag.startWidth + (event.clientX - drag.startX))
      if (Math.abs(event.clientX - drag.startX) > 3) {
        drag.moved = true
      }
      setColumnWidths((current) => ({ ...current, [drag.name]: next }))
    }
    const onUp = () => {
      resizeDrag.current = null
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [resizable])

  useEffect(() => {
    const searchedData = data.filter((item) => {
      if (!searchQuery) {
        return true
      }
      const needle = searchQuery.toLowerCase()
      return searchableColumns.some((searchId) => {
        const raw = item[searchId]
        const value = raw == null ? '' : String(raw)
        return value.toLowerCase().includes(needle)
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

  const columnNames = visibleColumnDefs.map((column) => column.name).join('|')

  useLayoutEffect(() => {
    if (!resizable) {
      return
    }
    const container = scrollRef.current?.clientWidth || 720
    setColumnWidths((current) => {
      const next = { ...current }
      let changed = false
      const hasSelect = visibleColumnDefs.some(
        (column) => column.name === 'select',
      )
      if (hasSelect && next.select == null) {
        next.select = 52
        changed = true
      }
      const content = visibleColumnDefs.filter(
        (column) => column.name !== 'select',
      )
      const selectW = hasSelect ? 52 : 0
      const first = content[0]
      if (first && next[first.name] == null) {
        next[first.name] = Math.round((container - selectW) * 0.25)
        changed = true
      }
      const rest = content.slice(1)
      const restShare =
        rest.length > 0
          ? Math.max(
              120,
              Math.floor(
                (container - selectW - (first ? next[first.name] : 0)) /
                  rest.length,
              ),
            )
          : 0
      rest.forEach((column) => {
        if (next[column.name] == null) {
          next[column.name] = restShare
          changed = true
        }
      })
      return changed ? next : current
    })
  }, [resizable, columnNames])

  const memoColumns = useMemo(
    () =>
      visibleColumnDefs.map(({ label, name, header }) => ({
        Header: header ?? label ?? name,
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

  const tableWidth = visibleColumnDefs.reduce(
    (sum, column) =>
      sum +
      (columnWidths[column.name] ||
        (column.name === 'select' ? 52 : 140)),
    0,
  )

  const renderCells = (row: { original: Row; id: string }) =>
    visibleColumnDefs.map((column, i) => (
      <td
        key={column.name ?? i}
        data-column={column.name}
        style={{
          width:
            columnWidths[column.name] ||
            (column.name === 'select' ? 52 : undefined),
          minWidth:
            columnWidths[column.name] ||
            (column.name === 'select' ? 52 : 80),
          textAlign: column.name === 'select' ? 'center' : 'left',
        }}
      >
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

  const selectedAttr = (original: Row) =>
    isRowSelected?.(original) ? 'true' : undefined

  const toolbar = (
        <Toolbar $sheet={sheet}>
          <ToolbarLeft>
            {!hideSearch && (
              <SearchWrapper $sheet={sheet}>
                <Input
                  className={sheet ? undefined : 'input'}
                  $sheet={sheet}
                  value={searchQuery}
                  placeholder={
                    sheet
                      ? 'Search...'
                      : `Search ${
                          tableData.length < 1 ? data.length : tableData.length
                        } entries`
                  }
                  onChange={handleSearchChange}
                />
                {sheet && (
                  <SearchIcon>
                    <Icon name="search" alt="" size="0.9rem" fitSize />
                  </SearchIcon>
                )}
              </SearchWrapper>
            )}
            {filterOptions &&
              filterOptions.map((filterOption) => (
                <div
                  key={filterOption.label}
                  style={{ minWidth: sheet ? 148 : 160 }}
                >
                  <Select
                    value={
                      selectedFilter[filterOption.label]
                        ? {
                            label: selectedFilter[filterOption.label].label,
                            value:
                              selectedFilter[filterOption.label].value ??
                              selectedFilter[filterOption.label].key,
                          }
                        : null
                    }
                    styles={sheet ? sheetFilterStyles : selectMenuStyles}
                    components={selectComponents}
                    menuPortalTarget={selectMenuPortalTarget}
                    menuPosition="fixed"
                    onChange={(value) =>
                      handleFilterChange({
                        value: value || null,
                        label: filterOption.label ? filterOption.label : null,
                      })
                    }
                    isClearable={true}
                    placeholder={
                      sheet
                        ? 'Filter'
                        : `Filter by ${titleize(filterOption.label)}`
                    }
                    options={filterOption.options.map((option) => {
                      return { value: option.key, label: option.label }
                    })}
                  />
                </div>
              ))}
          </ToolbarLeft>
          <ColumnsWrap ref={columnsRef} $sheet={sheet}>
            <ColumnsButton
              type="button"
              $sheet={sheet}
              aria-expanded={columnsOpen}
              aria-haspopup="menu"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                setColumnsOpen((open) => !open)
              }}
            >
              <Icon name={sheet ? 'grid' : 'list'} alt="" size="0.9rem" />
              Columns
              {!sheet && <Icon name="chevron-down" alt="" size="0.75rem" />}
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
  )

  const tableBody = (
        <TableScroll
          ref={scrollRef}
          $sheet={sheet}
          $fill={fillParent}
          $resizable={resizable}
        >
          <table
            className={sheet ? 'table' : 'table is-fullwidth'}
            {...getTableProps()}
            style={
              resizable
                ? { width: tableWidth, minWidth: '100%' }
                : undefined
            }
          >
            <thead>
              {headerGroups.map((headerGroup) => (
                <tr {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map((column, index) => {
                    const header = column.render('Header')
                    const sortable = Boolean(column.canSort)
                    const def = visibleColumnDefs[index]
                    const name = def?.name || column.id
                    const headerProps = sortable
                      ? column.getHeaderProps(column.getSortByToggleProps())
                      : column.getHeaderProps()
                    return (
                      <th
                        {...headerProps}
                        data-column={name}
                        data-sortable={sortable ? 'true' : 'false'}
                        style={{
                          ...(headerProps as { style?: object }).style,
                          position: 'sticky',
                          textAlign: name === 'select' ? 'center' : 'left',
                          width:
                            columnWidths[name] ||
                            (name === 'select' ? 52 : undefined),
                          minWidth:
                            columnWidths[name] ||
                            (name === 'select' ? 52 : 80),
                        }}
                        onClick={(event) => {
                          if (resizeDrag.current?.moved) {
                            event.preventDefault()
                            event.stopPropagation()
                          }
                        }}
                      >
                        {renderHeader(header)}
                        {sortable && (
                          <SortIndicator
                            isSorted={column.isSorted}
                            isSortedDesc={column.isSortedDesc}
                          />
                        )}
                        {resizable && name !== 'select' && (
                          <ResizeHandle
                            onMouseDown={(event) => {
                              event.preventDefault()
                              event.stopPropagation()
                              const th = event.currentTarget.parentElement
                              resizeDrag.current = {
                                name,
                                startX: event.clientX,
                                startWidth:
                                  th?.getBoundingClientRect().width || 140,
                                moved: false,
                              }
                            }}
                            onClick={(event) => {
                              event.preventDefault()
                              event.stopPropagation()
                            }}
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
                                data-selected={selectedAttr(row.original)}
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
                                    data-selected={selectedAttr(row.original)}
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
                          data-selected={selectedAttr(row.original)}
                          onClick={(e) => {
                            if (onClick != null) {
                              onClick(row, e)
                            }
                          }}
                        >
                          {renderCells(row)}
                        </FocusableTr>
                      ) : (
                        <tr
                          key={row.id}
                          {...row.getRowProps()}
                          data-selected={selectedAttr(row.original)}
                          style={{}}
                        >
                          {renderCells(row)}
                        </tr>
                      )
                    })
                  : emptyRow}
              </tbody>
            )}
          </table>
        </TableScroll>
  )

  const footer = (
        <Footer $sheet={sheet}>
          <FooterLeft>
            <span>
              {rangeStart}–{rangeEnd} of {tableData.length}
            </span>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              Rows per page
              <div style={{ width: 88 }}>
                <Select
                  aria-label="Rows per page"
                  styles={selectCompactStyles}
                  components={selectComponents}
                  menuPortalTarget={selectMenuPortalTarget}
                  menuPosition="fixed"
                  isSearchable={false}
                  options={pageSizeOptions.map((size) => ({
                    value: size,
                    label: String(size),
                  }))}
                  value={{ value: pageSize, label: String(pageSize) }}
                  onChange={(option) => {
                    if (option) {
                      handlePageSize(option.value)
                    }
                  }}
                />
              </div>
            </label>
          </FooterLeft>
          <FooterRight>
            <Pager>
              <FooterButton
                type="button"
                onClick={() => gotoPage(0)}
                disabled={!canPreviousPage}
                aria-label="First page"
              >
                <Icon name="chevrons-left" fitSize size="0.85rem" />
              </FooterButton>
              <FooterButton
                type="button"
                onClick={() => previousPage()}
                disabled={!canPreviousPage}
                aria-label="Previous page"
              >
                <Icon name="chevron-left" fitSize size="0.85rem" />
              </FooterButton>
              <div style={{ width: 108, minHeight: 32 }}>
                <Select
                  aria-label="Current page"
                  styles={{
                    ...selectCompactStyles,
                    control: (style, state) => ({
                      ...selectCompactStyles.control(style, state),
                      border: 0,
                      borderRadius: 0,
                      minHeight: 32,
                      height: 32,
                      boxShadow: 'none',
                    }),
                  }}
                  components={selectComponents}
                  menuPortalTarget={selectMenuPortalTarget}
                  menuPosition="fixed"
                  isSearchable={false}
                  options={(pageOptions.length > 0 ? pageOptions : [0]).map(
                    (idx: number) => ({
                      value: idx,
                      label: `Page ${idx + 1}`,
                    }),
                  )}
                  value={{
                    value: pageIndex,
                    label: `Page ${pageIndex + 1}`,
                  }}
                  onChange={(option) => {
                    if (option) {
                      gotoPage(option.value)
                    }
                  }}
                />
              </div>
              <FooterButton
                type="button"
                onClick={() => nextPage()}
                disabled={!canNextPage}
                aria-label="Next page"
              >
                <Icon name="chevron-right" fitSize size="0.85rem" />
              </FooterButton>
              <FooterButton
                type="button"
                onClick={() => gotoPage(pageCount - 1)}
                disabled={!canNextPage}
                aria-label="Last page"
              >
                <Icon name="chevrons-right" fitSize size="0.85rem" />
              </FooterButton>
            </Pager>
          </FooterRight>
        </Footer>
  )

  return (
    <Styles $fill={fillParent}>
      {sheet ? (
        <>
          {toolbar}
          <TableFrame $sheet $fill={fillParent}>
            {tableBody}
            {footer}
          </TableFrame>
        </>
      ) : (
        <TableFrame $fill={fillParent}>
          {toolbar}
          {tableBody}
          {footer}
        </TableFrame>
      )}
    </Styles>
  )
}

export default Table
