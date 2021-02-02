import { ReactElement, ReactNode, useEffect, useState } from 'react'
import styled from 'styled-components'

import { BLACK, WHITE, WHITE_ALPHA } from '../constants/colors'
import { titleize } from '../utils'
import { Container } from './common'

const BackgroundTabs = styled.div`
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

const Div = styled.div`
  padding: 1rem 0;
`
const Tabs = styled.div``

type Tab = {
  name: string
  content: ReactNode | (() => ReactNode)
  disabled?: boolean
  label?: string
}

type Props = {
  background?: string
  tabClassName?: string
  tabs: Tab[]
  useHashRouting?: boolean
  currentTabName?: string
  onTabChange?: (tab: Tab) => void
}

const TabView = ({
  tabs,
  tabClassName = '',
  background,
  useHashRouting = true,
  currentTabName,
  onTabChange,
}: Props): ReactElement => {
  // the server side rendering does not have a window object
  const [currentTab, setCurrentTab] = useState<string>(
    currentTabName ?? tabs[0].name,
  )

  useEffect(() => {
    if (useHashRouting) {
      setCurrentTab(window.location.hash.substring(1) || currentTab)
    } else {
      setCurrentTab(currentTab)
    }
  }, [])

  const getTabContent = (): ReactElement => {
    const tab = tabs.find((a) => a.name === currentTab) ?? {
      content: <>Invalid tab selected.</>,
    }
    return (
      <div key={currentTab}>
        {typeof tab.content === 'function' ? tab.content() : tab.content}
      </div>
    )
  }

  const enabledTabs = tabs.filter((tab) => !tab.disabled)

  const TabComponent = background ? BackgroundTabs : Tabs
  const ContainerComponent = background ? Container : Div

  return (
    <>
      <ContainerComponent
        background={background ?? WHITE}
        style={{ paddingBottom: 0, paddingTop: background ? 0 : undefined }}
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
                    if (useHashRouting)
                      window.history.replaceState(undefined, '', `#${name}`)
                    const t = tabs.find((t) => t.name === name)
                    if (t && onTabChange) onTabChange(t)
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
