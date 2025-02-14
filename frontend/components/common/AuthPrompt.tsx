import { ReactElement, ReactNode, useEffect, useState } from 'react'
import styled from 'styled-components'

import { CLUBS_BLUE } from '../../constants/colors'
import { getCurrentRelativePath, LOGIN_URL } from '../../utils'
import { OBJECT_NAME_PLURAL, SITE_LOGO, SITE_NAME } from '../../utils/branding'
import { Center, Icon, PhoneContainer, SmallText, Text, Title } from '.'

const Image = styled.img`
  height: 86px;
  width: auto;
  max-width: 242px;
  margin-right: 1rem;
  object-fit: contain;
`

const Margin = styled.div`
  margin: 1rem;
`

const TitleHeader = styled.div`
  margin-top: 1rem;
  text-align: center;

  h1 {
    margin-top: 1rem;
  }
`

type AuthPromptProps = {
  /**
   * The login prompt title that is shown right below the logo.
   */
  title?: string
  /**
   * If set to true, show the login button. Otherwise, hide the login button.
   */
  hasLogin?: boolean
  /**
   * A message prompting the user to login.
   */
  children?: ReactNode
}

const AuthPrompt = ({
  title = 'One last step...',
  children = `To make the most of ${SITE_NAME} features, like bookmarking and subscribing to ${OBJECT_NAME_PLURAL}, please login using your PennKey.`,
  hasLogin = true,
}: AuthPromptProps): ReactElement<any> => {
  const [nextLink, setNextLink] = useState<string>('/')

  useEffect(() => {
    setNextLink(getCurrentRelativePath())
  }, [])

  return (
    <PhoneContainer>
      <Center>
        <TitleHeader>
          <Image src={SITE_LOGO} />
          <Title>{title}</Title>
        </TitleHeader>
        <Margin>
          <Text>{children}</Text>
        </Margin>
        {hasLogin && (
          <>
            <Margin>
              <a
                href={`${LOGIN_URL}?next=${nextLink}`}
                className="button is-large is-link"
                style={{ backgroundColor: CLUBS_BLUE }}
              >
                <Icon alt="login" name="key" /> Continue to login
              </a>
            </Margin>
            <SmallText>
              <i>(We're sorry, we hate two-step too.)</i>
            </SmallText>
          </>
        )}
      </Center>
    </PhoneContainer>
  )
}

export default AuthPrompt
