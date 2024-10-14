import { Select } from 'antd'
import { useContext } from 'react'
import CapRoverThemeContext from '../../contexts/CapRoverThemeContext'
import CapRoverTheme from '../../styles/theme/CapRoverTheme'
import { ThemeProvider } from '../../styles/theme/ThemeProvider'
import Toaster from '../../utils/Toaster'

interface ThemeSelectorProps {
    themes: CapRoverTheme[]
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ themes }) => {
    const { currentTheme, setCapRoverThemeContext } =
        useContext(CapRoverThemeContext)

    // const dispatch = useDispatch()

    const options = themes.map((it) => {
        return { value: it.name, label: it.name }
    })

    options.unshift({ value: 'default', label: 'Default' })

    const handleChange = (value: string) => {
        const t = themes.find((it) => it.name === value)
        setCapRoverThemeContext(t)
        ThemeProvider.getInstance()
            .saveCurrentTheme(t ? t.name : '')
            .catch(Toaster.createCatcher())
        // dispatch(emitRootKeyChanged()) Needed? TODO
    }

    return (
        <Select
            style={{ width: 250 }}
            options={options}
            value={currentTheme?.name || options[0].value}
            onChange={handleChange}
        />
    )
}

export default ThemeSelector
