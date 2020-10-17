import { ReactElement } from 'react'

import { Club, School } from '../../types'
import {
  OBJECT_NAME_SINGULAR,
  SHOW_MEMBERS,
  SITE_NAME,
} from '../../utils/branding'
import { Text } from '../common'
import { ModelForm } from '../Form'
import BaseCard from './BaseCard'

type Props = {
  club: Club
  schools: School[]
}

export default function AdvisorCard({ club, schools }: Props): ReactElement {
  return (
    <BaseCard title="Points of Contact">
      <Text>
        Provide points of contact for your organization. Public points of
        contact will be shown to the public, while private points of contact
        will be shown to only {SITE_NAME} administrators.
        {SHOW_MEMBERS && (
          <>
            {' '}
            Your {OBJECT_NAME_SINGULAR} members will show up on the{' '}
            {OBJECT_NAME_SINGULAR} page, but only the name, title, and profile
            picture will be shown. If you would like to provide more detailed
            contact information, use the form below.
          </>
        )}
      </Text>
      <ModelForm
        baseUrl={`/clubs/${club.code}/advisors/`}
        initialData={club.advisor_set}
        fields={[
          { name: 'name', type: 'text' },
          { name: 'title', type: 'text' },
          {
            name: 'school',
            type: 'multiselect',
            placeholder:
              'Select schools or departments that this point of contact belongs under',
            choices: schools,
            converter: (a) => ({ value: a.id, label: a.name }),
            reverser: (a) => ({ id: a.value, name: a.label }),
          },
          { name: 'email', type: 'email' },
          { name: 'phone', type: 'text' },
          {
            name: 'public',
            type: 'checkbox',
            label: 'Show contact information to the public?',
          },
        ]}
      />
    </BaseCard>
  )
}
