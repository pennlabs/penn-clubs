import { Field } from 'formik'
import { ReactElement, useState } from 'react'

import { Advisor, AdvisorVisibilityType, Club } from '../../types'
import { OBJECT_NAME_SINGULAR, SHOW_MEMBERS } from '../../utils/branding'
import { Text } from '../common'
import { SelectField, TextField } from '../FormComponents'
import { ModelForm } from '../ModelForm'
import BaseCard from './BaseCard'

type Props = {
  club: Club
  validateAdvisors?: (valid: boolean) => void
}

export const VISIBILITY_TYPES = [
  {
    value: AdvisorVisibilityType.AdminOnly,
    label: 'Admin Only',
  },
  {
    value: AdvisorVisibilityType.Students,
    label: 'Students (Logged In)',
  },
  {
    value: AdvisorVisibilityType.All,
    label: 'All (Public, External)',
  },
]

export default function AdvisorCard({
  club,
  validateAdvisors,
}: Props): ReactElement {
  const [advisorsCount, setAdvisorsCount] = useState<number>(
    club.advisor_set.length || 0,
  )
  const updateAdvisors = (
    newAdvisors: (Advisor & { _status?: boolean; _errorMessage?: string })[],
  ): void => {
    let validCount = 0
    if (newAdvisors.length) {
      validCount = newAdvisors.filter(
        (advisor) =>
          (advisor._status || !advisor._errorMessage) && advisor.visibility,
      ).length
    }
    if (validateAdvisors) {
      validateAdvisors(validCount > 0)
    }
    setAdvisorsCount(validCount)
  }

  const fields = (
    <>
      <Field name="name" as={TextField} />
      <Field name="title" as={TextField} />
      <Field name="department" as={TextField} />
      <Field name="email" as={TextField} type="email" />
      <Field name="phone" as={TextField} />
      <Field
        name="visibility"
        label="Show contact information to the public?"
        as={SelectField}
        required
        choices={VISIBILITY_TYPES}
        serialize={({ value }) => value}
        isMulti={false}
        valueDeserialize={(val) =>
          VISIBILITY_TYPES.find((x) => x.value === val)
        }
      />
    </>
  )

  return (
    <>
      <BaseCard title="Points of Contact">
        <Text>
          Provide points of contact for your organization.
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
          onUpdate={updateAdvisors}
          baseUrl={`/clubs/${club.code}/advisors/`}
          defaultObject={{ public: AdvisorVisibilityType.Students }}
          initialData={club.advisor_set}
          fields={fields}
        />
      </BaseCard>
    </>
  )
}
