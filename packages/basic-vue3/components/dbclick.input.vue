<template>
    <div @dblclick="editing=true">
        <template v-if="editing">
            <n-input v-model:value="data" ref="input" :size="size" @blur="editing=false" @keyup="onKeyup">
                <template #suffix>
                    <n-button circle quaternary @click="toUpdate" type="primary" size="tiny"> <template #icon><n-icon :component="Check" /></template> </n-button>
                </template>
            </n-input>
        </template>
        <template v-else>
            <n-text v-if="!text" depth="3" size="small">没有内容（双击可编辑）</n-text>
            <!-- <template v-else>{{text}}</template> -->
            <n-ellipsis v-else>{{text}}</n-ellipsis>
        </template>
    </div>
</template>

<script setup>
    import { ref,watch,nextTick } from 'vue'
    import { Check } from '@vicons/fa'

    const props = defineProps({
        text:{type:String},
        size:{type:String, default:"medium"},
        onUpdate:{type:Function}
    })

    let input = ref()
    let data = ref(props.text)
    const editing = ref(false)
    const toUpdate = ()=> {
        if(data.value != props.text){
            props.onUpdate(data.value)
            editing.value = false
        }
        else
            M.warn(`内容未修改`)
    }
    const onKeyup = e=> e.code === 'Enter' && toUpdate()
    watch(editing, ()=>nextTick(()=> input.value && input.value.focus()))
</script>
