import 'react-toastify/dist/ReactToastify.min.css'

import { ToastContainer } from 'react-toastify'

const App = ({ Component, pageProps }) => {
  return (
    <>
      <Component {...pageProps} />
      <ToastContainer position={'bottom-center'} />
    </>
  )
}

export default App
