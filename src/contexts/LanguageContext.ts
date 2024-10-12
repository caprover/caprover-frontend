import { createContext } from 'react'
import { LanguageOption } from '../utils/Language'

const LanguageContext = createContext({
    setCurrentLanguageOptionContext: (value: LanguageOption) => {},
})

export default LanguageContext
