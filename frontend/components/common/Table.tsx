import { ReactElement, useMemo, useState, useEffect } from 'react'
import {
 usePagination,
 useTable,
 useFilters,
 useGlobalFilter,
 useSortBy,
} from 'react-table'
import Select from 'react-select'
import { Icon } from '.'
import {
 BORDER,
 WHITE,
 ALLBIRDS_GRAY,
 CLUBS_GREY,
 BLUE,
 FOCUS_GRAY,
} from '../../constants/colors'
import { BODY_FONT } from '../../constants/styles'
import styled from 'styled-components'
import { MD, mediaMaxWidth, BORDER_RADIUS } from '../../constants/measurements'
 
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

type filterOption = {
  options : string[],
  label: string,
}

type Row= { [key: string]: any }

type Action = {
  name: string,
  classes: string,
  icon : string,
  clickFunction : (any) => any
}

type selectFilter = {
  value: string,
  label: string
}
 
type tableProps = {
 columns: Row[],
 data: Row[],
 searchableColumns: string[]
 filterOptions: filterOption [],
 actions?: Action[]
}
 
const Styles = styled.div`
 padding: 1rem;
 width: 100%;
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
 padding-bottom: 25px;
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
 
const Table = ({
 columns,
 data,
 searchableColumns,
 filterOptions,
}: tableProps): ReactElement => {
 const [searchQuery, setSearchQuery] = useState<string>('')
 const [tableData, setTableData] = useState<Row[]>([])
 const [selectedFilter, setSelectedFilter] = useState<selectFilter[]>([])
 useEffect(() => {
   const searchedData = data.filter((item) => {
     if (!searchQuery) return true
     if (!searchQuery || searchQuery.length < 3) {
       return true
     }
     let valid = false
     for (const searchId in searchableColumns) {
       const strings = item[searchableColumns[searchId]].split(' ')
       valid = strings.reduce(
         (acc, item) =>
           acc || item.toLowerCase().startsWith(searchQuery.toLowerCase()),
         false,
       )
       if (
         item[searchableColumns[searchId]]
           .toLowerCase()
           .startsWith(searchQuery.toLowerCase())
       )
         valid = true
     }
     return valid
   })
   const filteredData = searchedData.filter((item) => {
     if (selectedFilter && selectedFilter.length > 0) {
       let valid = true;
       selectedFilter.every(filter => {
        if (item[filter.value] !== filter.label) valid = false
       })
       return valid;
     } else return true
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
 
 const handleFilterChange = (value) => {
   if (value){
   const newFilters = [...selectedFilter, value]
   setSelectedFilter(newFilters) 
   }
 }
 
 return (
   <Styles>
     <Toolbar>
       <div className="is-pulled-right">
         <SearchWrapper>
           <Input
             className="input"
             value={searchQuery}
             placeholder={`search ${
               tableData.length < 1 ? data.length : tableData.length
             } entries`}
             onChange={handleSearchChange}
           />
         </SearchWrapper>
       </div>
 
       <div className="is-pulled-left" style={{ width: '70%' }}>
         <div
           style={{
             display: 'grid',
             gridTemplateColumns: "1fr 1fr 1fr"
            
           }}
         >
           {filterOptions.map((filterOption) => (
               <div style={{marginRight:"10px"}}>
               <Select
                 value={selectedFilter[filterOption.label]}
                 styles={styles}
                 components={components}
                 onChange={handleFilterChange}
                 isClearable ={true}
                 placeholder={`Filter By ${filterOption.label}`}
                 options={filterOption.options.map((option) => {
                   return { value: filterOption.label, label: option }
                 })}
               />
               </div>
           ))}
         </div>
       </div>
     </Toolbar>
     <table className="table is-fullwidth" {...getTableProps()}>
       <thead>
         {headerGroups.map((headerGroup) => (
           <tr {...headerGroup.getHeaderGroupProps()}>
             {headerGroup.headers.map((column) => (
               <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                 {column.render('Header')}
                 <span style={{ marginLeft: '1rem' }}>
                   {column.isSorted ? (
                     column.isSortedDesc ? (
                       <Icon name="chevron-down" />
                     ) : (
                       <Icon name="chevron-up" />
                     )
                   ) : (
                     ''
                   )}
                 </span>
               </th>
             ))}
           </tr>
         ))}
       </thead>
       <tbody {...getTableBodyProps()}>
         {page.map((row, i) => {
           prepareRow(row)
           return (
             <tr key={row.id} {...row.getRowProps()}>
               {columns.map(column => {
                 return <td>
                 {column.render? column.render(row.id): row.original[column.name]}
               </td>})}
             </tr>
           )
         })}
       </tbody>
     </table>
     {pageOptions.length > 1 && (
       <div className="is-clearfix" style={{ display: 'flex' }}>
         <button
           style={{ marginRight: '0.5rem' }}
           onClick={() => gotoPage(0)}
           disabled={!canPreviousPage}
         >
           <Icon name="chevrons-left" />
         </button>
         <button
           style={{ marginRight: '0.5rem' }}
           onClick={() => previousPage()}
           disabled={!canPreviousPage}
         >
           <Icon name="chevron-left" />
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
           onClick={() => gotoPage(pageCount - 1)}
           disabled={!canNextPage}
         >
           <Icon name="chevron-right" />
         </button>
         <button
           style={{ marginRight: '0.5rem' }}
           onClick={() => nextPage()}
           disabled={!canNextPage}
         >
           <Icon name="chevrons-right" />
         </button>
         <span className="is-pulled-right">
           {data.length} total entries, {pageSize} entries per page
         </span>
       </div>
     )}
   </Styles>
 )
}
 
export default Table
 
