const logger = require("./logger");

/**
 * @type {Map<String,Cache>}
 */
const caches = Map()

class Cache {
    /**
     * 缓存编号
     * @type {String}
     */
    key;
    /**
     * 缓存值
     * @type {*}
     */
    value;
    /**
     * 缓存超时（13位时间戳）
     * @type {Number}
     */
    expire;

    constructor(key, expireTime=2*60*60*1000){
        this.key = key
        this.value = null
        this.expire = expireTime>0? (Date.now()+expireTime):0
    }

    isTimeout() {
        return this.expire > 0 ? Date.now() > this.expire : false
    }
}

/**
 * 使用缓存
 * @param {String} key
 * @param {Function} provider
 * @param {Number} expireTime - 超时，单位 ms
 * @returns {Promise}
 */
exports.useCache = (key, provider, expireTime = 2 * 60 * 60 * 1000) => new Promise((ok, fail) => {
    if (caches.has(key)) {
        let cache = caches.get(key)
        if (!cache.isTimeout()) {
            global.isDebug && logger.debug(`[CAHCE] 使用缓存 ${key} （超时 ${new Date(cache.expire)}）`)
            return ok(cache.value)
        }
    }

    global.isDebug && logger.debug(`[CACHE] 即将计算缓存 ${key} 的值...`)
    Promise.resolve(provider.apply())
        .then(d => {
            let cache = new Cache(key, expireTime)
            cache.value = d
            caches.set(key, cache)
            global.isDebug && logger.debug(`[CACHE] 添加缓存 ${key} 超时=${new Date(cache.expire)}`)

            ok(d)
        })
        .catch(e => {
            logger.error(`[CACHE] 计算 ${key} 值出错`, e)
            fail(e)
        })
})
