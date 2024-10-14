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
                return data.themes || ([] as CapRoverTheme[])
            })
    }
}
