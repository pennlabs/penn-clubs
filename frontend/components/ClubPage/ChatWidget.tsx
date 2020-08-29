import { ReactElement, useEffect, useRef, useState } from 'react'

type Props = {
  code: string
}

const ChatWidget = ({ code }: Props): ReactElement => {
  const ws = useRef<WebSocket | null>(null)
  const [messages, setMessages] = useState<ReactElement[]>([])
  const [input, setInput] = useState<string>('')
  const [inputEnabled, setInputEnabled] = useState<boolean>(false)

  useEffect(() => {
    const wsUrl = `${location.protocol === 'http:' ? 'ws' : 'wss'}://${
      location.host
    }/api/ws/chat/${code}/`
    ws.current = new WebSocket(wsUrl)
    ws.current.onmessage = (e) => {
      const data = JSON.parse(e.data)
      setMessages((msg) => [
        ...msg,
        <div key={msg.length}>
          <b>{data.full_name}:</b> {data.message}
        </div>,
      ])
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

  return (
    <div>
      {messages}
      <input
        type="text"
        disabled={!inputEnabled}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.keyCode === 13) {
            ws.current?.send(JSON.stringify({ message: input }))
            setInput('')
          }
        }}
      />
    </div>
  )
}

export default ChatWidget
