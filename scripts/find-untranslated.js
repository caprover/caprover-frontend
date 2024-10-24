const fs = require('fs-extra')
const path = require('path')

// const __dirname = path.dirname(new URL(import.meta.url).pathname)
const ProjectSourceRoot = path.resolve(__dirname, '..')

const directoryPath = path.join(ProjectSourceRoot, './src/locales')
const englishJsonFilename = 'en-US.json' // Set the English JSON filename

// Function to load JSON files and check for untranslated strings
function findUntranslatedStrings(dirPath) {
    const files = fs.readdirSync(dirPath)
    const englishFilePath = path.join(dirPath, englishJsonFilename)
    const englishData = fs.readJsonSync(englishFilePath)
    const untranslated = {}

    files.forEach((file) => {
        if (path.extname(file) === '.json' && file !== englishJsonFilename) {
            const filePath = path.join(dirPath, file)
            const data = fs.readJsonSync(filePath)
            const languageCode = path.basename(file, '.json')

            // Check each key in the JSON file
            Object.entries(data).forEach(([key, value]) => {
                if (value === '') {
                    if (!untranslated[key]) {
                        untranslated[key] = {
                            untranslated: [],
                            englishSource:
                                englishData[key] ||
                                'No English source available',
                        }
                    }
                    untranslated[key].untranslated.push(languageCode)
                }
            })
        }
    })

    return untranslated
}

// Execute the function and log the results
const untranslated = findUntranslatedStrings(directoryPath)
console.log(JSON.stringify(untranslated, null, 2))
