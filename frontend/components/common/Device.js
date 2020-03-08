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
      <div class="marvel-device iphone8 silver" style={style}>
        <div class="top-bar"></div>
        <div class="sleep"></div>
        <div class="volume"></div>
        <div class="camera"></div>
        <div class="sensor"></div>
        <div class="speaker"></div>
        <div class="screen">{children}</div>
        <div class="home"></div>
        <div class="bottom-bar"></div>
      </div>
    ) : (
      <div class="marvel-device s5 white" style={style}>
        <div class="top-bar"></div>
        <div class="sleep"></div>
        <div class="camera"></div>
        <div class="sensor"></div>
        <div class="speaker"></div>
        <div class="screen">{children}</div>
        <div class="home"></div>
      </div>
    )}
  </>
)
