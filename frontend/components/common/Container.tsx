import { CSSProperties, ReactElement } from 'react'
import styled from 'styled-components'

import { WHITE } from '../../constants/colors'
import {
  LG,
  MD,
  mediaMinWidth,
  NAV_HEIGHT,
  XL,
} from '../../constants/measurements'

const getPadding = (percent) => {
  if (!percent) return 'padding-left: 1rem; padding-right: 1rem;'
  return `padding-left: calc(1rem + ${percent}%); padding-right: calc(1rem + ${percent}%);`
}

type WrapperProps = {
  $fullHeight?: boolean
}

const Wrapper = styled.div<WrapperProps>`
  width: 100%;
  padding-top: 1rem;
  padding-bottom: 1rem;
  padding-left: 1rem;
  padding-right: 1rem;

  ${mediaMinWidth(MD)} {
    ${getPadding(5)}
  }

  ${mediaMinWidth(LG)} {
    ${getPadding(10)}
  }

  ${mediaMinWidth(XL)} {
    ${getPadding(20)}
  }

  ${({ $fullHeight }) =>
    $fullHeight &&
    `
    min-height: calc(100vh - ${NAV_HEIGHT});
  `}
`

export const Container = ({
  background = WHITE,
  fullHeight = false,
  paddingTop = false,
  style,
  children,
}: ContainerProps): ReactElement<any> => (
  <div style={{ background, paddingTop: paddingTop ? 46 : undefined }}>
    <Wrapper $fullHeight={fullHeight} style={style}>
      {children}
    </Wrapper>
  </div>
)

type ContainerProps = React.PropsWithChildren<{
  background?: string
  fullHeight?: boolean
  paddingTop?: boolean
  style?: CSSProperties
}>

export const WideWrapper = styled(Wrapper)`
  ${mediaMinWidth(MD)} {
    ${getPadding(2.5)}
  }

  ${mediaMinWidth(LG)} {
    ${getPadding(5)}
  }

  ${mediaMinWidth(XL)} {
    ${getPadding(10)}
  }
`

export const WideContainer = ({
  background = WHITE,
  fullHeight,
  children,
}: ContainerProps): ReactElement<any> => (
  <div style={{ background }}>
    <WideWrapper $fullHeight={fullHeight}>{children}</WideWrapper>
  </div>
)

export const PhoneContainer = styled.div`
  margin: 15px auto;
  padding: 15px;
  max-width: 420px;
`
