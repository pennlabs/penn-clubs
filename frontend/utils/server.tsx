import fs from 'fs'
import path from 'path'
import showdown from 'showdown'
import util from 'util'

const readFilePromise = util.promisify(fs.readFile)

const relativeLinks = () => {
  return [
    {
      type: 'lang',
      regex: /!\[(.*?)\]\((.*?)\)/g,
      replace: (content, desc, url) => {
        if (/^https?:/.test(url)) {
          return content
        }
        return `![${desc}](/static/img/markdown/sacfairguide/${url})`
      },
    },
    {
      type: 'lang',
      regex: /(\w+)@pennclubs\.com/g,
      replace: '[$1@pennclubs.com](mailto:$1@pennclubs.com)',
    },
  ]
}

export async function fetchMarkdown(file: string): Promise<string> {
  const contents = await readFilePromise(
    path.join(process.cwd(), `markdown/${file}.md`),
  )
  const converter = new showdown.Converter({
    parseImgDimensions: true,
    strikethrough: true,
    tables: true,
    extensions: [relativeLinks],
  })
  return converter.makeHtml(contents.toString())
}
