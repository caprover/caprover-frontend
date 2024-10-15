import { createContext } from 'react'
import CapRoverTheme from '../styles/theme/CapRoverTheme'

const CapRoverThemeContext = createContext({
    currentTheme: undefined as undefined | CapRoverTheme,
    setCapRoverThemeContext: (value: CapRoverTheme | undefined) => {},
})

export default CapRoverThemeContext
