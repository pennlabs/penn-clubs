import { ReactElement } from 'react'

const Burger = ({ toggle }: BurgerProps): ReactElement => (
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

type BurgerProps = {
  toggle: () => void
}

export default Burger
