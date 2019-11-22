import React from 'react'
import ChildDisplay from './ChildDisplay'
import '../../constants/colors'
import s from 'styled-components'

export default function OrgChildren(props) {
  const { children } = props
  if (!children) {
    return <div>No children</div>
  }
  return (
    <div
      style={{
        whiteSpace: 'pre-wrap',
      }}
    >
      {children.map(c => {
        return <ChildDisplay child={c}></ChildDisplay>
      })}
      {children.map(c => {
        ;<p>{c.name} uh</p>
      })}
    </div>
  )
}
