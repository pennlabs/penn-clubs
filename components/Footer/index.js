import s from 'styled-components'
import Social from './Social'
import { ALLBIRDS_GRAY, RED } from '../../constants/colors'

const Foot = s.footer`
  height: 8rem;
  backgroundColor: ${ALLBIRDS_GRAY};
  fontSize: 0.85rem;
  display: flex;
  justify-content: center;
  flex-direction: column;
  text-align: center;
  align-items: center;
  padding: 4rem;
`

const Footer = () => (
  <Foot className="footer">
    <p>
      Made with{' '}
      <span className="icon is-small" style={{ color: RED }}>
        <i className="fa fa-heart"></i>
      </span>{' '}
      by <a href="https://pennlabs.org/">Penn Labs</a>
    </p>
    <Social />
  </Foot>
)

export default Footer
