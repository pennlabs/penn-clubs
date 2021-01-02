import { Field, Form, Formik } from 'formik'
import { NextPageContext } from 'next'
import React, { ReactElement, useRef, useState } from 'react'
import { toast } from 'react-toastify'

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
  OBJECT_NAME_TITLE_SINGULAR,
} from '../utils/branding'

const ScriptBox = ({ script }): ReactElement => {
  const ws = useRef<WebSocket | null>(null)
  const [isLoading, setLoading] = useState<boolean>(false)
  const [output, setOutput] = useState<string | null>(null)

  async function executeScriptHttp() {
    await doApiRequest('/scripts/?format=json', {
      method: 'POST',
      body: { action: script.name },
    })
      .then((resp) => resp.json())
      .then((resp) => {
        setOutput(resp.output)
      })
  }

  async function executeScriptWs() {
    setLoading(true)
    setOutput('')
    const wsUrl = `${location.protocol === 'http:' ? 'ws' : 'wss'}://${
      location.host
    }/api/ws/script/`
    ws.current = new WebSocket(wsUrl)
    ws.current.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.output) {
        setOutput((output) => output + data.output)
      }
    }
    ws.current.onopen = () => {
      ws.current?.send(JSON.stringify({ action: script.name }))
    }
    return new Promise<void>((resolve) => {
      if (ws.current != null) {
        ws.current.onclose = () => {
          resolve()
        }
      }
    })
  }

  return (
    <div className="box">
      <div className="is-size-5 is-family-monospace">{script.name}</div>
      <Text>{script.description}</Text>
      <button
        disabled={!script.execute || isLoading}
        className="button is-primary"
        onClick={(e) => {
          e.preventDefault()
          setLoading(true)
          if ('WebSocket' in window) {
            executeScriptWs().then(() => setLoading(false))
          } else {
            executeScriptHttp().then(() => setLoading(false))
          }
        }}
      >
        <Icon name="play" /> Execute
      </button>
      {output != null && (
        <pre className="mt-3">
          {output.length > 0 ? (
            output
          ) : (
            <span className="has-text-grey">(no output)</span>
          )}
        </pre>
      )}
    </div>
  )
}

function AdminPage({
  userInfo,
  tags,
  badges,
  clubfairs,
  scripts,
}): ReactElement {
  if (!userInfo) {
    return <AuthPrompt />
  }

  const bulkSubmit = async (data, { setSubmitting }) => {
    try {
      const resp = await doApiRequest('/clubs/bulk/?format=json', {
        method: 'POST',
        body: data,
      })
      const contents = await resp.json()
      if (contents.message) {
        toast.info(contents.message, { hideProgressBar: true })
      } else if (contents.error) {
        toast.error(contents.error, { hideProgressBar: true })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const tabs = [
    {
      name: 'bulk',
      label: 'Bulk Editing',
      content: () => (
        <>
          <Text>
            You can use the form below to perform bulk editing on{' '}
            {OBJECT_NAME_PLURAL}. Specify the list of {OBJECT_NAME_SINGULAR}{' '}
            codes below, which tags or badges you want to add or remove, and
            then press the action that you desire.
          </Text>
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
                <Field
                  name="fairs"
                  label={`${OBJECT_NAME_TITLE_SINGULAR} Fairs`}
                  as={SelectField}
                  choices={clubfairs}
                  valueDeserialize={fixDeserialize(clubfairs)}
                  isMulti
                  helpText={`Register or deregister the ${OBJECT_NAME_SINGULAR} for the selected fairs. Does not take into account any fair questions.`}
                />
                <div className="buttons">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="button is-success"
                    onClick={(e) => {
                      e.preventDefault()
                      setFieldValue('action', 'add')
                      handleSubmit()
                    }}
                  >
                    <Icon name="plus" /> Bulk Add
                  </button>
                  <button
                    type="submit"
                    className="button is-danger"
                    disabled={isSubmitting}
                    onClick={(e) => {
                      e.preventDefault()
                      setFieldValue('action', 'remove')
                      handleSubmit()
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
    {
      name: 'scripts',
      label: 'Scripts',
      content: () => (
        <div>
          {Array.isArray(scripts) ? (
            scripts
              .sort((a, b) =>
                a.execute ? -1 : b.execute ? 1 : a.name.localeCompare(b.name),
              )
              .map((script) => <ScriptBox key={script.name} script={script} />)
          ) : (
            <Text>
              You do not have permissions to view the list of available scripts.
            </Text>
          )}
        </div>
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

AdminPage.getInitialProps = async (ctx: NextPageContext) => {
  return doBulkLookup(['tags', 'badges', 'clubfairs', 'scripts'], ctx)
}

AdminPage.permissions = []

export default renderPage(AdminPage)
