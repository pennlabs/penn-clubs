import {
  Container,
  Icon,
  InfoPageTitle,
  Metadata,
  StrongText,
  Text,
} from 'components/common'
import { ReactElement } from 'react'
import renderPage from 'renderPage'
import styled from 'styled-components'
import { OBJECT_NAME_TITLE_SINGULAR } from 'utils/branding'

import { GREEN, SNOW } from '~/constants/colors'

const RankItem = styled.div`
  padding: 0.75em;
  margin-top: 15px;
  display: flex;

  & p {
    margin-bottom: 0;
  }

  & ul {
    display: block;
    font-size: 0.9em;
    margin-left: 1em;
  }
`

const LargeIconWrapper = styled.div`
  flex-basis: 80px;
  margin-right: 10px;
`

const LargeIcon = styled(Icon)`
  width: 75px;
  height: 75px;
  padding: 5px;

  @media (max-width: 769px) {
    & {
      width: 45px;
      height: 45px;
    }
  }
`

type RankItemData = {
  name: string
  description: string | ReactElement<any>
  points?: [number, string][]
}

type RankListProps = {
  items: RankItemData[]
}

const RankList = ({ items }: RankListProps): ReactElement<any> => {
  return (
    <div className="is-clearfix mb-5">
      {items.map(({ name, description, points }) => (
        <RankItem key={name}>
          <LargeIconWrapper>
            <LargeIcon
              name="check-circle"
              alt="check"
              style={{ color: GREEN }}
            />
          </LargeIconWrapper>
          <div>
            <b>{name}</b>
            <Text>{description}</Text>
            {points && (
              <ul>
                {points.map(([num, desc], i) => (
                  <li key={i}>
                    <b>{num > 0 ? `+${num}` : num}</b>: {desc}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </RankItem>
      ))}
    </div>
  )
}

const Applications = (): ReactElement<any> => (
  <Container background={SNOW}>
    <Metadata title={`Creating ${OBJECT_NAME_TITLE_SINGULAR} Applications`} />
    <InfoPageTitle>
      Creating {OBJECT_NAME_TITLE_SINGULAR} Applications
    </InfoPageTitle>
    <StrongText>Where can I find the application?</StrongText>
    <Text>
      Prior to the application being released for editing, we will have created
      an application for every Wharton Council club that is accessible in the
      "Manage Club" portal under Recruitment:
      <img
        src="/static/img/screenshots/applications_recruitment_tab.png"
        height={300}
      />
      From here, you will see an application we have created for you. The
      application start, application end, and release times will already be set
      as well as the application name. The place where you need to make edits is
      the questions that comprise the application.
    </Text>
    <StrongText>How can I update the questions on my application?</StrongText>
    <Text>
      Once you've found your application, you can click on "Questions" to open
      up a modal that allows you to edit the questions:
      <img
        src="/static/img/screenshots/applications_questions_edit.png"
        height={300}
      />
      There will be one question already created for you - the personal
      statement - you must leave this question as part of the application.
      Otherwise, you have four options for question types: Free Response, Short
      Answer, Multiple Choice. The only questions that will contribute to your
      total word count (which must stay below 500) is Free Response.
    </Text>
    <StrongText>
      What if my club has multiple committees with different applications?
    </StrongText>
    <Text>
      If you have multiple committees you can update your application to include
      all of those committees:
      <img
        src="/static/img/screenshots/applications_committees.png"
        height={300}
      />
      From here, when you are creating any particular question, you will be able
      to include that question only for particular committees. To do this, check
      the "Do you want this question to appear only for certain committees?" and
      listing the committees where you would like the question to appear:
      <img
        src="/static/img/screenshots/applications_committees_checkbox.png"
        height={300}
      />
      If your club has multiple committees, the student will be prompted about
      which one they would like to apply to when they open the application. They
      can apply to multiple committees.
    </Text>
    <StrongText>How can I reorder the questions?</StrongText>
    <Text>
      The questions appear on the application in the same order they do in the
      questions table, you can reorder the questions simply by{' '}
      <b>dragging and dropping them</b>.
    </Text>
    <StrongText>How can I preview the application?</StrongText>
    <Text>
      Just click on the preview button right next to the questions button!
      <img
        src="/static/img/screenshots/applications_preview.png"
        height={150}
      />
    </Text>
  </Container>
)

export default renderPage(Applications)
