/**
 * 生产环境下的数据交互封装（通过 H 对象）
 *
 * 调用 H.service 的 aid 参数来自 _META_AID_ （由构建工具自动注入）
 */

import { _downloadConfig, _dealWithErrorRequest } from './base'

const AID = _META_AID_ || (()=> {throw Error("请在 vue.config.js 或 vite.config.js 或 rsbuild.config.js 中定义 _META_AID_ 常量")})()

//生产环境使用 H.service 接口
window.POST=(url, data, onOk, onFail, useJson=true)=>{
    H.service.json(AID, url, data, useJson).then(onOk).catch(e=>_dealWithErrorRequest(url, e, onFail))
}

/**
 *
 * @param {String} url
 * @param {Object} data
 * @param {import('./base').DownloadConfig} ps
 */
window.DOWNLOAD=(url, data, ps={})=>{
    ps = _downloadConfig(ps)
    //调用 H.service.download 接口完成文件下载
    H.service.download(AID, url, data, {json: ps.json, fName: ps.fName})
        .then(({filename, headers, length})=>{
            if(ps.onOk){
                //生产环境下，自定义 onOk 参数缺失，非必要不使用
                ps.onOk({filename, contentType: undefined, headers, length})
            }
            else
                M.notice.ok(filename, "文件下载成功")
        })
        .catch(e=>_dealWithErrorRequest(url, e, ps.onFail))
}
