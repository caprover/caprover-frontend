import { SunFilled, SunOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { useContext } from 'react'
import DarkModeContext from '../../contexts/DarkModeContext'

const DarkModeSwitch = () => {
    const { isDarkMode, setIsDarkMode } = useContext(DarkModeContext)

    return (
        <Button
            onClick={() => {
                setIsDarkMode(!isDarkMode)
            }}
            shape="circle"
            icon={isDarkMode ? <SunOutlined /> : <SunFilled />}
        />
    )
}

export default DarkModeSwitch
