import axios from 'axios'
import qs  from 'qs'

import { _dealWithErrorRequest, _downloadConfig } from "./base"

//默认的 server 前缀为空
const CONTEXT = ""

window.changeUser = value=>{
    let user = typeof(value)=='object'? value : {id: value, name:"本地测试户", ip:"127.0.0.1"}

    const token = `${user.id}-${user.name}-${user.ip}`
    axios.defaults.headers.common['UA'] = window.TOKEN = encodeURI(token)
    console.debug(`[测试环境] 切换用户 TOKEN 为：${token} `)
}

changeUser(_LOCAL_UID_||"demo")

//开发环境使用的是 axios
window.POST=(url,data,onOk,onFail, useJson=true, headers={})=>{
    M.loadingBar.start()

    //提交数据到服务器
    axios.post(CONTEXT + url, useJson ? data : qs.stringify(data||{}), {headers}).then(function (response) {
        if(response.status===200){
            M.loadingBar.finish()
            if(onOk) onOk(response.data)
        }
        else{
            M.notice.error(`POST ${url} 失败\n响应码：${response.status}`)
        }
    }).catch(function (error) {
        _dealWithErrorRequest(url,error, onFail)
    })
}

/**
 * 下载文件到本地（使用 axios）
 * 程序如何判断是否为异常（后端异常返回的是 JSON 格式的异常信息）
 * 1. 后端没有返回文件名
 * 2. 返回的格式为 application/json
 *
 * ----------------------------------------------------------------------------
 * 另外一种下载方式：
 * window.open("/attach/zipDownload")
 *
 * @param {String} url
 * @param {Object} data
 * @param {import('./base').DownloadConfig} ps
 */
window.DOWNLOAD=(url, data, ps={})=>{
    ps = _downloadConfig(ps)
    let form = new FormData()
    let headers = {}
    if(ps.json){
        Object.keys(data).forEach(k=> form.append(k, data[k]))

        headers['Content-Type'] = "multipart/form-data"
    }
    let method = ps.useGet? axios.get:axios.post
    //提交数据到服务器
    method(CONTEXT + url, ps.json?form:qs.stringify(data||{}), {responseType: 'blob', headers}).then(function (response) {
        let headers = response.headers
        let contentType = headers['content-type']

        if(!response.data){
            console.error("服务器响应异常", response)
            return ps.onFail && ps.onFail(response)
        }

        const blob = new Blob([response.data], {type: contentType})
        const contentDisposition = headers['content-disposition']
        const length = headers['content-length']
        let filename = ps.fName
        if (!filename && contentDisposition) {
            filename = window.decodeURI(contentDisposition.split('=')[1])
        }

        //判断是否为后端出错
        if((!filename || !contentDisposition) && response.data.type=="application/json"){
            let fileReader = new FileReader()
            fileReader.onload = e=>{
                let jsonText = fileReader.result
                let result = JSON.parse(jsonText)

                console.debug("来自后端的下载响应：", result)

                //如果 onFail 返回 false 则不显示错误窗口
                let showErrorMsg = !onFail || (onFail && onFail(result)!=false)
                if(showErrorMsg){
                    let content = UI.html(`<div class="error">${result.message}</div><br>
                    <span class="h">1. 请确认您提交的参数是否正确后再重试<br>2. 若错误依旧请联系<b class="info">信息科技部</b>。</span>`
                    )
                    M.dialog({content, title:"文件下载失败（服务器响应内容如下）", type:"error"})
                }
            }
            fileReader.readAsText(response.data)
        }
        else {
            filename = filename || ("文件下载-"+H.date.datetime(H.date.now(), "YYYYMMDDHHmmss"))
            /**
             * 如果自定义了处理函数
             *
             * handler 于 onOk 不能同时被回调
             */
            if(typeof(ps.handler)=='function'){
                ps.handler(blob, filename)
            }
            else{
                //默认保存到文件中
                H.io.saveToFile(blob, filename)

                if(ps.onOk)
                    ps.onOk({filename, contentType, headers, length})
                else
                    M.notice.ok(filename, "文件下载成功")
            }
            // let link = document.createElement('a')
            // // 非IE下载
            // if ('download' in link) {
            //     link.href = window.URL.createObjectURL(blob)    // 创建下载的链接
            //     link.download = fileName                        // 下载后文件名
            //     link.style.display = 'none'
            //     document.body.appendChild(link)
            //     link.click()                                    // 点击下载
            //     window.URL.revokeObjectURL(link.href)           // 释放掉blob对象
            //     document.body.removeChild(link)                 // 下载完成移除元素
            // } else {
            //     // IE10+下载
            //     window.navigator.msSaveBlob(blob, fileName)
            // }
        }
    }).catch(function (error) {
        _dealWithErrorRequest(url, error, ps.onFail)
    })
}
