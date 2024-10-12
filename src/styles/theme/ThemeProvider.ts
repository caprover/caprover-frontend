import Toaster from '../../utils/Toaster'
import Utils from '../../utils/Utils'
import CapRoverTheme from './CapRoverTheme'

export class ThemeProvider {
    static instance: ThemeProvider
    static getInstance() {
        if (!ThemeProvider.instance) {
            ThemeProvider.instance = new ThemeProvider()
        }
        return ThemeProvider.instance
    }

    getSavedTheme() {
        return this.getAllThemes().then((themes) => {
            return themes[0]
        })
    }

    saveCurrentTheme(themeName: string) {
        return Promise.resolve()
            .then(() => {
                console.log(themeName)
                // call API TODO
            })
            .catch(Toaster.createCatcher())
    }

    saveCustomTheme(editModalTheme: CapRoverTheme) {
        return Promise.resolve().then(() => {
            return Utils.getDelayedPromise(600)
            // TODO
        })
    }

    getAllThemes() {
        return Promise.resolve()
            .then(() => {
                return Utils.getDelayedPromise(1000)
            })
            .then(() => {
                const themes = [] as CapRoverTheme[]

                themes.push({
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

                themes.push({
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

                themes.push({
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

                return themes
            })
    }
}
