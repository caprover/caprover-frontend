const prettier = require('prettier')
const fs = require('fs-extra')
const path = require('path')

const ProjectSourceRoot = path.resolve(__dirname, '..')

const sourceDirectoryPath = path.join(ProjectSourceRoot, './src/locales')
const translationsFilePath = path.join(ProjectSourceRoot, './translations.json')

function formatJSON(jsonContent) {
    const prettierConfig = fs.readJSONSync(
        path.resolve(ProjectSourceRoot, '.prettierrc.json')
    )

    return prettier.format(JSON.stringify(jsonContent), {
        ...prettierConfig,
        parser: 'json',
    })
}

// Function to update source JSON files with new translations
function updateTranslations(translationsFile, sourceDir) {
    const newTranslations = fs.readJsonSync(translationsFile)

    // Iterate over each key in the new translations
    Object.entries(newTranslations).forEach(([key, translations]) => {
        // Process each language and value
        translations.forEach(({ lang, value }) => {
            const langFile = path.join(sourceDir, `${lang}.json`)
            if (fs.existsSync(langFile)) {
                const data = fs.readJsonSync(langFile)

                // Update the translation in the source file
                data[key] = value

                const sortedData = {}
                const sortedKeys = Object.keys(data).sort((a, b) =>
                    a.localeCompare(b)
                )
                sortedKeys.forEach((key) => {
                    sortedData[key] = data[key]
                })

                fs.writeFileSync(langFile, formatJSON(sortedData))

                // fs.writeJsonSync(langFile, data, { spaces: 2 })
            } else {
                // If the language file does not exist, create it
                throw new Error('language does not exist ' + langFile)
            }
        })
    })
}

// Execute the function to update translations
updateTranslations(translationsFilePath, sourceDirectoryPath)
