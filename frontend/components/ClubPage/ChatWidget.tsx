import { createRef, ReactElement, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

import { CLUBS_GREY_LIGHT, WHITE } from '../../constants'
import { StrongText } from '../common'

const ChatMessages = styled.div`
  max-height: 300px;
  min-height: 100px;
  overflow-y: auto;
  width: 100%;
  border: 1px solid ${CLUBS_GREY_LIGHT};
  border-radius: 3px;
  background-color: ${WHITE};
  margin-bottom: 1rem;
  padding: 5px;
`

type Props = {
  code: string
}

const ChatWidget = ({ code }: Props): ReactElement<any> => {
  const ws = useRef<WebSocket | null>(null)
  const [messages, setMessages] = useState<ReactElement<any>[]>([])
  const [input, setInput] = useState<string>('')
  const [inputEnabled, setInputEnabled] = useState<boolean>(false)
  const messagesEle = createRef<HTMLDivElement>()

  useEffect(() => {
    const wsUrl = `${location.protocol === 'http:' ? 'ws' : 'wss'}://${
      location.host
    }/api/ws/chat/${code}/`
    ws.current = new WebSocket(wsUrl)
    ws.current.onmessage = (e) => {
      const data = JSON.parse(e.data)
      setMessages((msg) => {
        let ele
        if (data.username) {
          ele = (
            <div key={msg.length}>
              <b
                className={
                  data.membership != null ? 'has-text-info' : undefined
                }
              >
                {data.full_name}:
              </b>{' '}
              {data.message}
            </div>
          )
        } else {
          ele = (
            <div key={msg.length} className="has-text-grey">
              {data.message}
            </div>
          )
        }
        return [...msg, ele]
      })
    }
    ws.current.onopen = () => {
      setInputEnabled(true)
    }
    ws.current.onclose = () => {
      setInputEnabled(false)
    }

    return () => {
      ws.current?.close()
    }
  }, [])

  useEffect(() => {
    if (messagesEle.current) {
      messagesEle.current.scrollTo(0, messagesEle.current.scrollHeight)
    }
  }, [messages])

  return (
    <div>
      <StrongText>Live Chat</StrongText>
      <ChatMessages ref={messagesEle}>{messages}</ChatMessages>
      <input
        className="input is-small"
        placeholder={
          inputEnabled
            ? 'Type your message here and press enter'
            : 'Disconnected'
        }
        type="text"
        disabled={!inputEnabled}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.code === 'Enter') {
            ws.current?.send(JSON.stringify({ message: input }))
            setInput('')
          }
        }}
      />
    </div>
  )
}

export default ChatWidget
