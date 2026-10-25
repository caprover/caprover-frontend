import { ThemeConfig } from 'antd'

export default function createModernTheme(isDarkMode: boolean): ThemeConfig {
    return {
        cssVar: { key: 'caprover' },
        token: {
            fontFamily:
                "'Inter Variable', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            colorPrimary: isDarkMode ? '#785de0' : '#6952d9',
            colorLink: isDarkMode ? '#b4a5ff' : '#6952d9',
            colorBgLayout: isDarkMode ? '#101012' : '#fafafa',
            colorBgContainer: isDarkMode ? '#171719' : '#ffffff',
            colorBgElevated: isDarkMode ? '#202023' : '#ffffff',
            colorText: isDarkMode ? '#fafafa' : '#18181b',
            colorTextSecondary: isDarkMode ? '#a1a1aa' : '#63636c',
            colorBorder: isDarkMode ? '#3f3f46' : '#d4d4d8',
            colorBorderSecondary: isDarkMode ? '#303034' : '#e4e4e7',
            borderRadius: 6,
            borderRadiusLG: 10,
            controlHeight: 36,
            fontSize: 14,
            fontWeightStrong: 600,
            boxShadowTertiary: 'none',
        },
        components: {
            Layout: {
                headerBg: isDarkMode ? '#171719' : '#ffffff',
                siderBg: isDarkMode ? '#101012' : '#fafafa',
                lightSiderBg: isDarkMode ? '#101012' : '#fafafa',
                triggerBg: isDarkMode ? '#101012' : '#fafafa',
            },
            Menu: {
                itemBg: 'transparent',
                itemSelectedBg: isDarkMode ? '#272430' : '#edeaf8',
                itemSelectedColor: isDarkMode ? '#c4b8ff' : '#5e45c1',
                itemColor: isDarkMode ? '#a1a1aa' : '#3f3f46',
                itemHeight: 36,
                itemMarginInline: 8,
                itemMarginBlock: 2,
                itemBorderRadius: 6,
            },
            Button: {
                fontWeight: 500,
                primaryShadow: 'none',
                defaultShadow: 'none',
                dangerShadow: 'none',
                paddingInline: 12,
            },
            Badge: { statusSize: 7 },
            Card: { headerHeight: 48, bodyPadding: 24, headerFontSize: 15 },
            Table: {
                headerBg: isDarkMode ? '#202023' : '#fafafa',
                headerColor: isDarkMode ? '#a1a1aa' : '#63636c',
                headerSplitColor: 'transparent',
                bodySortBg: 'transparent',
                headerSortActiveBg: isDarkMode ? '#202023' : '#fafafa',
                cellPaddingBlockMD: 14,
                cellPaddingInlineMD: 16,
            },
            Tag: {
                defaultBg: isDarkMode ? '#232326' : '#fafafa',
                defaultColor: isDarkMode ? '#d4d4d8' : '#63636c',
            },
            Tabs: { titleFontSize: 13, horizontalItemGutter: 24 },
            Form: { itemMarginBottom: 20 },
            Input: { activeShadow: '0 0 0 3px rgba(105,82,217,0.12)' },
        },
    }
}
