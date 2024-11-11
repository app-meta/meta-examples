import { initApp } from "@@/basic.main"
import BuildRouter from "@@/basic.router"

import { Home } from "@vicons/fa"

initApp(
    /**
     * 参数一为主页面的布局组件，若传递了非组件，则使用默认布局（详见 commons\basic-vue3\Main.vue）
     * 并以参数作为全局菜单项：routeName=关联路由名称，text=菜单文本，icon=图标组件或者Render函数
     */
    BuildRouter(
        { routeName:"home", text:"首页", icon: Home },
        {
            homePage: "/home",
            mainRoutes: [
                { path: '/home', name: 'home',meta:{title:"首页"}, component: () => import('@/Home.vue') },
            ],
            windowRoutes: [],
            blankRoutes: []
        }
    ),
    {},
    { independent: true }
)
