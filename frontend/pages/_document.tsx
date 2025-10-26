import { cache } from '@emotion/css'
import createEmotionServer from '@emotion/server/create-instance'
import Document, {
  DocumentContext,
  DocumentInitialProps,
  Head,
  Html,
  Main,
  NextScript,
} from 'next/document'
import { ReactElement } from 'react'
import styled from 'styled-components'

import { BULMA_A, BULMA_GREY } from '../constants/colors'

export const renderStatic = async (html) => {
  if (html === undefined) {
    throw new Error('did you forget to return html from renderToString?')
  }
  const { extractCritical } = createEmotionServer(cache)
  const { ids, css } = extractCritical(html)

  return { html, ids, css }
}

const StyledHtml = styled.html`
  a {
    color: ${BULMA_A};
  }

  .has-text-grey {
    color: ${BULMA_GREY} !important;
  }
`

class BaseDocument extends Document {
  static async getInitialProps(
    ctx: DocumentContext,
  ): Promise<DocumentInitialProps> {
    const initialProps = await Document.getInitialProps(ctx)
    const page = await ctx.renderPage()
    const { css, ids } = await renderStatic(page.html)

    return {
      ...initialProps,
      styles: (
        <>
          {initialProps.styles}
          <style
            data-emotion={`css ${ids.join(' ')}`}
            dangerouslySetInnerHTML={{ __html: css }}
          />
        </>
      ),
    }
  }

  render(): ReactElement<any> {
    return (
      <StyledHtml as={Html} lang="en">
        <Head>
          <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/bulma/0.9.0/css/bulma.min.css"
            integrity="sha256-aPeK/N8IHpHsvPBCf49iVKMdusfobKo2oxF8lRruWJg="
            crossOrigin="anonymous"
          />
          <link
            href="https://fonts.googleapis.com/css?family=Roboto&display=swap"
            rel="stylesheet"
          />

          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap"
            rel="stylesheet"
          />

          <link
            href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300;0,400;0,600;0,700;0,800;1,300;1,400;1,600;1,700;1,800&display=swap"
            rel="stylesheet"
          />
          <link
            href="/static/css/react-draft-wysiwyg.css"
            rel="stylesheet"
            key="editor-css"
          />
          <link
            href="/static/css/react-datepicker.css"
            rel="stylesheet"
            key="datepicker-css"
          />
          <link
            href="/static/css/style-react-vis.css"
            rel="stylesheet"
            key="editor-css"
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </StyledHtml>
    )
  }
}

export default BaseDocument
