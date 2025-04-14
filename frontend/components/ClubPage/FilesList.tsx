import { ReactElement } from 'react'
import TimeAgo from 'react-timeago'

import { Club } from '../../types'
import { Icon } from '../common'

type Props = {
  club: Club
}

const FilesList = ({ club }: Props): ReactElement<any> => {
  const { files } = club
  return (
    <table className="table is-fullwidth">
      <thead>
        <tr>
          <th>Name</th>
          <th>Date Uploaded</th>
          <th>Download</th>
        </tr>
      </thead>
      <tbody>
        {files &&
          files.length &&
          files.map((file) => (
            <tr key={`${file.id}`}>
              <td>{file.name}</td>
              <td>
                <TimeAgo date={file.created_at} />
              </td>
              <td>
                <a
                  href={`/api/clubs/${club.code}/assets/${file.id}/`}
                  target="_blank"
                  className="button is-small is-primary"
                >
                  <Icon name="download" alt="download file" /> Download
                </a>
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  )
}

export default FilesList
