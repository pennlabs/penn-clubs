import Link from 'next/link'
import { ReactElement } from 'react'

import { Club, ClubApplicationRequired, ClubSize } from '../../types'
import { doApiRequest, formatResponse } from '../../utils'
import { Text } from '../common'
import Form from '../Form'

const CLUB_APPLICATIONS = [
  {
    value: ClubApplicationRequired.None,
    label: 'No Application Required',
  },
  {
    value: ClubApplicationRequired.Some,
    label: 'Application Required For Some Positions',
  },
  {
    value: ClubApplicationRequired.All,
    label: 'Application Required For All Positions',
  },
]

const CLUB_SIZES = [
  {
    value: ClubSize.Small,
    label: '< 20',
  },
  {
    value: ClubSize.Medium,
    label: '21-50',
  },
  {
    value: ClubSize.Large,
    label: '51-100',
  },
  {
    value: ClubSize.VeryLarge,
    label: '> 100',
  },
]

type ClubEditCardProps = {
  schools: any[]
  majors: any[]
  years: any[]
  tags: any[]
  club: Club
  isEdit: boolean
  onSubmit: (data: {
    message: ReactElement | string | null
    club?: Club
    isEdit?: boolean
  }) => void
}

export default function ClubEditCard({
  schools,
  majors,
  years,
  tags,
  club,
  isEdit,
  onSubmit,
}: ClubEditCardProps): ReactElement {
  const submit = (data): void => {
    const photo = data.image
    delete data.image

    const req =
      isEdit && club !== null
        ? doApiRequest(`/clubs/${club.code}/?format=json`, {
            method: 'PATCH',
            body: data,
          })
        : doApiRequest('/clubs/?format=json', {
            method: 'POST',
            body: data,
          })

    req.then((resp) => {
      if (resp.ok) {
        resp.json().then((info) => {
          let clubCode: string | null = null
          if (!isEdit) {
            clubCode = info.code
          } else {
            clubCode = club?.code ?? null
          }

          let msg = isEdit
            ? 'Club has been successfully saved.'
            : 'Club has been successfully created.'

          if (photo && photo.get('file') instanceof File) {
            doApiRequest(`/clubs/${clubCode}/upload/?format=json`, {
              method: 'POST',
              body: photo,
            }).then((resp) => {
              if (resp.ok) {
                msg += ' Club image also saved.'
              } else {
                msg += ' However, failed to upload club image file!'
              }
            })
          }
          onSubmit({ isEdit: true, club: info, message: msg })
        })
      } else {
        resp.json().then((err) => {
          onSubmit({ message: formatResponse(err) })
        })
      }
    })
  }

  const fields = [
    {
      name: 'General',
      type: 'group',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          help:
            !isEdit &&
            'Your club URL will be generated from your club name, and cannot be changed upon creation. Your club name can still be changed afterwards.',
        },
        {
          name: 'subtitle',
          type: 'text',
          required: true,
          help:
            'This text will be shown next to your club name in list and card views.',
        },
        {
          name: 'description',
          placeholder: 'Type your club description here!',
          type: 'html',
        },
        {
          name: 'tags',
          type: 'multiselect',
          placeholder: 'Select tags relevant to your club!',
          choices: tags,
          converter: (a) => ({ value: a.id, label: a.name }),
          reverser: (a) => ({ id: a.value, name: a.label }),
        },
        {
          name: 'image',
          apiName: 'file',
          accept: 'image/*',
          type: 'file',
          label: 'Club Logo',
        },
        {
          name: 'size',
          type: 'select',
          required: true,
          choices: CLUB_SIZES,
          converter: (a) => CLUB_SIZES.find((x) => x.value === a),
          reverser: (a) => a.value,
        },
        {
          name: 'founded',
          type: 'date',
          label: 'Date Founded',
        },
      ],
    },
    {
      name: 'Contact',
      type: 'group',
      description: (
        <Text>
          Contact information entered here will be shown on your club page.
        </Text>
      ),
      fields: [
        {
          name: 'email',
          type: 'email',
        },
        {
          name: 'website',
          type: 'url',
        },
        {
          name: 'facebook',
          type: 'url',
        },
        {
          name: 'twitter',
          type: 'url',
        },
        {
          name: 'instagram',
          type: 'url',
        },
        {
          name: 'linkedin',
          type: 'url',
        },
        {
          name: 'github',
          type: 'url',
        },
        {
          name: 'youtube',
          type: 'url',
        },
        {
          name: 'listserv',
          type: 'text',
        },
      ],
    },
    {
      name: 'Admission',
      type: 'group',
      description: (
        <Text>
          Some of these fields will be used to adjust club ordering on the home
          page. Click{' '}
          <Link href="/rank">
            <a>here</a>
          </Link>{' '}
          for more details.
        </Text>
      ),
      fields: [
        {
          name: 'application_required',
          label: 'Is an application required to join your organization?',
          required: true,
          type: 'select',
          choices: CLUB_APPLICATIONS,
          converter: (a) => CLUB_APPLICATIONS.find((x) => x.value === a),
          reverser: (a) => a.value,
        },
        {
          name: 'accepting_members',
          label: 'Are you currently accepting applications at this time?',
          type: 'checkbox',
        },
        {
          name: 'how_to_get_involved',
          type: 'textarea',
        },
        {
          name: 'target_years',
          type: 'multiselect',
          placeholder: 'Select graduation years relevant to your club!',
          choices: years,
          converter: (a) => ({ value: a.id, label: a.name }),
          reverser: (a) => ({ id: a.value, name: a.label }),
        },
        {
          name: 'target_schools',
          type: 'multiselect',
          placeholder: 'Select schools relevant to your club!',
          choices: schools,
          converter: (a) => ({ value: a.id, label: a.name }),
          reverser: (a) => ({ id: a.value, name: a.label }),
        },
        {
          name: 'target_majors',
          type: 'multiselect',
          placeholder: 'Select majors relevant to your club!',
          choices: majors,
          converter: (a) => ({ value: a.id, label: a.name }),
          reverser: (a) => ({ id: a.value, name: a.label }),
        },
      ],
    },
  ]

  return <Form fields={fields} defaults={club} onSubmit={submit} />
}
