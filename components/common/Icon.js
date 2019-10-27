import React from 'react'
import PropTypes from 'prop-types'
import s from 'styled-components'

const IconTag = s.img`
  ${({ size }) => `
    height: ${size || '1rem'};
    width: ${size || '1rem'};
  `}
  object-fit: contain;
  margin-bottom: 0;
  transform: translateY(2.5px);
`

const Icon = ({ name, alt, size, style }) => (
  <IconTag
    src={`/static/img/icons/${name}.svg`}
    alt={alt}
    style={style}
    size={size}
  />
)

Icon.defaultProps = {
  style: {},
}

Icon.propTypes = {
  name: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  style: PropTypes.object,
}

export default Icon
