import { defineConfig } from '@rsbuild/core'
import { pluginLess } from '@rsbuild/plugin-less';
import { pluginVue } from '@rsbuild/plugin-vue'

const isProduction = process.env.NODE_ENV === 'production'

import pkg from './package.json'

const version = ()=>{
    let now = new Date
    return [now.getFullYear()-2000, now.getUTCMonth()+1, now.getUTCDate(), now.getHours().toString().padStart(2,"0")+now.getMinutes().toString().padStart(2,"0")].join(".")
}

export default defineConfig({
    plugins: [pluginVue(), pluginLess()],
    source:{
        alias:{
            '@P'            : './public',
            '@@'            : '@app-meta/basic-vue3',
            '@@C'           : '@app-meta/basic-vue3/components',
            '@'             : './src',                               //代码目录
            '@C'            : './src/components',                    //常用组件
            '@V'            : './src/views',                         //常用组件
            '@@Http'        : `@app-meta/basic-vue3/util/http/${isProduction?'prod':'dev'}.js`, //数据交互方式
            '@Pagination'   : "@app-meta/basic-vue3/components/mixin/Pagination",
        },
        define: {
            //定义应用级别的常量
            "_VERSION_"     : JSON.stringify(isProduction? version() : process.env.NODE_ENV),
            "_APPNAME_"     : JSON.stringify(pkg.appName),
            "_META_AID_"    : JSON.stringify(pkg.appId),
            "_META_HOST_"   : JSON.stringify("http://localhost:3000/app-meta"),
            "_SERVER_"      : JSON.stringify(pkg.appId),
            "_LOCAL_UID_"   : JSON.stringify("")
        }
    },
    server:{
        base: isProduction?"./":"/",
        port: 3100,
        host: "localhost",
        proxy:[
            {
                context:['/up', '/upload'],
                target:"http://localhost:8080"
            }
        ]
    },
    html:{
        title: pkg.appName,
        tags: [
            // 注入 script
            { tag:'script', attrs:{ src:'http://localhost:3000/meta-helper.js' }, head: true, append:false }
        ]
    }
});
