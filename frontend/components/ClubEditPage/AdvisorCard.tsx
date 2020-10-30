import { Field } from 'formik'
import { ReactElement } from 'react'

import { Club, School } from '../../types'
import {
  OBJECT_NAME_SINGULAR,
  SHOW_MEMBERS,
  SITE_NAME,
} from '../../utils/branding'
import { Text } from '../common'
import { CheckboxField, MultiselectField, TextField } from '../FormComponents'
import { ModelForm } from '../ModelForm'
import BaseCard from './BaseCard'

type Props = {
  club: Club
  schools: School[]
}

export default function AdvisorCard({ club, schools }: Props): ReactElement {
  const fields = (
    <>
      <Field name="name" as={TextField} />
      <Field name="title" as={TextField} />
      <Field
        name="school"
        as={MultiselectField}
        choices={schools}
        placeholder="Select schools or departments that this point of contact belongs under"
      />
      <Field name="email" as={TextField} type="email" />
      <Field name="phone" as={TextField} />
      <Field
        name="public"
        as={CheckboxField}
        label="Show contact information to the public?"
      />
    </>
  )

  return (
    <>
      <BaseCard title="Public Points of Contact">
        <Text>
          Provide points of contact for your organization. These public points
          of contact will be shown to the public.
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
          listParams="&public=true"
          defaultObject={{ public: true }}
          initialData={club.advisor_set.filter(
            ({ public: isPublic }) => isPublic,
          )}
          fields={fields}
        />
      </BaseCard>
      <BaseCard title="Internal Points of Contact">
        <Text>
          These private points of contact will be shown to only {SITE_NAME}{' '}
          administrators.
        </Text>
        <ModelForm
          baseUrl={`/clubs/${club.code}/advisors/`}
          listParams="&public=false"
          defaultObject={{ public: false }}
          initialData={club.advisor_set.filter(
            ({ public: isPublic }) => !isPublic,
          )}
          fields={fields}
        />
      </BaseCard>
    </>
  )
}
