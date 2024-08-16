const { defineConfig } = require("@rspack/cli")

const pkg = require("./package.json")

module.exports = defineConfig({
    target: 'node',
    devtool: false,
    entry:"./index.js",
    output:{
        filename:`${pkg.aid||pkg.name}.js`
    }
})
