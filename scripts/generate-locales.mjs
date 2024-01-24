import parser from '@babel/parser'
import traverse from '@babel/traverse'
import * as types from '@babel/types'
import fs from 'fs/promises'
import globby from 'globby'
import path, { resolve } from 'path'
import prettier from 'prettier'

const __dirname = path.dirname(new URL(import.meta.url).pathname)
const ProjectSourceRoot = path.resolve(__dirname, '..')

async function formatJSON(jsonContent) {
    const prettierConfig = JSON.parse(
        await fs.readFile(path.resolve(ProjectSourceRoot, '.prettierrc.json'))
    )
    return prettier.format(JSON.stringify(jsonContent), {
        ...prettierConfig,
        parser: 'json',
    })
}

async function getMessages(filePath) {
    const content = await fs.readFile(filePath, 'utf8')
    const plugins = ['typescript', 'decorators-legacy']
    if (filePath.endsWith('tsx')) {
        plugins.push('jsx')
    }
    const result = []

    try {
        const ast = parser.parse(content, {
            plugins: plugins,
            sourceType: 'unambiguous',
        })
        traverse.default(ast, {
            enter(path) {
                const node = path.node
                if (types.isCallExpression(node)) {
                    const callee = node.callee
                    if (
                        types.isIdentifier(callee) &&
                        callee.name === 'localize'
                    ) {
                        const args = node.arguments.map((o) => {
                            if (types.isStringLiteral(o)) {
                                return o.value
                            }
                        })
                        const [key, message] = args
                        result.push([key, message])
                    }
                }
            },
        })
    } catch (error) {
        console.log(filePath)
    }

    return result
}

async function generate() {
    const sourceCode = await globby(['**/**.ts', '**/**.tsx'], {
        absolute: true,
        cwd: resolve(ProjectSourceRoot, 'src'),
    })
    const localsPath = resolve(ProjectSourceRoot, 'src/locales')
    const files = (await fs.readdir(localsPath)).filter((p) =>
        p.endsWith('.json')
    )
    const enUSMessages = {}
    for (const iterator of sourceCode) {
        const messages = await getMessages(iterator)
        messages.forEach(([key, message]) => {
            if (enUSMessages[key]) {
                if (enUSMessages[key] !== message) {
                    throw new Error(key)
                }
            } else {
                enUSMessages[key] = message
            }
        })
    }

    const sortedKeys = Object.keys(enUSMessages).sort((a, b) =>
        a.localeCompare(b)
    )

    files
        .filter((file) => path.extname(file) === '.json')
        .filter((file) => file !== 'en-US.json')
        .map((file) => path.resolve(localsPath, file))
        .forEach(async (file) => {
            const messages = JSON.parse(await fs.readFile(file, 'utf-8'))
            const result = {}
            sortedKeys.forEach((key) => {
                result[key] = messages[key] || ''
            })
            await fs.writeFile(file, await formatJSON(result))
        })

    const sortedData = {}
    sortedKeys.forEach((key) => {
        sortedData[key] = enUSMessages[key]
    })

    await fs.writeFile(
        path.resolve(localsPath, 'en-US.json'),
        await formatJSON(sortedData)
    )
}

generate()
