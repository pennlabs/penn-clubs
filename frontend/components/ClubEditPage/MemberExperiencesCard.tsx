import { ReactElement } from 'react'

import { Club } from '../../types'
import { Text } from '../common'
import { ModelForm } from '../Form'
import BaseCard from './BaseCard'

type MemberExperiencesCardProps = {
  club: Club
}

export default function MemberExperiencesCard({
  club,
}: MemberExperiencesCardProps): ReactElement {
  return (
    <BaseCard title="Student Experiences">
      <Text>
        Provide more information on what participating in your organization is
        like from a student's point of view.
      </Text>
      <ModelForm
        baseUrl={`/clubs/${club.code}/testimonials/`}
        initialData={club.testimonials}
        fields={[
          {
            name: 'text',
            type: 'textarea',
            hasLabel: false,
          },
        ]}
      />
    </BaseCard>
  )
}
