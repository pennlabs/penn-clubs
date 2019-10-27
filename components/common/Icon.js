import React from 'react'
import PropTypes from 'prop-types'
import s from 'styled-components'

const IconTag = s.img`
  height: 1rem;
  width: 1rem;
  object-fit: contain;
  margin-bottom: 0;
  transform: translateY(2.5px);
`

const Icon = ({ name, alt, style }) => (
  <IconTag src={`/static/img/icons/${name}.svg`} alt={alt} style={style} />
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
