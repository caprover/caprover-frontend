import { createContext } from 'react'
import { getCurrentLanguageOption, LanguageOption } from '../utils/Language'

const LanguageContext = createContext({
    currentLanguage: getCurrentLanguageOption(),
    setCurrentLanguageOptionContext: (value: LanguageOption) => {},
})

export default LanguageContext
