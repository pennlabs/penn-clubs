import { Field } from 'formik'
import moment from 'moment-timezone'
import React, { ReactElement } from 'react'

import { Template } from '../../types'
import { OBJECT_NAME_SINGULAR } from '../../utils/branding'
import { Text } from '../common'
import { TextField } from '../FormComponents'
import ModelForm from '../ModelForm'

type TemplatesTabProps = {
  canManageTemplates: boolean
  templates: Template[]
}

export default function TemplatesTab({
  canManageTemplates,
  templates,
}: TemplatesTabProps): ReactElement<any> {
  if (!canManageTemplates) {
    return <Text>You do not have permission to manage approval templates.</Text>
  }

  return (
    <>
      <Text>
        You can use this page to manage {OBJECT_NAME_SINGULAR} approval response
        templates. Since your account has the required permissions, you are able
        to view this page.
      </Text>
      <ModelForm
        baseUrl="/templates/"
        initialData={templates}
        fields={
          <>
            <Field
              name="title"
              as={TextField}
              required
              helpText={`The unique title of the ${OBJECT_NAME_SINGULAR} approval response template. This will be shown in the template dropdown menu.`}
            />
            <Field name="content" as={TextField} type="textarea" required />
          </>
        }
        tableFields={[
          { name: 'title', label: 'Title' },
          { name: 'content', label: 'Content' },
          { name: 'author', label: 'Author' },
          {
            name: 'created_at',
            label: 'Date Created',
            converter: (field) => moment(field).format('MMMM Do, YYYY'),
          },
          {
            name: 'updated_at',
            label: 'Last Updated',
            converter: (field) => moment(field).format('MMMM Do, YYYY'),
          },
        ]}
        noun="Template"
        confirmDeletion={true}
      />
    </>
  )
}
