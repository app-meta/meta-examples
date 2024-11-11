import { readFileSync } from 'node:fs'
import { defineConfig } from '@rsbuild/core'

const pkg = JSON.parse(readFileSync("./package.json"))

export default defineConfig({
    source:{
        entry:{ index: './index.js' },
    },
    output:{
        legalComments:"none",
        target:"node",
        filename:{
            js: `${pkg.name}.js`
        }
    }
})

