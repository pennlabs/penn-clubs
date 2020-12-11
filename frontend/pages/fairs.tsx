import { Field } from 'formik'
import { NextPageContext } from 'next'
import React, { ReactElement } from 'react'

import ClubFairCard from '../components/ClubEditPage/ClubFairCard'
import { Contact, Container, Metadata, Text, Title } from '../components/common'
import AuthPrompt from '../components/common/AuthPrompt'
import {
  DateTimeField,
  DynamicQuestionField,
  RichTextField,
  TextField,
} from '../components/FormComponents'
import { ModelForm } from '../components/ModelForm'
import TabView from '../components/TabView'
import { BG_GRADIENT, WHITE } from '../constants'
import renderPage from '../renderPage'
import { MembershipRank } from '../types'
import { apiCheckPermission, doBulkLookup } from '../utils'
import {
  MEMBERSHIP_ROLE_NAMES,
  OBJECT_NAME_PLURAL,
  OBJECT_NAME_SINGULAR,
  OBJECT_NAME_TITLE_SINGULAR,
} from '../utils/branding'

function FairsPage({ userInfo, fairs, memberships }): ReactElement {
  if (!userInfo) {
    return <AuthPrompt />
  }

  const canSeeFairStatus = apiCheckPermission('clubs.see_fair_status')

  const tabs = [
    {
      name: 'Register',
      content: () => (
        <>
          <Text>
            You can use this page to register your {OBJECT_NAME_SINGULAR} for{' '}
            {OBJECT_NAME_SINGULAR} fairs. Please read the instructions carefully
            before registering any of your {OBJECT_NAME_PLURAL}.
          </Text>
          <Text>
            You will only be able to register {OBJECT_NAME_PLURAL} where you
            have at least{' '}
            {MEMBERSHIP_ROLE_NAMES[MembershipRank.Officer].toLowerCase()}{' '}
            permissions. If you encounter any difficulties with the registration
            process, please email <Contact />.
          </Text>
          <ClubFairCard fairs={fairs} memberships={memberships} />
        </>
      ),
    },
    {
      name: 'Management',
      content: () => (
        <>
          <Text>
            You can use this page to manage {OBJECT_NAME_SINGULAR} fairs. Since
            your account has the required permissions, you are able to view this
            page.
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
                  helpText="The email address that students should contact for questions related to this activities fair."
                />
                <Field
                  name="start_time"
                  as={DateTimeField}
                  helpText="When your activities fair will start. If you have multiple time slots, this should be the beginning of the earliest slot."
                  required
                />
                <Field
                  name="end_time"
                  as={DateTimeField}
                  helpText="When your activities fair will end. If you have multiple time slots, this should be the end of the latest slot."
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
          />
        </>
      ),
      disabled: !canSeeFairStatus,
    },
  ]

  return (
    <>
      <Metadata title={`Register for ${OBJECT_NAME_TITLE_SINGULAR} Fairs`} />
      <Container background={BG_GRADIENT}>
        <Title style={{ marginTop: '2.5rem', color: WHITE, opacity: 0.95 }}>
          Register for {OBJECT_NAME_TITLE_SINGULAR} Fairs
        </Title>
      </Container>
      <TabView background={BG_GRADIENT} tabs={tabs} tabClassName="is-boxed" />
    </>
  )
}

FairsPage.getInitialProps = async (ctx: NextPageContext) => {
  return doBulkLookup(
    [['fairs', '/clubfairs/?format=json'], 'memberships'],
    ctx,
  )
}

FairsPage.permissions = ['clubs.see_fair_status']

export default renderPage(FairsPage)
