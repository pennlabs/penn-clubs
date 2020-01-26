import s from 'styled-components'

import {
  mediaMinWidth,
  mediaMaxWidth,
  TABLET,
  PHONE,
} from '../../constants/measurements'

const percent = numCols => (numCols / 12) * 100 + '%'

export const Flex = s.div`
  width: 100%;
  display: flex;
`

export const Row = s.div`
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

const ColWrapper = s.div`
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

const ColContainer = s.div`
  background: ${({ background }) => background || 'transparent'};
  overflow-x: visible;
  position: relative;
  ${({ flex }) => flex && 'display: flex; flex: 1;'}
  ${({ margin }) =>
    margin && `margin-left: ${margin}; margin-right: ${margin};`}
`

export const Col = ({ margin, children, background, flex, ...other }) => (
  <ColWrapper flex={flex} {...other}>
    <ColContainer flex={flex} margin={margin} background={background}>
      {children}
    </ColContainer>
  </ColWrapper>
)
