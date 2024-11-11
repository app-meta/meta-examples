import { createRouter, createWebHashHistory } from 'vue-router'

import WindowView from "./Window.vue"
import { checkRole } from "./Auth"

let isProduction = process.env.NODE_ENV == 'production'
const LOGIN = "login"
const version = _VERSION_
const IGNORES = [ LOGIN, 'login-cas', "app-form-designer" ]

/**
 *
 * @param {*} mainComponent
 * @param {*} ps
 *              homePage        默认跳转页面
 *              mainRoutes      主路由
 *              blankRoutes     全页面路由（适合做诸如 登陆页面 等没有导航的页面）
 *              windowRoutes    新开窗口路由（具备 footer）
 *
 * @returns  router 对象，可以在此基础上添加钩子（如 beforeEach）
 */
export default function ( mainComponent, ps) {
    ps = Object.assign({mainRoutes:[], blankRoutes:[], windowRoutes:[], homePage: "/home"}, ps||{})

    let component
    //使用自定义组件
    if(mainComponent && typeof(mainComponent.setup)==='function'){
        component = mainComponent
    }
    else{
        component = ()=> import("./Main.vue")
        //注册全局菜单
        window.mainMenus = Array.isArray(mainComponent)? mainComponent:[mainComponent]
    }

    const appRouter = {
        path: "",
        name: "main",
        redirect:  ps.homePage,
        component,
        children: [
            ...ps.mainRoutes,
            { path: '/401', name: "401", component: () => import('./components/common/401.vue') },
            { path: '/403', name: "403", component: () => import('./components/common/403.vue') },
            { path: '/404', name: "404", component: () => import('./components/common/404.vue') },
        ]
    }

    /**
     * 通过新窗口打开的路由（仅包含页面 footer ）
     */
    let windowRouter = {
        path: '',
        component: WindowView,
        children:  ps.windowRoutes
    }

    let routes = [
        ...ps.blankRoutes,
        appRouter,
        windowRouter,
        {
            path: "/:pathMatch(.*)",
            redirect: "/404"
        }
    ]

    const router = createRouter({
        history: createWebHashHistory(),
        routes
    })

    router.beforeEach((to, from, next) => {
        //判断权限
        if (to.meta.role && !checkRole(to.meta.role)) {
            console.debug(`☹ ${to.name} (${to.fullPath}) 需要权限 ${to.meta.role}，请联系管理员授权 ☹`)
            return next({ name: P403 })
        }

        window.document.title = (to.meta.title?`${to.meta.title} ·`:window.Config.appName??to.name) + `（版本=${version}）`
        next()
        // if ( !IGNORES.includes(to.name) && !window.TOKEN ) {
        //     console.debug(`检测到用户未登录，即将跳转到登录页面`)

        //     return next({ name: LOGIN })
        // }
        // else {
        //     //判断权限
        //     if (to.meta.role && !checkRole(to.meta.role)) {
        //         console.debug(`☹ ${to.name} (${to.fullPath}) 需要权限 ${to.meta.role}，请联系管理员授权 ☹`)
        //         return next({ name: P403 })
        //     }

        //     window.document.title = (to.meta.title?`${to.meta.title} ·`:window.Config.name)
        //     next()
        // }
    })

    return router
}
