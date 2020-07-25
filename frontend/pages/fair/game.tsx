import { ReactElement, useEffect } from 'react'
import s from 'styled-components'

import renderPage from '../../renderPage'

const GameBackground = s.div`
  background-color: black;
  color: white;
  width: 100%;
  height: calc(100vh - 3.25rem);
`

function FairGamePage(): ReactElement {
  // disable body overflow
  useEffect(() => {
    if (!document.querySelector('#no-overflow-style')) {
      const style = document.createElement('style')
      style.id = 'no-overflow-style'
      style.innerHTML = '.no-overflow { overflow: hidden; }'
      document.head.appendChild(style)
    }

    document.documentElement.classList.add('no-overflow')
    return () => document.documentElement.classList.remove('no-overflow')
  }, [])

  return <GameBackground>Testing!</GameBackground>
}

export default renderPage(FairGamePage)
