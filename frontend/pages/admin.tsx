import { Field, Form, Formik } from 'formik'
import { NextPageContext } from 'next'
import React, { ReactElement, useState } from 'react'

import { Container, Icon, Metadata, Text, Title } from '../components/common'
import AuthPrompt from '../components/common/AuthPrompt'
import { SelectField, TextField } from '../components/FormComponents'
import { fixDeserialize } from '../components/reports/ReportForm'
import TabView from '../components/TabView'
import { BG_GRADIENT, WHITE } from '../constants'
import renderPage from '../renderPage'
import { doApiRequest, doBulkLookup } from '../utils'
import {
  OBJECT_NAME_PLURAL,
  OBJECT_NAME_SINGULAR,
  OBJECT_NAME_TITLE,
} from '../utils/branding'

function FairsPage({ userInfo, tags, badges }): ReactElement {
  const [message, setMessage] = useState<string | null>(null)

  if (!userInfo) {
    return <AuthPrompt />
  }

  const bulkSubmit = async (data, { setSubmitting }) => {
    const resp = await doApiRequest('/clubs/bulk/?format=json', {
      method: 'POST',
      body: data,
    })
    const contents = await resp.json()
    if (contents.message || contents.error) {
      setMessage(contents.message ?? contents.error)
    }
    setSubmitting(false)
  }

  const tabs = [
    {
      name: 'Bulk Editing',
      content: () => (
        <>
          <Text>
            You can use the form below to perform bulk editing on{' '}
            {OBJECT_NAME_PLURAL}. Specify the list of {OBJECT_NAME_SINGULAR}{' '}
            codes below, which tags or badges you want to add or remove, and
            then press the action that you desire.
          </Text>
          {message != null && (
            <div className="notification is-primary">{message}</div>
          )}
          <Formik initialValues={{ action: 'add' }} onSubmit={bulkSubmit}>
            {({ setFieldValue, handleSubmit, isSubmitting }) => (
              <Form>
                <Field
                  as={TextField}
                  type="textarea"
                  name="clubs"
                  label={`List of ${OBJECT_NAME_TITLE}`}
                  helpText={`A list of ${OBJECT_NAME_SINGULAR} codes separated by commas, tabs, or new lines. Pasting in an Excel column will usually work perfectly fine.`}
                />
                <Field
                  name="tags"
                  label="Tags"
                  as={SelectField}
                  choices={tags}
                  valueDeserialize={fixDeserialize(tags)}
                  isMulti
                  helpText={`Add or remove all of the specified tags.`}
                />
                <Field
                  name="badges"
                  label="Badges"
                  as={SelectField}
                  choices={badges}
                  valueDeserialize={fixDeserialize(badges)}
                  isMulti
                  helpText={`Add or remove all of the specified badges.`}
                />
                <div className="buttons">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="button is-success"
                  >
                    <Icon name="plus" /> Bulk Add
                  </button>
                  <button
                    type="submit"
                    className="button is-danger"
                    disabled={isSubmitting}
                    onClick={(e) => {
                      setFieldValue('action', 'remove')
                      handleSubmit(e)
                    }}
                  >
                    <Icon name="x" /> Bulk Remove
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </>
      ),
    },
  ]

  return (
    <>
      <Metadata title="Admin Dashboard" />
      <Container background={BG_GRADIENT}>
        <Title style={{ marginTop: '2.5rem', color: WHITE, opacity: 0.95 }}>
          Admin Dashboard
        </Title>
      </Container>
      <TabView background={BG_GRADIENT} tabs={tabs} tabClassName="is-boxed" />
    </>
  )
}

FairsPage.getInitialProps = async (ctx: NextPageContext) => {
  return doBulkLookup(['tags', 'badges'], ctx)
}

FairsPage.permissions = []

export default renderPage(FairsPage)
