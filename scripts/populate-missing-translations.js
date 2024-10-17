const fs = require('fs-extra')
const path = require('path')

const ProjectSourceRoot = path.resolve(__dirname, '..')

const sourceDirectoryPath = path.join(ProjectSourceRoot, './src/locales')
const translationsFilePath = path.join(ProjectSourceRoot, './translations.json')

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
                fs.writeJsonSync(langFile, data, { spaces: 2 })
            } else {
                // If the language file does not exist, create it
                const newData = {}
                newData[key] = value
                fs.writeJsonSync(langFile, newData, { spaces: 2 })
            }
        })
    })
}

// Execute the function to update translations
updateTranslations(translationsFilePath, sourceDirectoryPath)
