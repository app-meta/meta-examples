<!--Markdown展示组件-->
<template>
    <div ref="viewer" :class="dark?'toastui-editor-dark':''"></div>
</template>

<script setup>
    import { ref,onMounted, computed, watch } from 'vue'

    import Viewer from '@toast-ui/editor/dist/toastui-editor-viewer'
    // 暗黑模式文字颜色 rgba(255, 255, 255, 0.82)
    import '@toast-ui/editor/dist/theme/toastui-editor-dark.css'
    import '@toast-ui/editor/dist/toastui-editor-viewer.css'

    const props = defineProps({
        code:{type:String},
        dark:{type:Boolean, default: window.DARK||false},
        height:{type:String, default:"auto"}
    })

    let mdViewer
    let viewer = ref(null)

    watch(()=>props.code, ()=> mdViewer && mdViewer.setMarkdown(props.code))

    onMounted(() => {
        mdViewer = new Viewer({
            el: viewer.value,
            height: props.height,
            initialValue: props.code
        })
    })
</script>

<style>
    /* 自定义样式 */
    .toastui-editor-contents {
        font-size: 14px !important;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol" !important;
    }
</style>
