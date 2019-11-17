import React from 'react'
import ChildDisplay from './ChildDisplay'
import '../../constants/colors'
import s from 'styled-components'

export default function OrgChildren(props) {
  const { children } = props
  return (
    <div
      style={{
        whiteSpace: 'pre-wrap',
      }}
    >
      {console.log('CHILDREN', children)}

      {children.map(c => {
        return <ChildDisplay child={c}></ChildDisplay>
      })}
      {children.map(c => {
        ;<p>{c.name} uh</p>
      })}
    </div>
  )
}
