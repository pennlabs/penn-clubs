import s from 'styled-components'

const Icons = s.div`
  display: flex;
  justify-content: center;
  width: 100%;
`

export default () => (
  <Icons>
    <a
      href="https://github.com/pennlabs/"
      aria-label="GitHub"
      style={{ marginRight: '10px' }}
    >
      <span>
        <i className="fab fa-github"></i>
      </span>
    </a>
    <a href="https://www.facebook.com/labsatpenn/" aria-label="Facebook">
      <span>
        <i className="fab fa-facebook-square"></i>
      </span>
    </a>
  </Icons>
)
