import { ReactElement, useEffect, useRef, useState } from 'react'
import s from 'styled-components'

import renderPage from '../../renderPage'
import { doApiRequest } from '../../utils'

const SmallVideoWindow = s.div`
  & video {
  width: 256px;
  }
`

function ClientList({ client, connections }): ReactElement | null {
  if (client === null) {
    return null
  }

  return (
    <div>
      <b>Client List:</b>
      <ul>
        <li>{client.userInfos[client.getId()].full_name} (You)</li>
        {connections.map((conn) => (
          <li key={conn}>{client.userInfos[conn].full_name}</li>
        ))}
      </ul>
    </div>
  )
}

function CameraPreview(): ReactElement {
  const selfVideoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    navigator.getUserMedia(
      { video: true, audio: true },
      (stream) => {
        if (selfVideoRef.current) {
          selfVideoRef.current.srcObject = stream
        }
      },
      // eslint-disable-next-line no-console
      (error) => console.warn(error.message),
    )
  }, [])

  return (
    <SmallVideoWindow>
      <video autoPlay muted ref={selfVideoRef} />
    </SmallVideoWindow>
  )
}

function RemoteStream({ client, id }): ReactElement {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const peerConnection = client.getPeerConnection(id)
    peerConnection.ontrack = ({ streams: [stream] }) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    }
  })
  return <video autoPlay ref={videoRef} />
}

class VideoClient {
  ws: WebSocket
  peerConnections: { [id: string]: RTCPeerConnection }
  events: { [name: string]: (data: any) => void }
  userInfos: { [name: string]: any }
  id: string | null

  constructor(address) {
    this.ws = new WebSocket(address)
    this.events = {}
    this.peerConnections = {}
    this.userInfos = {}
    this.id = null

    this.ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data)

      const handler = this.events[data.id]
      if (handler) {
        handler(data)
      } else {
        this.events.error({
          message: `Received invalid packet ID: ${data.id}`,
        })
      }
    }
  }

  getId(): string | null {
    return this.id
  }

  setId(id: string): void {
    this.id = id
  }

  registerEvent(name, handler) {
    if (name === 'open') {
      this.ws.onopen = handler
    }

    this.events[name] = handler
  }

  addPeerConnection(id: string, conn: RTCPeerConnection): void {
    this.peerConnections[id] = conn
    conn.onicecandidate = ({ candidate }) => {
      this.send('ice', { to: id, ice: candidate })
    }
  }

  getPeerConnection(id: string): RTCPeerConnection {
    return this.peerConnections[id]
  }

  removePeerConnection(id: string): void {
    const conn = this.peerConnections[id]
    if (conn) {
      conn.close()
    }
    delete this.peerConnections[id]
    delete this.userInfos[id]
  }

  close() {
    this.ws.close()
    Object.values(this.peerConnections).forEach((conn) => conn.close())
  }

  send(id: string, data: any) {
    this.ws.send(JSON.stringify({ id, ...data }))
  }
}

function VideoPage(): ReactElement {
  const websocketRef = useRef<VideoClient | null>(null)
  const [connections, setConnections] = useState<string[]>([])

  useEffect(() => {
    const client = new VideoClient(
      location.hostname === 'localhost'
        ? 'ws://localhost:4000/'
        : 'ws://ws01.pennclubs.com/',
    )
    websocketRef.current = client

    const createOffer = async (userid) => {
      const peerConnection = new RTCPeerConnection()
      client.addPeerConnection(userid, peerConnection)
      await setUpVideo(userid)
      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(new RTCSessionDescription(offer))
      client.send('offer', { offer, to: userid })
    }

    client.registerEvent('users', (data) => {
      client.userInfos = data.userInfos
      client.setId(data.myid)
      setConnections([])
      data.users.filter((id) => id !== data.myid).forEach(createOffer)
    })

    const setUpVideo = (id) => {
      return new Promise((resolve) => {
        const peerConnection = client.getPeerConnection(id)

        setConnections((conn) => [...conn, id])

        navigator.getUserMedia(
          { video: true, audio: true },
          (stream) => {
            stream
              .getTracks()
              .forEach((track) => peerConnection.addTrack(track, stream))
            resolve()
          },
          (error) => console.warn(error),
        )
      })
    }

    client.registerEvent('offer', async (data) => {
      const peerConnection = new RTCPeerConnection()
      client.addPeerConnection(data.from, peerConnection)
      await setUpVideo(data.from)
      await peerConnection.setRemoteDescription(data.offer)

      const answer = await peerConnection.createAnswer()
      await peerConnection.setLocalDescription(
        new RTCSessionDescription(answer),
      )

      client.send('answer', { answer, to: data.from })
    })

    client.registerEvent('answer', async (data) => {
      const peerConnection = client.getPeerConnection(data.from)
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(data.answer),
      )
    })

    client.registerEvent('ice', async (data) => {
      const peerConnection = client.getPeerConnection(data.from)
      if (data.ice !== null) {
        peerConnection
          .addIceCandidate(data.ice)
          .catch((e) => console.error(`addIceCandidate failure: ${e.name}`))
      }
    })

    client.registerEvent('peerClose', async (data) => {
      client.removePeerConnection(data.peer)
      setConnections((conn) => conn.filter((id) => id !== data.peer))
    })

    client.registerEvent('open', async () => {
      const resp = await doApiRequest('/fair/jwt/')
      const json = await resp.json()
      client.send('auth', { jwt: json.jwt })
    })

    client.registerEvent('error', (data) => {
      console.error(data.message)
    })

    client.registerEvent('newUser', (data) => {
      client.userInfos[data.peerId] = data.userInfo
    })

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close()
      }
    }
  }, [])

  return (
    <>
      {connections.map((id) => (
        <span key={id}>
          <RemoteStream client={websocketRef.current} id={id} />
        </span>
      ))}
      <CameraPreview />
      <ClientList client={websocketRef.current} connections={connections} />
    </>
  )
}

export default renderPage(VideoPage)
