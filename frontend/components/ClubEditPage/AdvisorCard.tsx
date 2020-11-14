import { Field } from 'formik'
import { ReactElement, useState } from 'react'
import styled from 'styled-components'
import { RED } from '../../constants/colors'
import { Club} from '../../types'
import {
  OBJECT_NAME_SINGULAR,
  SHOW_MEMBERS,
  SITE_NAME,
  SITE_ID
} from '../../utils/branding'
import { Text } from '../common'
import { CheckboxField, TextField } from '../FormComponents'
import { ModelForm } from '../ModelForm'
import BaseCard from './BaseCard'

type Props = {
  club: Club
  validateAdvisors?: (valid : boolean) => void
}

const RequireText = styled.p`
  color: ${RED};
  margin-top: 1rem;
`

export default function AdvisorCard({
  club,
  validateAdvisors,
}: Props): ReactElement {
  const [advisorsCount, setAdvisorsCount] = useState<number>(
    club.advisor_set.length || 1,
  )
  const updateAdvisors = (newAdvisors) => {
    let validCount = 0
    if (newAdvisors.length) {
      validCount = newAdvisors.filter(
        (advisor) => !advisor._error_message && advisor.public,
      ).length
    }
    if (validateAdvisors) {
      if (validCount > 0) validateAdvisors(true)
      else validateAdvisors(false)
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
          onUpdate={updateAdvisors}
          baseUrl={`/clubs/${club.code}/advisors/`}
          listParams="&public=true"
          defaultObject={{ public: true }}
          initialData={club.advisor_set.filter(
            ({ public: isPublic }) => isPublic,
          )}
          fields={fields}
        />
        {SITE_ID === 'Hub@Penn' && (
          <RequireText>At least one public contact is required*</RequireText>
        )}
      </BaseCard>

      <BaseCard title="Internal Points of Contact">
        <Text>
          These private points of contact will be shown to only {SITE_NAME}{' '}
          administrators.
        </Text>
        <ModelForm
          onUpdate={updateAdvisors}
          requireOne={advisorsCount === 1}
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
