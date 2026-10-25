import { Field, Form, Formik, useField, useFormikContext } from 'formik'
import Link from 'next/link'
import React, {
  ReactElement,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react'
import styled from 'styled-components'

import { BLACK } from '~/constants'
import { useRegistrationQueueSettings } from '~/hooks/useRegistrationQueueSettings'

import { MD, mediaMaxWidth } from '../../constants/measurements'
import { CLUB_ROUTE } from '../../constants/routes'
import {
  Category,
  Classification,
  Club,
  ClubApplicationRequired,
  ClubRecruitingCycle,
  ClubSize,
  Eligibility,
  GroupActivityOption,
  Major,
  MembershipRank,
  School,
  Status,
  StudentType,
  Tag,
  Type,
  UserInfo,
  Year,
} from '../../types'
import {
  apiCheckPermission,
  bifurcateFilter,
  categorizeFilter,
  doApiRequest,
  formatResponse,
  hasAdminPermissions,
  isClubFieldShown,
  isSummer,
} from '../../utils'
import {
  APPROVAL_AUTHORITY,
  APPROVAL_AUTHORITY_SHORTHAND,
  FIELD_PARTICIPATION_LABEL,
  FORM_DESCRIPTION_EXAMPLES,
  FORM_LOGO_DESCRIPTION,
  FORM_TARGET_DESCRIPTION,
  FORM_TARGET_ENABLED,
  MEMBERSHIP_ROLE_NAMES,
  OBJECT_NAME_SINGULAR,
  OBJECT_NAME_TITLE_SINGULAR,
  OBJECT_TAB_ADMISSION_LABEL,
  SHOW_RANK_ALGORITHM,
  SITE_ID,
  SITE_NAME,
} from '../../utils/branding'
import { ModalContent } from '../ClubPage/Actions'
import { LiveBanner, LiveSub, LiveTitle } from '../ClubPage/LiveEventsDialog'
import { Checkbox, CheckboxLabel, Contact, Icon, Modal, Text } from '../common'
import {
  CheckboxField,
  CheckboxTextField,
  CreatableMultipleSelectField,
  FieldHelpTip,
  FileField,
  FormikAddressField,
  FormStyle,
  RichTextField,
  SelectField,
  TextField,
} from '../FormComponents'
import { doFormikInitialValueFixes } from '../ModelForm'
import AdvisorCard from './AdvisorCard'
import { ADMIN_NAVY, ADMIN_PAD_FIELD } from './adminTheme'
import { PageHeading, PageTitle, ViewLink } from './ClubAdminShell'
import {
  EDIT_SECTION_ATTR,
  editSectionCardStyle,
  editSectionHeaderStyle,
  toSectionId,
} from './editSection'

// Group Activity Assessment Field Component
const GroupActivityAssessmentField: React.FC<{
  name: string
  label?: string
  helpText?: string
  options: GroupActivityOption[]
}> = ({ name, label = 'Group Activity Assessment', helpText, options }) => {
  const [field, meta] = useField(name)
  const { setFieldValue, setFieldTouched, submitCount } = useFormikContext()

  const currentValues = field.value || []
  const selectedIds: number[] = currentValues.map((v) =>
    typeof v === 'object' && v !== null ? v.id : v,
  )
  const noneOption = options.find((opt) => opt.text === 'None of the above')
  const isNoneSelected = noneOption
    ? selectedIds.includes(noneOption.id)
    : false

  const handleCheckboxChange = (
    option: GroupActivityOption,
    checked: boolean,
  ) => {
    if (checked) {
      if (option.text === 'None of the above') {
        // Selecting "None of the above" clears all other selections
        setFieldValue(name, [option])
      } else {
        // Selecting any other option removes "None of the above" and adds the option
        const valuesWithoutNone = currentValues.filter(
          (val) => (typeof val === 'object' ? val.id : val) !== noneOption?.id,
        )
        // Avoid duplicates
        const exists = valuesWithoutNone.some(
          (val) => (typeof val === 'object' ? val.id : val) === option.id,
        )
        setFieldValue(
          name,
          exists ? valuesWithoutNone : [...valuesWithoutNone, option],
        )
      }
    } else {
      // Unchecking removes the option
      setFieldValue(
        name,
        currentValues.filter(
          (val) => (typeof val === 'object' ? val.id : val) !== option.id,
        ),
      )
    }
    setFieldTouched(name, true, false)
  }

  const isOptionSelected = (optionId: number) => selectedIds.includes(optionId)

  return (
    <div className="field" data-field-name={name}>
      <label className="label">
        <span>
          {label}
          <span style={{ color: 'red' }}>*</span>
        </span>
        {helpText ? (
          <FieldHelpTip label={label}>{helpText}</FieldHelpTip>
        ) : null}
      </label>
      <div className="control">
        <div style={{ marginBottom: '1rem' }}>
          {options.map((option) => (
            <div key={option.id} style={{ marginBottom: '0.5rem' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  style={{ marginRight: '0.5rem', transform: 'scale(1.2)' }}
                  checked={isOptionSelected(option.id)}
                  onChange={(e) =>
                    handleCheckboxChange(option, e.target.checked)
                  }
                />
                <span>{option.text}</span>
              </label>
            </div>
          ))}
        </div>
      </div>
      {submitCount > 0 && meta.error && (
        <p className="help is-danger">{meta.error}</p>
      )}
    </div>
  )
}

/**
 * After submit, scroll to the first invalid field in form order
 * (client errors first, then server/status errors).
 */
const ScrollToFirstError = ({ fieldOrder }: { fieldOrder: string[] }): null => {
  const { errors, status, submitCount, isSubmitting } =
    useFormikContext<Record<string, unknown>>()
  const lastScrolledSubmitCount = useRef(0)

  useEffect(() => {
    // Wait until submit finishes so server status errors are included.
    if (
      isSubmitting ||
      submitCount < 1 ||
      submitCount === lastScrolledSubmitCount.current
    ) {
      return
    }

    const firstErrorField = fieldOrder.find(
      (name) => Boolean(errors?.[name]) || Boolean(status?.[name]),
    )
    if (!firstErrorField) {
      return
    }

    lastScrolledSubmitCount.current = submitCount
    const el = document.querySelector(
      `[data-field-name="${firstErrorField}"]`,
    ) as HTMLElement | null
    if (!el) {
      return
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const focusable = el.querySelector(
      'input, textarea, select, button, [tabindex]',
    ) as HTMLElement | null
    focusable?.focus?.({ preventScroll: true })
  }, [errors, fieldOrder, isSubmitting, status, submitCount])

  return null
}

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
  categories: Readonly<Category[]>
  classifications: Readonly<Classification[]>
  eligibilities: Readonly<Eligibility[]>
  types: Readonly<Type[]>
  statuses: Readonly<Status[]>
  groupActivityOptions: Readonly<GroupActivityOption[]>
  userInfo?: UserInfo
  club: Partial<Club>
  isEdit: boolean
  variant?: 'admin' | 'stacked'

  onSubmit?: (data: {
    message: ReactElement<any> | string | null
    club?: Club
    isEdit?: boolean
  }) => Promise<void>
}

const AdminGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(260px, 0.9fr);
  gap: 16px;
  align-items: start;

  ${mediaMaxWidth(MD)} {
    grid-template-columns: 1fr;
  }
`

const EditPageBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 16px;

  ${PageHeading} {
    margin: 0;
    min-width: 0;
  }
`

const FieldPair = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${ADMIN_PAD_FIELD};

  ${mediaMaxWidth(MD)} {
    grid-template-columns: 1fr;
  }

  .field,
  .field:not(:last-child) {
    margin-bottom: 0;
  }
`

const MediaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${ADMIN_PAD_FIELD};
  align-items: flex-start;

  ${mediaMaxWidth(MD)} {
    flex-direction: column;
  }

  .field,
  .field:not(:last-child) {
    flex: 0 0 auto;
    width: auto;
    margin-bottom: 0;
  }
`

const MediaHelp = styled.div`
  flex: 1;
  min-width: 0;
  font-size: 0.875rem;
  line-height: 1.45;
  color: #42424f;

  p {
    margin: 0 0 0.5rem;
  }

  p:last-child {
    margin-bottom: 0;
  }
`

const EmailRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  input {
    flex: 1;
    min-width: 0;
  }
`

const VisibilityButton = styled.button<{ $public?: boolean }>`
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  gap: 6px;
  height: 38px;
  padding: 0 12px;
  border: 1px solid #d8d8d8;
  border-radius: 10px;
  background: #f3f3f3;
  color: ${ADMIN_NAVY};
  cursor: pointer;
  font-size: 0.875rem;
  line-height: 1;
  white-space: nowrap;

  &:hover {
    background: #ececec;
  }
`

const EmailPublicField = (props: {
  name?: string
  required?: boolean
  label?: string
  helpText?: string
  help?: string
}): ReactElement<any> => {
  const [emailField, emailMeta] = useField('email')
  const [publicField, , publicHelpers] = useField('email_public')
  const { submitCount } = useFormikContext<any>()
  const isPublic = Boolean(publicField.value)
  const label = props.label ?? 'Email'
  const helpText = props.helpText ?? props.help
  const errorMessage =
    submitCount > 0 && typeof emailMeta.error === 'string'
      ? emailMeta.error
      : undefined

  return (
    <div className="field" data-field-name="email">
      <label className="label" htmlFor="club-email">
        <span>
          {label}
          {props.required && <span style={{ color: 'red' }}>*</span>}
        </span>
        {helpText && <FieldHelpTip label={label}>{helpText}</FieldHelpTip>}
      </label>
      <div className="control">
        <EmailRow>
          <input
            id="club-email"
            type="email"
            className={`input${errorMessage ? ' is-danger' : ''}`}
            {...emailField}
            value={emailField.value ?? ''}
          />
          <VisibilityButton
            type="button"
            $public={isPublic}
            aria-pressed={isPublic}
            aria-label={
              isPublic ? 'Email is public. Make private.' : 'Email is private. Make public.'
            }
            title={
              isPublic
                ? 'Visible on the club page. Click to hide from the public.'
                : 'Hidden from the public. Click to show on the club page.'
            }
            onClick={() => publicHelpers.setValue(!isPublic)}
          >
            <Icon name={isPublic ? 'globe' : 'lock'} alt="" size="1rem" fitSize />
            {isPublic ? 'Public' : 'Private'}
          </VisibilityButton>
        </EmailRow>
      </div>
      {errorMessage && <p className="help is-danger">{errorMessage}</p>}
    </div>
  )
}

const SOCIAL_CONTACT_FIELDS = [
  { name: 'facebook', label: 'Facebook' },
  { name: 'instagram', label: 'Instagram' },
  { name: 'twitter', label: 'Twitter' },
  { name: 'linkedin', label: 'LinkedIn' },
  { name: 'github', label: 'GitHub' },
  { name: 'youtube', label: 'YouTube' },
]

const NUMBER_CONTACT_FIELDS = ['phone']
const OTHER_CONTACT_FIELDS = ['listserv']

const contactHasValue = (club: Club, name: string): boolean => {
  const value = club[name as keyof Club]
  return value != null && String(value).trim() !== ''
}

const AddContactMenu = ({
  availableSocial,
  canAddNumber,
  canAddOther,
  onAdd,
}: {
  availableSocial: Array<{ name: string; label: string }>
  canAddNumber: boolean
  canAddOther: boolean
  onAdd: (names: string[]) => void
}): ReactElement<any> | null => {
  const [open, setOpen] = useState(false)
  const [socialOpen, setSocialOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false)
        setSocialOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const hasAnything =
    availableSocial.length > 0 || canAddNumber || canAddOther
  if (!hasAnything) {
    return null
  }

  return (
    <AddContactWrap ref={ref}>
      <AddContactButton
        type="button"
        aria-label="Add contact link"
        aria-expanded={open}
        onClick={() => {
          setOpen((current) => !current)
          setSocialOpen(false)
        }}
      >
        <Icon name="plus" alt="" size="22px" fitSize />
      </AddContactButton>
      {open && (
        <AddContactList>
          {availableSocial.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setSocialOpen((current) => !current)}
              >
                Add Social Media
              </button>
              {socialOpen &&
                availableSocial.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    className="sub"
                    onClick={() => {
                      onAdd([item.name])
                      setOpen(false)
                      setSocialOpen(false)
                    }}
                  >
                    {item.label}
                  </button>
                ))}
            </>
          )}
          {canAddNumber && (
            <button
              type="button"
              onClick={() => {
                onAdd(NUMBER_CONTACT_FIELDS)
                setOpen(false)
              }}
            >
              Add Number
            </button>
          )}
          {canAddOther && (
            <button
              type="button"
              onClick={() => {
                onAdd(OTHER_CONTACT_FIELDS)
                setOpen(false)
              }}
            >
              Add Other
            </button>
          )}
        </AddContactList>
      )}
    </AddContactWrap>
  )
}

const AddContactWrap = styled.div`
  position: relative;
  margin-right: 12px;
`

const AddContactButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  background: transparent;
  color: ${ADMIN_NAVY};
  cursor: pointer;
`

const AddContactList = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  z-index: 20;
  min-width: 188px;
  padding: 4px 0;
  background: white;
  border: 1px solid #d8d8d8;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

  button {
    display: block;
    width: 100%;
    padding: 8px 12px;
    border: 0;
    background: transparent;
    color: ${ADMIN_NAVY};
    font-size: 0.875rem;
    text-align: left;
    cursor: pointer;
  }

  button:hover {
    background: #f3f3f3;
  }

  button.sub {
    padding-left: 22px;
    color: #42424f;
  }
`

const SaveButton = styled.button`
  flex-shrink: 0;
  background: #4f46e5;
  color: white;
  border: 0;
  border-radius: 6px;
  padding: 0.6rem 1.2rem;
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const Card = ({
  title,
  children,
  action,
}: React.PropsWithChildren<{
  title?: string | ReactElement<any>
  action?: ReactNode
}>): ReactElement<any> => {
  const label = typeof title === 'string' ? title : undefined
  const id = label ? toSectionId(label) : undefined
  return (
    <div
      className="card mb-5"
      id={id}
      {...(label ? { [EDIT_SECTION_ATTR]: label } : {})}
      style={editSectionCardStyle}
    >
      <div
        className="card-header"
        style={{ ...editSectionHeaderStyle, alignItems: 'center' }}
      >
        <div className="card-header-title">{title}</div>
        {action}
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
  categories,
  classifications,
  eligibilities,
  types,
  statuses,
  groupActivityOptions,
  club,
  isEdit,
  userInfo,
  variant = 'stacked',

  onSubmit = () => Promise.resolve(undefined),
}: ClubEditCardProps): ReactElement<any> {
  const placeholderRejectionReason =
    'Placeholder club - must edit with real details for approval'
  const { settings: queueSettings, isLoading } = useRegistrationQueueSettings()
  const canApprove = apiCheckPermission('clubs.approve_club', true) === true
  const isSuperuser = userInfo?.is_superuser === true
  const hasQueueOverride = isSuperuser || canApprove
  const isReapprovalOpen = queueSettings?.reapproval_queue_open === true
  const isNewApprovalOpen = queueSettings?.new_approval_queue_open === true
  const queueBlocksCurrentForm =
    (isEdit && !isReapprovalOpen) || (!isEdit && !isNewApprovalOpen)
  const [isClient, setIsClient] = useState(false)
  const [showRankModal, setShowRankModal] = useState<boolean>(false)
  const [addedContact, setAddedContact] = useState<string[]>(() =>
    [
      ...SOCIAL_CONTACT_FIELDS.map((item) => item.name),
      ...NUMBER_CONTACT_FIELDS,
      ...OTHER_CONTACT_FIELDS,
    ].filter((name) => contactHasValue(club, name)),
  )
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

  useEffect(() => {
    setIsClient(true)
  }, [])

  const appendFormValue = (
    formData: FormData,
    key: string,
    value: unknown,
  ): void => {
    if (value === undefined || value === null) {
      return
    }
    if (value instanceof File) {
      formData.append(key, value)
      return
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (
          typeof item === 'object' &&
          item !== null &&
          !(item instanceof Date)
        ) {
          Object.entries(item as Record<string, unknown>).forEach(
            ([childKey, childValue]) =>
              appendFormValue(
                formData,
                `${key}[${index}]${childKey}`,
                childValue,
              ),
          )
        } else {
          appendFormValue(formData, key, item)
        }
      })
      return
    }
    if (value instanceof Date) {
      formData.append(key, value.toISOString())
      return
    }
    if (typeof value === 'object') {
      Object.entries(value as Record<string, unknown>).forEach(
        ([childKey, childValue]) =>
          appendFormValue(formData, `${key}.${childKey}`, childValue),
      )
      return
    }
    formData.append(key, String(value))
  }

  const buildClubFormData = (body: object, constitution: File): FormData => {
    const formData = new FormData()
    Object.entries(body).forEach(([key, value]) => {
      appendFormValue(formData, key, value)
    })
    formData.append('constitution', constitution)
    return formData
  }

  const submit = (data, { setSubmitting, setStatus }): Promise<void> => {
    const photo = data.image
    if (photo !== null && photo !== undefined) {
      delete data.image
    }
    const constitution = data.constitution
    if (constitution !== null && constitution !== undefined) {
      delete data.constitution
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

    const targetYears =
      exclusives.year
        ?.filter(([_, value]) => value?.checked)
        .map(([key, value]) => {
          const id = Number(key.match(/^exclusive:(.+?):(.+?)$/)?.[2] ?? -1)
          return {
            id,
            program: value.detail,
          }
        }) ?? []

    const studentTypes =
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
          targetYears.push(target_year)
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
          studentTypes.push(target_student_type)
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
        target_years: targetYears,
        student_types: studentTypes,
        target_schools,
      }
    } else {
      body = {
        ...Object.fromEntries(withoutExclusiveEntries),
        target_years: targetYears,
        student_types: studentTypes,
        target_schools,
      }
    }

    const requestedApproval = (body as { approved?: boolean }).approved === true
    const requestBody =
      !isEdit && hasQueueOverride
        ? {
            ...body,
            approved: requestedApproval,
            ...(requestedApproval
              ? {}
              : { approved_comment: placeholderRejectionReason }),
          }
        : body

    // Create must send constitution in the same multipart request (backend
    // validates it on POST). Edits upload constitution separately so other
    // fields can stay JSON and empty arrays still clear correctly.
    const uploadConstitutionFile = async (
      clubCode: string,
      file: File,
    ): Promise<Response> => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('is_constitution', 'true')
      return doApiRequest(`/clubs/${clubCode}/upload_file/?format=json`, {
        method: 'POST',
        body: formData,
      })
    }

    const runClubRequest = async (): Promise<Response> => {
      if (isEdit && club?.code && constitution instanceof File) {
        const uploadResp = await uploadConstitutionFile(club.code, constitution)
        if (!uploadResp.ok) {
          return uploadResp
        }
      }

      const bodyForRequest =
        !isEdit && constitution instanceof File
          ? buildClubFormData(requestBody, constitution)
          : requestBody

      if (isEdit && club?.code) {
        return doApiRequest(`/clubs/${club.code}/?format=json`, {
          method: 'PATCH',
          body: bodyForRequest,
        })
      }
      return doApiRequest('/clubs/?format=json', {
        method: 'POST',
        body: bodyForRequest,
      })
    }

    return runClubRequest().then((resp) => {
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
          {/* <a onClick={() => setShowRankModal(true)}>
            How does filling out this information affect your club?
          </a> */}
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
        ...(!isEdit && hasQueueOverride
          ? [
              {
                name: 'approved',
                type: 'checkbox',
                label: `If checked, this ${OBJECT_NAME_SINGULAR} will be visible to the public right away without approval. Otherwise, it will be created as not approved with a placeholder reason until edited and resubmitted for review.`,
              },
            ]
          : []),
        {
          name: 'name',
          type: 'text',
          required: true,
          label: `${OBJECT_NAME_TITLE_SINGULAR} Name`,
          disabled: !isReapprovalOpen && !hasQueueOverride,
          help: isEdit ? (
            <>
              Changing this field will require reapproval from the{' '}
              {APPROVAL_AUTHORITY}. If you would like to change your{' '}
              {OBJECT_NAME_SINGULAR} URL to match your {OBJECT_NAME_SINGULAR}{' '}
              name, you will need to contact it at <Contact point="support" />{' '}
              for permission and copy <Contact />.
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
          name: 'category',
          type: 'select',
          label: 'Category',
          required: true,
          help: 'Select the category that best describes your organization.',
          choices: categories,
        },
        {
          name: 'classification',
          type: 'select',
          label: 'Classification',
          required: true,
          help: 'Select the classification that applies to your organization.',
          choices: classifications,
        },
        {
          name: 'tags',
          type: 'multiselect',
          label: 'Tags',
          help: 'Select tags that describe your organization. These are optional and permit multiple choices.',
          placeholder: 'Select tags...',
          choices: tags,
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
          help: `A focused, short statement in accordance with ${APPROVAL_AUTHORITY_SHORTHAND} guidelines. Cannot exceed 150 words.`,
          required: true,
          placeholder: `Type your ${OBJECT_NAME_SINGULAR} mission here!`,
          type: 'html',
          hidden: !isClient || (!isReapprovalOpen && !hasQueueOverride),
        },
        {
          name: 'image',
          help: `${FORM_LOGO_DESCRIPTION}`,
          accept: 'image/*',
          type: 'image',
          label: `${OBJECT_NAME_TITLE_SINGULAR} Logo`,
          disabled: !isReapprovalOpen && !hasQueueOverride,
        },
        {
          name: 'constitution',
          help: club.constitution_url ? (
            <>
              Current constitution:{' '}
              <a href={club.constitution_url} target="_blank">
                Download
              </a>
              . Upload a PDF, DOC, or DOCX file to replace it.
            </>
          ) : (
            'Upload a PDF, DOC, or DOCX file containing your club constitution.'
          ),
          accept:
            '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          type: 'file',
          required: !hasQueueOverride && !club.constitution_url,
          label: `${OBJECT_NAME_TITLE_SINGULAR} Constitution`,
          disabled: !isReapprovalOpen && !hasQueueOverride,
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
      name: 'Group Activity Assessment',
      type: 'group',
      description: (
        <Text>
          Please indicate which activities your {OBJECT_NAME_SINGULAR} engages
          in. This information helps us understand your group's activities and
          ensure appropriate oversight.
        </Text>
      ),
      fields: [
        {
          name: 'group_activity_assessment',
          type: 'groupActivityAssessment',
          required: true,
          help: 'Select all activities that apply to your group. If none apply, select "None of the above".',
        },
      ],
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
          type: 'emailPublic',
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
          hidden: true,
          label: `Show this contact email to the public. If you do not check this box, your contact email will only be visible to internal ${OBJECT_NAME_SINGULAR} members.`,
        },
        {
          name: 'website',
          type: 'url',
          required: SITE_ID === 'fyh',
        },
        {
          name: 'phone',
          type: 'tel',
          label: 'Phone number',
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
      name: 'Visibility',
      type: 'group',
      description: (
        <Text>
          Control whether your {OBJECT_NAME_SINGULAR} appears to people who are
          not signed in. If this is unchecked, your {OBJECT_NAME_SINGULAR} will
          not appear in public search results and your public page will return a
          404 "Not Found" error.
        </Text>
      ),
      fields: [
        {
          name: 'visible_to_public',
          type: 'checkbox',
          label: `Make this ${OBJECT_NAME_SINGULAR} visible to the public.`,
        },
      ].filter(({ name }) => isClubFieldShown(name)),
    },
    {
      name: OBJECT_TAB_ADMISSION_LABEL,
      type: 'group',
      description: SHOW_RANK_ALGORITHM ? (
        <Text>
          Some of these fields will be used to adjust {OBJECT_NAME_SINGULAR}{' '}
          ordering on the home page. See the ranking details listed under the
          page title for more information.
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
          hidden: !isClient,
        },
        {
          name: 'signature_events',
          label: 'Signature Events',
          type: 'html',
          hidden: !isClient,
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
          hidden: SITE_ID === 'fyh' || !FORM_TARGET_ENABLED,
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
    // Admin-only fields section
    ...(hasAdminPermissions()
      ? [
          {
            name: 'Admin Settings',
            type: 'group',
            description: (
              <div className="mb-4">
                <Text>
                  These fields are only visible to administrators and can be
                  used to set special attributes for this {OBJECT_NAME_SINGULAR}
                  .
                </Text>
              </div>
            ),
            fields: [
              {
                name: 'status',
                type: 'select',
                label: 'Status',
                help: 'Select the current status of this organization.',
                choices: statuses,
                placeholder: 'Select a status...',
                adminOnly: true,
              },
              {
                name: 'type',
                type: 'select',
                label: 'Type',
                help: 'Select the type that best describes this organization.',
                choices: types,
                placeholder: 'Select a type...',
                adminOnly: true,
              },
              {
                name: 'eligibility',
                type: 'multiselect',
                label: 'Eligibility',
                help: 'Select the eligibility categories that apply to this club for funding and other administrative purposes.',
                placeholder: 'Select eligibility categories...',
                choices: eligibilities,
                adminOnly: true,
              },
            ],
          },
        ]
      : []),
  ]

  const creationDefaults = {
    subtitle: '',
    email: '',
    email_public: false,
    visible_to_public: true,
    accepting_members: false,
    size: CLUB_SIZES[0].value,
    application_required: CLUB_APPLICATIONS[0].value,
    recruiting_cycle: CLUB_RECRUITMENT_CYCLES[0].value,
    group_activity_assessment: [],
    ...(hasQueueOverride ? { approved: false } : {}),
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

  const isMissingRequiredValue = (value: unknown, type?: string): boolean => {
    if (value === null || value === undefined) {
      return true
    }
    if (Array.isArray(value)) {
      return value.length === 0
    }
    if (typeof value === 'string') {
      const text =
        type === 'html'
          ? value
              .replace(/<[^>]*>/g, '')
              .replace(/&nbsp;/g, '')
              .trim()
          : value.trim()
      return text.length === 0
    }
    return false
  }

  const fieldOrder = fields.flatMap(({ hidden, fields: groupFields }) =>
    hidden
      ? []
      : groupFields
          .filter((field: any) => field.name && !field.hidden)
          .map((field: any) => field.name as string),
  )

  const renderEditField = (
    props: any,
    key: React.Key,
  ): ReactElement<any> | null => {
    if (props == null || props.hidden) {
      return null
    }
    const other = { ...props }
    delete other.hidden
    if (props.type === 'content') {
      return <div key={key}>{props.content}</div>
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
    if (props.type === 'emailPublic') {
      return <EmailPublicField key={key} {...other} />
    }

    return (
      <Field
        key={key}
        as={
          {
            text: TextField,
            checkbox: CheckboxField,
            html: RichTextField,
            multiselect: SelectField,
            select: SelectField,
            image: FileField,
            file: FileField,
            address: FormikAddressField,
            location: FormikAddressField,
            checkboxText: CheckboxTextField,
            creatableMultiSelect: CreatableMultipleSelectField,
            groupActivityAssessment: (fieldProps) => (
              <GroupActivityAssessmentField
                {...fieldProps}
                options={groupActivityOptions || []}
              />
            ),
          }[props.type] ?? TextField
        }
        {...other}
      />
    )
  }

  const renderAdminLayout = () => {
    const groupByName = (name: string) =>
      fields.find((group) => group.name === name)
    const visibleFields = (group?: { hidden?: boolean; fields?: any[] }) =>
      group?.hidden
        ? []
        : ((group?.fields ?? []) as any[]).filter((field) => !field.hidden)
    const generalFields = visibleFields(groupByName('General'))
    const contactFields = visibleFields(groupByName('Contact'))
    const admissionFields = visibleFields(
      groupByName(OBJECT_TAB_ADMISSION_LABEL),
    )
    const pick = (list: any[], name: string) =>
      list.find((field) => field.name === name)
    const relabel = (field: any, label: string) =>
      field ? { ...field, label } : null
    const primaryContact = ['address', 'email', 'website']
    const extraContact = contactFields.filter(
      (field) => field.name && !primaryContact.includes(field.name),
    )
    const visibleExtra = extraContact.filter(
      (field) => field.name && addedContact.includes(field.name),
    )
    const availableSocial = SOCIAL_CONTACT_FIELDS.filter(
      (item) =>
        !addedContact.includes(item.name) &&
        extraContact.some((field) => field.name === item.name),
    )
    const canAddNumber = NUMBER_CONTACT_FIELDS.some(
      (name) =>
        !addedContact.includes(name) &&
        extraContact.some((field) => field.name === name),
    )
    const canAddOther = OTHER_CONTACT_FIELDS.some(
      (name) =>
        !addedContact.includes(name) &&
        extraContact.some((field) => field.name === name),
    )
    const admissionPrimary = ['application_required', 'recruiting_cycle']
    const sideNames = new Set(['image', 'constitution'])
    const paired = new Set([
      'category',
      'classification',
      'size',
      'founded',
      ...admissionPrimary,
    ])

    return {
      main: (
        <div>
          <Card title="General">
            {['approved', 'name', 'subtitle'].map((name) =>
              renderEditField(pick(generalFields, name), name),
            )}
            <FieldPair>
              <div>
                {renderEditField(pick(generalFields, 'category'), 'category')}
              </div>
              <div>
                {renderEditField(
                  relabel(pick(generalFields, 'classification'), 'Open to'),
                  'classification',
                )}
              </div>
            </FieldPair>
            {['tags', 'terms', 'description'].map((name) =>
              renderEditField(pick(generalFields, name), name),
            )}
            <FieldPair>
              <div>{renderEditField(pick(generalFields, 'size'), 'size')}</div>
              <div>
                {renderEditField(pick(generalFields, 'founded'), 'founded')}
              </div>
            </FieldPair>
            {generalFields
              .filter(
                (field) =>
                  field.name &&
                  !sideNames.has(field.name) &&
                  !paired.has(field.name) &&
                  ![
                    'approved',
                    'name',
                    'subtitle',
                    'tags',
                    'terms',
                    'description',
                  ].includes(field.name),
              )
              .map((field) => renderEditField(field, field.name))}
          </Card>
          <Card title="Admissions">
            <FieldPair>
              <div>
                {renderEditField(
                  relabel(
                    pick(admissionFields, 'application_required'),
                    'Admission Category',
                  ),
                  'application_required',
                )}
              </div>
              <div>
                {renderEditField(
                  relabel(
                    pick(admissionFields, 'recruiting_cycle'),
                    'Recruitment Time Frame',
                  ),
                  'recruiting_cycle',
                )}
              </div>
            </FieldPair>
          </Card>
          {admissionFields.some(
            (field) => field.name && !admissionPrimary.includes(field.name),
          ) && (
            <Card title="Participation">
              {admissionFields
                .filter(
                  (field) =>
                    !field.name || !admissionPrimary.includes(field.name),
                )
                .map((field, index) =>
                  renderEditField(field, field.name || `admission-${index}`),
                )}
            </Card>
          )}
          {fields
            .filter(
              (group) =>
                !group.hidden &&
                group.name !== 'General' &&
                group.name !== 'Contact' &&
                group.name !== OBJECT_TAB_ADMISSION_LABEL,
            )
            .map((group) => (
              <Card title={group.name} key={group.name}>
                {group.description}
                {(group.fields as any[])
                  .filter((field) => !field.hidden)
                  .map((field, index) =>
                    renderEditField(
                      field,
                      field.name || `${group.name}-${index}`,
                    ),
                  )}
              </Card>
            ))}
        </div>
      ),
      side: (
        <div>
          <Card title={`${OBJECT_NAME_TITLE_SINGULAR} Logo`}>
            <MediaRow>
              {pick(generalFields, 'image')?.help && (
                <MediaHelp>
                  <p>{pick(generalFields, 'image').help}</p>
                </MediaHelp>
              )}
              {pick(generalFields, 'image') &&
                renderEditField(
                  {
                    ...pick(generalFields, 'image'),
                    help: undefined,
                    noLabel: true,
                    dropzone: true,
                  },
                  'image',
                )}
            </MediaRow>
          </Card>
          <Card title={`${OBJECT_NAME_TITLE_SINGULAR} Constitution`}>
            <MediaRow>
              <MediaHelp>
                <p>
                  Upload a PDF, DOC, or DOCX file containing your club
                  constitution.
                </p>
                {club.constitution_url && (
                  <p>
                    Current constitution:{' '}
                    <a href={club.constitution_url} target="_blank">
                      Download
                    </a>
                  </p>
                )}
              </MediaHelp>
              {pick(generalFields, 'constitution') &&
                renderEditField(
                  {
                    ...pick(generalFields, 'constitution'),
                    help: undefined,
                    noLabel: true,
                    dropzone: true,
                    dropIcon: 'book-open',
                  },
                  'constitution',
                )}
            </MediaRow>
          </Card>
          <Card
            title="Contact"
            action={
              <AddContactMenu
                availableSocial={availableSocial}
                canAddNumber={canAddNumber}
                canAddOther={canAddOther}
                onAdd={(names) =>
                  setAddedContact((current) => [
                    ...current,
                    ...names.filter((name) => !current.includes(name)),
                  ])
                }
              />
            }
          >
            {primaryContact.map((name) =>
              renderEditField(pick(contactFields, name), name),
            )}
            {visibleExtra.map((field) =>
              renderEditField(
                field.name === 'listserv'
                  ? { ...field, label: 'Other' }
                  : field,
                field.name,
              ),
            )}
          </Card>
        </div>
      ),
    }
  }

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={(values, actions) =>
        submit({ ...values, emailOverride: false }, actions)
      }
      enableReinitialize
      validate={(values) => {
        const formValues = values as Record<string, unknown>
        const errors: Record<string, string> = {}

        // Validate top-to-bottom so inline errors and scroll target match form order.
        for (const group of fields) {
          if (group.hidden) {
            continue
          }
          for (const field of group.fields as any[]) {
            if (field.hidden || field.disabled || !field.required) {
              continue
            }
            if (isMissingRequiredValue(formValues[field.name], field.type)) {
              errors[field.name] = 'This field is required.'
            }
          }
        }

        // Only prompt for email confirmation after all required fields are filled.
        if (
          Object.keys(errors).length === 0 &&
          typeof values.email === 'string' &&
          values.email.includes('upenn.edu') &&
          !emailModal
        ) {
          showEmailModal(true)
          errors.email = 'Please confirm your email'
        }

        return errors
      }}
      validateOnChange={false}
      validateOnBlur={false}
    >
      {({ dirty, isSubmitting, setFieldValue, submitForm, values }) => {
        const adminLayout =
          variant === 'admin' ? renderAdminLayout() : null
        return (
        <>
          <ScrollToFirstError fieldOrder={fieldOrder} />
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
          {!isLoading && !isReapprovalOpen && !isNewApprovalOpen && (
            <LiveBanner>
              <LiveTitle>
                Queue Closed{isSummer() ? ' for Summer Break' : ''}{' '}
                {hasQueueOverride ? '(admin override)' : ''}
              </LiveTitle>
              <LiveSub>
                No edits to existing clubs or applications for new clubs will be
                submitted for review to the {APPROVAL_AUTHORITY}. Please reach
                out to <Contact point="osa" /> with any questions.
                {hasQueueOverride && (
                  <p className="mt-2">
                    Your elevated access allows you to make changes or register
                    a new club. When creating a new club, you can choose whether
                    it should become immediately visible without approval.
                  </p>
                )}
              </LiveSub>
            </LiveBanner>
          )}
          {!isLoading && !isNewApprovalOpen && isReapprovalOpen && !isEdit && (
            <LiveBanner>
              <LiveTitle>
                Queue Closed for New Clubs{' '}
                {hasQueueOverride ? '(admin override)' : ''}
              </LiveTitle>
              <LiveSub>
                Submissions for new clubs are closed for the time being. Please
                reach out to the {APPROVAL_AUTHORITY} at
                <Contact point="osa" /> with any questions.
                {hasQueueOverride && (
                  <p className="mt-2">
                    Your elevated access allows you to register a new club. You
                    can choose whether it should become immediately visible
                    without approval.
                  </p>
                )}
              </LiveSub>
            </LiveBanner>
          )}
          {!isLoading && !isReapprovalOpen && isNewApprovalOpen && isEdit && (
            <LiveBanner>
              <LiveTitle>
                Queue Closed for Re-Approval{' '}
                {hasQueueOverride ? '(admin override)' : ''}
              </LiveTitle>
              <LiveSub>
                Submissions for re-approval are closed for the time being.
                Please reach out to the {APPROVAL_AUTHORITY} at
                <Contact point="osa" /> with any questions.
                {hasQueueOverride && (
                  <p className="mt-2">
                    Your elevated access allows you to make changes. Clubs you
                    create can be made immediately visible without approval upon
                    creation.
                  </p>
                )}
              </LiveSub>
            </LiveBanner>
          )}
          {variant === 'admin' ? (
            <FormStyle admin>
              <EditPageBar>
                <PageHeading>
                  <PageTitle>
                    Edit {OBJECT_NAME_TITLE_SINGULAR} Page
                  </PageTitle>
                  {isEdit && club.code && (
                    <Link
                      href={CLUB_ROUTE()}
                      as={CLUB_ROUTE(club.code)}
                      passHref
                      legacyBehavior
                    >
                      <ViewLink>
                        View Page
                        <Icon name="external-link" alt="" size="0.95rem" />
                      </ViewLink>
                    </Link>
                  )}
                </PageHeading>
                <SaveButton
                  disabled={
                    !dirty ||
                    isSubmitting ||
                    (!isNewApprovalOpen && !isEdit && !hasQueueOverride)
                  }
                  type="button"
                  onClick={() => submitForm()}
                >
                  {isSubmitting
                    ? 'Saving...'
                    : isEdit
                      ? 'Save Changes'
                      : 'Submit'}
                </SaveButton>
              </EditPageBar>
              <AdminGrid>
                <Form noValidate>{adminLayout?.main}</Form>
                <div>
                  <Form noValidate>{adminLayout?.side}</Form>
                  {isEdit && club.code && <AdvisorCard club={club} />}
                </div>
              </AdminGrid>
            </FormStyle>
          ) : (
            <Form noValidate>
            <FormStyle isHorizontal>
              {fields.map(
                ({ name, description, fields: groupFields, hidden }, i) => {
                  if (hidden) {
                    return null
                  }
                  return (
                    <Card title={name} key={i}>
                      {description}
                      {(groupFields as any[]).map((props: any, index) =>
                        renderEditField(props, props.name || index),
                      )}
                    </Card>
                  )
                },
              )}
              <button
                disabled={
                  !dirty ||
                  isSubmitting ||
                  (!isNewApprovalOpen && !isEdit && !hasQueueOverride)
                }
                type="submit"
                className="button is-primary is-large"
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </FormStyle>
            </Form>
          )}
        </>
        )
      }}
    </Formik>
  )
}
