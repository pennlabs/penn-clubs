import PropTypes from 'prop-types'

const Burger = ({ toggle }) => (
  <a
    role="button"
    className="navbar-burger burger"
    aria-label="menu"
    aria-expanded="false"
    data-target="navbarBasicExample"
    onClick={toggle}
  >
    <span aria-hidden="true" />
    <span aria-hidden="true" />
    <span aria-hidden="true" />
  </a>
)

Burger.propTypes = {
  toggle: PropTypes.func.isRequired,
}

export default Burger
