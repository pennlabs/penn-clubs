import { ReactElement, useState } from 'react'
import TimeAgo from 'react-timeago'

import { Club, File } from '../../types'
import { doApiRequest } from '../../utils'
import { Icon } from '../common'
import Form from '../Form'
import BaseCard from './BaseCard'

type FilesCardProps = {
  club: Club
}

export default function FilesCard({ club }: FilesCardProps): ReactElement {
  const [files, setFiles] = useState<File[]>(club.files)

  const reloadFiles = () => {
    doApiRequest(`/clubs/${club.code}/assets/?format=json`)
      .then((resp) => resp.json())
      .then(setFiles)
  }

  return (
    <BaseCard title="Files">
      <table className="table is-fullwidth">
        <thead>
          <tr>
            <th>Name</th>
            <th>Date Uploaded</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {files && files.length ? (
            files.map((a) => (
              <tr key={`${a.id}-${a.name}`}>
                <td>{a.name}</td>
                <td>
                  <TimeAgo date={a.created_at} />
                </td>
                <td>
                  <div className="buttons">
                    <button
                      className="button is-small is-danger"
                      onClick={() =>
                        doApiRequest(
                          `/clubs/${club.code}/assets/${a.id}/?format=json`,
                          { method: 'DELETE' },
                        ).then(() => reloadFiles())
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
              <td colSpan={3} className="has-text-grey">
                There are no uploaded files for this club.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <Form
        fields={[{ name: 'file', type: 'file' }]}
        onSubmit={(data) => {
          doApiRequest(`/clubs/${club.code}/upload_file/?format=json`, {
            method: 'POST',
            body: data.file,
          })
            .then((resp) => resp.json())
            .then(() => reloadFiles())
        }}
      />
    </BaseCard>
  )
}
