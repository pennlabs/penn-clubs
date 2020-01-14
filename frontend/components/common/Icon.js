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

  .button.is-primary &,
  .button.is-link &,
  .button.is-info &,
  .button.is-success &,
  .button.is-danger & {
    filter: invert(100%);
    margin-right: 3px;
    margin-top: -5px;
  }

  .button.is-large & {
    ${({ size }) => `
      height: ${size || '1.5rem'};
      width: ${size || '1.5rem'};
      margin-right: 7px;
      margin-top: -7px;
    `}
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
  alt: ''
}

Icon.propTypes = {
  name: PropTypes.string.isRequired,
  alt: PropTypes.string,
  size: PropTypes.string,
  style: PropTypes.object,
}
