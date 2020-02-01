import PropTypes from 'prop-types'
import s from 'styled-components'

const reqSvgs = require.context('../../public/static/img/icons', true, /\.svg$/)

const IconWrapper = s.span`
  display: inline-block;
  vertical-align: middle;

  .button & {
    margin-right: 0.25rem;
  }

  & svg {
    display: block;
    margin: auto;
  }
`

export const Icon = ({ name, show = true, size = '1rem', ...props }) => {
  const svg = reqSvgs(`./${name}.svg`)
  if (!show || !svg || !svg.default) {
    return null
  }
  const iconInfo = svg.default().props
  return (
    <IconWrapper>
      {svg.default({
        preserveAspectRatio: 'xMidYMid meet',
        width: size,
        height: size,
        viewBox: `0 0 ${iconInfo.width} ${iconInfo.height}`,
        ...props,
      })}
    </IconWrapper>
  )
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
