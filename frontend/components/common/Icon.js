import PropTypes from 'prop-types'
import s from 'styled-components'

const reqSvgs = require.context('../../public/static/img/icons', true, /\.svg$/)

export const Icon = ({ name, show = true, size = '1rem', ...props }) => {
  const svg = reqSvgs(`./${name}.svg`)
  if (!show || !svg || !svg.default) {
    return null
  }
  return svg.default({
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    ...props,
  })
}

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
