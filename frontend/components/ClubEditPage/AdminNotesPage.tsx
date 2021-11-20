import { Field, Form, Formik } from 'formik'
import React, { ReactElement } from 'react'
import styled from 'styled-components'

import { Club } from '~/types'
import { doApiRequest } from '~/utils'

import {
  ALLBIRDS_GRAY,
  CLUBS_GREY,
  FOCUS_GRAY,
  MEDIUM_GRAY,
  WHITE,
} from '../../constants/colors'
import { BORDER_RADIUS, MD, mediaMaxWidth } from '../../constants/measurements'
import { BODY_FONT } from '../../constants/styles'
import { Icon } from '../common'
import { FormStyle, RichTextField, TextField } from '../FormComponents'
import AdminNotesCard from './AdminNotesCard'
import BaseCard from './BaseCard'

const NotesPage = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  justify-items: space-between;

  ${mediaMaxWidth(MD)} {
    flex-direction: column;
  }
`

const NotesSearchBar = styled.div`
  margin: 0px 5px;
  flex: 0 0 27.5%;
  display: flex;
  flex-direction: column;
`
const EditNotes = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  margin-left: 16px;
`
const SelectIcon = styled(Icon)`
  cursor: pointer;
  color: ${MEDIUM_GRAY};
  opacity: 0.75;
  margin-right: 6px !important;
`

const CollapseButton = styled.div`
  flex: 0 0 1.5rem;
  height: 70vh;

  ${mediaMaxWidth(MD)} {
    position: absolute;
    top: 50px;
    left: 5px;
    height: 0px !important;
  }
`

const FieldWithButton = styled.div`
  display: flex;
  position: relative;

  &:after {
    content: attr(data-time);
    position: absolute;
    color: gray;
    bottom: 0;
    right: 0;
    font-size: 0.625rem;
  }

  ${mediaMaxWidth(MD)} {
    flex-direction: column;
    margin-bottom: 1rem;
    align-items: center;

    &:after {
      bottom: -1rem;
    }
  }
`

const ControlButton = styled.button`
  flex: 0 1 20%;
  margin-left: 16px;
`

const NotesContainer = styled.div`
  height: 60vh;
  flex: 1 1 auto;
  overflow: auto;
  position: relative;
`

const AddNotesFAB = styled.button.attrs({ className: 'button is-primary' })`
  position: sticky;
  bottom: 0;
  border-radius: 50%;
  height: 40px;
  width: 40px;
  float: right;
  margin: 8px;
  padding: 8px;
`

const SearchWrapper = styled.div`
  position: relative;
  margin-bottom: 1.2rem;
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

const SearchIcon = styled.span`
  cursor: pointer;
  opacity: 0.75;
  padding-top: 6px;
  position: absolute;
  right: 4px;
`

type AdminNotesCardProp = {
  id: number
  title: string
  creator: string
  content: string
  created_at: string
  club: string
}

type AdminNotesPageProp = {
  club: Club
}

export default function AdminNotesPage({
  club,
}: AdminNotesPageProp): ReactElement {
  const [isEdit, setIsEdit] = React.useState<boolean>(true)
  const [notes, setNotes] = React.useState<AdminNotesCardProp[]>([])
  const [currNote, setCurrNote] = React.useState<AdminNotesCardProp | null>(
    null,
  )
  const [searchValue, setSearchValue] = React.useState<string>('')
  const [hideSearchBar, setHideSearchBar] = React.useState<boolean>(false)

  const fabRef = React.useRef<any>()
  const formikValueRef = React.useRef<any>()

  const viewNote = (note: AdminNotesCardProp) => {
    setCurrNote(note)
    setIsEdit(false)
  }

  const controlClick = () => {
    const hasContent = 'content' in formikValueRef.current.values
    if (isEdit && hasContent) {
      onSave({ ...formikValueRef.current.values, club: club.code })
    }
    setIsEdit(!isEdit)
  }

  const deleteClick = () => {
    if (currNote !== null) {
      onDelete(currNote.id)
    }
  }

  const getNotes = () => {
    doApiRequest(`/clubs/${club.code}/adminnotes/?format=json`, {
      method: 'GET',
    })
      .then((resp) => resp.json())
      .then((response) => setNotes(response))
  }

  const onDelete = (id: number): void => {
    doApiRequest(`/clubs/${club.code}/adminnotes/${id}/?format=json`, {
      method: 'DELETE',
    })
      .then(() => setCurrNote(null))
      .then(() => getNotes())
  }

  const onSave = (object: any): void => {
    const newNote = currNote == null
    doApiRequest(
      `/clubs/${club.code}/adminnotes/${
        newNote ? '' : object.id + '/'
      }?format=json`,
      {
        method: newNote ? 'POST' : 'PUT',
        body: (({ club, title, content }) => ({ club, title, content }))(
          object,
        ),
      },
    )
      .then((resp) => resp.json())
      .then((response) => setCurrNote(response))
      .then(() => getNotes())
  }

  React.useEffect(() => {
    getNotes()
  }, [])

  return (
    <BaseCard title="Admin Notes">
      <NotesPage>
        <NotesSearchBar style={{ display: hideSearchBar ? 'none' : 'flex' }}>
          <SearchWrapper>
            <SearchIcon>
              <SelectIcon name="search" />
            </SearchIcon>

            <Input
              type="text"
              name="Search"
              placeholder="Search"
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </SearchWrapper>
          <NotesContainer>
            {notes
              .filter((note) =>
                (note.title + note.content)
                  .toUpperCase()
                  .includes(searchValue.toUpperCase()),
              )
              .map((note, i) => {
                return (
                  <AdminNotesCard
                    note={note}
                    key={i}
                    viewNote={viewNote}
                    disabled={isEdit && currNote != null}
                  />
                )
              })}
            <AddNotesFAB
              ref={fabRef}
              disabled={isEdit}
              onClick={() => {
                setCurrNote(null)
                setIsEdit(!isEdit)
              }}
            >
              <Icon noMargin size="24px" name="plus" />
            </AddNotesFAB>
          </NotesContainer>
        </NotesSearchBar>
        <CollapseButton>
          {hideSearchBar ? (
            <SelectIcon
              name="chevrons-right"
              size="1.5rem"
              noMargin
              onClick={() => setHideSearchBar(false)}
            />
          ) : (
            <SelectIcon
              name="chevrons-left"
              size="1.5rem"
              noMargin
              onClick={() => setHideSearchBar(true)}
            />
          )}
        </CollapseButton>
        <EditNotes>
          <Formik
            innerRef={formikValueRef}
            initialValues={currNote == null ? {} : currNote}
            enableReinitialize
            onSubmit={() => {
              // pass
            }}
          >
            <Form
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <FormStyle isHorizontal>
                <FieldWithButton
                  data-time={
                    currNote != null
                      ? `Created at: ${new Date(
                          currNote.created_at,
                        ).toLocaleString()}`
                      : ''
                  }
                >
                  <Field
                    as={TextField}
                    name="title"
                    noLabel
                    placeholder="Notes Title"
                    disabled={currNote != null && !isEdit}
                    flexAuto={true}
                    maxLength={255}
                  />

                  <ControlButton
                    className="button is-small is-round is-light is-outlined is-primary"
                    onClick={() => controlClick()}
                  >
                    {isEdit ? (
                      <>
                        <Icon name="save" />
                        Save Notes
                      </>
                    ) : (
                      <>
                        <Icon name="edit" />
                        Edit Notes
                      </>
                    )}
                  </ControlButton>
                  <ControlButton
                    className="button is-small is-round is-light is-outlined is-danger"
                    style={{
                      display: isEdit && currNote != null ? 'block' : 'none',
                    }}
                    onClick={() => deleteClick()}
                  >
                    <Icon name="trash" />
                    Delete Notes
                  </ControlButton>
                </FieldWithButton>

                <Field
                  as={RichTextField}
                  name="content"
                  style={{ overflow: 'auto' }}
                  readOnly={!isEdit}
                  toolbarHidden={!isEdit}
                  flexAuto={true}
                  noLabel
                />
              </FormStyle>
            </Form>
          </Formik>
        </EditNotes>
      </NotesPage>
    </BaseCard>
  )
}
