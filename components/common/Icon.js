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

  .button:not(.is-light) & {
    filter: invert(100%);
    margin-right: 3px;
    margin-top: -5px;
  }
`

export const Icon = ({ name, alt, size, style, ...props }) => (
  <IconTag
    src={`/static/img/icons/${name}.svg`}
    alt={alt}
    style={style}
    size={size}
    {...props}
  />
)

Icon.defaultProps = {
  style: {},
  size: undefined,
}

Icon.propTypes = {
  name: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  size: PropTypes.string,
  style: PropTypes.object,
}
