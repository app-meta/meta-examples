//定义全局变量
global.isPro = process.env.NODE_ENV === 'production'
global.isDebug = global.isDebug ??= !global.isPro

const { existsSync, statSync, readFileSync } = require('fs')

const logger = require("./logger")
const mysql = require("./mysql")
const date = require("./date")

const configFile = "config.json"
/**@type {ServerConfig} */
const config = {
    port: 9000,
    cors: !global.isPro,
    useDB: false,
    args: "",
    url: "",
    custom: {}
}

/**
 *
 * @param {*} data
 * @param {String} message
 * @returns
 */
const success = (data, message)=>({data, message, success:true})
/**
 *
 * @param {String} message
 * @param {*} data
 * @returns
 */
const error   = (message, data)=>({data, message, success:false})

/**
 * @typedef {Object} User
 * @property {String} id - 用户唯一ID
 * @property {String} name - 用户中文名
 * @property {String} longName - 完整用户名（ID+name）
 * @property {String} ip - 用户终端原始IP
 * @property {Array<String>} role - 用户权限
 */

/**
 * @typedef {Object} ServerConfig
 * @property {Number} port - 服务端口，默认9000
 * @property {String} url - 服务地址（仅当部署模式为外部时有值）
 * @property {Boolean} cors - 是否允许 CORS，开发模式下默认允许
 * @property {String} args - 启动参数
 * @property {Boolean} useDB - 是否启用数据库
 * @property {String} dbHost - 数据库地址
 * @property {String|Number} dbPort - 数据库端口
 * @property {String} dbName - 数据库名
 * @property {String} dbUser - 数据库登录用户名
 * @property {String} dbPwd - 数据库登录密码
 * @property {Object} custom - 自定义应用参数
 */

/**
 * @typedef {Object} InitedServer
 * @property {import('fastify').FastifyInstance} app
 * @property {Object} config
 */

/**
 * 定义路由初始化函数
 * @callback routesFunc
 * @param {import('fastify').FastifyInstance} app
 * @param {ServerConfig} config
 */

exports.assert = {
    hasText: (o, msg)=> {
        if(typeof(o) != 'string' || o.trim().length==0)
            throw msg || "参数不能为空"
    },
    isTrue: (o, msg)=> {
        if(o != true)
            throw msg || "表达式校验不通过"
    }
}
exports.success = success
exports.error = error
exports.logger = logger
exports.mysql   = mysql
exports.D = date
exports.sleep = time=> new Promise(ok=> setTimeout(ok, time))
exports.appConfig = config

/**
 * @param {ServerConfig} defaultConfig
 * @param {routesFunc} routesFunc
 * @returns {Promise<InitedServer>}
 */
exports.initServer = (defaultConfig, routesFunc)=> new Promise(async (ok, fail)=>{
    Object.assign(config, defaultConfig)

    if(existsSync(configFile) && statSync(configFile).isFile()){
        Object.assign(config, JSON.parse(readFileSync(configFile, { encoding: 'utf-8' })))
        if(global.isDebug){
            logger.info(`从${configFile}中读取配置文件`, config)
        }
    }

    if(config.useDB ===  true && !!config.dbName){
        const mysqlCfg = mysql.mysqlBuilder(config)
        if(global.isDebug)
            logger.info(`创建数据库连接池`, mysqlCfg)
        else
            logger.info(`创建数据库连接池： ${mysqlCfg.database}@${mysqlCfg.host||"localhost"} user=${mysqlCfg.user} port=${mysqlCfg.port}`)
    }

    const app = require('fastify')({
        disableRequestLogging: true,
        logger:false
    })

    /*
     * ==================== 添加请求参数处理，兼容 form、JSON ====================
     */
    // fastify 默认对 application/json 格式的请求头进行 JSON 化处理，如需自定义处理，请参考如下代码
    app.addContentTypeParser('application/json', { parseAs: 'string' }, function (req, body, done) {
        try {
            done(null, JSON.parse(body))
        } catch (err) {
            err.statusCode = 400
            done(err, undefined)
        }
    })

    // app.addContentTypeParser('application/x-www-form-urlencoded', function (request, payload, done) {
    //     let body = ''
    //     payload.on('data', d=>body += d)
    //     payload.on('end', ()=>{
    //         try {
    //             const parsed = require("querystring").parse(body)
    //             done(null, parsed)
    //         } catch (e) {
    //             done(e)
    //         }
    //     })
    //     payload.on('error', done)
    // })

    /*
     * ==================== 添加统一异常处理 ====================
     */
    app.setNotFoundHandler((req, res)=> res.status(404).send(error(`${req.url} NOT FOUND`)))
    app.setErrorHandler((e, req, res)=>{
        let msg = typeof(e) === 'string'?e:e.message
        logger.error(`[${req.routeOptions.url}]`, msg)
        res.status(200).send(error(msg))
    })

    /**
     * 增加用户信息读取，统一的格式为 {ID}-{用户名（URL编码）}-{IP}-{角色，多个以英文逗号隔开}
     *
     * req.routeOptions 对象示例
     * {
        method: 'GET',
        url: '/time',
        bodyLimit: 1048576,
        attachValidation: false,
        logLevel: '',
        exposeHeadRoute: true,
        prefixTrailingSlash: 'both',
        handler: [Function: bound ],
        version: undefined
     * }
     */
    app.addHook('preHandler', (req, res, done)=>{
        const route = req.routeOptions.url
        if(!!route){
            /**@type {String} */
            let ua = req.headers['ua']
            if(!!ua){
                let tmp = ua.split("-", 6)
                if(tmp.length>=3){
                    let id = tmp[0]
                    let name = decodeURIComponent(tmp[1])
                    /**@type {User} */
                    const user = { id,name,longName: `${name}(${id})`, ip: tmp[2], role: tmp[3]? tmp[3].split(",").map(v=>v.trim()) : [] }
                    req.user = user
                    global.isDebug && logger.debug(`[${route}] 解析用户信息`, user.longName, user.ip, user.role)
                }
                else
                    logger.debug(`[${route}] 无效的用户头部信息 ${ua}`)
            }
            // 配置原始 IP
            if(req.ip == '::1' && req.headers['origin_ip']){
                req.ip = req.headers['origin_ip']
                global.isDebug && logger.debug(`修正客户端 IP 为 ${req.ip}`)

            }
        }

        // 开启 CORS
        if(config.cors === true && !!route){
            res.header("Access-Control-Allow-Origin", req.headers.origin)
            res.header("Access-Control-Allow-Credentials", 'true')
            res.header("Access-Control-Allow-Headers", "*")
            res.header("Access-Control-Allow-Methods", "*")

            logger.debug(`启用 CORS 访问 >`, route)
        }
        done()
    })
    app.addHook('onSend', (req, res, payload, done)=>{
        //对于没有调用 Response.send 方法的路由函数，自动返回空结果
        if(payload === undefined){
            global.isDebug && logger.debug(`检测到 ${req.routeOptions.url} 处理函数返回空，自动填充 Result 对象...`)
            return done(null, JSON.stringify(success()))
        }
        done(null, payload)
    })

    if(config.cors === true){
        // 允许所有 OPTIONS 类型的请求（通常是浏览器的预检策略）
        app.options("/*", (req, res)=> res.send(0))
    }

    routesFunc(app, config)

    app.listen({ port: config.port }, (err) => {
        if (err) {
            logger.error(err)
            process.exit(1)
        }

        logger.info(`APP STARTED (PORT=${config.port})...`)
        ok({ config, app })
    })
})
