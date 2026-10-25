import { Moon, Sun } from 'lucide-react'
import { Button } from 'antd'
import { useContext } from 'react'
import DarkModeContext from '../../contexts/DarkModeContext'
import { localize } from '../../utils/Language'

const DarkModeSwitch = () => {
    const { isDarkMode, setIsDarkMode } = useContext(DarkModeContext)

    return (
        <Button
            onClick={() => {
                setIsDarkMode(!isDarkMode)
            }}
            type="text"
            aria-label={localize(
                'appearance.toggle_color_mode',
                'Toggle color mode'
            )}
            icon={isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
        />
    )
}

export default DarkModeSwitch
