import { NextPageContext } from 'next'
import Link from 'next/link'
import { ReactElement, useState } from 'react'
import s from 'styled-components'

import ClubEditCard from '../../../components/ClubEditPage/ClubEditCard'
import FormProgressIndicator from '../../../components/ClubEditPage/FormProgressIndicator'
import ClubMetadata from '../../../components/ClubMetadata'
import { Contact, Container, Icon, Title } from '../../../components/common'
import Form from '../../../components/Form'
import { DARK_GRAY, GREEN, MEDIUM_GRAY } from '../../../constants/colors'
import { CLUB_ROUTE } from '../../../constants/routes'
import renderPage from '../../../renderPage'
import { Club } from '../../../types'
import { doApiRequest } from '../../../utils'

type RenewPageProps = {
  club: Club
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

const PolicyBox = (): ReactElement => {
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
  return (
    <div>
      {policies.map(({ name, content }) => (
        <Policy>
          <blockquote>{content}</blockquote>
          <label className="checkbox">
            <input type="checkbox" /> I agree to the policy on <b>{name}</b>.
          </label>
        </Policy>
      ))}
    </div>
  )
}

const RenewPage = ({
  club,
  schools,
  majors,
  years,
  tags,
}: RenewPageProps): ReactElement => {
  const [step, setStep] = useState<number>(0)

  const year = new Date().getFullYear()

  const steps = [
    {
      name: 'Introduction',
      content: () => (
        <>
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
              You must fill out this approval form by <b>August 20, {year}</b>{' '}
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
          />
        </>
      ),
    },
    {
      name: 'Constitution',
      content: () => (
        <>
          <TextInfoBox>
            <p>
              Please upload your constitution in the form below. The club
              constitution should be in pdf or docx format.
            </p>
            <Form
              fields={[
                {
                  name: 'file',
                  accept: 'application/pdf,application/msword',
                  type: 'file',
                  label: 'Club Constitution',
                },
              ]}
            />
          </TextInfoBox>
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
          <PolicyBox />
        </>
      ),
    },
    {
      name: 'Complete',
      content: () => (
        <>
          <FinishedText>🎉 Congratulations! 🎉</FinishedText>
          <TextInfoBox>
            <p>
              You've completed the club approval form for the {year} -{' '}
              {year + 1} school year! When your application is processed, all
              club officers will receive an email from Penn Clubs.
            </p>
            <p>Thank you for completing the club renewal process!</p>
          </TextInfoBox>
        </>
      ),
    },
  ]

  const nextStep = () => {
    setStep(step + 1)
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
          <button onClick={nextStep} className="button is-primary">
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
