import { Field } from 'formik'
import Link from 'next/link'
import React, { ReactElement } from 'react'

import { FAIR_INFO_ROUTE } from '../../constants'
import { ClubFair, MembershipRank } from '../../types'
import {
  FAIR_NAME,
  MEMBERSHIP_ROLE_NAMES,
  OBJECT_NAME_SINGULAR,
} from '../../utils/branding'
import { Icon, Text } from '../common'
import {
  CheckboxField,
  DateTimeField,
  DynamicQuestionField,
  RichTextField,
  TextField,
} from '../FormComponents'
import ModelForm from '../ModelForm'

type FairsTabProps = {
  fairs: ClubFair[]
}

const FairsTab = ({ fairs }: FairsTabProps): ReactElement<any> => {
  return (
    <>
      <Text>
        You can use this page to manage {OBJECT_NAME_SINGULAR} fairs. Since your
        account has the required permissions, you are able to view this page.
      </Text>
      <ModelForm
        baseUrl="/clubfairs/"
        initialData={fairs}
        fields={
          <>
            <Field name="name" as={TextField} required />
            <Field name="organization" as={TextField} required />
            <Field
              name="contact"
              as={TextField}
              required
              type="email"
              helpText={`The email address that students should contact for questions related to this ${FAIR_NAME} fair.`}
            />
            <Field
              name="start_time"
              as={DateTimeField}
              helpText={`When your ${FAIR_NAME} fair will start. If you have multiple time slots, this should be the beginning of the earliest slot.`}
              required
            />
            <Field
              name="end_time"
              as={DateTimeField}
              helpText={`When your ${FAIR_NAME} fair will end. If you have multiple time slots, this should be the end of the latest slot.`}
              required
            />
            <Field
              name="time"
              label="Display Time"
              as={TextField}
              helpText="If you do not specify this field, it will automatically be generated from the start and end time. This field exists so that you can specify a more accurate description of the start and end times."
            />
            <Field
              name="registration_start_time"
              as={DateTimeField}
              helpText="If this is not specified, registration will be open immediately."
            />
            <Field
              name="registration_end_time"
              as={DateTimeField}
              helpText="After this time, registrations will no longer be accepted."
              required
            />
            <Field
              name="information"
              as={RichTextField}
              helpText="This will be shown to students on the fair page."
            />
            <Field
              name="registration_information"
              as={RichTextField}
              helpText={`This will be shown to ${OBJECT_NAME_SINGULAR} ${MEMBERSHIP_ROLE_NAMES[
                MembershipRank.Officer
              ].toLowerCase()}s on the registration page.`}
            />
            <Field
              name="virtual"
              as={CheckboxField}
              helpText="Check this box if your fair is virtual."
            />
            <Field
              name="questions"
              as={DynamicQuestionField}
              helpText="The questions you enter here will be required during fair registration."
            />
          </>
        }
        tableFields={[
          { name: 'name', label: 'Name' },
          { name: 'organization', label: 'Organization' },
        ]}
        noun="Fair"
        actions={(object) => (
          <Link
            legacyBehavior
            href={{ pathname: FAIR_INFO_ROUTE, query: { fair: object.id } }}
          >
            <button className="button is-info is-small">
              <Icon name="eye" /> Preview
            </button>
          </Link>
        )}
        confirmDeletion={true}
      />
    </>
  )
}

export default FairsTab
