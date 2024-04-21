import { BulbFilled, BulbOutlined } from '@ant-design/icons'
import { Switch } from 'antd'
import { useContext } from 'react'
import DarkModeContext from '../../contexts/DarkModeContext'

const DarkModeSwitch = () => {
    const { isDarkMode, setIsDarkMode } = useContext(DarkModeContext)

    return (
        <Switch
            checkedChildren={<BulbOutlined />}
            unCheckedChildren={<BulbFilled />}
            checked={isDarkMode}
            onChange={(checked) => {
                setIsDarkMode(checked)
            }}
        />
    )
}

export default DarkModeSwitch
