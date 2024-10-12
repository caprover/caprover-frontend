import { Select } from 'antd'
import { useContext, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import LanguageContext from '../../contexts/LanguageContext'
import { emitRootKeyChanged } from '../../redux/actions/GlobalActions'
import {
    getCurrentLanguageOption,
    languagesOptions,
    setCurrentLanguageOption,
} from '../../utils/Language'

interface LanguageSelectorProps {
    forceReload?: boolean
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ forceReload }) => {
    const [currentLanguage, setCurrentLanguage] = useState(
        getCurrentLanguageOption().value
    )

    const { setCurrentLanguageOptionContext } = useContext(LanguageContext)

    const dispatch = useDispatch()

    const handleChange = (value: string) => {
        const langOption = setCurrentLanguageOption(value)
        setCurrentLanguageOptionContext(langOption)
        setCurrentLanguage(value)
        dispatch(emitRootKeyChanged())
        if (forceReload) {
            window.location.reload()
        }
    }

    useEffect(() => {
        setCurrentLanguage(getCurrentLanguageOption().value)
    }, [])

    return (
        <Select
            style={{ width: 150 }}
            options={languagesOptions}
            value={currentLanguage}
            onChange={handleChange}
        />
    )
}

export default LanguageSelector
