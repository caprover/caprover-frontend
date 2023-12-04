import { createContext } from 'react'

const DarkModeContext = createContext({
    isDarkMode: false,
    setIsDarkMode: (value: boolean) => {},
})

export default DarkModeContext
