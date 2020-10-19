import Link from 'next/link'
import { ReactElement } from 'react'

import {
  Club,
  ClubApplicationRequired,
  ClubSize,
  Major,
  School,
  Tag,
  Year,
} from '../../types'
import { doApiRequest, formatResponse, isClubFieldShown } from '../../utils'
import {
  APPROVAL_AUTHORITY,
  FIELD_PARTICIPATION_LABEL,
  OBJECT_NAME_SINGULAR,
  OBJECT_NAME_TITLE_SINGULAR,
  OBJECT_TAB_ADMISSION_LABEL,
  SITE_NAME,
} from '../../utils/branding'
import { Contact, Text } from '../common'
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
  schools: Readonly<School[]>
  majors: Readonly<Major[]>
  years: Readonly<Year[]>
  tags: Readonly<Tag[]>
  club: Partial<Club>
  isEdit: boolean
  onSubmit?: (data: {
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
  onSubmit = () => undefined,
}: ClubEditCardProps): ReactElement {
  const submit = (data): void => {
    const photo = data.image
    if (photo !== null) {
      delete data.image
    }

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
            ? `${OBJECT_NAME_TITLE_SINGULAR} has been successfully saved.`
            : `${OBJECT_NAME_TITLE_SINGULAR} has been successfully created.`

          if (photo && photo.get('file') instanceof File) {
            doApiRequest(`/clubs/${clubCode}/upload/?format=json`, {
              method: 'POST',
              body: photo,
            }).then((resp) => {
              if (resp.ok) {
                msg += ` ${OBJECT_NAME_TITLE_SINGULAR} image also saved.`
              } else {
                msg += ` However, failed to upload ${OBJECT_NAME_SINGULAR} image file!`
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
          help: isEdit ? (
            <>
              If you would like to change your {OBJECT_NAME_SINGULAR} URL in
              addition to your {OBJECT_NAME_SINGULAR} name, you will need to
              email <Contact />. Changing this field will require reapproval
              from the {APPROVAL_AUTHORITY}.
            </>
          ) : (
            <>
              Your {OBJECT_NAME_SINGULAR} URL will be generated from your{' '}
              {OBJECT_NAME_SINGULAR} name, and cannot be changed upon creation.
              Your {OBJECT_NAME_SINGULAR} name can still be changed afterwards.
            </>
          ),
        },
        {
          name: 'subtitle',
          type: 'text',
          help: `This text will be shown next to your ${OBJECT_NAME_SINGULAR} name in list and card views.`,
        },
        {
          name: 'description',
          required: true,
          help: `Changing this field will require reapproval from the ${APPROVAL_AUTHORITY}.`,
          placeholder: `Type your ${OBJECT_NAME_SINGULAR} description here!`,
          type: 'html',
        },
        {
          name: 'tags',
          type: 'multiselect',
          placeholder: `Select tags relevant to your ${OBJECT_NAME_SINGULAR}!`,
          choices: tags,
          converter: (a) => ({ value: a.id, label: a.name }),
          reverser: (a) => ({ id: a.value, name: a.label }),
        },
        {
          name: 'image',
          help: `Changing this field will require reapproval from the ${APPROVAL_AUTHORITY}.`,
          value: club.image_url,
          apiName: 'file',
          accept: 'image/*',
          type: 'image',
          label: `${OBJECT_NAME_TITLE_SINGULAR} Logo`,
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
      ].filter(({ name }) => isClubFieldShown(name)),
    },
    {
      name: 'Contact',
      type: 'group',
      description: (
        <Text>
          Contact information entered here will be shown on your{' '}
          {OBJECT_NAME_SINGULAR} page.
        </Text>
      ),
      fields: [
        {
          name: 'email',
          required: true,
          type: 'email',
          help: `Along with your ${OBJECT_NAME_SINGULAR} officers, this email will receive important notifications from ${SITE_NAME}. It will also be shown on your ${OBJECT_NAME_SINGULAR} page unless otherwise specified.`,
        },
        {
          name: 'email_public',
          type: 'checkbox',
          label: `Show this contact email to the public. If you do not check this box, your contact email will only be visible to internal ${OBJECT_NAME_SINGULAR} members.`,
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
      ].filter(({ name }) => isClubFieldShown(name)),
    },
    {
      name: OBJECT_TAB_ADMISSION_LABEL,
      type: 'group',
      description: (
        <Text>
          Some of these fields will be used to adjust {OBJECT_NAME_SINGULAR}{' '}
          ordering on the home page. Click{' '}
          <Link href="/rank">
            <a>here</a>
          </Link>{' '}
          for more details.
        </Text>
      ),
      fields: [
        {
          name: 'application_required',
          label: `Is an application required to join your ${OBJECT_NAME_SINGULAR}?`,
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
          name: 'available_virtually',
          label: `Is your ${OBJECT_NAME_SINGULAR} available virtually?`,
          type: 'checkbox',
        },
        {
          name: 'appointment_needed',
          label: `Is an appointment necessary to interact with your ${OBJECT_NAME_SINGULAR}?`,
          type: 'checkbox',
        },
        {
          name: 'how_to_get_involved',
          label: FIELD_PARTICIPATION_LABEL,
          type: 'textarea',
        },
        {
          name: 'signature_events',
          label: 'Signature Events',
          type: 'textarea',
        },
        {
          name: 'target_years',
          type: 'multiselect',
          placeholder: `Select graduation years relevant to your ${OBJECT_NAME_SINGULAR}!`,
          choices: years,
          converter: (a) => ({ value: a.id, label: a.name }),
          reverser: (a) => ({ id: a.value, name: a.label }),
        },
        {
          name: 'target_schools',
          type: 'multiselect',
          placeholder: `Select schools relevant to your ${OBJECT_NAME_SINGULAR}!`,
          choices: schools,
          converter: (a) => ({ value: a.id, label: a.name }),
          reverser: (a) => ({ id: a.value, name: a.label }),
        },
        {
          name: 'target_majors',
          type: 'multiselect',
          placeholder: `Select majors relevant to your ${OBJECT_NAME_SINGULAR}!`,
          choices: majors,
          converter: (a) => ({ value: a.id, label: a.name }),
          reverser: (a) => ({ id: a.value, name: a.label }),
        },
      ].filter(({ name }) => isClubFieldShown(name)),
    },
  ]

  const creationDefaults = {
    subtitle: 'Your Subtitle Here',
    email_public: true,
  }

  return (
    <Form
      fields={fields}
      defaults={Object.keys(club).length ? club : creationDefaults}
      onSubmit={submit}
      enableSubmitWithoutEdit={true}
    />
  )
}
