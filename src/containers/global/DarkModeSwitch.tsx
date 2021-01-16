import { BulbFilled, BulbOutlined } from '@ant-design/icons'
import { Switch } from 'antd'
import React, { Component } from 'react'
import StorageHelper from '../../utils/StorageHelper'
import ThemeModeHelper from './../../utils/ThemeModeHelper'
export default class DarkModeSwitch extends Component<{}, any> {
    constructor(props: any) {
        super(props)
        this.state = { isChecked: StorageHelper.getDarkModeFromLocalStorage() }
    }
    render() {
        return (
            <Switch
                checkedChildren={<BulbOutlined />}
                unCheckedChildren={<BulbFilled />}
                checked={this.state.isChecked}
                onChange={(checked) => {
                    StorageHelper.setDarkModeInLocalStorage(checked)
                    ThemeModeHelper.loadTheme(checked)
                    this.setState({ isChecked: checked })
                }}
            />
        )
    }
}
