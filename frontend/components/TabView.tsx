import { useRouter } from 'next/router'
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

type BaseProps = {
  tab?: string | null
  setTab: (tab: string) => void
} & Props

/**
 * A tab view that does not handle the state of the current tab.
 * Uses the first tab as default if tab is null or undefined.
 */
export const BaseTabView = ({
  tab,
  setTab,
  tabs,
  tabClassName = '',
  background,
}: BaseProps): ReactElement<any> => {
  if (tab == null || tab.length <= 0) {
    tab = tabs[0].name
  }

  const getTabContent = (): ReactElement<any> => {
    const tabContent = tabs.find((a) => a.name === tab)?.content ?? (
      <>Invalid tab selected.</>
    )

    return (
      <div key={tab}>
        {typeof tabContent === 'function' ? tabContent() : tabContent}
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
                className={name === tab ? 'is-active' : ''}
                key={`tab-${name}`}
              >
                <a
                  style={{ borderBottomWidth: '2px', marginBottom: '-2px' }}
                  onClick={() => {
                    setTab(name)
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

/**
 * A tab view that uses Next.js routing to transition between tab states.
 */
export const BrowserTabView = (
  props: Props & { tab?: string | null; route: string },
): ReactElement<any> => {
  const router = useRouter()
  const [currentTab, setCurrentTab] = useState<string | null>(props.tab ?? null)

  useEffect(() => {
    const handleChange = (url: string) => {
      if (url.startsWith(props.route)) {
        const newTab = url
          .substring(props.route.length)
          .match(/^\/?([^/]*)\/?$/)?.[1]
        newTab != null && setCurrentTab(newTab)
      }
    }

    router.events.on('routeChangeStart', handleChange)

    return () => router.events.off('routeChangeStart', handleChange)
  }, [])

  const setTab = (newTab: string) => {
    setCurrentTab(newTab)
    router.push(`${props.route}/${newTab}`, undefined, { shallow: true })
  }

  return <BaseTabView {...props} tab={currentTab} setTab={setTab} />
}

/**
 * A tab view that uses browser hashes and navigation to set the state of the current tab.
 */
const HashTabView = (props: Props): ReactElement<any> => {
  const [currentTab, setCurrentTab] = useState<string>(props.tabs[0].name)

  // the server side rendering does not have a window object
  useEffect(() => {
    setCurrentTab(window.location.hash.substring(1) || currentTab)
  }, [])

  return (
    <BaseTabView
      {...props}
      tab={currentTab}
      setTab={(tab) => {
        setCurrentTab(tab)
        window.history.replaceState(undefined, '', `#${tab}`)
      }}
    />
  )
}

export default HashTabView
