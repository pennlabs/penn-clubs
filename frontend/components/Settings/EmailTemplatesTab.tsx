import { Field } from 'formik'
import Link from 'next/link'
import { ReactElement } from 'react'

// import { ReactElement, useEffect, useState } from 'react'
import { EmailTemplate } from '../../types'
// import { doApiRequest } from '../../utils'
import { Icon, Text } from '../common'
import { TextField } from '../FormComponents'
import ModelForm from '../ModelForm'

type Props = {
  emailTemplates?: EmailTemplate[]
  emailTemplate?: number
}

const EmailTemplatesTab = ({
  emailTemplates: initialTemplates,
  emailTemplate: initialSelection,
}: Props): ReactElement => {
  return (
    <>
      <Text>
        You can use this page to manage email templates. Since your account has
        the required permissions, you are able to view this page.
      </Text>
      <ModelForm
        baseUrl="/emailtemplates/"
        initialData={initialTemplates}
        fields={
          <>
            <Field
              name="name"
              as={TextField}
              helpText="Name of the email template."
              required
            />
            <Field
              name="template"
              as={TextField}
              type="textarea"
              helpText="Content of the email template."
              required
            />
          </>
        }
        tableFields={[{ name: 'name', label: 'Name' }]}
        noun="Email Template"
        confirmDeletion={true}
        actions={(object) => (
          <Link
            href={{
              pathname: '/api/emailpreview/',
              query: { email: object.name },
            }}
          >
            <button className="button is-info is-small">
              <Icon name="eye" /> Preview
            </button>
          </Link>
        )}
      />
    </>
  )
}

export default EmailTemplatesTab
