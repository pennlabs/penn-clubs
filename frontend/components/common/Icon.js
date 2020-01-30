import PropTypes from 'prop-types'
import s from 'styled-components'

const reqSvgs = require.context('../../public/static/img/icons', true, /\.svg$/)

export const Icon = ({ name, size = '1rem', ...props }) =>
  reqSvgs(`./${name}.svg`).default({
    preserveAspectRatio: true,
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    ...props,
  })

Icon.defaultProps = {
  style: {},
  size: '1rem',
  alt: '',
}

Icon.propTypes = {
  name: PropTypes.string.isRequired,
  alt: PropTypes.string,
  size: PropTypes.string,
  style: PropTypes.object,
}
