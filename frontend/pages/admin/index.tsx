import { NextPageContext } from 'next'
import { useRouter } from 'next/router'

const REDIRECTION_TO = '/admin/bulk'

const RedirectPage = () => {
  const router = useRouter()
  if (typeof window !== 'undefined') {
    router.push(REDIRECTION_TO)
  }
}

RedirectPage.getInitialProps = (ctx: NextPageContext) => {
  const { res } = ctx
  if (res) {
    res.writeHead(302, { Location: REDIRECTION_TO })
    res.end()
  }
  return {}
}

export default RedirectPage
