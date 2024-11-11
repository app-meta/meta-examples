import { toRaw, unref } from 'vue'

import UI from "./ui-tool"
import './http'
import './date'

window.UI = UI

/**
 * 将 Proxy 对象转换为普通 Object
 *
 * 方式一：return {...(ref.value||ref)}
 *      该方法无法处理嵌套对象，故选用 JSON 反序列化方式
 *
 * 方式二： 使用 vue3 自带的 toRaw(unref(bean)) 方式
 * @param {*} ref
 * @returns
 */
let _ = ref=> {
    // return toRaw(unref(ref))
    return JSON.parse(JSON.stringify(ref.value||ref))
}

window._    = _
window._raw = ref=> toRaw(unref(ref))

const showClientError = (e, title="调用客户端接口失败", width="640px")=>{
    let msg = e.message
    let index = msg.indexOf(":")
    M.dialog({
        content: UI.html(`<div>${msg.substring(index+1).trim()}</div><div class="mt-3 h">${msg.substring(0, index)}</div>`),
        title,
        type:"error",
        style:{ width },
        transformOrigin:"center",
        positiveText:"朕知道了"
    })
}
