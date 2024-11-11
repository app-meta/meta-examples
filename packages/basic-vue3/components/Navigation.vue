<template>
    <n-page-header>
        <template #title><slot></slot></template>
        <template #subtitle>
            <div>
                <n-menu :inverted="inverted" v-model:value="activeKey" class="mini" mode="horizontal" :options="menus" :icon-size="16" />
            </div>
        </template>

        <template v-if="showExtra" #extra>
            <n-space>
                <slot name="extra-left"></slot>
                <n-dropdown trigger="click" @select="userMenuSelect" :options="userOptions" :show-arrow="true">
                    <slot name="right">
                        <n-button text class="mt-1" :color="inverted?'#FFF':undefined"><template #icon><n-icon :component="Cog"/></template></n-button>
                        <!-- <Cog class="icon" /> -->
                    </slot>
                </n-dropdown>
            </n-space>
        </template>
    </n-page-header>
</template>

<script setup>
    import { ref, createVNode, watch, onBeforeMount } from "vue"
    import { RouterLink, useRoute, useRouter } from "vue-router"

    import { NIcon } from 'naive-ui'
    import { PowerOff, RedoAlt, Cog, Palette, Search } from "@vicons/fa"

    import Theme from "./naive-ui/Theme.vue"

    const props = defineProps({
        menus: {type:Array, default:[]},
        iconSize:{type:Number, default:22},
        inverted:{type:Boolean, default:false},
        showExtra:{type:Boolean, default: true}
    })

    const router = useRouter()
    const route = useRoute()

    let activeKey = ref(route.name)

    let userOptions = [
        // { type:"group", label:"主题配色"},
        { type:"render", render: ()=>createVNode(Theme) },
        { type:"divider"},
        { label: '重载主界面',key: 1, icon: ()=>UI.buildIcon(RedoAlt)},
        // { label: '退出平台',key: 4, icon: ()=>UI.buildIcon(PowerOff, {class:"text-red-500"})}
        { label: '关闭窗口',key: 4, icon: ()=>UI.buildIcon(PowerOff, {class:"error"})}
    ]

    //头像下拉菜单
    const userMenuSelect = (key) => {
        if(key == 1)        window.location.reload()
        else if(key == 4)   {
            M.confirm(`关闭窗口`, `确定要关闭当前窗口吗？（关闭前请保存当前操作，以免数据丢失）`, window.close)
        }
    }

    /**
     * 监听路由变化：https://blog.csdn.net/qq_38974163/article/details/122187858
     *
     * 方法一：使用 watch
     * 方法二：使用 onBeforeRouteUpdate，需要在 router-view 内部
     */
    watch(route, ()=>activeKey.value = route.name)
</script>

<style lang="less">
    .n-menu-item-content--selected {
        .n-menu-item-content-header {
            font-weight: bold !important;
        }
    }
</style>
