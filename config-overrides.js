const {
    override,
    fixBabelImports,
    addLessLoader,
} = require("customize-cra");

module.exports = override(
    fixBabelImports("import", {
        libraryName: "antd",
        libraryDirectory: "es",
        style: true // change importing css to less
    }),
    addLessLoader({
        javascriptEnabled: true,
        modifyVars: {
            "@primary-color": "#1b8ad3",
            '@font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
        },
    })
);