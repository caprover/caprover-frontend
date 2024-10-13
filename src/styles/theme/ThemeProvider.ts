import ApiManager from '../../api/ApiManager'
import CapRoverTheme from './CapRoverTheme'

export class ThemeProvider {
    static instance: ThemeProvider
    static getInstance() {
        if (!ThemeProvider.instance) {
            ThemeProvider.instance = new ThemeProvider()
        }
        return ThemeProvider.instance
    }

    private apiManager: ApiManager

    constructor() {
        this.apiManager = new ApiManager()
    }

    getSavedTheme() {
        const self = this
        return Promise.resolve() //
            .then(() => {
                return self.apiManager.getCurrentTheme()
            })
    }

    saveCurrentTheme(themeName: string) {
        const self = this
        return Promise.resolve() //
            .then(() => {
                return self.apiManager.setCurrentTheme(themeName)
            })
    }

    saveCustomTheme(oldName: string, editModalTheme: CapRoverTheme) {
        const self = this
        return Promise.resolve().then(() => {
            return self.apiManager.saveTheme(oldName, editModalTheme)
        })
    }

    getAllThemes() {
        const self = this
        return Promise.resolve()
            .then(() => {
                return self.apiManager.getAllThemes()
            })
            .then((data) => {
                const fetchedThemes = data.themes || ([] as CapRoverTheme[])
                fetchedThemes.forEach((it) => (it.customized = true))

                const builtInThemes = [] as CapRoverTheme[]

                builtInThemes.push({
                    name: 'legacy',
                    content: `{
                algorithm: isDarkMode ? darkAlgorithm : defaultAlgorithm,
                components: {
                    Layout: {
                        lightSiderBg: '#ff0000',
                        siderBg: '#ff0000',
                        headerBg: '#fafafa',
                    },
                },
                token: {
                    colorPrimary: isDarkMode ? '#5233ff' : '#5539f5',
                    colorLink: isDarkMode ? '#5539f5' : '#5539f5',
                    fontFamily: \`QuickSand, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
                                'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji',
                                'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'\`,
                },
            }`,
                })

                builtInThemes.push({
                    name: 'red',
                    content: `{
                algorithm: isDarkMode ? darkAlgorithm : defaultAlgorithm,
                components: {
                    Layout: {
                        lightSiderBg: '#ff0000',
                        siderBg: '#ff0000',
                        headerBg: '#ff0000',
                    },
                },
                token: {
                    colorPrimary: isDarkMode ? '#5233ff' : '#5539f5',
                    colorLink: isDarkMode ? '#5539f5' : '#5539f5',
                    fontFamily: \`QuickSand, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
                                'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji',
                                'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'\`,
                },
            }`,
                })

                builtInThemes.push({
                    name: 'green',
                    content: `{
                algorithm: isDarkMode ? darkAlgorithm : defaultAlgorithm,
                components: {
                    Layout: {
                        lightSiderBg: '#ff00ff',
                        siderBg: '#ff0000',
                        headerBg: '#00ff00',
                    },
                },
                token: {
                    colorPrimary: isDarkMode ? '#5233ff' : '#5539f5',
                    colorLink: isDarkMode ? '#5539f5' : '#5539f5',
                    fontFamily: \`QuickSand, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
                                'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji',
                                'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'\`,
                },
            }`,
                })

                return [...builtInThemes, ...fetchedThemes]
            })
    }
}
