import { ReactElement, useEffect, useState } from 'react'
import s from 'styled-components'

import { BLACK, WHITE, WHITE_ALPHA } from '../constants/colors'
import { titleize } from '../utils'
import { Container } from './common'

const BackgroundTabs = s.div`
  ul {
    border-bottom-width: 0;

    li {
      a {
        border: 0 !important;
        font-weight: 500;
        color: ${WHITE};
        opacity: 0.8;

        :hover {
          background: ${WHITE_ALPHA(0.2)} !important;
          color: ${WHITE} !important;
        }
      }

      &.is-active {
        a {
          color: ${BLACK} !important;
          opacity: 1;

          :hover {
            background: ${WHITE} !important;
            color: ${BLACK} !important;
          }
        }
      }
    }
  }
`

const Div = s.div`
  padding: 1rem 0;
`
const Tabs = s.div``

type Props = {
  background?: string | false
  tabClassName?: string
  tabs: {
    name: string
    content: ReactElement | string
    disabled?: boolean
    label?: string
  }[]
}

const TabView = ({
  tabs,
  tabClassName = '',
  background = false,
}: Props): ReactElement => {
  // the server side rendering does not have a window object
  const [currentTab, setCurrentTab] = useState<string>(tabs[0].name)

  useEffect(() => {
    setCurrentTab(window.location.hash.substring(1) || currentTab)
  }, [])

  const getTabContent = (): ReactElement => (
    <div key={currentTab}>
      {
        (
          tabs.find((a) => a.name === currentTab) ?? {
            content: <>Invalid tab selected.</>,
          }
        ).content
      }
    </div>
  )

  const enabledTabs = tabs.filter((tab) => !tab.disabled)

  const TabComponent = background ? BackgroundTabs : Tabs
  const ContainerComponent = background ? Container : Div

  return (
    <>
      <ContainerComponent
        background={background || WHITE}
        style={{ paddingBottom: 0 }}
      >
        <TabComponent className={`tabs ${tabClassName}`}>
          <ul>
            {enabledTabs.map(({ name, label }) => (
              <li
                className={name === currentTab ? 'is-active' : ''}
                key={`tab-${name}`}
              >
                <a
                  style={{ borderBottomWidth: '2px', marginBottom: '-2px' }}
                  onClick={() => {
                    setCurrentTab(name)
                    window.history.replaceState(undefined, '', `#${name}`)
                  }}
                >
                  {label || titleize(name)}
                </a>
              </li>
            ))}
          </ul>
        </TabComponent>
      </ContainerComponent>

      <ContainerComponent>{getTabContent()}</ContainerComponent>
    </>
  )
}

export default TabView
