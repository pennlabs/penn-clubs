import cheerio from 'cheerio'
import { NextPageContext } from 'next'
import { ReactElement } from 'react'
import s from 'styled-components'

import { Container, Metadata } from '../../../components/common'
import {
  BACKGROUND_GRAY,
  LIGHT_GRAY,
  MEDIUM_GRAY,
  SNOW,
} from '../../../constants/colors'
import renderPage from '../../../renderPage'
import { fetchMarkdown } from '../../../utils/server'

const MarkdownContent = s.div`
  & h1 {
    margin-top: 2.5vw;
    margin-bottom: 2rem;
    font-size: 2rem;
    font-weight: bold;
  }

  & img {
    display: block;
    max-height: 400px;
    margin: 15px auto;
    box-shadow 2px 2px 10px ${MEDIUM_GRAY};
  }

  & div.toc {
    border-left: 5px solid ${LIGHT_GRAY};
    padding: 15px;
    margin-bottom: 15px;
    background-color: ${BACKGROUND_GRAY};
  }
`

const GuidePage = ({ title, contents, toc }): ReactElement => {
  return (
    <Container background={SNOW}>
      <Metadata title={title} />
      <MarkdownContent className="content">
        <h1>{title}</h1>
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
      </MarkdownContent>
    </Container>
  )
}

const completePage = renderPage(GuidePage)
const initialProps = completePage.getInitialProps
completePage.getInitialProps = undefined

export const getServerSideProps = async (ctx: NextPageContext) => {
  const fetchProps = async () => {
    return await (initialProps ?? (() => undefined))(ctx)
  }

  const [props, contents] = await Promise.all([
    fetchProps(),
    fetchMarkdown('sacfairguide'),
  ])

  const dom = cheerio.load(contents)
  const title = dom('h1').eq(0).text() ?? 'Penn Clubs Guide'
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
}

export default completePage
