/*
 * @Author: 集成显卡
 * @Date: 2022-08-23 13:04:59
 * @Last Modified by: 集成显卡
 * @Last Modified time: 2024-11-11 16:32:33
 *
 *
 * 注意：
 * ① 统一使用 json 提交数据
 */

import { _dealWithErrorRequest, _loading } from "./base"

import "@@Http"

/**
 * 对于返回 Result 对象的请求封装
 * @param {*} url   请求地址
 * @param {*} data  参数
 * @param {*} onOk  请求成功后回调函数
 * @param {*} ps    额外设置
 *                      fail    请求失败后的回调函数
 *                      json    是否以 JSON 格式提交参数
 *                      headers 自定义请求头
 *                      loading 加载中的开关（RefImpl 类型），在开始请求时设置为 true，请求结束（无论成功与否）都设置为 false
 */
window.RESULT=(url,data,onOk, ps={})=>{
    ps = Object.assign(
        {
            fail (){},          //失败时的回调函数
            json: true,         //是否以 JSON Body 形式提交参数
            headers:{},         //自定义请求头
            loading:undefined   //加载中开关
        },
        ps
    )
    _loading(ps, true)

    POST(
        url,data,
        function (res) {
            _loading(ps)

            if(res.success === true) onOk && onOk(res)
            else{
                if(res.message==="NOT LOGIN"){
                    let msg = "请先登录再使用该功能"
                    M.warn(msg)
                    throw Error(msg)
                    // return tryLoginWithCAS(location.hash) && E.emit("jumpTo", {name:"login"}, true)
                }

                //当自定义了异常处理函数，就优先调用，当 onFail 返回 true 时不显示系统级别的错误提示
                let notShowError = ps.fail && ps.fail(res)===true
                if(!notShowError){
                    M.notice.create({
                        type:"error",
                        content: res.message,
                        title:"数据接口异常",
                        description: url
                    })
                }
            }
        },
        function (e){
            _loading(ps)

            if(ps.fail)     ps.fail(e)
        },
        ps.json,
        ps.headers
    )
}

export default {}
