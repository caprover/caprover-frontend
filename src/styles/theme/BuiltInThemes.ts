const BuiltInThemes = {
    getDefaultTheme(
        isDarkMode: boolean,
        defaultAlgorithm: any,
        darkAlgorithm: any
    ) {
        return {
            algorithm: isDarkMode ? darkAlgorithm : defaultAlgorithm,
            token: {
                colorPrimary: '#0090ff',
                colorLink: '#009000',
                fontFamily: `QuickSand, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
                            'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji',
                            'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'`,
            },
        }
    },
}

export default BuiltInThemes
