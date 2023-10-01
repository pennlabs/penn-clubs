import fs from 'fs'
import path from 'path'
import showdown from 'showdown'
import util from 'util'

const readFilePromise = util.promisify(fs.readFile)

const relativeLinks = (guidePath: string) => {
  return () => [
    {
      type: 'lang',
      regex: /!\[(.*?)\]\((.*?)\)/g,
      replace: (content, desc, url) => {
        if (/^https?:/.test(url)) {
          return content
        }
        return `![${desc}](/static/img/markdown/${guidePath}/${url})`
      },
    },
    {
      type: 'lang',
      regex: /(\w+)@(pennclubs\.com|sacfunded\.net)/g,
      replace: '[$1@$2](mailto:$1@$2)',
    },
    {
      type: 'lang',
      regex: /<important>(.*?)<\/important>/g,
      replace: '<div class="has-text-danger has-text-weight-bold">$1</div>',
    },
  ];
}

export async function fetchMarkdown(file: string): Promise<string | null> {
  try {
    const contents = await readFilePromise(
      path.join(process.cwd(), 'markdown', path.basename(`${file}.md`)),
    )
    const converter = new showdown.Converter({
      parseImgDimensions: true,
      strikethrough: true,
      tables: true,
      extensions: [relativeLinks(file)],
    })
    return converter.makeHtml(contents.toString())
  } catch (e) {
    if (e.code === 'ENOENT') {
      return null
    }
    throw e
  }
}
