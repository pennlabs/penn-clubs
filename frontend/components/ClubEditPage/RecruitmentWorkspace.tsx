import { ReactElement, useState } from 'react'
import styled from 'styled-components'

import { Club } from '../../types'
import { OBJECT_NAME_SINGULAR, SHOW_APPLICATIONS } from '../../utils/branding'
import { Text } from '../common'
import { ADMIN_CANVAS } from './adminTheme'
import { AdminPrimary } from './adminControls'
import ApplicationWorkspace from './ApplicationWorkspace'
import { PageTitle } from './ClubAdminShell'

const Fill = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
`

const Layout = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
  overflow: hidden;
`

const Column = styled.section`
  background: ${ADMIN_CANVAS};
  border-radius: 10px;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  padding: 18px 16px 16px;
`

const ColumnHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  gap: 10px;
  margin: 0 0 12px;
  position: relative;
  z-index: 6;
`

const Widget = styled.div`
  background: white;
  border-radius: 10px;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  overflow: auto;
  padding: 14px;
`

const AppsFill = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
`

type Props = {
  club: Club
}

export default function RecruitmentWorkspace({
  club,
}: Props): ReactElement<any> {
  const [listOpen, setListOpen] = useState(true)

  return (
    <Fill>
      <Layout>
        <Column>
          <ColumnHead>
            <PageTitle>Applications</PageTitle>
            {!listOpen && (
              <AdminPrimary type="button" onClick={() => setListOpen(true)}>
                All Applications
              </AdminPrimary>
            )}
          </ColumnHead>
          <AppsFill>
            {SHOW_APPLICATIONS ? (
              <ApplicationWorkspace
                club={club}
                listOpen={listOpen}
                onCloseList={() => setListOpen(false)}
              />
            ) : (
              <Widget>
                <Text>
                  Applications are not enabled for this {OBJECT_NAME_SINGULAR}.
                </Text>
              </Widget>
            )}
          </AppsFill>
        </Column>
      </Layout>
    </Fill>
  )
}
