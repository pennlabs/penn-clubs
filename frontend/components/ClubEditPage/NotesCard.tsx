import moment from 'moment'
import {
  Dispatch,
  ReactElement,
  SetStateAction,
  useEffect,
  useState,
} from 'react'
import styled from 'styled-components'
import { Club } from '../../types'
import { M2 } from '../../constants/measurements'
import { WHITE } from '../../constants/colors'
import { doApiRequest } from '../../utils'
import { BlueTag, Card, Loading, Text } from '../common'
import BaseCard from './BaseCard'

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
  setDisplayNote: Dispatch<SetStateAction<Note | null>>
}

type NotesCardProps = {
  club: Club
}

const NoteDashboardContainer = styled.div`
  height: 400px;
`

const Row = styled.div`
  display: flex;
  justify-content: space-between;
`

const NoteHeader = styled.span`
  font-size: 14px;
  font-wegiht: 500;
  color: #3a3a3a;
`

const DisplayNoteHeader = styled.span`
  font-size: 28px;
  font-wegiht: 500;
  color: #3a3a3a;
`

const Date = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: #959595;
`

const Subheader = styled.p`
  font-family: HelveticaNeue;
  font-size: 12px;
  font-weight: 500;
  color: #959595;
  line-height: 1em;
`

const Content = styled(Text)`
  font-size: 14px;
  margin-top: 5px;
  margin-bottom: 8px;
`

const StyledCard = styled(Card)`
  background-color: ${WHITE};
  margin-bottom: ${M2};
  padding-left: ${M2};
`
function Note({ note, setDisplayNote }: NoteProps): ReactElement {
  return (
    <StyledCard hoverable bordered onClick={() => setDisplayNote(note)}>
      <Row>
        <div>
          <NoteHeader>{note.title}</NoteHeader>
          <Subheader>{note.creator}</Subheader>
        </div>
        <Date>{note.modified}</Date>
      </Row>

      <Content>{note.content}</Content>
      {note.noteTags.map((noteTag, index) => {
        return (
          <BlueTag key={index} className="tag is-rounded has-text-white">
            {noteTag.name}
          </BlueTag>
        )
      })}
    </StyledCard>
  )
}

export default function NotesCard({ club }: NotesCardProps): ReactElement {
  const [loading, setLoading] = useState<boolean>(false)
  const [notes, setNotes] = useState<Note[]>([])
  const [displayNote, setDisplayNote] = useState<Note | null>(null)

  useEffect(() => {
    setLoading(true)
    doApiRequest(`/clubs/${club.code}/notes/?format=json&start=`)
      .then((request) => request.json())
      .then((response) => {
        setNotes(
          response.map((note) => {
            return {
              creator: note.creator_full_name,
              title: note.title,
              content: note.content,
              modified: moment(note.updated_at).format('D/M/YYYY'),
              creatingClub: note.creating_club,
              subjectClub: note.subject_club,
              noteTags: note.note_tags.map((noteTag) => {
                return {
                  name: noteTag.name,
                }
              }),
            }
          }),
        )
        if (notes.length > 0) {
          console.log(notes)
          setDisplayNote(notes[0])
        }
        setLoading(false)
      })
  }, [])

  return (
    <BaseCard title="Notes">
      {loading ? (
        <Loading />
      ) : (
        <NoteDashboardContainer className="columns">
          <div className="column is-4" style={{ overflow: 'scroll' }}>
            {notes.map((note, index) => {
              return (
                <Note key={index} note={note} setDisplayNote={setDisplayNote} />
              )
            })}
          </div>
          <StyledCard
            className="column is-8"
            style={{ marginTop: '12px' }}
            bordered
          >
            {displayNote == null ? (
              <></>
            ) : (
              <>
                <DisplayNoteHeader>{displayNote.title}</DisplayNoteHeader>
                <Subheader>{`Last updated ${displayNote.modified} by ${displayNote.creator}`}</Subheader>
                <hr />
                <Text>{displayNote.content}</Text>
                <Subheader>
                  <span style={{ marginRight: '5px' }}>Tagged: </span>
                  {displayNote.noteTags.map((noteTag, index) => {
                    return (
                      <BlueTag
                        key={index}
                        className="tag is-rounded has-text-white"
                      >
                        {noteTag.name}
                      </BlueTag>
                    )
                  })}
                </Subheader>
              </>
            )}
          </StyledCard>
        </NoteDashboardContainer>
      )}
    </BaseCard>
  )
}
