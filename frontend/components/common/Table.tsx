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
 GREEN,
 HOVER_GRAY,
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
 
type tableProps = {
 columns: any
 data: any
 searchableColumns: any
 filterOptions: any
 actions?: any
}
 
const Styles = styled.div`
 padding: 1rem;
 width: 100%;
 
 table {
   border-collapse: collapse;
   margin: 25px 0;
   font-size: 0.95em;
   font-family: sans-serif;
   min-width: 400px;
   box-shadow: 0 0 20px rgba(0, 0, 0, 0.15);
 
   thead tr {
     background-color: ${BLUE};
     color: ${WHITE};
     text-align: left;
   }
   thead th {
    color: ${WHITE};
    text-transform : capitalize
  }
 
   th,
   td {
     padding: 8px 15px;
   }
 
   tbody tr {
     border-bottom: 1px solid #dddddd;
   }
 
   tbody tr:nth-of-type(even) {
     background-color: ${HOVER_GRAY};
   }
 
   tbody tr:last-of-type {
     border-bottom: 2px solid ${BLUE};
   }

 }
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
 actions,
}: tableProps): ReactElement => {
 const [searchQuery, setSearchQuery] = useState<any>('')
 const [tableData, setTableData] = useState<any>([])
 const [selectedFilter, setSelectedFilter] = useState<any>({
   value: '',
   label: '',
 })
 useEffect(() => {
   const searchedData = data.filter((item) => {
     if (!searchQuery || searchQuery.length < 0) return true
     const searschString = searchQuery
     if (!searschString || searschString.length < 3) {
       return true
     }
     let valid = false
     for (const searchId in searchableColumns) {
       const strings = item[searchableColumns[searchId]].split(' ')
       valid = strings.reduce(
         (acc, item) =>
           acc || item.toLowerCase().startsWith(searschString.toLowerCase()),
         false,
       )
       if (
         item[searchableColumns[searchId]]
           .toLowerCase()
           .startsWith(searschString.toLowerCase())
       )
         valid = true
     }
     return valid
   })
   const filteredData = searchedData.filter((item) => {
     if (selectedFilter.value.length > 0 && selectedFilter.label.length > 0) {
       return item[selectedFilter.value] === selectedFilter.label
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
   if (e.target.value.length >= 0) {
     setSearchQuery(e.target.value)
   }
 }
 
 const components = {
   IndicatorSeparator: () => null,
 }
 
 const handleFilterChange = (value) => {
   setSelectedFilter(value)
  
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
                 value={selectedFilter ? selectedFilter.label : ''}
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
             {actions && <th>Actions</th>}
           </tr>
         ))}
       </thead>
       <tbody {...getTableBodyProps()}>
         {page.map((row, i) => {
           prepareRow(row)
           return (
             <tr {...row.getRowProps()}>
               {row.cells.map((cell) => {
                 return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
               })}
               <td>
                 <div className="buttons">
                   {actions.map((action) => {
                     return (
                       <button
                         className={action.classes}
                         onClick={() => {
                           action.clickFunction(row.original)
                         }}
                       >
                         <Icon name={action.Icon} alt="edit" /> 
                       </button>
                     )
                   })}
                 </div>
               </td>
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
 

