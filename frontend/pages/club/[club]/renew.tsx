import ClubEditCard from 'components/ClubEditPage/ClubEditCard'
import ClubFairCard from 'components/ClubEditPage/ClubFairCard'
import FilesCard from 'components/ClubEditPage/FilesCard'
import FormProgressIndicator from 'components/ClubEditPage/FormProgressIndicator'
import { ClubRenewalProcessWarningBanner } from 'components/ClubEditPage/RenewCard'
import ClubMetadata from 'components/ClubMetadata'
import { Contact, Container, Icon, InfoPageTitle } from 'components/common'
import AuthPrompt from 'components/common/AuthPrompt'
import ResourceCreationPage from 'components/ResourceCreationPage'
import { DARK_GRAY, GREEN, MEDIUM_GRAY } from 'constants/colors'
import { NextPageContext } from 'next'
import Link from 'next/link'
import { ChangeEvent, ReactElement, useEffect, useState } from 'react'
import { toast, TypeOptions } from 'react-toastify'
import renderPage from 'renderPage'
import styled from 'styled-components'
import {
  Category,
  Classification,
  Club,
  Eligibility,
  Major,
  MembershipRank,
  School,
  Status,
  StudentType,
  Tag,
  Type,
  Year,
} from 'types'
import {
  apiCheckPermission,
  doApiRequest,
  getCurrentSchoolYear,
  isClubFieldShown,
} from 'utils'
import {
  APPROVAL_AUTHORITY,
  APPROVAL_AUTHORITY_URL,
  MEMBERSHIP_ROLE_NAMES,
  OBJECT_NAME_SINGULAR,
  OBJECT_NAME_TITLE_SINGULAR,
  SCHOOL_NAME,
  SITE_ID,
  SITE_NAME,
} from 'utils/branding'

import { CLUB_ROUTE } from '~/constants/routes'
import { useRegistrationQueueSettings } from '~/hooks/useRegistrationQueueSettings'

type InitialRenewPageProps = {
  club: Club
  schools: School[]
  majors: Major[]
  years: Year[]
  tags: Tag[]
  studentTypes: StudentType[]
  categories: Category[]
  eligibilities: Eligibility[]
  types: Type[]
  classifications: Classification[]
  statuses: Status[]
}

type RenewPageProps = InitialRenewPageProps & {
  authenticated: boolean | null
}

const SubTitle = styled.h2`
  font-size: 1.5rem;
  color: ${DARK_GRAY};
`

const TextInfoBox = styled.div`
  margin: 15px auto;

  & p {
    margin-bottom: 1em;
  }
`

const PartnerLogo = styled.img`
  max-width: 160px;
`

const FinishedText = styled.div`
  color: ${GREEN};
  text-align: center;
  margin-top: 30px;
  font-size: 2em;
  font-weight: bold;
`

const Policy = styled.div`
  margin-bottom: 2em;

  & blockquote {
    padding: 10px;
    border: 1px solid ${MEDIUM_GRAY};
    border-radius: 5px;
    margin-bottom: 0.5em;
  }
`

type Props = {
  onChecked?: () => void
}

const PolicyBox = ({
  onChecked = () => undefined,
}: Props): ReactElement<any> => {
  const [numChecked, setNumChecked] = useState<number>(0)

  const policies = [
    {
      name: 'Nondiscrimination',
      content: (
        <div>
          Student organizations must fully comply with the University of
          Pennsylvania's Nondiscrimination Statement. The University of
          Pennsylvania seeks talented students, faculty, and staff with a wide
          variety of backgrounds, experiences, and perspectives. The University
          of Pennsylvania does not discriminate on the basis of race, color,
          sex, sexual orientation, religion, creed, national origin (including
          shared ancestry or ethnic characteristics), citizenship status, age,
          disability, veteran status or any other class protected under
          applicable federal, state, or local law in the administration of its
          admissions, financial aid, educational or athletic programs, or other
          University-administered programs or in its employment practices.
          Questions or complaints regarding this policy should be directed to
          the executive director of the Office of Equal Opportunity Programs;
          Franklin Building, 3451 Walnut Street, Suite 421, Philadelphia, PA
          19104-6106; or (215) 898-6993.
        </div>
      ),
    },
    {
      name: 'Antihazing',
      content: (
        <div>
          Student organizations must fully comply with the University of
          Pennsylvania’s Antihazing Regulations, as outlined in the{' '}
          <a href="https://catalog.upenn.edu/pennbook/">Pennbook</a>. To ensure
          compliance, students are encouraged to thoroughly review the
          definition of hazing and the illustrative examples provided within the
          the Antihazing Regulations. Additionally, it is vital for students to
          understand the potential consequences of violating these regulations,
          which may encompass University sanctions affecting both individuals
          and organizations, as well as potential legal ramifications under
          state law.
        </div>
      ),
    },
    {
      name: 'Compliance',
      content: (
        <div>
          Student organizations are obligated to adhere to all policies and
          procedures established by the University of Pennsylvania. This
          includes, but is not limited to, the policies outlined in the{' '}
          <a href="https://catalog.upenn.edu/pennbook/">Pennbook</a> and the{' '}
          <a href="https://catalog.upenn.edu/pennbook/code-of-student-conduct/">
            Code of Student Conduct
          </a>
          . Furthermore, student organizations are expected to operate in
          compliance with all relevant local, state, and federal laws.
        </div>
      ),
    },
  ]

  useEffect(() => {
    if (numChecked === policies.length) {
      onChecked()
    }
  }, [numChecked])

  const updateCheckedStatus = (e: ChangeEvent<HTMLInputElement>) => {
    setNumChecked((numChecked) =>
      e.target.checked ? numChecked + 1 : numChecked - 1,
    )
    e.persist()
  }

  return (
    <div>
      {policies.map(({ name, content }) => (
        <Policy key={name}>
          <blockquote>{content}</blockquote>
          <label className="checkbox">
            <input type="checkbox" onChange={updateCheckedStatus} /> I agree to
            the policy on <b>{name}</b>.
          </label>
        </Policy>
      ))}
    </div>
  )
}

const RenewPage = (props: RenewPageProps): ReactElement<any> => {
  const {
    club: initialClub,
    authenticated,
    schools,
    majors,
    years,
    tags,
    studentTypes,
    categories,
    eligibilities,
    types,
    classifications,
    statuses,
  } = props

  const [club, setClub] = useState<Club>(initialClub)
  const [step, setStep] = useState<number>(0)
  const [changeStatusError, setChangeStatusError] = useState<string | null>(
    null,
  )
  const { settings: queueSettings } = useRegistrationQueueSettings()
  const [submitMessage, setSubmitMessage] = useState<
    string | ReactElement<any> | null
  >(null)
  const [arePoliciesAccepted, setPoliciesAccepted] = useState<boolean>(false)

  const hasPermission = apiCheckPermission(`clubs.manage_club:${club.code}`)

  const notify = (
    msg: string | ReactElement<any>,
    type: TypeOptions = 'info',
  ): void => {
    toast[type](msg)
  }

  const requiredFields = [
    { field: 'name', label: 'Club Name' },
    { field: 'category', label: 'Category' },
    { field: 'classification', label: 'Classification' },
    { field: 'description', label: 'Club Mission' },
    { field: 'email', label: 'Contact Email' },
    { field: 'size', label: 'Club Size' },
    { field: 'application_required', label: 'Membership Process' },
    { field: 'recruiting_cycle', label: 'Recruiting Cycle' },
  ]

  const validateRequiredFields = (): Array<{
    label: string
    field: string
  }> => {
    const errors: Array<{
      label: string
      field: string
    }> = []

    requiredFields.forEach(({ field, label }) => {
      const value = club[field as keyof Club]

      if (
        value === null ||
        value === undefined ||
        (typeof value === 'string' && !value.trim()) ||
        (Array.isArray(value) && !value.length) ||
        !value
      ) {
        errors.push({ label, field })
      }
    })

    return errors
  }

  if (authenticated === false) {
    return <AuthPrompt />
  }

  if (club.code === undefined) {
    return (
      <AuthPrompt title="Oh no!" hasLogin={false}>
        <p>
          The {OBJECT_NAME_SINGULAR} you are looking for does not exist. If you
          believe this is an error, contact <Contact />.
        </p>
      </AuthPrompt>
    )
  }

  if (!hasPermission) {
    return (
      <AuthPrompt title="Oh no!" hasLogin={false}>
        <ClubMetadata club={club} />
        {queueSettings?.reapproval_queue_open !== true && (
          <ClubRenewalProcessWarningBanner />
        )}
        <p>
          You do not have permission to initiate the renewal process for{' '}
          {(club && club.name) || `this ${OBJECT_NAME_SINGULAR}`}. To get
          access, contact <Contact />.
        </p>
        {club.is_member !== false && (
          <p>
            You are a member of this {OBJECT_NAME_SINGULAR}, but only officers
            and above can perform this action.
          </p>
        )}
      </AuthPrompt>
    )
  }

  if (SITE_ID === 'fyh') {
    return <ResourceCreationPage {...props} />
  }

  const year = getCurrentSchoolYear()

  const prerequisites = [
    {
      name: 'Membership Requirements',
      content: (
        <div style={{ display: 'inline-block' }}>
          Each club must have at least eight active members, with a minimum of
          three members designated as officers.
        </div>
      ),
    },
    {
      name: 'Group Contacts',
      content: (
        <div>
          Listed group contacts are members of the organization who have
          significant understanding of, and influence on, group operations.
        </div>
      ),
    },
    {
      name: 'Club Operations',
      content: (
        <div>
          Student organizations are to be initiated by, organized, primarily
          comprised of and solely led by undergraduate or graduate students.
        </div>
      ),
    },
    {
      name: 'Training and Workshops',
      content: (
        <div>
          Organizations must complete any required student organization
          trainings or workshops, such as the Student Organization Summit.
        </div>
      ),
    },
    {
      name: 'Branding Compliance',
      content: (
        <div>
          Clubs must have logos that adhere to university branding standards and
          ensure consistent use across all platforms, including social media and
          websites. Refer to the{' '}
          <a href="https://universitylife.upenn.edu/student-brand-guidelines/">
            Student Branding Guidelines
          </a>{' '}
          for more information.
        </div>
      ),
    },
    {
      name: 'University Affiliation',
      content: (
        <div>
          The club mission must clearly state that the group is a student
          organization at the University.
        </div>
      ),
    },
    {
      name: 'Policy Adherence',
      content: (
        <div>
          All groups must comply with the relevant policies and guidelines for
          student organizations.
        </div>
      ),
    },
  ]

  const steps = [
    {
      name: 'Introduction',
      content: () => (
        <>
          {club.active && (
            <div className="notification is-primary">
              You or another {OBJECT_NAME_SINGULAR}{' '}
              {MEMBERSHIP_ROLE_NAMES[MembershipRank.Officer].toLowerCase()} has
              already completed this form and started the renewal process for{' '}
              <b>{club.name}</b> for the {year}-{year + 1} school year! You do
              not have to complete this form, and completing it for a second
              time will not do anything.
              <div className="mt-3">
                <Link
                  legacyBehavior
                  href={CLUB_ROUTE()}
                  as={CLUB_ROUTE(club.code)}
                >
                  <a className="button is-primary is-light">
                    Back to {OBJECT_NAME_TITLE_SINGULAR}
                  </a>
                </Link>
              </div>
            </div>
          )}
          <TextInfoBox>
            <p>
              The annual club registration process, conducted by the{' '}
              <a target="_blank" href={APPROVAL_AUTHORITY_URL}>
                {APPROVAL_AUTHORITY}
              </a>
              , ensures that student-run clubs are officially registered and
              permitted to operate on campus for the upcoming academic year.
              During this process, clubs are required to submit updated officer
              and membership roster information and, if applicable, update their
              primary contact details.
            </p>
            <p>
              The purpose of this process is to maintain a well-organized and
              vibrant campus community, enabling students to explore various
              interests and engage in extracurricular activities. By registering
              each year, clubs reaffirm their commitment to following university
              policies, uphold their mission, and demonstrate their ongoing
              relevance to the student body.
            </p>
            <p>
              Registration identifies the organization as active and grants
              access to essential university resources, such as reserving space,
              accessing electronic resources, appropriate use of the Penn name,
              potential funding opportunities, participation in activities
              fairs, and the ability to advertise as a student-run organization
              at the University of Pennsylvania.
            </p>
            <p>
              To successfully register or re-register your organization, the
              following prerequisites must be met:
            </p>
            {prerequisites.map(({ name, content }) => (
              <p>
                <b>{name}</b>: {content}
              </p>
            ))}
            <p>
              If you have any questions about the club registration process,
              please contact the {APPROVAL_AUTHORITY} at
              <Contact point="osa" />.
            </p>
          </TextInfoBox>
        </>
      ),
    },
    {
      name: `${OBJECT_NAME_TITLE_SINGULAR} Info`,
      content: () => (
        <>
          <TextInfoBox>
            Please verify that your {OBJECT_NAME_SINGULAR} information is up to
            date. If you need to make any changes, change it in the form below
            and hit submit.
            <div className="mt-3 notification is-info is-light">
              <strong>Required Fields:</strong> All fields marked with an
              asterisk (*) must be filled in before you can proceed to the next
              step.
            </div>
          </TextInfoBox>
          <ClubEditCard
            eligibilities={eligibilities}
            categories={categories}
            classifications={classifications}
            schools={schools}
            majors={majors}
            years={years}
            tags={tags}
            studentTypes={studentTypes}
            types={types}
            statuses={statuses}
            club={club}
            isEdit={true}
            onSubmit={({ club, message }): Promise<void> => {
              if (club !== undefined) {
                setClub(club)
              }
              if (message !== undefined) {
                if (typeof message === 'string') {
                  notify(message, 'success')
                } else {
                  setSubmitMessage(message)
                }
              }
              return Promise.resolve(undefined)
            }}
          />
          {submitMessage !== null && (
            <div className="mt-3 mb-3 notification is-info">
              {submitMessage}
            </div>
          )}
          <p className="mt-3 mb-3">
            If you have made any changes to your {OBJECT_NAME_SINGULAR}, please
            make sure you have pressed the "Submit" button above before pressing
            the "Continue" button below.
          </p>
        </>
      ),
    },
    {
      name: 'Policies',
      content: () => (
        <>
          <TextInfoBox>
            <p>
              As a student organization associated with the {SCHOOL_NAME}, you
              must agree to all of the policies listed below.
            </p>
          </TextInfoBox>
          <PolicyBox onChecked={() => setPoliciesAccepted(true)} />
        </>
      ),
      disabled: !arePoliciesAccepted,
    },
    {
      name: 'Fairs',
      content: () => {
        return (
          <>
            <TextInfoBox>
              <p>
                You will be able to update your registration or register for new
                activity fairs at any time through the {OBJECT_NAME_SINGULAR}{' '}
                management page.
              </p>
            </TextInfoBox>
            <ClubFairCard club={club} />
            <hr />
            <TextInfoBox>
              <p>
                Please upload any files required by the {APPROVAL_AUTHORITY}{' '}
                here. You can upload new files at any time from the management
                page.
              </p>
            </TextInfoBox>
            <FilesCard club={club} />
          </>
        )
      },
    },
    {
      name: 'Complete',
      onEnterTab: async () => {
        try {
          await doApiRequest(`/clubs/${club.code}/?format=json`, {
            method: 'PATCH',
            body: {
              active: true,
            },
          }).then((resp) => {
            if (resp.ok) {
              setChangeStatusError(null)
            } else {
              resp.json().then((res) => {
                setChangeStatusError(res.detail || 'An unknown error occurred')
              })
            }
          })
        } catch (e) {
          setChangeStatusError('Connection Error')
        }
      },
      content: () => (
        <>
          {changeStatusError === null ? (
            <>
              <FinishedText>🎉 Congratulations! 🎉</FinishedText>
              <TextInfoBox>
                <p>
                  You've completed the {OBJECT_NAME_SINGULAR} approval form for
                  the {year} - {year + 1} school year! When your application is
                  processed, all club officers will receive an email from{' '}
                  {SITE_NAME}.
                </p>
                <p>
                  Thank you for completing the {OBJECT_NAME_SINGULAR} renewal
                  process!
                </p>
              </TextInfoBox>
            </>
          ) : (
            <>
              <FinishedText>Oh no!</FinishedText>
              <TextInfoBox>
                <p>
                  An error occured while submitting your {OBJECT_NAME_SINGULAR}{' '}
                  approval form: {changeStatusError}. If this is unexpected,
                  please contact <Contact /> and we'll help you resolve your
                  issue.
                </p>
                <p>Alternatively, you can refresh this page and try again.</p>
              </TextInfoBox>
            </>
          )}
        </>
      ),
    },
  ]

  const nextStep = () => {
    // only check for required fields on the Club Info step
    if (step === 1) {
      const errors = validateRequiredFields()
      if (errors.length > 0) {
        notify(
          <>
            <div>You must fill in all required fields before continuing:</div>
            <ul className="mt-2">
              {errors.map((error, index) => (
                <li key={index}>
                  <b>{error.label}</b> is required
                </li>
              ))}
            </ul>
          </>,
          'error',
        )
        return
      }
    }

    const enterTab = steps[step + 1].onEnterTab
    if (enterTab !== undefined) {
      enterTab()
        .then(() => {
          setStep(step + 1)
        })
        .catch(() => {
          setStep(step + 1)
        })
    } else {
      setStep(step + 1)
    }
  }

  return (
    <Container>
      <ClubMetadata club={club} />
      {queueSettings?.reapproval_queue_open !== true && (
        <ClubRenewalProcessWarningBanner />
      )}
      <div className="is-clearfix mb-5">
        <div className="is-pulled-left">
          <InfoPageTitle>
            Renew {OBJECT_NAME_TITLE_SINGULAR} Approval
          </InfoPageTitle>
          <SubTitle>
            <b>{club.name}</b>
          </SubTitle>
          <SubTitle>
            {year} - {year + 1} School Year
          </SubTitle>
        </div>
        <PartnerLogo
          src="/static/img/collaborators/osa.png"
          className="mt-5 is-pulled-right"
        />
      </div>
      <FormProgressIndicator
        step={step}
        steps={steps}
        onStepClick={(newStep) => {
          if (newStep < step) {
            setStep(newStep)
          }
        }}
      />
      <div className="mt-5">{steps[step].content()}</div>
      <div className="has-text-centered">
        {step < steps.length - 1 ? (
          <button
            onClick={nextStep}
            disabled={
              steps[step].disabled ||
              queueSettings?.reapproval_queue_open !== true
            }
            className="button is-primary"
          >
            <Icon name="chevrons-right" />
            Continue
          </button>
        ) : (
          <Link
            href={CLUB_ROUTE()}
            as={CLUB_ROUTE(club.code)}
            className="button is-primary"
          >
            <Icon name="chevrons-left" />
            Back to {OBJECT_NAME_TITLE_SINGULAR}
          </Link>
        )}
      </div>
    </Container>
  )
}

RenewPage.permissions = ['clubs.approve_club', 'clubs.see_pending_clubs']

RenewPage.getInitialProps = async ({
  query,
  req,
}: NextPageContext): Promise<InitialRenewPageProps> => {
  const data = {
    headers: req ? { cookie: req.headers.cookie } : undefined,
  }
  const clubReq = await doApiRequest(`/clubs/${query.club}/?format=json`, data)
  const clubRes = await clubReq.json()

  RenewPage.permissions = [
    `clubs.manage_club:${query.club}`,
    'clubs.approve_club',
    'clubs.see_pending_clubs',
  ]

  const endpoints = [
    'tags',
    'schools',
    'majors',
    'years',
    'student_types',
    'categories',
    'eligibilities',
    'types',
    'classifications',
    'statuses',
    'badges',
  ]
  return Promise.all(
    endpoints.map(async (item) => {
      if (!isClubFieldShown(item)) {
        return [item, []]
      }
      const request = await doApiRequest(`/${item}/?format=json`, data)
      const response = await request.json()
      return [item, response]
    }),
  ).then((values) => {
    const output = { club: clubRes }
    values.forEach((item) => {
      output[item[0]] = item[1]
    })
    return output
  }) as Promise<InitialRenewPageProps>
}

export default renderPage(RenewPage)
