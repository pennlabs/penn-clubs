import React from 'react'
import ChildDisplay from './ChildDisplay'
import '../../constants/colors'
import s from 'styled-components'

export default function OrgChildren(props) {
  const { children } = props
  if (!children) {
    return <div>No children</div>
  }
  if (!children.length) {
    return <ChildDisplay noChildren={true}></ChildDisplay>
  }
  return (
    <div
      style={{
        whiteSpace: 'pre-wrap',
        margin: '0px',
      }}
    >
      {children.map(c => {
        return <ChildDisplay child={c}></ChildDisplay>
      })}
    </div>
  )
}
