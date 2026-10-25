import { ReactElement, ReactNode, useState } from 'react'
import { toast } from 'react-toastify'
import styled from 'styled-components'

import { doApiRequest } from '~/utils'

const ModalContainer = styled.div`
  text-align: left;
  padding: 20px;
`

// sends the user through Google sign-in, then back to the page they are on
export const connectGoogleUrl = (): string =>
  `/api/social/login/google-oauth2/?next=${encodeURIComponent(window.location.pathname)}`

// the backend answers with either {detail} or a list of validation messages
const errorMessage = (data: any, fallback: string): string =>
  data?.detail ?? (Array.isArray(data) ? data.join(' ') : fallback)

/**
 * Creates a Google Sheet holding the rows in the user's Google Drive, then shows
 * a link to it, or a link to connect their Google account if they haven't yet.
 */
export async function exportToGoogleSheets(
  title: string,
  rows: string[][],
): Promise<void> {
  const resp = await doApiRequest('/google/sheets/?format=json', {
    method: 'POST',
    body: { title, rows },
  })
  const data = await resp.json().catch(() => null)
  if (resp.ok) {
    toast.success(
      <a href={data.url} target="_blank" rel="noreferrer">
        Open your Google Sheet
      </a>,
      { autoClose: false },
    )
  } else if (data?.code === 'google_not_connected') {
    toast.info(
      <>
        To export to Google Sheets, first{' '}
        <a href={connectGoogleUrl()}>connect your Google account</a>.
      </>,
      { autoClose: false },
    )
  } else {
    toast.error(errorMessage(data, 'Could not export to Google Sheets.'))
  }
}

/**
 * Adds the questions of a Google Form to the end of an application.
 */
export function GoogleFormImport({
  clubCode,
  applicationId,
  onImported,
}: {
  clubCode: string
  applicationId: number
  onImported?: () => void
}): ReactElement {
  const [link, setLink] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ReactNode>(null)
  const [result, setResult] = useState<{
    imported: number
    warnings: string[]
  } | null>(null)

  const importForm = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const resp = await doApiRequest(
        `/clubs/${clubCode}/applications/${applicationId}/import_google_form/?format=json`,
        { method: 'POST', body: { link } },
      )
      const data = await resp.json().catch(() => null)
      if (resp.ok) {
        setResult(data)
        setLink('')
        onImported?.()
      } else if (data?.code === 'google_not_connected') {
        setError(
          <>
            First, <a href={connectGoogleUrl()}>connect your Google account</a>,
            then import the form again.
          </>,
        )
      } else {
        setError(errorMessage(data, 'Could not import that form.'))
      }
    } catch {
      setError(
        'Could not reach the server. Check your connection and try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalContainer>
      <h3 className="title is-4">Import from Google Forms</h3>
      <p className="mb-3">
        Open your Google Form for editing and copy the link from your browser's
        address bar. Its questions will be added to the end of this application.
      </p>
      <div className="field has-addons">
        <div className="control is-expanded">
          <input
            className="input"
            type="url"
            placeholder="https://docs.google.com/forms/d/.../edit"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
        </div>
        <div className="control">
          <button
            className={`button is-primary ${loading ? 'is-loading' : ''}`}
            disabled={!link.trim() || loading}
            onClick={importForm}
          >
            Import
          </button>
        </div>
      </div>
      {error && <p className="has-text-danger">{error}</p>}
      {result && (
        <div className="notification is-success is-light content">
          Imported {result.imported} questions. Close this window to review
          them.
          {result.warnings.length > 0 && (
            <>
              <p className="mt-3 mb-1">
                A few things couldn't be copied over exactly:
              </p>
              <ul className="mt-0">
                {result.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </ModalContainer>
  )
}
