import Link from 'next/link'
import { ReactElement } from 'react'

import { Container, Title } from '../../components/common'
import renderPage from '../../renderPage'

function FairInfoPage(): ReactElement {
  return (
    <Container>
      <Title>Welcome to the Virtual Club Fair!</Title>
      <p className="mb-3">Here is a description on how the fair works.</p>
      <p className="mb-3">Insert more details here.</p>
      <b>Code of Conduct</b>
      <ul className="mb-3">
        <li>Be nice to people!</li>
      </ul>
      <Link href="/fair/game">
        <a className="button is-primary">Join the fair</a>
      </Link>
    </Container>
  )
}

export default renderPage(FairInfoPage)
