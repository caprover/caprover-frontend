import { ThemeConfig } from 'antd'

export default function createModernTheme(isDarkMode: boolean): ThemeConfig {
    return {
        cssVar: { key: 'caprover' },
        token: {
            fontFamily:
                "'Inter Variable', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            colorPrimary: isDarkMode ? '#785de0' : '#6952d9',
            colorLink: isDarkMode ? '#b4a5ff' : '#6952d9',
            colorBgLayout: isDarkMode ? '#101114' : '#f8f9fb',
            colorBgContainer: isDarkMode ? '#16171b' : '#ffffff',
            colorBgElevated: isDarkMode ? '#1e1f25' : '#ffffff',
            colorText: isDarkMode ? '#ededf0' : '#202128',
            colorTextSecondary: isDarkMode ? '#a0a1ac' : '#717380',
            colorBorder: isDarkMode ? '#34353e' : '#dddfe6',
            colorBorderSecondary: isDarkMode ? '#2b2c34' : '#e9eaf0',
            borderRadius: 6,
            borderRadiusLG: 10,
            controlHeight: 34,
            fontSize: 13,
            fontWeightStrong: 600,
            boxShadowTertiary: 'none',
        },
        components: {
            Layout: {
                headerBg: isDarkMode ? '#16171b' : '#ffffff',
                siderBg: isDarkMode ? '#101114' : '#f8f9fb',
                lightSiderBg: isDarkMode ? '#101114' : '#f8f9fb',
                triggerBg: isDarkMode ? '#101114' : '#f8f9fb',
            },
            Menu: {
                itemBg: 'transparent',
                itemSelectedBg: isDarkMode ? '#272430' : '#edeaf8',
                itemSelectedColor: isDarkMode ? '#c4b8ff' : '#5e45c1',
                itemColor: isDarkMode ? '#a0a1ac' : '#626470',
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
            Card: { headerHeight: 48, bodyPadding: 24, headerFontSize: 14 },
            Table: {
                headerBg: isDarkMode ? '#1b1c21' : '#f9f9fb',
                headerColor: isDarkMode ? '#a0a1ac' : '#717380',
                headerSplitColor: 'transparent',
                bodySortBg: 'transparent',
                headerSortActiveBg: isDarkMode ? '#1b1c21' : '#f9f9fb',
                cellPaddingBlockMD: 14,
                cellPaddingInlineMD: 16,
            },
            Tag: {
                defaultBg: isDarkMode ? '#22232b' : '#f5f5f8',
                defaultColor: isDarkMode ? '#b5b6c1' : '#717380',
            },
            Tabs: { titleFontSize: 13, horizontalItemGutter: 24 },
            Form: { itemMarginBottom: 20 },
            Input: { activeShadow: '0 0 0 3px rgba(105,82,217,0.12)' },
        },
    }
}
