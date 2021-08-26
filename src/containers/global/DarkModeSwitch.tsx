import { BulbFilled, BulbOutlined } from '@ant-design/icons'
import { Switch } from 'antd'
import React, { useEffect, useState } from 'react'
import { useThemeSwitcher } from 'react-css-theme-switcher'
import StorageHelper from '../../utils/StorageHelper'

const DarkModeSwitch = () => {
    const { switcher, themes } = useThemeSwitcher()
    const [checked, setChecked] = useState(false)

    useEffect(() => {
        const storedCheckedState = StorageHelper.getDarkModeFromLocalStorage()
        setChecked(storedCheckedState)
    }, [])

    return (
        <Switch
            checkedChildren={<BulbOutlined />}
            unCheckedChildren={<BulbFilled />}
            checked={checked}
            onChange={(checked) => {
                StorageHelper.setDarkModeInLocalStorage(checked)
                switcher({ theme: checked ? themes.dark : themes.light })
                setChecked(checked)
            }}
        />
    )
}

export default DarkModeSwitch
