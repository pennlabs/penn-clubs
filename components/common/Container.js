import PropTypes from 'prop-types'
import s from 'styled-components'

import { WHITE } from '../../constants/colors'
import { mediaMinWidth, MD, LG, XL } from '../../constants/measurements'

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
`

const Container = ({ background = WHITE, children }) => (
  <div style={{ background }}>
    <Wrapper className="container">{children}</Wrapper>
  </div>
)

Container.defaultProps = {
  background: WHITE,
}

Container.propTypes = {
  background: PropTypes.string,
  children: PropTypes.node.isRequired,
}

export default Container
