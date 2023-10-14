import { useEffect, useRef, useState } from 'react'

const issueIcon =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNSAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgIDxwYXRoCiAgICAgICAgZD0iTTI0LjY0MjggMTkuMDc2N0wxNC44ODMyIDEuOTQyODFDMTQuNjM5NCAxLjUyMzA0IDE0LjI5MTIgMS4xNzQ5OSAxMy44NzMzIDAuOTMzMTQ5QzEzLjQ1NTMgMC42OTEzMTEgMTIuOTgyMSAwLjU2NDA4NyAxMi41MDA2IDAuNTY0MDg3QzEyLjAxOSAwLjU2NDA4NyAxMS41NDU4IDAuNjkxMzExIDExLjEyNzkgMC45MzMxNDlDMTAuNzA5OSAxLjE3NDk5IDEwLjM2MTcgMS41MjMwNCAxMC4xMTc5IDEuOTQyODFMMC4zNTgzMjIgMTkuMDc2N0MwLjEyMzY2NCAxOS40ODI3IDAgMTkuOTQ0NSAwIDIwLjQxNDdDMCAyMC44ODUgMC4xMjM2NjQgMjEuMzQ2OCAwLjM1ODMyMiAyMS43NTI4QzAuNTk5MDggMjIuMTc1MSAwLjk0NjY1MSAyMi41MjUgMS4zNjUzNyAyMi43NjY3QzEuNzg0MDkgMjMuMDA4NCAyLjI1ODg4IDIzLjEzMzEgMi43NDEwMSAyMy4xMjhIMjIuMjYwMUMyMi43NDE5IDIzLjEzMjcgMjMuMjE2MiAyMy4wMDc4IDIzLjYzNDUgMjIuNzY2MUMyNC4wNTI4IDIyLjUyNDUgMjQuNCAyMi4xNzQ3IDI0LjY0MDYgMjEuNzUyOEMyNC44NzU2IDIxLjM0NyAyNC45OTk2IDIwLjg4NTMgMjUgMjAuNDE1QzI1LjAwMDQgMTkuOTQ0OCAyNC44NzcxIDE5LjQ4MjkgMjQuNjQyOCAxOS4wNzY3Wk0xMS42MDc3IDkuNTg5NzFDMTEuNjA3NyA5LjM1MDM0IDExLjcwMTggOS4xMjA3NyAxMS44NjkyIDguOTUxNTFDMTIuMDM2NyA4Ljc4MjI1IDEyLjI2MzggOC42ODcxNiAxMi41MDA2IDguNjg3MTZDMTIuNzM3MyA4LjY4NzE2IDEyLjk2NDQgOC43ODIyNSAxMy4xMzE5IDguOTUxNTFDMTMuMjk5MyA5LjEyMDc3IDEzLjM5MzQgOS4zNTAzNCAxMy4zOTM0IDkuNTg5NzFWMTQuMTAyNUMxMy4zOTM0IDE0LjM0MTkgMTMuMjk5MyAxNC41NzE0IDEzLjEzMTkgMTQuNzQwN0MxMi45NjQ0IDE0LjkxIDEyLjczNzMgMTUuMDA1IDEyLjUwMDYgMTUuMDA1QzEyLjI2MzggMTUuMDA1IDEyLjAzNjcgMTQuOTEgMTEuODY5MiAxNC43NDA3QzExLjcwMTggMTQuNTcxNCAxMS42MDc3IDE0LjM0MTkgMTEuNjA3NyAxNC4xMDI1VjkuNTg5NzFaTTEyLjUwMDYgMTkuNTE3OEMxMi4yMzU3IDE5LjUxNzggMTEuOTc2OCAxOS40Mzg0IDExLjc1NjUgMTkuMjg5N0MxMS41MzYzIDE5LjE0MDkgMTEuMzY0NiAxOC45Mjk1IDExLjI2MzMgMTguNjgyMUMxMS4xNjE5IDE4LjQzNDcgMTEuMTM1NCAxOC4xNjI1IDExLjE4NzEgMTcuODk5OUMxMS4yMzg3IDE3LjYzNzMgMTEuMzY2MyAxNy4zOTYgMTEuNTUzNiAxNy4yMDY3QzExLjc0MDkgMTcuMDE3MyAxMS45Nzk1IDE2Ljg4ODQgMTIuMjM5MyAxNi44MzYyQzEyLjQ5OTEgMTYuNzgzOSAxMi43NjgzIDE2LjgxMDcgMTMuMDEzMSAxNi45MTMyQzEzLjI1NzggMTcuMDE1NyAxMy40NjY5IDE3LjE4OTIgMTMuNjE0MSAxNy40MTE4QzEzLjc2MTIgMTcuNjM0NSAxMy44Mzk4IDE3Ljg5NjIgMTMuODM5OCAxOC4xNjRDMTMuODM5OCAxOC41MjMgMTMuNjk4NyAxOC44Njc0IDEzLjQ0NzUgMTkuMTIxM0MxMy4xOTY0IDE5LjM3NTIgMTIuODU1NyAxOS41MTc4IDEyLjUwMDYgMTkuNTE3OFoiCiAgICAgICAgZmlsbD0iI0ZGRiIgLz4KPC9zdmc+CiAgICA='
const infoIcon =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgIDxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIgogICAgICAgIGQ9Ik0xMiAxQzUuOTI1IDEgMSA1LjkyNSAxIDEyQzEgMTguMDc1IDUuOTI1IDIzIDEyIDIzQzE4LjA3NSAyMyAyMyAxOC4wNzUgMjMgMTJDMjMgNS45MjUgMTguMDc1IDEgMTIgMVpNMTEuNSA2QzExLjIzNDggNiAxMC45ODA0IDYuMTA1MzYgMTAuNzkyOSA2LjI5Mjg5QzEwLjYwNTQgNi40ODA0MyAxMC41IDYuNzM0NzggMTAuNSA3QzEwLjUgNy4yNjUyMiAxMC42MDU0IDcuNTE5NTcgMTAuNzkyOSA3LjcwNzExQzEwLjk4MDQgNy44OTQ2NCAxMS4yMzQ4IDggMTEuNSA4SDEyQzEyLjI2NTIgOCAxMi41MTk2IDcuODk0NjQgMTIuNzA3MSA3LjcwNzExQzEyLjg5NDYgNy41MTk1NyAxMyA3LjI2NTIyIDEzIDdDMTMgNi43MzQ3OCAxMi44OTQ2IDYuNDgwNDMgMTIuNzA3MSA2LjI5Mjg5QzEyLjUxOTYgNi4xMDUzNiAxMi4yNjUyIDYgMTIgNkgxMS41Wk0xMCAxMEM5LjczNDc4IDEwIDkuNDgwNDMgMTAuMTA1NCA5LjI5Mjg5IDEwLjI5MjlDOS4xMDUzNiAxMC40ODA0IDkgMTAuNzM0OCA5IDExQzkgMTEuMjY1MiA5LjEwNTM2IDExLjUxOTYgOS4yOTI4OSAxMS43MDcxQzkuNDgwNDMgMTEuODk0NiA5LjczNDc4IDEyIDEwIDEySDExVjE1SDEwQzkuNzM0NzggMTUgOS40ODA0MyAxNS4xMDU0IDkuMjkyODkgMTUuMjkyOUM5LjEwNTM2IDE1LjQ4MDQgOSAxNS43MzQ4IDkgMTZDOSAxNi4yNjUyIDkuMTA1MzYgMTYuNTE5NiA5LjI5Mjg5IDE2LjcwNzFDOS40ODA0MyAxNi44OTQ2IDkuNzM0NzggMTcgMTAgMTdIMTRDMTQuMjY1MiAxNyAxNC41MTk2IDE2Ljg5NDYgMTQuNzA3MSAxNi43MDcxQzE0Ljg5NDYgMTYuNTE5NiAxNSAxNi4yNjUyIDE1IDE2QzE1IDE1LjczNDggMTQuODk0NiAxNS40ODA0IDE0LjcwNzEgMTUuMjkyOUMxNC41MTk2IDE1LjEwNTQgMTQuMjY1MiAxNSAxNCAxNUgxM1YxMUMxMyAxMC43MzQ4IDEyLjg5NDYgMTAuNDgwNCAxMi43MDcxIDEwLjI5MjlDMTIuNTE5NiAxMC4xMDU0IDEyLjI2NTIgMTAgMTIgMTBIMTBaIgogICAgICAgIGZpbGw9IiNGRkYiIC8+Cjwvc3ZnPgogICAg'
const closeIcon =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTEiIGhlaWdodD0iMTIiIHZpZXdCb3g9IjAgMCAxMSAxMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgIDxwYXRoCiAgICAgICAgZD0iTTAuMjY3NTI3IDAuNDA4NDM2QzAuNDM5MDQ2IDAuMjM3NDkyIDAuNjcxNTQ4IDAuMTQxNDc1IDAuOTEzOTYzIDAuMTQxNDc1QzEuMTU2MzggMC4xNDE0NzUgMS4zODg4OCAwLjIzNzQ5MiAxLjU2MDQgMC40MDg0MzZMNS40ODc4IDQuMzI3NTNMOS40MTUyIDAuNDA4NDM2QzkuNTI3MDEgMC4yODgyNzcgOS42NjkyMyAwLjIwMDQzNyA5LjgyNjg4IDAuMTU0MTY5QzkuOTg0NTIgMC4xMDc5MDIgMTAuMTUxNyAwLjEwNDkyMSAxMC4zMTA5IDAuMTQ1NTM5QzEwLjQ3MDEgMC4xODYxNTggMTAuNjE1NCAwLjI2ODg3MyAxMC43MzE1IDAuMzg0OTdDMTAuODQ3NSAwLjUwMTA2NyAxMC45MyAwLjY0NjI0NyAxMC45NzAzIDAuODA1MjE0QzExLjAxMTEgMC45NjM4OTYgMTEuMDA4MiAxLjEzMDYxIDEwLjk2MjEgMS4yODc4MUMxMC45MTU5IDEuNDQ1MDIgMTAuODI4MiAxLjU4NjkxIDEwLjcwODEgMS42OTg1N0w2Ljc4MDY3IDUuNjE3NjdMMTAuNzA4MSA5LjUzNjc3QzEwLjgyODUgOS42NDgzNCAxMC45MTY1IDkuNzkwMjYgMTAuOTYyOSA5Ljk0NzU3QzExLjAwOTIgMTAuMTA0OSAxMS4wMTIyIDEwLjI3MTggMTAuOTcxNSAxMC40MzA2QzEwLjkzMDggMTAuNTg5NSAxMC44NDc5IDEwLjczNDQgMTAuNzMxNiAxMC44NTAyQzEwLjYxNTIgMTAuOTY2IDEwLjQ2OTggMTEuMDQ4NCAxMC4zMTA1IDExLjA4ODZDMTAuMTUxNCAxMS4xMjkzIDkuOTg0MzcgMTEuMTI2NCA5LjgyNjgzIDExLjA4MDRDOS42NjkyOSAxMS4wMzQzIDkuNTI3MSAxMC45NDY4IDkuNDE1MiAxMC44MjY5TDUuNDg3OCA2LjkwNzgxTDEuNTYwNCAxMC44MjY5QzEuMzg2ODggMTAuOTg4MSAxLjE1NzUyIDExLjA3NTggMC45MjA1MTIgMTEuMDcxN0MwLjY4MzUwNSAxMS4wNjc2IDAuNDU3MzE1IDEwLjk3MiAwLjI4OTQ4MSAxMC44MDVDMC4xMjIwODcgMTAuNjM3NSAwLjAyNjI3MzggMTAuNDExOCAwLjAyMjE3OTcgMTAuMTc1M0MwLjAxODA4NTUgOS45Mzg3OSAwLjEwNjAyOSA5LjcwOTkxIDAuMjY3NTI3IDkuNTM2NzdMNC4xOTQ5MyA1LjYxNzY3TDAuMjY3NTI3IDEuNjk4NTdDMC4wOTYyMjA5IDEuNTI3NDIgMCAxLjI5NTQxIDAgMS4wNTM1QzAgMC44MTE2MDMgMC4wOTYyMjA5IDAuNTc5NTkzIDAuMjY3NTI3IDAuNDA4NDM2WiIKICAgICAgICBmaWxsPSIjQkFCQUJBIiAvPgo8L3N2Zz4KICAgIA=='

export interface AnnouncementProps {
  type: 'issue' | 'notice'
  title?: string
  // message: string
}

const COLORS = {
  issue: '#EF4B5F',
  notice: '#209CEE',
}

const useDismiss = (key: string) => {
  const dismissKey = `dismissed-${key}`
  const [dismissed, setDismissed] = useState(() => true)
  useEffect(() => {
    setDismissed(window.localStorage.getItem(dismissKey) === 'true')
  }, [])
  const dismiss = () => {
    window.localStorage.setItem(dismissKey, 'true')
    setDismissed(true)
  }
  return { dismissed, dismiss }
}

const useIsClamped = (ref: React.RefObject<HTMLElement>) => {
  const [isClamped, setIsClamped] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      if (!ref.current) {
        return
      }
      const { clientHeight, scrollHeight } = ref.current
      setIsClamped(clientHeight < scrollHeight)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [ref])

  return isClamped
}

/**
 *
 * Temporary hard-coded announcement banner for maintenance (231014)
 */
export const Announcement: React.FC<AnnouncementProps> = ({
  type,
  title,
  // message,
}) => {
  const { dismissed, dismiss } = useDismiss(
    `org.pennlabs.announcements.outage.231014`,
  )
  const textRef = useRef<HTMLDivElement>(null)
  const isClamped = useIsClamped(textRef)
  const [expanded, setExpanded] = useState(false)

  const icon = type === 'issue' ? issueIcon : infoIcon

  if (dismissed) return null

  return (
    <>
      <style jsx>
        {`
          .announcement-text {
            font-size: 18px;
            display: -webkit-box;
            overflow: hidden;
          }
          @media (max-width: 768px) {
            .announcement-text {
              font-size: 16px;
              -webkit-line-clamp: ${expanded ? 'unset' : 2};
              -webkit-box-orient: vertical;
            }
          }
        `}
      </style>
      <div
        style={{
          fontFamily: `BlinkMacSystemFont, -apple-system, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, Helvetica, Arial, sans-serif`,
          display: `flex`,
          overflow: `hidden`,
          borderRadius: `8px`,
          border: `1px solid ${COLORS[type]}`,
          backgroundColor: `#fff`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            backgroundColor: COLORS[type],
          }}
        >
          <img
            src={icon}
            style={{
              width: '20px',
              height: '20px',
              transform: 'translate3d(0, -3px, 0)',
            }}
          />
        </div>
        <div
          style={{
            flex: 1,
            display: 'flex',
            padding: '16px 8px 16px 16px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              flex: 1,
            }}
            ref={textRef}
          >
            {title && (
              <div
                style={{
                  fontWeight: 600,
                  padding: '8px 12px',
                  color: COLORS[type],
                }}
              >
                {title}
              </div>
            )}
            <div className="announcement-text">
              🔧 We're performing essential maintenance over Fall Break weekend.
              Please expect possible service interruptions until Sunday. We
              greatly appreciate your understanding.{' '}
              <a
                href="mailto:contact@pennlabs.org"
                style={{
                  color: COLORS[type],
                  marginRight: '4px',
                }}
              >
                Contact us
              </a>{' '}
              for assistance.
            </div>
            {isClamped && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  padding: '4px 12px',
                }}
              >
                <button
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: COLORS[type],
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
                    padding: 0,
                    margin: 0,
                    textDecoration: 'underline',
                  }}
                  onClick={() => setExpanded(true)}
                >
                  Read more
                </button>
              </div>
            )}
          </div>
          <div>
            <button
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                margin: 0,
              }}
              onClick={dismiss}
            >
              <img
                src={closeIcon}
                style={{
                  width: '16px',
                  height: '16px',
                }}
              />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
