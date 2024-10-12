import { Select } from 'antd'
import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
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
    const dispatch = useDispatch()

    const handleChange = (value: string) => {
        setCurrentLanguageOption(value)
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
