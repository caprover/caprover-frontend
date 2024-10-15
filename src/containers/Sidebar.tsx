import {
    ClusterOutlined,
    CodeOutlined,
    DashboardOutlined,
    LaptopOutlined,
    LogoutOutlined,
    SettingOutlined,
} from '@ant-design/icons'
import { Layout, Menu, MenuProps } from 'antd'
import React, { useContext } from 'react'
import CapRoverThemeContext from '../contexts/CapRoverThemeContext'
import ThemeParser from '../styles/theme/ThemeParser'
import { localize } from '../utils/Language'

const { Sider } = Layout

interface SidebarProps {
    isMobile: boolean
    collapsed: boolean
    toggleSider: () => void
    onLogoutClicked: () => void
    location: any
    history: any
}

const Sidebar: React.FC<SidebarProps> = ({
    isMobile,
    collapsed,
    toggleSider,
    onLogoutClicked,
    location,
    history,
}) => {
    const { currentTheme } = useContext(CapRoverThemeContext)

    let siderTheme = (ThemeParser.parseExtra(currentTheme)?.siderTheme ||
        'light') as 'light' | 'dark'

    const MENU_ITEMS: MenuProps['items'] = [
        {
            key: 'dashboard',
            label: localize('menu_item.dashboard', 'Dashboard'),
            icon: <LaptopOutlined />,
        },
        {
            key: 'apps',
            label: localize('menu_item.app', 'Apps'),
            icon: <CodeOutlined />,
        },
        {
            key: 'monitoring',
            label: localize('menu_item.monitoring', 'Monitoring'),
            icon: <DashboardOutlined />,
        },
        {
            key: 'cluster',
            label: localize('menu_item.cluster', 'Cluster'),
            icon: <ClusterOutlined />,
        },
        {
            key: 'settings',
            label: localize('menu_item.settings', 'Settings'),
            icon: <SettingOutlined />,
        },
    ]

    const LOGOUT = 'logout'

    if (isMobile) {
        MENU_ITEMS.push({
            key: LOGOUT,
            label: localize('page_root.logout', 'Logout'),
            icon: <LogoutOutlined />,
        })
    }

    return (
        <Sider
            breakpoint="lg"
            theme={siderTheme}
            trigger={isMobile && undefined}
            collapsible
            collapsed={collapsed}
            width={200}
            collapsedWidth={isMobile ? 0 : 80}
            style={{ zIndex: 2 }}
            onCollapse={toggleSider}
        >
            <Menu
                selectedKeys={[location.pathname.substring(1)]}
                theme={siderTheme}
                mode="inline"
                defaultSelectedKeys={['dashboard']}
                style={{ height: '100%', borderRight: 0 }}
                items={MENU_ITEMS}
                onClick={(e) => {
                    if (e.key === LOGOUT) {
                        onLogoutClicked()
                    } else {
                        history.push(`/${e.key}`)
                    }
                }}
            ></Menu>
        </Sider>
    )
}

export default Sidebar
