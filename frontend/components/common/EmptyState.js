import s from 'styled-components'

const Image = s.img`
  ${({ size }) => `width: ${size || '50%'}`}
  display: block;
  margin: 7.5%;
  margin-left: auto;
  margin-right: auto;
`

export const EmptyState = ({ name, alt, size, style, ...props }) => (
  <Image 
    src={`/static/img/${name}.svg`}
    alt={alt}
    style={style}
    size={size}
    {...props}
  />
)
