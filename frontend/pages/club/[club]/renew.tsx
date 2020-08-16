import { NextPageContext } from 'next'
import Link from 'next/link'
import { setUncaughtExceptionCaptureCallback } from 'process'
import { ChangeEvent, ReactElement, useEffect, useState } from 'react'
import s from 'styled-components'

import ClubEditCard from '../../../components/ClubEditPage/ClubEditCard'
import FilesCard from '../../../components/ClubEditPage/FilesCard'
import FormProgressIndicator from '../../../components/ClubEditPage/FormProgressIndicator'
import ClubMetadata from '../../../components/ClubMetadata'
import { Contact, Container, Icon, Title } from '../../../components/common'
import AuthPrompt from '../../../components/common/AuthPrompt'
import Form from '../../../components/Form'
import { DARK_GRAY, GREEN, MEDIUM_GRAY } from '../../../constants/colors'
import { CLUB_ROUTE } from '../../../constants/routes'
import renderPage from '../../../renderPage'
import { Club, MembershipRank } from '../../../types'
import { doApiRequest } from '../../../utils'

type RenewPageProps = {
  club: Club
  authenticated: boolean | null
  schools: any[]
  majors: any[]
  years: any[]
  tags: any[]
}

const SubTitle = s.h2`
  font-size: 1.5rem;
  color: ${DARK_GRAY};
`

const TextInfoBox = s.div`
  margin: 15px auto;

  & p {
    margin-bottom: 1em;
  }
`

const PartnerLogo = s.img`
  max-width: 160px;
`

const FinishedText = s.div`
  color: ${GREEN};
  text-align: center;
  margin-top: 30px;
  font-size: 2em;
  font-weight: bold;
`

const Policy = s.div`
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

const PolicyBox = ({ onChecked = () => undefined }: Props): ReactElement => {
  const [numChecked, setNumChecked] = useState<number>(0)

  const policies = [
    {
      name: 'Campus Membership',
      content: (
        <div>
          Membership in registered campus organizations must be open to all
          persons without regard to race, color, sex, sexual or affectional
          preference, religion, national or ethnic origin, handicap, or
          disability. Under Title IX of the U.S. Education Act Amendment of
          1972, certain exemptions may be granted for intercollegiate and
          intramural athletics, fraternities and sororities, and musical groups
          based on vocal range. Members of all campus organizations must conduct
          themselves at all times in a mature and responsible manner.
        </div>
      ),
    },
    {
      name: 'Legal Regulations',
      content: (
        <div>
          The rights and property of all persons are to be respected regardless
          of time or place. Failure to comply with University, City, State, or
          Federal laws and regulations can result in appropriate disciplinary
          action. Members of campus organizations are expected to adhere to
          standards of conduct established by Divisions and Departments of the
          University.
        </div>
      ),
    },
    {
      name: 'Hazing',
      content: (
        <div>
          The University is an association of equals who, in working together,
          comprise a scholarly community. Hazing is inconsistent with the goals
          and purpose of the University and is explicitly forbidden.
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

const RenewPage = ({
  club: initialClub,
  authenticated,
  schools,
  majors,
  years,
  tags,
}: RenewPageProps): ReactElement => {
  const [club, setClub] = useState<Club>(initialClub)
  const [step, setStep] = useState<number>(0)
  const [changeStatus, setChangeStatus] = useState<boolean>(false)
  const [arePoliciesAccepted, setPoliciesAccepted] = useState<boolean>(false)
  const [isSacChecked, setSacChecked] = useState<boolean>(club.fair)

  if (authenticated === false) {
    return <AuthPrompt />
  }

  if (club.code === undefined) {
    return (
      <AuthPrompt title="Oh no!" hasLogin={false}>
        <p>
          The club you are looking for does not exist. If you believe this is an
          error, contact <Contact />.
        </p>
      </AuthPrompt>
    )
  }

  if (club.is_member === false || club.is_member > MembershipRank.Officer) {
    return (
      <AuthPrompt title="Oh no!" hasLogin={false}>
        <ClubMetadata club={club} />
        <p>
          You do not have permission to initiate the renewal process for{' '}
          {(club && club.name) || 'this club'}. To get access, contact{' '}
          <Contact />.
        </p>
        {club.is_member !== false && (
          <p>
            You are a member of this club, but only officers and above can
            perform this action.
          </p>
        )}
      </AuthPrompt>
    )
  }

  const year = new Date().getFullYear()

  const steps = [
    {
      name: 'Introduction',
      content: () => (
        <>
          {club.active && (
            <div className="notification is-primary">
              You or another club officer has already completed this form and
              started the renewal process for <b>{club.name}</b> for the {year}-
              {year + 1} school year! You do not have to complete this form, and
              completing it for a second time will not do anything.
              <div className="mt-3">
                <Link href={CLUB_ROUTE()} as={CLUB_ROUTE(club.code)}>
                  <a className="button is-primary is-light">Back to Club</a>
                </Link>
              </div>
            </div>
          )}
          <TextInfoBox>
            <p>
              Every year, the{' '}
              <a target="_blank" href="https://www.vpul.upenn.edu/osa/">
                Office of Student Affairs (OSA)
              </a>{' '}
              requires clubs to renew their approval status to ensure that the
              Office of Student Affairs has the{' '}
              <b>most up to date information</b> and that club members are{' '}
              <b>aware of university policies</b>. This process must be
              performed once a year by the current leadership of the club.
            </p>
            <p>
              You must fill out this approval form by <b>August 24, {year}</b>{' '}
              in order to have your club shown during the New Student
              Orientation. Late submissions will be accepted, but we cannot
              guarantee that they will be processed in time for New Student
              Orientation.
            </p>
            <p>
              During this process, you will review your club information, update
              your club constitution, and agree to the latest policies governing
              student organizations at the University of Pennsylvania.
            </p>
            <p>
              Starting from Fall 2020, all clubs will perform this process using
              the Penn Clubs website. We hope to make the process as easy as
              possible, and would love your feedback on how we're doing. If you
              run into technical difficulties or have feedback on the renewal
              process, please contact <Contact />.
            </p>
            <p>
              If you have any questions about the club renewal process, please
              contact the Office of Student Affairs at{' '}
              <Contact email="pennosa@zimbra.upenn.edu" />.
            </p>
          </TextInfoBox>
        </>
      ),
    },
    {
      name: 'Club Info',
      content: () => (
        <>
          <TextInfoBox>
            Please verify that your club information is up to date. If you need
            to make any changes, change it in the form below and hit submit.
          </TextInfoBox>
          <ClubEditCard
            schools={schools}
            majors={majors}
            years={years}
            tags={tags}
            club={club}
            isEdit={true}
            onSubmit={({ club }) => {
              if (club !== undefined) {
                setClub(club)
              }
            }}
          />
          <p className="mt-3 mb-3">
            If you have made any changes to your club page, please press the
            "Submit" button above. Pressing the continue button will{' '}
            <b>discard any unsaved changes</b>.
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
              As a student organization associated with the University of
              Pennsylvania, you must agree to all of the policies listed below.
            </p>
          </TextInfoBox>
          <PolicyBox onChecked={() => setPoliciesAccepted(true)} />
        </>
      ),
      disabled: !arePoliciesAccepted,
    },
    {
      name: 'SAC Fair',
      content: () => {
        return (
          <TextInfoBox>
            <p>
              Every year, the{' '}
              <a href="https://sacfunded.net/" target="_blank">
                Student Activities Council
              </a>{' '}
              hosts a Fall Activities Fair. This year, the SAC Fair will be held
              virtually during the first few days of school. In addition to Penn
              Clubs, which now has an anonymous Q & A feature, clubs will be
              designated one of three days to host a live Zoom session for a
              couple of hours. All submitted zoom links will be featured on Penn
              Clubs.
            </p>
            <p>
              Like the in-person SAC Fair, clubs are encouraged to have a few
              members present on Zoom to introduce their club to prospective
              members and to answer questions.
            </p>
            <p>
              If you would like to particpate in the Fall {year} SAC fair, check
              the box below. If you check the box below, your club information
              will be shared with the Student Activites Council and more details
              will be sent to you at a later date.
            </p>
            <label>
              <input
                type="checkbox"
                checked={isSacChecked}
                onChange={(e) => {
                  const checked = e.target.checked
                  doApiRequest(`/clubs/${club.code}/?format=json`, {
                    method: 'PATCH',
                    body: {
                      fair: checked,
                    },
                  })
                  setSacChecked(checked)
                  e.persist()
                }}
              />{' '}
              Yes, <b>{club.name}</b> would like to participate in the Fall{' '}
              {year} SAC Fair.
            </label>
          </TextInfoBox>
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
          })
          setChangeStatus(true)
        } catch (e) {
          setChangeStatus(false)
        }
      },
      content: () => (
        <>
          {changeStatus ? (
            <>
              <FinishedText>🎉 Congratulations! 🎉</FinishedText>
              <TextInfoBox>
                <p>
                  You've completed the club approval form for the {year} -{' '}
                  {year + 1} school year! When your application is processed,
                  all club officers will receive an email from Penn Clubs.
                </p>
                <p>Thank you for completing the club renewal process!</p>
              </TextInfoBox>
            </>
          ) : (
            <>
              <FinishedText>Oh no!</FinishedText>
              <TextInfoBox>
                <p>
                  An error occured while submitting your club approval form.
                  Please contact <Contact /> and we'll help you resolve your
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
      <div className="is-clearfix mb-5">
        <div className="is-pulled-left">
          <Title>Renew Club Approval</Title>
          <SubTitle>
            <b>{club.name}</b>
          </SubTitle>
          <SubTitle>
            {year} - {year + 1} School Year
          </SubTitle>
        </div>
        <PartnerLogo
          src="/static/img/collaborators/osa.png"
          className="is-pulled-right"
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
            disabled={steps[step].disabled}
            className="button is-primary"
          >
            <Icon name="chevrons-right" />
            Continue
          </button>
        ) : (
          <Link href={CLUB_ROUTE()} as={CLUB_ROUTE(club.code)}>
            <a className="button is-primary">
              <Icon name="chevrons-left" />
              Back to Club
            </a>
          </Link>
        )}
      </div>
    </Container>
  )
}

RenewPage.getInitialProps = async ({ query, req }: NextPageContext) => {
  const data = {
    headers: req ? { cookie: req.headers.cookie } : undefined,
  }
  const clubReq = await doApiRequest(`/clubs/${query.club}/?format=json`, data)
  const clubRes = await clubReq.json()

  const endpoints = ['tags', 'schools', 'majors', 'years']
  return Promise.all(
    endpoints.map(async (item) => {
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
  })
}

export default renderPage(RenewPage)
