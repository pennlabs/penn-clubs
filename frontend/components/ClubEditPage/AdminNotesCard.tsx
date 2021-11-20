import React, { ReactElement } from 'react'
import styled from 'styled-components'

import { CardTitle, Description } from '../ClubCard'
import { Card } from '../common'

const NotesCard = styled(Card)`
  border: 1.5px solid gray;
  cursor: pointer;
  margin: 16px 0px;
`
const OverflowWrapper = styled.div`
  width: 100%;
  display: table;
  table-layout: fixed;
`
const OverflowDescription = styled(Description)`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  word-break: break-all;
  word-wrap: break-word;
`
const NoteInfo = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  opacity: 0.75;
  user-select: none;
`

function extractContentFromHtml(html) {
  return new DOMParser().parseFromString(html, 'text/html').documentElement
    .textContent
}

export default function AdminNotesCard({
  note,
  viewNote,
  disabled,
}): ReactElement {
  return (
    <NotesCard
      hoverable
      onClick={disabled ? () => {} : () => viewNote(note)}
      disabled={disabled}
    >
      <CardTitle>{note.title}</CardTitle>
      <OverflowWrapper>
        <OverflowDescription>
          {extractContentFromHtml(note.content)}
        </OverflowDescription>
      </OverflowWrapper>

      <NoteInfo>
        <b>{note.creator}</b>
        <p>{new Date(note.created_at).toLocaleDateString()}</p>
      </NoteInfo>
    </NotesCard>
  )
}
