import { useEffect } from 'react'

/**
 * The banner injected by https://status.pennlabs.org/banner.js, which is loaded
 * in `pages/_document.tsx`. The script inserts it as the first child of
 * `document.body` (before the Next.js root) with `position: relative`, so by
 * default it sits in normal flow and scrolls away while our fixed navbar stays
 * pinned below where the banner used to be.
 */
const BANNER_ID = 'pennlabs-status-banner'

/** Must stay in sync with `STATUS_BANNER_HEIGHT` in `constants/measurements`. */
const HEIGHT_VARIABLE = '--status-banner-height'

/**
 * Matches the navbar (1001) and stays below modals (1002), so that modals and
 * their shade still cover the banner. The injected script sets 99999, which
 * would otherwise float the banner over every overlay once it is pinned.
 */
const BANNER_Z_INDEX = '1001'

/**
 * Pins the Penn Labs status banner to the top of the viewport and publishes its
 * height as the `--status-banner-height` CSS variable on the document root.
 *
 * The banner is injected asynchronously by a third party script, can be
 * dismissed by the user, and wraps to multiple lines on narrow viewports, so its
 * height has to be measured at runtime rather than hardcoded. Anything that
 * offsets off the navbar consumes the variable via `STATUS_BANNER_HEIGHT`, which
 * falls back to `0px` when no banner is present.
 */
export const useStatusBannerHeight = (): void => {
  useEffect(() => {
    const root = document.documentElement

    // Only write when the value actually changes. Setting a custom property
    // from inside a ResizeObserver callback relayouts everything that consumes
    // it, which otherwise trips the "ResizeObserver loop" error.
    let published: string | null = null
    const setHeight = (height: number) => {
      const value = `${height}px`
      if (value === published) {
        return
      }
      published = value
      root.style.setProperty(HEIGHT_VARIABLE, value)
    }

    let banner: HTMLElement | null = null
    const resizeObserver = new ResizeObserver(() => {
      if (banner != null) {
        setHeight(banner.offsetHeight)
      }
    })

    const sync = () => {
      const found = document.getElementById(BANNER_ID)
      if (found === banner) {
        return
      }

      resizeObserver.disconnect()
      banner = found

      if (banner == null) {
        setHeight(0)
        return
      }

      banner.style.position = 'fixed'
      banner.style.top = '0'
      banner.style.left = '0'
      banner.style.zIndex = BANNER_Z_INDEX

      setHeight(banner.offsetHeight)
      resizeObserver.observe(banner)
    }

    sync()

    // The script is deferred and fetches before rendering, so the banner is
    // usually inserted after hydration. Watch for it appearing and for the user
    // dismissing it.
    const mutationObserver = new MutationObserver(sync)
    mutationObserver.observe(document.body, { childList: true })

    return () => {
      mutationObserver.disconnect()
      resizeObserver.disconnect()
      // Deliberately leave the variable in place. The header unmounts and
      // remounts on every client side route change, and clearing it here would
      // collapse the offset in between.
    }
  }, [])
}
