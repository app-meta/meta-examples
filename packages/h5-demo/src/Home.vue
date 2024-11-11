<template>
    <div>
        <n-button @click="getTime">获取服务器时间</n-button>
        <n-text depth="3">{{ time }}</n-text>
    </div>
    <div class="content" style="margin-top: 20px;">
        <input type="file" @change="handleFileChange" />
        <n-button @click="uploadFileWithFetch">FETCH上传文件</n-button>
        <n-button @click="uploadFile">点我上传文件</n-button>
    </div>
    <div style="margin-top: 20px;">
        <n-button @click="service('form')">常规表单提交</n-button>
        <n-button @click="service('json')">JSON表单提交</n-button>
    </div>
</template>

<script setup>
    import { ref } from 'vue'

    let file = ref()
    let time = ref()

    const getTime = ()=> RESULT('/service/demo/up', {name:"h5-demo"}, v=>time.value = v.data)

    const handleFileChange = e=>{
        const f = e.target.files[0];
        if (f) {
            file.value = f;
            console.log('Selected File:', file.value);
        }
    }

    const buildForm = ()=> new Promise(ok=>{
        if(!file.value) return M.warn('请先选择文件')

        const formData = new FormData()
        formData.append('file', file.value)
        formData.append("name", Date.now())

        ok(formData)
    })

    const uploadFileWithFetch = ()=> buildForm().then(body=>{
        console.debug(body)
        fetch('http://localhost:3000/app-meta/service/demo/upload', {
            method: 'POST',
            body
        })
        .then(v=>v.json())
        .then(v=>{
            console.debug("响应结果：", v)
        })
        .catch(e=>console.debug("文件上传失败", e))
    })

    const uploadFile = ()=> buildForm().then(body=>{
        H.service.json('demo', "/upload", body).then(v=>console.debug(v))
    })

    const service = (type="json")=>{
        let body = { name:"集成显卡", age:18 }
        H.service.json('demo', `/${type}`, body, type=='json').then(v=>console.debug(v))
    }
</script>
