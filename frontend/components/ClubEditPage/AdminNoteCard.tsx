import { Field } from 'formik'
import moment from 'moment-timezone'
import { ReactElement } from 'react'

import { Club } from '../../types'
import { TextField } from '../FormComponents'
import { ModelForm } from '../ModelForm'
import BaseCard from './BaseCard'

type AdminNoteCardProps = {
  club: Club
}

export default function AdminNoteCard({
  club,
}: AdminNoteCardProps): ReactElement {
  const noteTableFields = [
    { label: 'Author', name: 'creator' },
    { label: 'Note', name: 'content' },
    {
      label: 'Created On',
      name: 'created_at',
      converter: (field) => moment(field).format('MMMM Do, YYYY'),
    },
  ]

  return (
    <BaseCard title="Notes">
      <p className="mb-3">
        Below is a list of notes about {club.name}. These notes are only visible
        to site administrators.
      </p>
      <ModelForm
        baseUrl={`/clubs/${club.code}/adminnotes/`}
        fields={
          <>
            <Field name="content" as={TextField} type="textarea" required />
          </>
        }
        tableFields={noteTableFields}
        searchableColumns={['content']}
        noun="Note"
      />
    </BaseCard>
  )
}
