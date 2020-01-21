import React from 'react'
import s from 'styled-components'
import { BORDER } from '../../constants/colors'

const Card = s.div`
  text-align: center;
  box-sizing: border-box;
  width: 100%;
  margin-right: 1%;
  margin-bottom: 20px;
  padding: 20px 10px;
  border: 1px solid ${BORDER};
  display: inline-block;
  background-color: white;
`

const Label = s.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const Avatar = s.div`
  border-radius: 9999px;
`

const MemberCard = ({ a }) => (
  <Card>
    <div>
      <Avatar
        style={{ margin: '0 auto' }}
        className="has-background-light image is-64x64"
      />
    </div>
    <br />
    <Label className="title is-5">{a.name || 'No Name'}</Label>
    <Label className="subtitle is-6">{a.title}</Label>
    <Label className="subtitle is-6">
      {a.email ? (
        <span>
          <a href={'mailto:' + a.email}>{a.email}</a>
        </span>
      ) : (
        'No Email'
      )}
    </Label>
  </Card>
)

export default MemberCard
