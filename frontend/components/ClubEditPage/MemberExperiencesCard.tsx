import { Field } from 'formik'
import { ReactElement } from 'react'

import { Club } from '../../types'
import { Text } from '../common'
import { TextField } from '../FormComponents'
import { ModelForm } from '../ModelForm'
import BaseCard from './BaseCard'

type MemberExperiencesCardProps = {
  club: Club
}

export default function MemberExperiencesCard({
  club,
}: MemberExperiencesCardProps): ReactElement<any> {
  return (
    <BaseCard title="Student Experiences">
      <Text>
        Provide more information on what participating in your organization is
        like from a student's point of view.
      </Text>
      <ModelForm
        baseUrl={`/clubs/${club.code}/testimonials/`}
        initialData={club.testimonials}
        fields={<Field name="text" as={TextField} type="textarea" noLabel />}
      />
    </BaseCard>
  )
}
