// jshint esversion:6

const path = require('path')
const fs = require('fs')
const {
    override,
    fixBabelImports,
    addLessLoader,
    addWebpackPlugin,
} = require('customize-cra')
const AntDesignThemePlugin = require('antd-theme-webpack-plugin');
const {
    getLessVars
} = require('antd-theme-generator');

const themeVariables = getLessVars(
    path.join(__dirname, './src/styles/vars.less')
);
const defaultVars = getLessVars(
    './node_modules/antd/lib/style/themes/default.less'
);
const darkVars = {
    ...getLessVars('./node_modules/antd/lib/style/themes/dark.less'),
    '@primary-color': defaultVars['@primary-color'],
    '@picker-basic-cell-active-with-range-color': 'darken(@primary-color, 20%)',
    '@table-selected-row-bg': 'darken(@primary-color, 20%)',
    '@shadow-2': '0 6px 12px -4px rgba(0, 0, 0, 0.48), 0 12px 12px 0 rgba(0, 0, 0, 0.32), 0 18px 28px 8px rgba(0, 0, 0, 0.2)',
    ...themeVariables,
}
const lightVars = {
    ...getLessVars('./node_modules/antd/lib/style/themes/compact.less'),
    '@primary-color': defaultVars['@primary-color'],
    '@shadow-2': '0 6px 12px -4px rgba(0, 0, 0, 0.12), 0 12px 12px 0 rgba(0, 0, 0, 0.08), 0 18px 28px 8px rgba(0, 0, 0, 0.05)',
    ...themeVariables,
}
fs.writeFileSync('./src/styles/dark.json', JSON.stringify(darkVars))
fs.writeFileSync('./src/styles/light.json', JSON.stringify(lightVars))

const options = {
    stylesDir: path.join(__dirname, './src'),
    antDir: path.join(__dirname, './node_modules/antd'),
    varFile: path.join(__dirname, './src/styles/vars.less'),
    themeVariables: Array.from(
        new Set([
            ...Object.keys(darkVars),
            ...Object.keys(lightVars),
            ...Object.keys(themeVariables),
        ])
    ),
    generateOnce: false, // generate color.less on each compilation
}

module.exports = override(
    fixBabelImports('import', {
        libraryName: 'antd',
        libraryDirectory: 'es',
        style: true,
    }),
    addWebpackPlugin(new AntDesignThemePlugin(options)),
    addLessLoader({
        javascriptEnabled: true,
    })
)