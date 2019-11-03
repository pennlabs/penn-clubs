import PropTypes from 'prop-types'
import s from 'styled-components'

import renderPage from '../renderPage.js'
import Container from '../components/common/Container'
import { SNOW } from '../constants/colors'
import { HOME_ROUTE } from '../constants/routes'

const Image = s.img`
  margin-top: calc(1rem + 5vh);
  width: 100%;
  max-width: 18rem;
  margin-bottom: 1.5rem;
`

const Error = ({ statusCode = 500, message = 'Something went wrong' }) => (
  <Container background={SNOW} fullHeight>
    <div style={{ textAlign: 'center' }}>
      <Image src="/static/img/button.svg" alt="something went wrong" />
      <h1
        className="is-size-1"
        style={{ marginBottom: '0.2rem', fontWeight: 'bold' }}
      >
        {statusCode}: Oh no!
      </h1>
      <p className="is-size-5" style={{ marginBottom: '1rem' }}>
        {message}
      </p>
      <a className="button is-medium is-primary" href={HOME_ROUTE}>
        Back to home
      </a>
    </div>
  </Container>
)

Error.getInitialProps = ({ res, err } = {}) => {
  const statusCode = (res && res.statusCode) || (err && err.statusCode) || 404
  let message = (err && err.message) || (res && res.message) || undefined

  if (!message) {
    if (statusCode === 404) {
      message = 'The page you were looking for does not exist.'
    } else {
      message = 'Something went wrong.'
    }
  }

  return { statusCode, message }
}

Error.defaultProps = {
  statusCode: 500,
  message: 'Something went wrong.',
}

Error.propTypes = {
  statusCode: PropTypes.number,
  message: PropTypes.string,
}

export default renderPage(Error)
