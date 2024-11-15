<template>
    <n-config-provider :theme="theme" :locale="locale" :date-locale="dateLocale" :theme-overrides="customVars" :hljs="hljs">
        <AppProvider>
            <div :class="{ 'default-background': theme != darkTheme }">
                <router-view></router-view>
            </div>

            <n-watermark v-if="watermark" :content="water.text" cross fullscreen :font-color="water.color"
                :font-size="water.fontSize" :line-height="16" :width="water.width" :height="384" :x-offset="60" :y-offset="90" :rotate="water.rotate" />
        </AppProvider>
    </n-config-provider>
</template>

<script setup>
    import { ref, computed, onMounted } from 'vue'
    import { useRouter, useRoute } from 'vue-router'
    import { darkTheme, useOsTheme, zhCN, dateZhCN } from 'naive-ui'

    import hljs from 'highlight.js/lib/core'
    import javascript from 'highlight.js/lib/languages/javascript'

    import AppNavigation from './components/Navigation.vue'
    import AppProvider from "./components/naive-ui/Application.vue"

    import { getPrimaryColor } from './theme/colors'

    import { useUISetting } from "./store/uiSetting"
    const uiSetting = useUISetting()

    const router = useRouter()
    const route = useRoute()

    let osTheme     = useOsTheme()
    let locale      = computed(()=> zhCN)
    let dateLocale  = computed(()=> dateZhCN)
    let theme       = computed(()=> {
        let _theme = uiSetting.theme == 'dark'? darkTheme: uiSetting.theme == 'auto'? (osTheme.value === 'dark'? darkTheme: null): null
        window.DARK = _theme == darkTheme
        return _theme
    })

    let watermark       = ref(false)
    let water = { text:"", fontSize:16, rotate:-15, color:"rgba(128, 128, 128, .15)" }

    /**
     * @type import('naive-ui').GlobalThemeOverrides
     */
    let customVars  = {
        //读取 meta 平台的颜色配置
        common: getPrimaryColor(localStorage.getItem("ui.color"))
    }

    let jumpTo = (pathOrObj)=> {
        let newRoute = typeof(pathOrObj)==='object'?pathOrObj:{name:pathOrObj}
        if(newRoute.name === "login"){
            if(!newRoute.query)    newRoute.query = {}
            newRoute.query['from'] = route.fullPath
        }
        router.push(newRoute)
    }

    /**
     * 设置用户信息
     */
    let setupUser = user=>{
        let account = { id: user.id, name: user.name, ip: user.ip, roles: user.roles, isAdmin: Array.isArray(user.roles) && user.roles.includes("ADMIN") }
        //锁定用户对象，不支持修改
        Object.keys(account).forEach(k => {
            Object.defineProperty(account, k, { value: account[k], writable: false, enumerable: true, configurable: true })
        })
        window.User = account
        // console.debug("用户加载完成", account)

        if(Config.watermark != 'false'){
            let r           = Math.random()
            water.text      = H.io.render(Config.watermark_text||`{{id}}（{{date}}）`, {id:user.id, name:user.name, date: H.date.date(), ip: user.ip})
            water.width     = Math.floor(Config.watermark_width||"380")
            water.color     = Config.watermark_color
            water.fontSize  = r*10 + 16
            water.rotate    = r > 0.5? -15 : r > 0.3? 15:30
            watermark.value = true
        }
    }

    onMounted(() => {
        //如需使用请通过 'npm i -S highlight.js' 安装组件
        hljs.registerLanguage('javascript', javascript)

        E.on('jumpTo', jumpTo)
    })
</script>

<style lang="less">
    .default-background {
        .layout {
            /* background: #fafafa !important; */
        }
    }
</style>
