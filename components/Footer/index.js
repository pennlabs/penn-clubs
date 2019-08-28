import s from 'styled-components'
import Social from './Social'

const Foot = s.footer`
  height: 8rem;
  backgroundColor: #f2f2f2;
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
    <p>Made with {' '}
      <span className="icon is-small" style={{ color: '#F56F71' }}>
        <i className="fa fa-heart"></i>
      </span>
      {' '} by {' '}
      <a href="https://pennlabs.org/">Penn Labs</a>
    </p>
    <Social />
  </Foot>
)

export default Footer
