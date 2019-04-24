import fetch from 'isomorphic-unfetch'
import PropTypes from 'prop-types'
import renderPage from '../renderPage.js'
import { CLUBS_GREY } from '../colors'

const Club = (props) => {
  const { club, favorites, tags } = props
  return (
    <div>

    </div>
  )
}

Club.getInitialProps = async function getProps(props) {
  const { query } = props
  const clubRequest = await fetch(`https://clubs.pennlabs.org/clubs/${query.club}`)
  return { club: clubResponse }
}

Club.propTypes = {
  club: PropTypes.shape({
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
  }).isRequired,
}

export default renderPage(Club)
