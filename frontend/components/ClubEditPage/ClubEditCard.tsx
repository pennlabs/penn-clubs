import { Field, Form, Formik } from 'formik'
import Link from 'next/link'
import React, { ReactElement, useState } from 'react'

import { BLACK } from '~/constants'

import {
  Club,
  ClubApplicationRequired,
  ClubRecruitingCycle,
  ClubSize,
  Major,
  MembershipRank,
  School,
  StudentType,
  Tag,
  Year,
} from '../../types'
import {
  bifurcateFilter,
  categorizeFilter,
  doApiRequest,
  formatResponse,
  isClubFieldShown,
} from '../../utils'
import {
  APPROVAL_AUTHORITY,
  FIELD_PARTICIPATION_LABEL,
  FORM_DESCRIPTION_EXAMPLES,
  FORM_LOGO_DESCRIPTION,
  FORM_TAG_DESCRIPTION,
  FORM_TARGET_DESCRIPTION,
  MEMBERSHIP_ROLE_NAMES,
  NEW_APPROVAL_QUEUE_ENABLED,
  OBJECT_NAME_SINGULAR,
  OBJECT_NAME_TITLE_SINGULAR,
  OBJECT_TAB_ADMISSION_LABEL,
  REAPPROVAL_QUEUE_ENABLED,
  SHOW_RANK_ALGORITHM,
  SITE_ID,
  SITE_NAME,
} from '../../utils/branding'
import { ModalContent } from '../ClubPage/Actions'
import { LiveBanner, LiveSub, LiveTitle } from '../ClubPage/LiveEventsDialog'
import { Checkbox, CheckboxLabel, Contact, Modal, Text } from '../common'
import {
  CheckboxField,
  CheckboxTextField,
  CreatableMultipleSelectField,
  FileField,
  FormikAddressField,
  FormStyle,
  RichTextField,
  SelectField,
  TextField,
} from '../FormComponents'
import { doFormikInitialValueFixes } from '../ModelForm'

export const CLUB_APPLICATIONS = [
  {
    value: ClubApplicationRequired.Open,
    label: 'Open Membership',
  },
  {
    value: ClubApplicationRequired.Tryout,
    label: 'Tryout Required',
  },
  {
    value: ClubApplicationRequired.Audition,
    label: 'Audition Required',
  },
  {
    value: ClubApplicationRequired.Application,
    label: 'Application Required',
  },
  {
    value: ClubApplicationRequired.ApplicationAndInterview,
    label: 'Application and Interview Required',
  },
]

export const CLUB_RECRUITMENT_CYCLES = [
  {
    value: ClubRecruitingCycle.Unknown,
    label: 'Unknown',
  },
  {
    value: ClubRecruitingCycle.Fall,
    label: 'Fall Semester',
  },
  {
    value: ClubRecruitingCycle.Spring,
    label: 'Spring Semester',
  },
  {
    value: ClubRecruitingCycle.Both,
    label: 'Both Semesters',
  },
  {
    value: ClubRecruitingCycle.Open,
    label: 'Open',
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
  studentTypes: Readonly<StudentType[]>
  years: Readonly<Year[]>
  tags: Readonly<Tag[]>
  club: Partial<Club>
  isEdit: boolean
  onSubmit?: (data: {
    message: ReactElement<any> | string | null
    club?: Club
    isEdit?: boolean
  }) => Promise<void>
}

const Card = ({
  title,
  children,
}: React.PropsWithChildren<{
  title?: string | ReactElement<any>
}>): ReactElement<any> => {
  return (
    <div className="card mb-5">
      <div className="card-header">
        <div className="card-header-title">{title}</div>
      </div>
      <div className="card-content">{children}</div>
    </div>
  )
}
interface EmailModalProps {
  closeModal: () => void
  email: string
  setEmail: (inp: string) => void
  confirmSubmission: () => void
}

const EmailModal = ({
  closeModal,
  email,
  setEmail,
  confirmSubmission,
}: EmailModalProps): ReactElement<any> => {
  return (
    <Modal
      width={'450px'}
      show={true}
      closeModal={closeModal}
      marginBottom={false}
    >
      <div className="card-content mb-2">
        <Text className="has-text-danger">
          This email will be visible to the public.
          <br />
          We recommend that you don’t use a personal email, and instead use a
          club email.
        </Text>
        <Field
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input mb-5"
          style={{ maxWidth: '350px' }}
        ></Field>
        <div>
          <button onClick={confirmSubmission} className="button is-primary">
            Confirm
          </button>
        </div>
      </div>
    </Modal>
  )
}

/**
 * Remove fields in an object that are not part of a whitelist.
 *
 * Accounts for how some fields have _url appended as a suffix and allows these fields through.
 */
const removeNonFieldAttributes = (
  object: { [key: string]: any },
  validFields: Set<string>,
): { [key: string]: any } => {
  return Object.entries(object).reduce((acc, [key, value]) => {
    if (
      validFields.has(key) ||
      (key.endsWith('_url') && validFields.has(key.substr(0, key.length - 4)))
    ) {
      acc[key] = value
    }
    return acc
  }, {})
}

const EXCLUSIVE_CHECKBOX_TEXT_REQUIRED_ERROR =
  'We cannot accept a checkmark only. Please return to the list and provide the name of the specific programming for the student populations that have been selected.'

/**
 * A card that can show and edit the basic properties of a Club object.
 *
 * Consists of a group of cards, with each card representing a subset of fields on the Club object grouped by category.
 */
export default function ClubEditCard({
  schools,
  majors,
  studentTypes,
  years,
  tags,
  club,
  isEdit,
  onSubmit = () => Promise.resolve(undefined),
}: ClubEditCardProps): ReactElement<any> {
  const [showRankModal, setShowRankModal] = useState<boolean>(false)
  const [showTargetFields, setShowTargetFields] = useState<boolean>(
    !!(
      club.target_majors?.length ||
      club.target_schools?.length ||
      club.target_years?.length ||
      club.student_types?.length
    ),
  )

  const [showSchoolYearProgramming, setSchoolYearProgramming] =
    useState<boolean>(
      !!(
        club.target_majors?.length ||
        club.target_schools?.length ||
        club.target_years?.length ||
        club.student_types?.length
      ),
    )

  const [showStudentTypeProgramming, setStudentTypeProgramming] =
    useState<boolean>(
      !!(
        club.target_majors?.length ||
        club.target_schools?.length ||
        club.target_years?.length ||
        club.student_types?.length
      ),
    )

  const [showSchoolProgramming, setSchoolProgramming] = useState<boolean>(
    !!(
      club.target_majors?.length ||
      club.target_schools?.length ||
      club.target_years?.length ||
      club.student_types?.length
    ),
  )

  const [emailModal, showEmailModal] = useState<boolean>(false)

  const submit = (data, { setSubmitting, setStatus }): Promise<void> => {
    const photo = data.image
    if (photo !== null) {
      delete data.image
    }

    const entries = Object.entries(data)
    let body = {}

    const [exclusiveEntries, withoutExclusiveEntries] = bifurcateFilter(
      entries,
      ([key]) => !!key.match(/^exclusive:(.+?):(.+?)$/g),
    )

    // sorry ts
    const exclusives = categorizeFilter(
      exclusiveEntries,
      ([key]) => key.match(/^exclusive:(.+?):(.+?)$/)?.[1] ?? 'unknown',
    ) as unknown as {
      year: Array<[string, { checked?: boolean; detail?: string }]>
      // major: Array<[string, { checked?: boolean; detail?: string }]>
      student_type: Array<[string, { checked?: boolean; detail?: string }]>
      school: Array<[string, { checked?: boolean; detail?: string }]>
    }

    const target_years =
      exclusives.year
        ?.filter(([_, value]) => value?.checked)
        .map(([key, value]) => {
          const id = Number(key.match(/^exclusive:(.+?):(.+?)$/)?.[2] ?? -1)
          return {
            id,
            program: value.detail,
          }
        }) ?? []

    const student_types =
      exclusives.student_type
        ?.filter(([_, value]) => value?.checked)
        .map(([key, value]) => {
          const id = Number(key.match(/^exclusive:(.+?):(.+?)$/)?.[2] ?? -1)
          return {
            id,
            program: value.detail,
          }
        }) ?? []

    const target_schools =
      exclusives.school
        ?.filter(([_, value]) => value?.checked)
        .map(([key, value]) => {
          const id = Number(key.match(/^exclusive:(.+?):(.+?)$/)?.[2] ?? -1)
          return {
            id,
            program: value.detail,
          }
        }) ?? []

    if (SITE_NAME === 'fyh') {
      data.target_years.forEach((target_year) => {
        if (
          exclusives.year?.find(
            (year) => year[0].split(':')[2] === target_year.id.toString(),
          ) === undefined
        ) {
          target_years.push(target_year)
        }
      })

      data.student_types.forEach((target_student_type) => {
        if (
          exclusives.student_type?.find(
            (student_type) =>
              student_type[0].split(':')[2] ===
              target_student_type.id.toString(),
          ) === undefined
        ) {
          student_types.push(target_student_type)
        }
      })

      data.target_schools.forEach((target_school) => {
        if (
          exclusives.school?.find(
            (school) => school[0].split(':')[2] === target_school.id.toString(),
          ) === undefined
        ) {
          target_schools.push(target_school)
        }
      })

      body = {
        ...Object.fromEntries(withoutExclusiveEntries),
        target_years,
        student_types,
        target_schools,
      }
    } else {
      body = {
        ...Object.fromEntries(withoutExclusiveEntries),
        target_years,
        student_types,
        target_schools,
      }
    }

    const req =
      isEdit && club !== null
        ? doApiRequest(`/clubs/${club.code}/?format=json`, {
            method: 'PATCH',
            body,
          })
        : doApiRequest('/clubs/?format=json', {
            method: 'POST',
            body,
          })

    return req.then((resp) => {
      if (resp.ok) {
        return resp.json().then((info) => {
          let clubCode: string | null = null
          if (!isEdit) {
            clubCode = info.code
          } else {
            clubCode = club?.code ?? null
          }

          let msg = isEdit
            ? `${OBJECT_NAME_TITLE_SINGULAR} has been successfully saved.`
            : `${OBJECT_NAME_TITLE_SINGULAR} has been successfully created.`

          const finishUpload = async () => {
            if (photo && photo instanceof File) {
              const formData = new FormData()
              formData.append('file', photo)
              const resp = await doApiRequest(
                `/clubs/${clubCode}/upload/?format=json`,
                {
                  method: 'POST',
                  body: formData,
                },
              )
              if (resp.ok) {
                msg += ` ${OBJECT_NAME_TITLE_SINGULAR} image also saved.`
                const { url } = await resp.json()
                info.image_url = url
              } else {
                msg += ` However, failed to upload ${OBJECT_NAME_SINGULAR} image file!`
              }
            }
            await onSubmit({ isEdit: true, club: info, message: msg })
            setStatus({})
            setSubmitting(false)
          }
          return finishUpload()
        })
      } else {
        return resp.json().then(async (err) => {
          await onSubmit({ message: formatResponse(err) })
          setStatus(err)
          setSubmitting(false)
        })
      }
    })
  }

  const fields = [
    {
      name: 'General',
      type: 'group',
      description: (
        <div className="mb-4">
          <a onClick={() => setShowRankModal(true)}>
            How does filling out this information affect your club?
          </a>
          <Modal
            show={showRankModal}
            closeModal={() => setShowRankModal(false)}
            marginBottom={false}
            width="80%"
          >
            <ModalContent className="content mb-4">
              <h2>How we calculate club rankings</h2>
              <hr />
              <h5>
                The following positively affects your club's ranking in homepage
                search results:
              </h5>
              <ul>
                <li>
                  Upcoming events with filled out name, description, and image
                </li>
                <li>Upcoming, open applications for membership</li>
                <li>
                  Having at least 3 active officers, plus a bonus for any
                  additional non-officer member on the platform
                </li>
                <li>
                  Having between 3 and 7 useful tags (please email <Contact />{' '}
                  if none apply)
                </li>
                <li>
                  Posting a public (non-personal) contact email and 2 or more
                  social links
                </li>
                <li>
                  Having a club logo image uploaded and subtitle filled out
                </li>
                <li>
                  Filling out a club mission with images and detail (rewarded up
                  to 1000 words)
                </li>
                <li>Displaying 3 or more student testimonials (experiences)</li>
                <li>Filling out the {FIELD_PARTICIPATION_LABEL} section</li>
                <li>
                  Updating the club listing recently (within the last 8 months)
                </li>
              </ul>
            </ModalContent>
          </Modal>
        </div>
      ),
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          label: `${OBJECT_NAME_TITLE_SINGULAR} Name`,
          disabled: !REAPPROVAL_QUEUE_ENABLED,
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
              (Ex: {FORM_DESCRIPTION_EXAMPLES})
            </>
          ),
        },
        {
          name: 'subtitle',
          type: 'text',
          placeholder: 'Your Subtitle Here',
          label: `${OBJECT_NAME_TITLE_SINGULAR} Subtitle`,
          help: `This text will be shown next to your ${OBJECT_NAME_SINGULAR} name in list and card views. Enter a one sentence description of your ${OBJECT_NAME_SINGULAR}.`,
        },
        {
          name: 'terms',
          type: 'creatableMultiSelect',
          label: 'Keywords',
          help: `Enter keywords for your ${OBJECT_NAME_SINGULAR} here. This could be a term, acronym, abbreviation, or phrase that relates to your ${OBJECT_NAME_SINGULAR}. Keywords allow users to more effectively identify your ${OBJECT_NAME_SINGULAR} when they are entered in the ${SITE_NAME} search bar.`,
          deserialize: (terms) =>
            terms != null && terms !== ''
              ? terms.split(',').map((term: string) => {
                  return {
                    label: term,
                    value: term,
                  }
                })
              : null,
          serialize: (terms) =>
            terms != null ? terms.map((term) => term.value).join(',') : null,
        },
        {
          name: 'description',
          label: 'Club Mission',
          required: true,
          placeholder: `Type your ${OBJECT_NAME_SINGULAR} mission here!`,
          type: 'html',
          hidden: !REAPPROVAL_QUEUE_ENABLED,
        },
        {
          name: 'tags',
          type: 'multiselect',
          required: true,
          help: `${FORM_TAG_DESCRIPTION}`,
          placeholder: `Select tags relevant to your ${OBJECT_NAME_SINGULAR}!`,
          choices: tags,
        },
        {
          name: 'image',
          help: `${FORM_LOGO_DESCRIPTION}`,
          accept: 'image/*',
          type: 'image',
          label: `${OBJECT_NAME_TITLE_SINGULAR} Logo`,
          disabled: !REAPPROVAL_QUEUE_ENABLED,
        },
        {
          name: 'size',
          type: 'select',
          required: true,
          choices: CLUB_SIZES,
          valueDeserialize: (a) => CLUB_SIZES.find((x) => x.value === a),
          serialize: (a) => a.value,
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
          Contact information entered here will be shown{' '}
          <strong>on your {OBJECT_NAME_SINGULAR} page</strong>.
        </Text>
      ),
      fields: [
        {
          name: 'address',
          label: 'Location',
          required: false,
          type: 'location',
          help: 'Remember, this will be available to the public. Please only include information you feel comfortable sharing.',
        },
        {
          name: 'email',
          required: true,
          type: 'email',
          help:
            SITE_ID === 'fyh'
              ? `This can be a specific or general email that will serve as the main point of contact for ${SITE_NAME} users. The email associated with the owner of this resource page will be used by ${SITE_NAME} administrators as a point of contact for resource management and renewal.`
              : `Along with your ${OBJECT_NAME_SINGULAR} ${
                  MEMBERSHIP_ROLE_NAMES[MembershipRank.Officer]
                }s, this email will receive important notifications from ${SITE_NAME}. It will also be shown on your ${OBJECT_NAME_SINGULAR} page unless otherwise specified.`,
        },
        {
          name: 'email_public',
          type: 'checkbox',
          label: `Show this contact email to the public. If you do not check this box, your contact email will only be visible to internal ${OBJECT_NAME_SINGULAR} members.`,
        },
        {
          name: 'website',
          type: 'url',
          required: SITE_ID === 'fyh',
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
      description: SHOW_RANK_ALGORITHM ? (
        <Text>
          Some of these fields will be used to adjust {OBJECT_NAME_SINGULAR}{' '}
          ordering on the home page. Click <Link href="/rank">here</Link> for
          more details.
        </Text>
      ) : (
        <Text>
          This information will help students learn more about your{' '}
          {OBJECT_NAME_SINGULAR}.
        </Text>
      ),
      fields: [
        {
          name: 'application_required',
          label: `What is the membership process to join your ${OBJECT_NAME_SINGULAR}?`,
          required: true,
          type: 'select',
          choices: CLUB_APPLICATIONS,
          valueDeserialize: (a) => CLUB_APPLICATIONS.find((x) => x.value === a),
          serialize: (a) => a.value,
        },
        {
          name: 'recruiting_cycle',
          label: `When do you recruit your members?`,
          required: true,
          type: 'select',
          choices: CLUB_RECRUITMENT_CYCLES,
          valueDeserialize: (a) =>
            CLUB_RECRUITMENT_CYCLES.find((x) => x.value === a),
          serialize: (a) => a.value,
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
          type: 'html',
        },
        {
          name: 'signature_events',
          label: 'Signature Events',
          type: 'html',
        },
        {
          type: 'content',
          content:
            SITE_ID === 'fyh' ? (
              <>
                <Text>{FORM_TARGET_DESCRIPTION}</Text>
                <div className="ml-2 mb-4">
                  <CheckboxLabel>
                    <Checkbox
                      checked={!showTargetFields}
                      onChange={(e) => setShowTargetFields(false)}
                      color={BLACK}
                    />{' '}
                    <span className="ml-1">Yes.</span>
                  </CheckboxLabel>
                  {/* spacer */}
                  <div style={{ display: 'inline-block', marginLeft: '8px' }} />
                  <CheckboxLabel>
                    <Checkbox
                      checked={showTargetFields}
                      onChange={(e) => setShowTargetFields(true)}
                      color={BLACK}
                    />{' '}
                    <span className="ml-1">
                      No, my {OBJECT_NAME_SINGULAR} is restricted to certain
                      student groups.
                    </span>
                  </CheckboxLabel>
                </div>
                <Text>
                  If not, Hub@Penn has provided a way for certain student
                  populations to filter resources with support services designed
                  specifically with them in mind. In order for this filter to
                  work adequately for your resource, you must choose from
                  following list of tags.
                </Text>
                <Text>
                  Please note: It is assumed that all Penn resources are
                  available to all Penn students. Please be selective in your
                  choice of tags.
                </Text>
              </>
            ) : (
              <>
                <Text>{FORM_TARGET_DESCRIPTION}</Text>
                <div className="ml-2 mb-4">
                  <CheckboxLabel>
                    <Checkbox
                      checked={showTargetFields}
                      onChange={(e) => setShowTargetFields(e.target.checked)}
                      color={BLACK}
                    />{' '}
                    <span className="ml-1">
                      Yes, my {OBJECT_NAME_SINGULAR} is restricted to certain
                      student groups.
                    </span>
                  </CheckboxLabel>
                </div>
              </>
            ),
          hidden: SITE_ID === 'fyh',
        },
        {
          name: 'target_years',
          label: 'Target Years',
          type: 'multiselect',
          placeholder: `Select graduation years relevant to your ${OBJECT_NAME_SINGULAR}!`,
          choices: years,
          hidden: SITE_ID === 'fyh' || !showTargetFields,
          // valueDeserialize: (o) => o && { value: o.id, label: o.name },
          deserialize: (o) => ({ value: o.id, label: o.name }),
        },
        {
          name: 'target_schools',
          type: 'multiselect',
          placeholder: `Select schools relevant to your ${OBJECT_NAME_SINGULAR}!`,
          choices: schools,
          hidden: SITE_ID === 'fyh' || !showTargetFields,
        },
        {
          name: 'target_majors',
          type: 'multiselect',
          placeholder: `Select majors relevant to your ${OBJECT_NAME_SINGULAR}!`,
          choices: majors,
          hidden: SITE_ID === 'fyh' || !showTargetFields,
        },
        {
          name: 'student_types',
          type: 'multiselect',
          placeholder: `Select student types relevant to your ${OBJECT_NAME_SINGULAR}!`,
          choices: studentTypes,
          hidden: SITE_ID === 'fyh' || !showTargetFields,
        },
      ].filter(({ name }) => name == null || isClubFieldShown(name)),
    },
    {
      name: 'Exclusive Programming',
      type: 'group',
      hidden: SITE_ID !== 'fyh',
      description: (
        <>
          <Text>
            We assume that many Penn resources are available to all Penn
            students. Among all the services/programs that your resource
            provides,{' '}
            <b>
              does your resource provide programs targeted to a specific
              category of students
            </b>{' '}
            (graduate, exchange, etc.) ? If yes, please select and provide the
            name of the specific programming for the student populations that
            have been selected. If no, please skip this question.
          </Text>
        </>
      ),
      fields: [
        {
          type: 'content',
          content: (
            <div style={{ marginBottom: '8px' }}>
              <b>School Year Specific</b>
            </div>
          ),
        },
        ...years.map(({ name, id }) => {
          const inTarget = club.target_years?.find((o) => o.id === id)
          return {
            name: `exclusive:year:${id}`,
            label: name,
            type: 'checkboxText',
            textRequired: EXCLUSIVE_CHECKBOX_TEXT_REQUIRED_ERROR,
            value: {
              checked: !!inTarget,
              detail: (inTarget ?? ({} as any)).program ?? '',
            },
          }
        }),
        {
          type: 'content',
          content: (
            <div style={{ marginBottom: '8px' }}>
              <b>Student Type Specific</b>
            </div>
          ),
        },
        ...(studentTypes || []).map(({ name, id }) => {
          const inTarget = club.student_types?.find((o) => o.id === id)
          return {
            name: `exclusive:student_type:${id}`,
            label: name,
            type: 'checkboxText',
            textRequired: EXCLUSIVE_CHECKBOX_TEXT_REQUIRED_ERROR,
            value: {
              checked: !!inTarget,
              detail: (inTarget ?? ({} as any)).program ?? '',
            },
          }
        }),
        {
          type: 'content',
          content: (
            <div style={{ marginBottom: '8px' }}>
              <b>School Specific</b>
            </div>
          ),
        },
        ...schools.map(({ name, id }) => {
          const inTarget = club.target_schools?.find((o) => o.id === id)
          return {
            name: `exclusive:school:${id}`,
            label: name,
            type: 'checkboxText',
            textRequired: EXCLUSIVE_CHECKBOX_TEXT_REQUIRED_ERROR,
            value: {
              checked: !!inTarget,
              detail: (inTarget ?? ({} as any)).program ?? '',
            },
          }
        }),
      ],
    },
  ]

  const creationDefaults = {
    subtitle: '',
    email: '',
    email_public: true,
    accepting_members: false,
    size: CLUB_SIZES[0].value,
    application_required: CLUB_APPLICATIONS[0].value,
    recruiting_cycle: CLUB_RECRUITMENT_CYCLES[0].value,
  }

  const editingFields = new Set<string>()
  fields.forEach(({ fields }) =>
    fields.forEach((args) => {
      if (args.name != null) {
        editingFields.add(args.name)
      }
    }),
  )

  const initialValues = Object.keys(club).length
    ? doFormikInitialValueFixes(removeNonFieldAttributes(club, editingFields))
    : creationDefaults

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={(values, actions) =>
        submit({ ...values, emailOverride: false }, actions)
      }
      enableReinitialize
      validate={(values) => {
        const errors: { email?: string } = {}
        if (values.email.includes('upenn.edu') && !emailModal) {
          showEmailModal(true)
          errors.email = 'Please confirm your email'
        }
        return errors
      }}
      validateOnChange={false}
      validateOnBlur={false}
    >
      {({ dirty, isSubmitting, setFieldValue, submitForm, values }) => (
        <Form>
          {emailModal && (
            <EmailModal
              closeModal={() => showEmailModal(false)}
              email={values.email}
              setEmail={(newEmail) => setFieldValue('email', newEmail)}
              confirmSubmission={() => {
                showEmailModal(false)
                submitForm()
              }}
            />
          )}
          {!REAPPROVAL_QUEUE_ENABLED && (
            <LiveBanner>
              <LiveTitle>Queue Closed for Summer Break</LiveTitle>
              <LiveSub>
                No edits to existing clubs or applications for new clubs will be
                submitted for review to OSA.
              </LiveSub>
            </LiveBanner>
          )}
          {!NEW_APPROVAL_QUEUE_ENABLED &&
            REAPPROVAL_QUEUE_ENABLED &&
            !isEdit && (
              <LiveBanner>
                <LiveTitle>Queue Closed for New Clubs</LiveTitle>
                <LiveSub>
                  Submissions for new clubs are closed for the time being.
                  Please reach out to the Office of Student Affairs at
                  vpul-pennosa@pobox.upenn.edu with any questions.
                </LiveSub>
              </LiveBanner>
            )}
          <FormStyle isHorizontal>
            {fields.map(({ name, description, fields, hidden }, i) => {
              if (hidden) {
                return null
              }
              return (
                <Card title={name} key={i}>
                  {description}
                  {(fields as any[]).map(
                    (props: any, i): ReactElement<any> | null => {
                      const { hidden, ...other } = props
                      if (hidden) {
                        return null
                      }
                      if (props.type === 'content') {
                        return <div key={i}>{props.content}</div>
                      }
                      if (other.help) {
                        other.helpText = other.help
                        delete other.help
                      }
                      if (props.type === 'select') {
                        other.isMulti = false
                      } else if (props.type === 'multiselect') {
                        other.isMulti = true
                      }
                      if (props.type === 'image') {
                        other.isImage = true
                        delete other.type
                      }

                      return (
                        <Field
                          key={i}
                          as={
                            {
                              text: TextField,
                              checkbox: CheckboxField,
                              html: RichTextField,
                              multiselect: SelectField,
                              select: SelectField,
                              image: FileField,
                              address: FormikAddressField,
                              checkboxText: CheckboxTextField,
                              creatableMultiSelect:
                                CreatableMultipleSelectField,
                            }[props.type] ?? TextField
                          }
                          {...other}
                        />
                      )
                    },
                  )}
                </Card>
              )
            })}
            <button
              disabled={
                !dirty ||
                isSubmitting ||
                (!NEW_APPROVAL_QUEUE_ENABLED && !isEdit)
              }
              type="submit"
              className="button is-primary is-large"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </FormStyle>
        </Form>
      )}
    </Formik>
  )
}
