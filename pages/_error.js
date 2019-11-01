import PropTypes from 'prop-types'

const Error = ({ statusCode }) => {
  return (
    <p>
      {statusCode
        ? `An error ${statusCode} occurred on server`
        : 'An error occurred on client'}
    </p>
  )
}

Error.getInitialProps = ({ res = { statusCode: 500 }, err }) => {
  const { statusCode } = res
  return { statusCode }
}

Error.defaultProps = {
  statusCode: 500,
}

Error.propTypes = {
  statusCode: PropTypes.number,
}

export default Error
