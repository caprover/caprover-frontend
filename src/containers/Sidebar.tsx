import {
    Button,
    Drawer,
    Dropdown,
    Layout,
    Menu,
    MenuProps,
    Modal,
    Tooltip,
} from 'antd'
import {
    Activity,
    BookOpen,
    Boxes,
    ExternalLink,
    Github,
    Globe,
    HelpCircle,
    LayoutDashboard,
    LogOut,
    Server,
    Settings,
    Wrench,
} from 'lucide-react'
import React, { useContext, useState } from 'react'
import CapRoverThemeContext from '../contexts/CapRoverThemeContext'
import LanguageContext from '../contexts/LanguageContext'
import ThemeParser from '../styles/theme/ThemeParser'
import { localize } from '../utils/Language'
import DarkModeSwitch from './global/DarkModeSwitch'
import LanguageSelector from './global/LanguageSelector'

interface SidebarProps {
    isMobile: boolean
    collapsed: boolean
    toggleSider: () => void
    onLogoutClicked: () => void
    location: { pathname: string }
    history: { push: (path: string) => void }
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
    const { currentLanguage } = useContext(LanguageContext)
    const [showLanguageSelector, setShowLanguageSelector] = useState(false)
    const siderTheme =
        ThemeParser.parseExtra(currentTheme)?.siderTheme === 'dark'
            ? 'dark'
            : 'light'
    const compact = collapsed && !isMobile
    const items: MenuProps['items'] = [
        {
            key: 'dashboard',
            label: localize('menu_item.dashboard', 'Dashboard'),
            icon: <LayoutDashboard size={16} />,
        },
        {
            key: 'apps',
            label: localize('menu_item.app', 'Apps'),
            icon: <Boxes size={16} />,
        },
        {
            key: 'monitoring',
            label: localize('menu_item.monitoring', 'Monitoring'),
            icon: <Activity size={16} />,
        },
        {
            type: 'group',
            label: compact
                ? ''
                : localize('navigation.administration', 'Administration'),
            children: [
                {
                    key: 'cluster',
                    label: localize(
                        'menu_item.infrastructure',
                        'Infrastructure'
                    ),
                    icon: <Server size={16} />,
                },
                {
                    key: 'maintenance',
                    label: localize('menu_item.maintenance', 'Maintenance'),
                    icon: <Wrench size={16} />,
                },
                {
                    key: 'settings',
                    label: localize('menu_item.settings', 'Settings'),
                    icon: <Settings size={16} />,
                },
            ],
        },
    ]
    const navigation = (
        <div className="sidebar-content">
            <a
                className="sidebar-brand"
                href="#/dashboard/"
                aria-label="CapRover"
            >
                <img src="/icon-512x512.png" alt="" />
                {!compact && <span>CapRover</span>}
            </a>
            {!compact && (
                <div className="sidebar-section-label">
                    {localize('navigation.platform', 'Platform')}
                </div>
            )}
            <Menu
                selectedKeys={[location.pathname.split('/')[1]]}
                theme={siderTheme}
                mode="inline"
                inlineCollapsed={compact}
                items={items}
                onClick={(e) => history.push('/' + e.key)}
            />
            <div className="sidebar-footer">
                <div className="sidebar-tools">
                    <Tooltip
                        title={localize('navigation.language', 'Language')}
                    >
                        <Button
                            type="text"
                            icon={<Globe size={16} />}
                            aria-label={localize(
                                'navigation.language',
                                'Language'
                            )}
                            onClick={() => setShowLanguageSelector(true)}
                        />
                    </Tooltip>
                    <DarkModeSwitch />
                    <Dropdown
                        trigger={['click']}
                        menu={{
                            items: [
                                {
                                    key: 'docs',
                                    icon: <BookOpen size={14} />,
                                    label: (
                                        <a
                                            href="https://caprover.com"
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            {localize(
                                                'page_root.docs_link',
                                                'Docs'
                                            )}{' '}
                                            <ExternalLink size={12} />
                                        </a>
                                    ),
                                },
                                {
                                    key: 'github',
                                    icon: <Github size={14} />,
                                    label: (
                                        <a
                                            href="https://github.com/caprover/caprover"
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            GitHub <ExternalLink size={12} />
                                        </a>
                                    ),
                                },
                            ],
                        }}
                    >
                        <Button
                            type="text"
                            icon={<HelpCircle size={16} />}
                            aria-label={localize('navigation.help', 'Help')}
                        />
                    </Dropdown>
                </div>
                <Tooltip title={localize('page_root.logout', 'Logout')}>
                    <Button
                        className="sidebar-logout"
                        type="text"
                        icon={<LogOut size={16} />}
                        aria-label={localize('page_root.logout', 'Logout')}
                        onClick={onLogoutClicked}
                    >
                        {!compact && localize('page_root.logout', 'Logout')}
                    </Button>
                </Tooltip>
            </div>
        </div>
    )
    return (
        <>
            {isMobile ? (
                <Drawer
                    className="navigation-drawer"
                    placement={currentLanguage.rtl ? 'right' : 'left'}
                    width={248}
                    open={!collapsed}
                    onClose={toggleSider}
                    title={localize('navigation.title', 'Navigation')}
                >
                    {navigation}
                </Drawer>
            ) : (
                <Layout.Sider
                    className="app-sidebar"
                    theme={siderTheme}
                    width={248}
                    collapsedWidth={64}
                    collapsed={collapsed}
                >
                    {navigation}
                </Layout.Sider>
            )}
            <Modal
                title={localize('navigation.language', 'Language')}
                open={showLanguageSelector}
                onCancel={() => setShowLanguageSelector(false)}
                footer={<div />}
                width={320}
            >
                <LanguageSelector />
            </Modal>
        </>
    )
}

export default Sidebar
