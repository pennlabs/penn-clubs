import { Container, Metadata, Title } from 'components/common'
import AuthPrompt from 'components/common/AuthPrompt'
import QueueTab from 'components/Settings/QueueTab'
import RenewTab from 'components/Settings/RenewTab'
import HashTabView from 'components/TabView'
import { ReactElement } from 'react'
import renderPage from 'renderPage'
import { apiCheckPermission } from 'utils'
import { OBJECT_NAME_TITLE } from 'utils/branding'

import { BG_GRADIENT, WHITE } from '~/constants/colors'

function UserRenewal({ userInfo, authenticated }): ReactElement<any> {
  const canApprove = apiCheckPermission('clubs.approve_club')

  if (authenticated === null) {
    return <div />
  }

  if (!userInfo) {
    return <AuthPrompt />
  }

  const tabs = [
    {
      name: 'Clubs',
      content: <RenewTab userInfo={userInfo} />,
    },
    { name: 'Queue', content: <QueueTab />, disabled: !canApprove },
  ]

  return (
    <>
      <Metadata title={`Renew ${OBJECT_NAME_TITLE}`} />
      <Container background={BG_GRADIENT}>
        <Title style={{ marginTop: '2.5rem', color: WHITE, opacity: 0.95 }}>
          Renew {OBJECT_NAME_TITLE}
        </Title>
      </Container>
      <HashTabView
        background={BG_GRADIENT}
        tabs={tabs}
        tabClassName="is-boxed"
      />
    </>
  )
}

UserRenewal.permissions = ['clubs.approve_club']

export default renderPage(UserRenewal)
