import { ReactElement } from 'react'
import styled from 'styled-components'

import {
  mediaMaxWidth,
  mediaMinWidth,
  PHONE,
  TABLET,
} from '../../constants/measurements'

const percent = (numCols: number): string => (numCols / 12) * 100 + '%'

export const Flex = styled.div`
  width: 100%;
  display: flex;

  ${mediaMaxWidth(PHONE)} {
    display: block;

    & img {
      margin: 0;
    }
  }
`

export const Row = styled.div<{ alwaysFlex?: boolean; margin?: string }>`
  display: flex;
  flex-direction: row;
  width: 100%;
  flex-wrap: wrap;
  ${({ alwaysFlex }) =>
    !alwaysFlex && `${mediaMaxWidth(PHONE)} { display: block; }`}
  ${({ margin }) =>
    margin &&
    `
    margin-left: -${margin};
    margin-right: -${margin};
    width: calc(100% + ${margin} + ${margin});
  `}
`

interface ColWrapperProps {
  width?: string
  sm?: number
  offsetSm?: number
  overflowY?: string
  md?: number
  offsetMd?: number
  lg?: number
  offsetLg?: number
  flex?: boolean
}

const ColWrapper = styled.div<ColWrapperProps>`
  flex: ${({ width }) => (width ? 'none' : 1)};
  width: ${({ width }) => width || 'auto'};
  overflow-y: ${({ overflowY }) => overflowY || 'visible'};
  overflow-x: visible;
  ${mediaMinWidth('0px')} {
    ${({ sm }) => sm && `width: ${percent(sm)}; flex: none;`}
    ${({ offsetSm }) => offsetSm && `margin-left: ${percent(offsetSm)};`}
  }
  ${mediaMinWidth(PHONE)} {
    ${({ md }) => md && `width: ${percent(md)}; flex: none;`}
    ${({ offsetMd }) => offsetMd && `margin-left: ${percent(offsetMd)};`}
  }
  ${mediaMinWidth(TABLET)} {
    ${({ lg }) => lg && `width: ${percent(lg)}; flex: none;`}
    ${({ offsetLg }) => offsetLg && `margin-left: ${percent(offsetLg)};`}
  }
  ${({ flex }) => flex && 'display: flex;'}
`

const ColContainer = styled.div<{
  background?: string
  flex?: boolean
  margin?: string
}>`
  background: ${({ background }) => background || 'transparent'};
  overflow-x: visible;
  position: relative;
  min-width: 0;
  ${({ flex }) => flex && 'display: flex; flex: 1;'}
  ${({ margin }) =>
    margin && `margin-left: ${margin}; margin-right: ${margin};`}
`

interface Props {
  background?: string
  margin?: string
  flex?: boolean
}

export const Col = ({
  margin,
  children,
  background,
  flex,
  ...other
}: React.PropsWithChildren<Props & ColWrapperProps>): ReactElement<any> => (
  <ColWrapper flex={flex} {...other}>
    <ColContainer flex={flex} margin={margin} background={background}>
      {children}
    </ColContainer>
  </ColWrapper>
)
