/*
 * @Author: 集成显卡
 * @Date: 2022-12-02 10:05:37
 * @Last Modified by: 集成显卡
 * @Last Modified time: 2024-07-26 14:57:34
 */

const fs = require("fs")

const format = [
    "{{timestamp}} {{title}} : {{message}}", //default format
    {
        error: "{{timestamp}} {{title}} : {{message}}\n{{stack}}" // error format
    }
]
const dateformat = global.isPro? "yyyy-mm-dd HH:MM:ss.L":"HH:MM:ss.L"

const buildLogger = (withFile=true)=>{
    //创建 logs 目录
    const _dir = global.logDir||"logs"
    if(withFile)
        fs.existsSync(_dir) || fs.mkdirSync(_dir, {recursive: true})

    var logger = withFile?
        require('tracer').dailyfile({
            root:_dir,
            logPathFormat: global.logPath ?? "log.txt",//默认日志保存到logs/{日期}.log："{{root}}/{{date}}.log"
            format: format,
            level: !global.isPro || global.isDebug? "debug":"info",
            dateformat: dateformat,
            transport: d=>console.log(d.output)
        })
        :
        require("tracer").colorConsole({
            format: format,
            dateformat: dateformat,
            preprocess: function (data) {
                data.title = data.title.toUpperCase();
            }
        })
    return logger
}

// 测试环境下只使用 控制台Logger
module.exports = buildLogger(global.isPro)
