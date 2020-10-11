import { ReactElement } from 'react'

import { Club, School } from '../../types'
import { Text } from '../common'
import { ModelForm } from '../Form'
import BaseCard from './BaseCard'

type Props = {
  club: Club
  schools: School[]
}

export default function AdvisorCard({ club, schools }: Props): ReactElement {
  return (
    <BaseCard title="Advisors">
      <Text>Provide faculty advisor contacts for your organization.</Text>
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
              'Select schools that this faculty advisor belongs under',
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
