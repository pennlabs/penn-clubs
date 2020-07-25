import { ReactElement, useEffect, useState } from 'react'

import { Container, Title } from '../components/common'
import renderPage from '../renderPage'
import { isBetaEnabled, setBetaState } from '../utils'

function BetaOptionCard({ name, description, identifier }): ReactElement {
  const [betaState, setLocalBetaState] = useState<boolean>(false)

  useEffect(() => {
    setLocalBetaState(isBetaEnabled(identifier))
  }, [])

  return (
    <div className="card mb-5">
      <div className="card-content">
        <b>{name}</b>
        <p className="mb-3">{description}</p>
        <div
          className={`button is-small ${
            betaState ? 'is-danger' : 'is-primary'
          }`}
          onClick={() => {
            setBetaState(identifier, !betaState)
            setLocalBetaState(!betaState)
          }}
        >
          {betaState ? 'Disable' : 'Enable'}
        </div>
      </div>
    </div>
  )
}

const BetaPage = (): ReactElement => {
  return (
    <Container>
      <Title>Penn Clubs Beta Features</Title>
      <p className="mb-5">
        This is a secret page where you can enable some of the new features that
        we're testing out on Penn Clubs. These features will only apply to your
        current browser session, not at the account level.
      </p>
      <BetaOptionCard
        name="Virtual Club Fair"
        description="Enable virtual club fair features around the entire site."
        identifier="fair"
      />
    </Container>
  )
}

export default renderPage(BetaPage)
