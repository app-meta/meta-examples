const { existsSync, mkdirSync } = require("fs")
const { resolve } = require("path")

/**
 * 创建目录（如不存在）
 * @param {String|Array<String>} subs 
 * @returns {String}
 */
exports.dir = (subs)=>{
    const _dir = resolve(...subs)
    existsSync(_dir) || mkdirSync(_dir, { recursive: true })
    return _dir
}