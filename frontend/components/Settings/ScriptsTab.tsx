import { Field, Form, Formik } from 'formik'
import React, { ReactElement, useRef, useState } from 'react'

import { doApiRequest, titleize } from '../../utils'
import { SITE_NAME } from '../../utils/branding'
import { Icon, Text } from '../common'
import { CheckboxField, SelectField, TextField } from '../FormComponents'

const ScriptBox = ({ script, useWs }): ReactElement<any> => {
  const ws = useRef<WebSocket | null>(null)
  const [isLoading, setLoading] = useState<boolean>(false)
  const [output, setOutput] = useState<string | null>(null)

  async function executeScriptHttp(data): Promise<void> {
    await doApiRequest('/scripts/?format=json', {
      method: 'POST',
      body: { action: script.name, parameters: data },
    })
      .then((resp) => resp.json())
      .then((resp) => {
        setOutput(resp.output)
      })
  }

  async function executeScriptWs(data): Promise<void> {
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
      ws.current?.send(
        JSON.stringify({ action: script.name, parameters: data }),
      )
    }
    return new Promise<void>((resolve) => {
      if (ws.current != null) {
        ws.current.onclose = () => {
          resolve()
        }
      }
    })
  }

  function execute(data): void {
    setLoading(true)
    if ('WebSocket' in window && useWs) {
      executeScriptWs(data).then(() => setLoading(false))
    } else {
      executeScriptHttp(data).then(() => setLoading(false))
    }
  }

  return (
    <div className="box">
      <div className="is-size-5 is-family-monospace">{script.name}</div>
      <Text>{script.description}</Text>
      <Formik
        initialValues={Object.keys(script.arguments)
          .map((arg) => [arg, script.arguments[arg].default])
          .reduce((acc, [k, v]) => {
            acc[k] = v
            return acc
          }, {})}
        onSubmit={execute}
      >
        <Form>
          {script.execute &&
            Object.keys(script.arguments).map((arg) => (
              <Field
                key={arg}
                as={
                  script.arguments[arg].choices != null
                    ? SelectField
                    : script.arguments[arg].type === 'bool'
                      ? CheckboxField
                      : TextField
                }
                name={arg}
                label={titleize(arg)}
                helpText={script.arguments[arg].help}
                choices={script.arguments[arg].choices}
              />
            ))}
          <button
            type="submit"
            disabled={!script.execute || isLoading}
            className="button is-primary"
          >
            <Icon name="play" /> Execute
          </button>
        </Form>
      </Formik>
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

export interface ScriptsTabProps {
  scripts: any[]
}

const ScriptsTab = ({ scripts }) => {
  const [useWs, setUseWs] = useState<boolean>(true)

  return (
    <div>
      <Text>
        As an administrator, you can execute management scripts that affect all
        of {SITE_NAME}. You can specify the execution method below. The
        preferred method is Web Sockets, as this will allow you to see real-time
        updates and work for long running scripts.
      </Text>
      <div className="field has-addons mb-5">
        <div className="control">
          <button
            className={`button ${useWs ? 'is-primary' : 'is-secondary'}`}
            onClick={() => setUseWs(true)}
          >
            Web Sockets
          </button>
        </div>
        <div className="control">
          <button
            className={`button ${!useWs ? 'is-primary' : 'is-secondary'}`}
            onClick={() => setUseWs(false)}
          >
            HTTP
          </button>
        </div>
      </div>
      {Array.isArray(scripts) ? (
        scripts
          .filter((s) => s.execute)
          .sort((a, b) =>
            a.execute ? -1 : b.execute ? 1 : a.name.localeCompare(b.name),
          )
          .map((script) => (
            <ScriptBox key={script.name} script={script} useWs={useWs} />
          ))
      ) : (
        <Text>
          You do not have permissions to view the list of available scripts.
        </Text>
      )}
    </div>
  )
}

export default ScriptsTab
