import darkVars from '../styles/dark.json'
import lightVars from '../styles/light.json'

export class ThemeModeHelper {
    loadTheme(isDarkMode: boolean): Promise<void> {
        const vars = isDarkMode ? darkVars : lightVars
        return (window as any).less.modifyVars(vars)
    }
}

const instance = new ThemeModeHelper()
export default instance
