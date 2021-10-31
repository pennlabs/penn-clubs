import { ReactElement, useEffect, useMemo, useState } from 'react'
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd'
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
  LIGHT_GRAY,
  SNOW,
  WHITE,
} from '../../constants/colors'
import { BORDER_RADIUS, MD, mediaMaxWidth } from '../../constants/measurements'
import { BODY_FONT } from '../../constants/styles'
import { titleize } from '../../utils'
import { Icon } from '.'

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
  onClick?: (row: any, event: any) => void
  draggable?: boolean
  onDragEnd?: (result: any) => void | null | undefined
  initialPage?: number
  setInitialPage?: (page: number) => void
  initialPageSize?: number
}

const Styles = styled.div`
  padding: 1rem;
`

const SearchWrapper = styled.div`
  overflow: visible;
  margin: 0px;
  ${mediaMaxWidth(MD)} {
    width: 100%;
    margin: 0;
    border-bottom: 1px solid ${BORDER};
    background: ${WHITE};
  }
`
const Toolbar = styled.div`
  margin-bottom: 40px;
`
const Input = styled.input`
  border: 1px solid ${ALLBIRDS_GRAY};
  outline: none;
  color: ${CLUBS_GREY};
  width: 100%;
  font-size: 1em;
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

const GreyText = styled.span`
  color: ${LIGHT_GRAY};
`

const Table = ({
  columns,
  data,
  searchableColumns,
  filterOptions,
  focusable,
  onClick,
  draggable = false,
  onDragEnd,
  initialPage = 0,
  setInitialPage,
  initialPageSize = 10,
}: tableProps): ReactElement => {
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [tableData, setTableData] = useState<Row[]>([])
  const [selectedFilter, setSelectedFilter] = useState<any>({})
  const [sortedColumn, setSortedColumn] = useState<any>(null)
  useEffect(() => {
    const searchedData = data.filter((item) => {
      if (!searchQuery || searchQuery.length < 3) {
        return true
      }
      return searchableColumns.some((searchId) => {
        if (typeof item[searchId] === 'string') {
          const strings = item[searchId].split(' ')
          return strings.some((string) =>
            string.toLowerCase().startsWith(searchQuery.toLowerCase()),
          )
        }
        return false
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
  }, [searchQuery, selectedFilter, data])

  const memoColumns = useMemo(
    () =>
      columns.map(({ label, name }) => ({
        Header: label ?? name,
        accessor: name,
      })),
    [data],
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
    pageOptions,
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns: memoColumns,
      data: tableData,
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

  const handleColumnsSort = (target) => {
    if (sortedColumn && sortedColumn.name === target) {
      if (sortedColumn.status === 'asc') {
        setSortedColumn({ name: target, status: 'desc' })
      } else {
        setSortedColumn(null)
      }
    } else {
      setSortedColumn({ name: target, status: 'asc' })
    }
  }

  const components = {
    IndicatorSeparator: () => null,
  }

  const handleFilterChange = (newFilter) => {
    const newFilters = { ...selectedFilter }
    newFilters[newFilter.label] = newFilter.value
    setSelectedFilter(newFilters)
  }
  if (data.length <= 0) {
    return <></>
  } else if (setInitialPage != null) {
    setInitialPage(pageIndex)
  }
  return (
    <Styles>
      <Toolbar className="is-clearfix">
        <div className="is-pulled-right">
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
        </div>
        <div className="is-pulled-left is-clearfix" style={{ width: '70%' }}>
          {filterOptions &&
            filterOptions.map((filterOption) => (
              <span
                style={{ marginRight: '10px', width: '40%', float: 'left' }}
              >
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
              </span>
            ))}
        </div>
      </Toolbar>

      {headerGroups.length > 0 ? (
        <table className="table is-fullwidth" {...getTableProps()}>
          <thead>
            {headerGroups.map((headerGroup) => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column) => (
                  <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                    <div onClick={() => handleColumnsSort(column.Header)}>
                      {titleize(column.render('Header'))}
                      <span style={{ marginLeft: '1rem' }}>
                        {column.isSorted ? (
                          column.isSortedDesc ? (
                            <Icon name="triangle-down" />
                          ) : (
                            <Icon name="triangle-up" />
                          )
                        ) : sortedColumn === null ? (
                          <Icon name="group-arrows" />
                        ) : (
                          ''
                        )}
                      </span>
                    </div>
                  </th>
                ))}
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
                    {page.map((row, index) => {
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
                          {columns.map((column, i) => {
                            return (
                              <td key={i}>
                                {column.render
                                  ? column.render(row.original.id) || (
                                      <GreyText>None</GreyText>
                                    )
                                  : row.original[column.name] || (
                                      <GreyText>None</GreyText>
                                    )}
                              </td>
                            )
                          })}
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
                              {columns.map((column, i) => {
                                return (
                                  <td key={i}>
                                    {column.render
                                      ? column.render(row.original.id, row.id)
                                      : row.original[column.name]}
                                  </td>
                                )
                              })}
                            </tr>
                          )}
                        </Draggable>
                      )
                    })}
                    {provided.placeholder}
                  </tbody>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            <tbody {...getTableBodyProps()}>
              {page.map((row, i) => {
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
                    {columns.map((column, i) => {
                      return (
                        <td key={i}>
                          {column.render
                            ? column.render(row.original.id, row.id)
                            : row.original[column.name]}
                        </td>
                      )
                    })}
                  </FocusableTr>
                ) : (
                  <tr key={row.id} {...row.getRowProps()} style={{}}>
                    {columns.map((column, i) => {
                      return (
                        <td key={i}>
                          {column.render
                            ? column.render(row.original.id, row.id)
                            : row.original[column.name]}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          )}
        </table>
      ) : (
        <h1>Nothing to Show.</h1>
      )}
      {pageOptions.length > 1 && (
        <div className="is-clearfix">
          <button
            style={{ marginRight: '0.5rem' }}
            className="is-light is-small"
            onClick={() => gotoPage(0)}
            disabled={!canPreviousPage}
          >
            {'<<'}
          </button>
          <button
            style={{ marginRight: '0.5rem' }}
            className="is-light is-small"
            onClick={() => previousPage()}
            disabled={!canPreviousPage}
          >
            {'<'}
          </button>
          <select
            value={pageIndex}
            onChange={(e) => gotoPage(Number(e.target.value))}
            className="input is-small"
            style={{ maxWidth: 150, marginRight: '0.5rem' }}
          >
            {pageOptions.map(
              (idx: number): ReactElement => (
                <option value={idx}>Page {idx + 1}</option>
              ),
            )}
          </select>
          <button
            style={{ marginRight: '0.5rem' }}
            className="is-light is-small"
            onClick={() => nextPage()}
            disabled={!canNextPage}
          >
            {'>'}
          </button>
          <button
            style={{ marginRight: '0.5rem' }}
            className="is-light is-small"
            onClick={() => gotoPage(pageCount - 1)}
            disabled={!canNextPage}
          >
            {'>>'}
          </button>
          <div className="is-pulled-right">
            <span>
              {data.length} total entries, {pageSize} entries per page
            </span>
          </div>
        </div>
      )}
    </Styles>
  )
}

export default Table
