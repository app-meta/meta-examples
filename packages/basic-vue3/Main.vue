<template>
    <n-layout position="absolute">
        <n-layout-header :inverted="inverted" :style="{height: headerHeight}" class="px-4" bordered>
            <app-navigation :inverted="inverted" :menus="menus" title-width="280px" :showExtra="true">
                <div :class="{white: inverted }"  :style="{lineHeight: headerHeight}">{{appName}}</div>
            </app-navigation>
        </n-layout-header>
        <!--如需头部，设置 style top: 50px;-->
        <n-layout position="absolute" :style="{bottom:'36px', top: headerHeight}" class="layout" :content-style="{padding: padding+'px',height:'100%'}" :native-scrollbar="false">
            <router-view />
        </n-layout>
        <n-layout-footer position="absolute" style="height: 36px; padding:6px; text-align: center;" bordered>
            <Banner />
        </n-layout-footer>
    </n-layout>
</template>

<script setup>
    import { ref, computed, h } from 'vue'
    import { RouterLink } from "vue-router"

    import Banner from "@@C/common/Banner.vue"
    import AppNavigation from "@@C/Navigation.vue"
    import { useUISetting } from "@@/store/uiSetting"
    const uiSetting = useUISetting()

    const headerHeight = "40px"
    const inverted = computed(()=> uiSetting.darkNav)      //反转头部导航

    let inited = ref(false)
    let padding = ref(12)
    let appName = _APPNAME_

    const menuItem = (routeName, text, icon)=> ({
        label: () => h(RouterLink, { to: { name: routeName } }, ()=>text),
        key: routeName,
        icon: typeof(icon)==='function'?icon:UI.buildIcon2(icon)
    })  

    const buildMenus = (newMenus)=>(newMenus||window.mainMenus||[]).map(v=> menuItem(v.routeName, v.text, v.icon))

    const menus = ref(buildMenus())

    //刷新菜单
    E.on('menus', (newMenus)=> menus.value = buildMenus(newMenus))
    // const menus = [
    //     menuItem("home", "首页", Home),
    //     menuItem("app-mine", "我的应用", AppStore)
    // ]
</script>
