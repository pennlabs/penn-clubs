import Head from 'next/head'

export const Device = ({ children, style, type = 'iphone' }) => (
  <>
    <Head>
      <link
        href="/static/css/devices.min.css"
        rel="stylesheet"
        key="devices-css"
      />
    </Head>
    {type === 'iphone' ? (
      <div className="marvel-device iphone8 silver" style={style}>
        <div className="top-bar"></div>
        <div className="sleep"></div>
        <div className="volume"></div>
        <div className="camera"></div>
        <div className="sensor"></div>
        <div className="speaker"></div>
        <div className="screen">{children}</div>
        <div className="home"></div>
        <div className="bottom-bar"></div>
      </div>
    ) : (
      <div className="marvel-device s5 white" style={style}>
        <div className="top-bar"></div>
        <div className="sleep"></div>
        <div className="camera"></div>
        <div className="sensor"></div>
        <div className="speaker"></div>
        <div className="screen">{children}</div>
        <div className="home"></div>
      </div>
    )}
  </>
)
