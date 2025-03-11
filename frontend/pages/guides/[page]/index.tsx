import cheerio from 'cheerio'
import { Contact, Container, Metadata } from 'components/common'
import { NextPageContext } from 'next'
import { ReactElement } from 'react'
import renderPage from 'renderPage'
import styled from 'styled-components'
import { SITE_NAME } from 'utils/branding'
import { fetchMarkdown } from 'utils/server'

import {
  BACKGROUND_GRAY,
  LIGHT_GRAY,
  MEDIUM_GRAY,
  SNOW,
} from '~/constants/colors'

const MarkdownContent = styled.div.attrs({ className: 'content' })`
  & h1 {
    margin-top: 2.5vw;
    margin-bottom: 2rem;
    font-size: 2rem;
    font-weight: bold;
  }

  & h2 {
    font-size: 1.5rem;
  }

  & h2:not(:first-child) {
    margin-top: 2em;
  }

  & img {
    display: block;
    max-height: 400px;
    margin: 25px auto;
    box-shadow 2px 2px 10px ${MEDIUM_GRAY};
  }

  & div.toc {
    border-left: 5px solid ${LIGHT_GRAY};
    padding: 15px;
    margin-bottom: 25px;
    background-color: ${BACKGROUND_GRAY};
  }
`

const GuidePage = ({ title, contents, toc }): ReactElement<any> => {
  return (
    <Container background={SNOW}>
      <Metadata title={title} />
      <MarkdownContent>
        <h1>{title}</h1>
        {contents !== null ? (
          <>
            <div className="toc">
              <b>Table of Contents</b>
              <ul className="mt-0">
                {toc.map(({ title, id }) => (
                  <li key={id}>
                    <a href={`#${id}`}>{title}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div dangerouslySetInnerHTML={{ __html: contents }} />
          </>
        ) : (
          <>
            <p>
              The guide you are looking for does not exist. Perhaps it was moved
              or deleted?
            </p>
            <p>
              If you believe that this guide should exist, please contact{' '}
              <Contact />.
            </p>
          </>
        )}
      </MarkdownContent>
    </Container>
  )
}

const completePage = renderPage(GuidePage)
const initialProps = completePage.getInitialProps
completePage.getInitialProps = undefined

export const getServerSideProps = async (
  ctx: NextPageContext,
): Promise<{
  props: {
    title: string
    contents: string | null
    toc: { title: string; id: string | undefined }[]
  }
}> => {
  const fetchProps = async () => {
    return await (initialProps ?? (() => undefined))(ctx)
  }

  const [props, contents] = await Promise.all([
    fetchProps(),
    fetchMarkdown(ctx.query.page as string),
  ])

  if (contents !== null) {
    const dom = cheerio.load(contents)
    const title = dom('h1').eq(0).text() ?? `${SITE_NAME} Guide`
    dom('h1').eq(0).remove()
    const toc = dom('h2')
      .map((i, el) => {
        return {
          title: dom(el).text(),
          id: dom(el).attr('id'),
        }
      })
      .get()

    return { props: { ...props, title, contents: dom.html(), toc } }
  } else {
    return {
      props: {
        ...props,
        title: '404 Not Found',
        contents: null,
        toc: [],
      },
    }
  }
}

export default completePage
