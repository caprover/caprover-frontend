import { Select } from 'antd'
import { useContext } from 'react'
import { useDispatch } from 'react-redux'
import LanguageContext from '../../contexts/LanguageContext'
import { emitRootKeyChanged } from '../../redux/actions/GlobalActions'
import {
    languagesOptions,
    setCurrentLanguageOption,
} from '../../utils/Language'

interface LanguageSelectorProps {
    forceReload?: boolean
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ forceReload }) => {
    const { currentLanguage, setCurrentLanguageOptionContext } =
        useContext(LanguageContext)

    const dispatch = useDispatch()

    const handleChange = (value: string) => {
        const langOption = setCurrentLanguageOption(value)
        setCurrentLanguageOptionContext(langOption)
        dispatch(emitRootKeyChanged())
        if (forceReload) {
            window.location.reload()
        }
    }

    return (
        <Select
            style={{ width: 150 }}
            options={languagesOptions}
            value={currentLanguage.value}
            onChange={handleChange}
        />
    )
}

export default LanguageSelector
