import { Container, InfoPageTitle, Metadata, Text } from 'components/common'
import fs from 'fs'
import { NextPageContext } from 'next'
import Link from 'next/link'
import path from 'path'
import { ReactElement } from 'react'
import renderPage from 'renderPage'
import util from 'util'
import { SITE_NAME } from 'utils/branding'

import { GUIDE_ROUTE, SNOW } from '~/constants'

const readDirPromise = util.promisify(fs.readdir)

type GuideListPageProps = {
  guides: string[]
}

const GuideListPage = ({ guides }: GuideListPageProps): ReactElement => {
  return (
    <Container fullHeight background={SNOW}>
      <Metadata title="Guide List" />
      <InfoPageTitle>Guide List</InfoPageTitle>
      <Text>You can find a list of guides for {SITE_NAME} on this page.</Text>
      <div className="content">
        <ul>
          {guides.map((item) => (
            <li>
              <Link href={GUIDE_ROUTE()} as={GUIDE_ROUTE(item)}>
                {item}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Container>
  )
}

const completePage = renderPage(GuideListPage)
const initialProps = completePage.getInitialProps
completePage.getInitialProps = undefined

export const getServerSideProps = async (
  ctx: NextPageContext,
): Promise<{ props: { guides: string[] } }> => {
  const guidesDir = await readDirPromise(path.join(process.cwd(), 'markdown'))
  const props = await (initialProps ?? (async () => ({})))(ctx)

  return {
    props: { ...props, guides: guidesDir.map((file) => file.split('.')[0]) },
  }
}

export default completePage
