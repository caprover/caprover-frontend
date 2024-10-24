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

    getCurrentTheme() {
        return Promise.resolve() //
            .then(() => {
                return new ApiManager().getCurrentTheme()
            })
    }

    saveCurrentTheme(themeName: string) {
        return Promise.resolve() //
            .then(() => {
                return new ApiManager().setCurrentTheme(themeName)
            })
    }

    saveCustomTheme(oldName: string, editModalTheme: CapRoverTheme) {
        return Promise.resolve().then(() => {
            return new ApiManager().saveTheme(oldName, editModalTheme)
        })
    }

    getAllThemes() {
        return Promise.resolve()
            .then(() => {
                return new ApiManager().getAllThemes()
            })
            .then((data) => {
                return data.themes || ([] as CapRoverTheme[])
            })
    }

    deleteTheme(themeName: string) {
        return Promise.resolve().then(() => {
            return new ApiManager().deleteTheme(themeName)
        })
    }
}
