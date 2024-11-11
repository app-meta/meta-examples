<template>
    <div>
        版权所有 © <span v-html="html"></span>
    </div>
</template>

<script setup>
    const props = defineProps({
        text:{type:String}
    })

    let html = props.text || `<a style="text-decoration: none; font-weight: 600;" target="_blank">南宁分行信息科技部</a> 2007-${new Date().getFullYear()}`
</script>
