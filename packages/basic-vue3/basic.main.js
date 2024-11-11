import { createApp, nextTick } from 'vue'
import axios from 'axios'
import naive from 'naive-ui'

import App from './App.vue'

import './theme/tailwind-simple.css'
import './theme/naive.less'
import './theme/app.less'

// 全局组件
import Tag from './components/custom/tag.vue'

// 全局工具配置
import "./util"

import { setupStore } from './store'

//引入事件通信组件
import mitt from 'mitt'

import { setupDirectives } from './components/directive'

const isProduction  = process.env.NODE_ENV == 'production'
window.DEV = !isProduction
//开发环境下，设置 CHANNEL 为开发端
window.CHANNEL = isProduction ? "H5" : "DEV"

/**
 * 向 window 注入全局对象 Config
 * @param {*} ps
 */
const customConfig = (ps = {}) => {
    window.Config = Object.assign(
        {
            JSON: false,                                    //是否以 JSON 格式发送请求，默认 false

            WATERMARK: true,                                //是否显示水印
            AUTH_URL: "",                                   //远程授权信息获取地址
            UI_NOTICE_PLACEMENT: "top-right",               //通知框弹出位置
            appName: _APPNAME_ ||window.document.title ,    //应用名称

            isDev   : !isProduction,                        //是否为开发模式
        },
        ps
    )
}

const loadRole = url => new Promise((onOk, onFail) => {
    RESULT(
        url, {},
        d => {
            let account = Object.assign({ roles: [] }, d.data)
            //锁定用户对象，不支持修改
            Object.keys(account).forEach(k => {
                Object.defineProperty(account, k, { value: account[k], writable: false, enumerable: true, configurable: true })
            })
            window.User = account
            onOk()
        },
        {
            fail(e) {
                // throw Error(`无法从 ${url} 获取用户信息`, e)
                console.error(`无法从 ${url} 获取用户信息：`, e)
                onFail(`无法从 ${url} 获取用户信息`)
                return true
            }
        }
    )
})

// if(!isProduction){
//     (()=>{
//         let HOST        = _META_HOST_
//         let script      = document.createElement('script')
//         script.src      = `${HOST}/meta-helper.js`
//         script.type     = 'text/javascript'
//         script.defer    = true
//         document.getElementsByTagName('head').item(0).appendChild(script)
//         script.onload = ()=>{
//             console.debug(`测试环境下的 META 组件加载完成 ^.^`)
//             H.data.init({aid:_META_AID_, prefix: `${HOST}`})

//             let setupUser = data=>{
//                 console.debug(`读取到登录用户信息`, data)
//                 let account = { ...data, isAdmin: Array.isArray(data.roles) && data.roles.includes("ADMIN") }
//                 //锁定用户对象，不支持修改
//                 Object.keys(account).forEach(k=>Object.defineProperty(account, k, {value: account[k], writable:false, enumerable:true, configurable:true}) )
//                 window.User = account
//                 sessionStorage.setItem("User", JSON.stringify(account))
//             }

//             if(!!sessionStorage.User)
//                 setupUser(JSON.parse(sessionStorage.User))
//             else
//                 H.data.getUserInfo().then(setupUser)
//         }
//     })()
// }

const _setupUser = (data, nextAction)=>{
    if(!isProduction)    console.debug(`读取到登录用户信息`, data)
    let account = { ...data, isAdmin: Array.isArray(data.roles) && data.roles.includes("ADMIN") }
    //锁定用户对象，不支持修改
    Object.keys(account).forEach(k=>Object.defineProperty(account, k, {value: account[k], writable:false, enumerable:true, configurable:true}) )
    window.User = account
    sessionStorage.setItem("User", JSON.stringify(account))

    nextAction && nextAction(data)
}

const initMetaUser = (independent=false)=> new Promise(ok=>{
    if(!window.H){
        console.error(`[警告] 检测到未加载 H 对象，META 平台的功能将无法使用...`)
    }
    else if(H.data && typeof(H.data)==='object'){
        //直接设置 SERVER 全局属性
        window.SERVER = _META_HOST_
        H.log.debug(`配置 SERVER 为 ${window.SERVER}`)
    }

    if(independent) return ok()

    if(!!sessionStorage.User)
        _setupUser(JSON.parse(sessionStorage.User), ok)
    else
        H.data.getUserInfo().then(d=> _setupUser(d, ok))
})

/**
 * 初始化应用
 * @param {*} routerPath    路由对象
 * @param {*} config        自定义配置，详见 customConfig 方法
 * @param {*} userInfo      用户信息
 * @param {*} enables       开关项
 */
export const initApp = (routerPath, config={}, enables={})=> new Promise(async (ok)=>{
    customConfig(config)
    enables = Object.assign(
        {
            banner:true,            //打印控制台横幅信息
            store: true,            //是否启用 store
            independent: false,     //是否为独立应用，无需加载 META 平台的用户信息（不调用 initMetaUser 方法）
        },
        enables
    )

    const app = createApp(App)

    if(enables.store){
        //============================================================
        //初始化 store
        //按需开启
        //============================================================
        setupStore(app)
    }

    if(window.Config.AUTH_URL){
        await loadRole(window.Config.AUTH_URL).catch(e=> setTimeout(()=> M.notice.error(e), 1000))
    }

    if(typeof(routerPath) == 'object' && typeof(routerPath.beforeEach)=='function'){
        app.use(routerPath)
    }
    else
        throw Error(`routerPath 参数必须为 Object 或者 Function 类型...`)
    // else {
    //     const router = require(routerPath)
    //     if(!isProduction)   console.debug(`从 ${routerPath} 加载路由信息...`)
    //     app.use(router)
    // }

    app.use(naive)
    setupDirectives(app)

    /**
     * 全局话事件组件
     */
    window.E = new mitt()

    app.component("Tag", Tag)

    initMetaUser(enables.independent === true).then(user=>{
        ok(app)
        app.mount('#root')
    })

    if(isProduction){
        // VUE3 全局异常处理
        app.config.errorHandler = (err, vm, info)=>{
            console.error(err)
            let nodeInfo = ""
            if(vm.rawNode){
                nodeInfo = `
                    <div class="mt-2"><span class="text-white bg-red-500 p-1">节点信息</span></div>
                    <div class="text-gray-500">${JSON.stringify(vm.rawNode)}</div>
                `
            }
            window.M.dialog({
                type: 'error',
                style:{width:"640px"},
                title:"应用执行出错",
                content: UI.html(`
                    <div class="text-lg">
                        <div>很遗憾，当前应用执行过程出现无法自处理的异常 🐛</div>
                        <div>请尝试刷新页面重试，如果问题依旧请联系技术人员进行处理</div>
                    </div>

                    <div class="mt-6">
                        <div><span class="text-white bg-red-500 p-1">异常信息</span></div>
                        <div class="text-red-600">${err}</div>
                        ${nodeInfo}
                    </div>
                `)
            })
        }
    }

    // 显示横幅
    if(enables.banner) {
        console.debug(
            `%c欢迎使用  · ${_APPNAME_}（UI） · ${!isProduction? "DEV" : "PRO"}`,
            "background:green;color:white;padding:5px; font-size:14px;font-family:微软雅黑"
        )
    }
})
