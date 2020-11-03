import { ReactElement, useState } from 'react'
import styled from 'styled-components'
import { Club, MembershipRank, MembershipRole } from '../../types'
import { Card, Loading } from '../common'
import BaseCard from './BaseCard'

export const MEMBERSHIP_ROLES: MembershipRole[] = [
  {
    value: MembershipRank.Member,
    label: 'Member',
  },
  {
    value: MembershipRank.Officer,
    label: 'Officer',
  },
  {
    value: MembershipRank.Owner,
    label: 'Owner',
  },
]

type Note = {
  creator: string
  modified: string
  title: string
  content: string
  creatingClub: Club
  subjectClub: Club
  noteTags: NoteTag[]
}

type NoteTag = {
  name: string
}

type NoteProps = {
  note: Note
}

type NotesCardProps = {
  club: Club
}

const Row = styled.div`
  display: flex;
  justify-content: space-between;
`

const Header = styled.span`
  font-family: HelveticaNeue;
  font-size: 14px;
  font-wegiht: 500;
  color: #3a3a3a;
`

const Date = styled.span`
  font-family: HelveticaNeue;
  font-size: 12px;
  font-weight: 500;
  color: #959595;
`

const Name = styled.span`
  font-family: HelveticaNeue;
  font-size: 10px;
  font-weight: 500;
  color: #959595;
`

function Note({ note }: NoteProps): ReactElement {
  return (
    <Card>
      <Row>
        <Header>{note.title}</Header>
        <Date>{note.modified}</Date>
      </Row>
      <Name>{note.creator}</Name>
      <p>{note.content}</p>
    </Card>
  )
}

export default function NotesCard({ club }: NotesCardProps): ReactElement {
  const [loadingNotes, setLoadingNotes] = useState<boolean>(false)
  const [notes, setNotes] = useState<Note[]>([])

  return (
    <BaseCard title="Notes">
      {loadingNotes ? (
        <Loading />
      ) : (
        <>
          <div className="column is-3">
            {notes.map((note) => {
              return <Note note={note} />
            })}
          </div>
          <div className="column is-9"></div>
        </>
      )}
    </BaseCard>
  )
}
