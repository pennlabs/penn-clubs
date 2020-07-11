import PropTypes from 'prop-types'
import s from 'styled-components'

import { WHITE } from '../../constants/colors'
import {
  LG,
  MD,
  mediaMinWidth,
  NAV_HEIGHT,
  XL,
} from '../../constants/measurements'

const getPadding = percent => {
  if (!percent) return 'padding-left: 1rem; padding-right: 1rem;'
  return `padding-left: calc(1rem + ${percent}%); padding-right: calc(1rem + ${percent}%);`
}

const Wrapper = s.div`
  width: 100%;
  padding-top: 1rem;
  padding-bottom: 1rem;
  padding-left: 1rem;
  padding-right: 1rem;

  ${mediaMinWidth(MD)} {
    ${getPadding(5)}
  }

  ${mediaMinWidth(LG)} {
    ${getPadding(15)}
  }

  ${mediaMinWidth(XL)} {
    ${getPadding(25)}
  }

  ${({ fullHeight }) =>
    fullHeight &&
    `
    min-height: calc(100vh - ${NAV_HEIGHT});
  `}
`

export const Container = ({
  background = WHITE,
  fullHeight,
  style,
  children,
}) => (
  <div style={{ background }}>
    <Wrapper fullHeight={fullHeight} style={style}>
      {children}
    </Wrapper>
  </div>
)

Container.defaultProps = {
  background: WHITE,
  fullHeight: false,
}

Container.propTypes = {
  background: PropTypes.string,
  children: PropTypes.node.isRequired,
  fullHeight: PropTypes.bool,
}

const WideWrapper = s(Wrapper)`
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

export const WideContainer = ({ background = WHITE, fullHeight, children }) => (
  <div style={{ background }}>
    <WideWrapper fullHeight={fullHeight}>{children}</WideWrapper>
  </div>
)

export const PhoneContainer = s.div`
  margin: 15px auto;
  padding: 15px;
  max-width: 420px;
`
