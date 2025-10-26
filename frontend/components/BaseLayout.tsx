import { PropsWithChildren } from 'react'
import { ToastContainer } from 'react-toastify'
import styled from 'styled-components'

import AuthPrompt from '~/components/common/AuthPrompt'
import Footer from '~/components/Footer'
import Header from '~/components/Header'
import { NAV_HEIGHT, SNOW } from '~/constants'
import { RenderPageWrapper, ToastStyle } from '~/renderPage'
import { PermissionsContext } from '~/utils'
import { createBasePropFetcher } from '~/utils/getBaseProps'

type BaseLayoutProps = Awaited<
  ReturnType<ReturnType<typeof createBasePropFetcher>>
> & {
  authRequired?: boolean
}

export const Wrapper = styled.div`
  min-height: calc(100vh - ${NAV_HEIGHT});
  background: ${SNOW};
`

export const BaseLayout: React.FC<PropsWithChildren<BaseLayoutProps>> = ({
  auth,
  permissions,
  children,
  authRequired,
}) => {
  const authError = !!(authRequired && !auth.authenticated)
  return (
    <>
      <PermissionsContext.Provider value={permissions}>
        <RenderPageWrapper>
          <Header {...auth} />
          {authError ? <AuthPrompt /> : <Wrapper>{children}</Wrapper>}
          <Footer />
        </RenderPageWrapper>
      </PermissionsContext.Provider>
      <ToastStyle>
        <ToastContainer
          limit={3}
          position="bottom-center"
          autoClose={3000}
          hideProgressBar={true}
        />
      </ToastStyle>
    </>
  )
}
