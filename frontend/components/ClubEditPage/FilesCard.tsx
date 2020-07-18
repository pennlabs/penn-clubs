import { ReactElement, useState } from 'react'

import { Club } from '../../types'
import { doApiRequest } from '../../utils'
import { Icon } from '../common'
import Form from '../Form'
import BaseCard from './BaseCard'

type FilesCardProps = {
  club: Club
}

export default function FilesCard({ club }: FilesCardProps): ReactElement {
  const [fileAlert, setFileAlert] = useState<string | null>(null)

  return (
    <BaseCard title="Files">
      <table className="table is-fullwidth">
        <thead>
          <tr>
            <th>Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {club && club.files && club.files.length ? (
            club.files.map((a) => (
              <tr key={a.name}>
                <td>{a.name}</td>
                <td>
                  <div className="buttons">
                    <button
                      className="button is-small is-danger"
                      onClick={() =>
                        doApiRequest(
                          `/clubs/${club.code}/assets/${a.id}/?format=json`,
                          { method: 'DELETE' },
                        ).then(() => setFileAlert('File has been deleted!'))
                      }
                    >
                      <Icon name="x" alt="delete file" /> Delete
                    </button>
                    <a
                      href={`/api/clubs/${club.code}/assets/${a.id}/`}
                      target="_blank"
                      className="button is-small is-primary"
                    >
                      <Icon name="download" alt="download file" /> Download
                    </a>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={2} className="has-text-grey">
                There are no uploaded files for this club.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {fileAlert && <div className="notification is-primary">{fileAlert}</div>}
      <Form
        fields={[{ name: 'file', type: 'file' }]}
        onSubmit={(data) => {
          doApiRequest(`/clubs/${club.code}/upload_file/?format=json`, {
            method: 'POST',
            body: data.file,
          })
            .then((resp) => resp.json())
            .then((resp) => {
              setFileAlert(resp.detail)
            })
        }}
      />
    </BaseCard>
  )
}
