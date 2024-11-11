export const _dealWithErrorRequest = (url, error, onFail)=>{
    M.loadingBar.error()

    if(!!onFail && typeof(onFail) === 'function'){
        if(onFail(error? error.response: null) === true)    return
    }
    console.debug(error)
    let content = ""
    let meta    = ""

    if(error.response && error.response.status) {
        meta    = `CODE=${error.response.status}`
        content = error.response.status == 404 ? "请求的接口不存在": error.response.data.message
    }
    else{
        meta    = "程序逻辑错误"
        content = typeof(error)==='string'? error: error.message
    }

    window.M.notice.create({ type:"error", content, title:"数据接口异常", description: url, meta})
}

/**
* 更新 loading
* @param {*} ps        包含 loading 的对象或者其本身
* @param {*} newVal
*/
export const _loading = (ps, newVal = false) => {
    if (ps.loading)
        ps.loading.value !== undefined ? ps.loading.value = newVal : ps.loading = newVal
    else
        ps.value !== undefined ? ps.value = newVal : ps = newVal
}

/**
 * @typedef {Object} DownloadConfig
 * @property {Function} onOk - 下载完成后的回调函数，默认：M.notice({文件名}, "文件下载成功")
 * @property {Function} onFail - 下载失败后的回调函数，默认：失败后通过 alert 打印错误信息
 * @property {Boolean} json - 是否使用 JSON 格式提交参数
 * @property {String} fName - 保存的文件名，若不为空则强制修改为该文件名，否则尝试从响应头中读取
 * @property {Boolean} useGet - 是否使用 GET 方式下载，注意：生产环境不支持
 * @property {Function} handler - 文件对象的自定义处理函数
 */

/**
 * 详见 DownloadConfig 定义
 * @param {DownloadConfig} ps 
 * @returns {DownloadConfig}
 */
export const _downloadConfig = ps=> Object.assign(
    {
        onOk: undefined,
        onFail:undefined,
        json:false,
        fName:null,
        useGet:false,
        handler:undefined
    },
    ps
)