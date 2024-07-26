const mysql = require('mysql2/promise')
const logger = require('./logger')

const AT    = "@"
const UNDER = "_"
const DESC  = Array.of("1", "DESC")

/**
 * @typedef {Object} Pagination - 分页参数
 * @property {Number} page - 当前页
 * @property {Number} pageSize - 每页数据量
 */

/**@type {mysql.Pool} */
let pool

/**
 * 执行 SQL 语句
 * @param {String} sql
 * @param {*} params
 * @returns {Array[]}
 */
const query = (sql, params)=> {
    if(!pool)  throw Error(`数据库连接未创建，请配置 useDB、dbName 属性...`)
    if(!global.isPro)   logger.debug("[SQL]", sql, "[PARAMS]",Array.isArray(params)?(`${params[0]} (+${params.length})`):(params||"（无）"))

    // return conn.query(sql, params.length == 1 && Array.isArray(params[0]) ? params[0] : params)
    return pool.query(sql, params)
    // return pool.execute(sql, params==undefined || Array.isArray(params)? params:[params])
}

/**
 * 直接返回结果
 * @param {*} sql 
 * @param {*} params 
 * @returns 
 */
const select = async (sql, params)=>{
    let [ rows ] = await query(sql, params)
    return rows
}

/**
 * 返回指定的sql结果数量
 * @param {String} table - 表名
 * @param {String} condition - 条件 SQL
 * @returns {Number}
 */
const count = async (table, condition, params) => {
    let [ results ] = await query(`SELECT COUNT(*) as size FROM ${table} ${condition?("WHERE "+condition):""}`, params)
    return Number(results[0].size)
}

exports.query = query
exports.select = select

/**
 * 
 * @param {import('.').ServerConfig} config
 * @returns {Object}
 */
exports.mysqlBuilder = config=> {
    if(!!pool)  return

    const cfg = {
        host: config.dbHost || '127.0.0.1',
        port: config.dbPort || 3306,
        user: config.dbUser || 'root',
        password: config.dbPwd || '',
        database: config.dbName,

        multipleStatements: true, 
        ssl: false,
        connectTimeout: 30*1000,
        waitForConnections: true,
        connectionLimit: 10,
        idleTimeout: 10 * 60 * 1000,
        enableKeepAlive: true
    }

    pool = mysql.createPool(cfg)

    return cfg
}

exports.count = count

/**
 * 按 ID 查询数据（单条）
 * @param {String} id
 * @param {String} table
 * @param {String} idField - ID字段名，默认 id
 * @returns {Object}
 */
exports.findById= async (id, table, idField="id")=>{
    let [ results ] = await query(`SELECT * FROM ${table} WHERE ${idField}=? LIMIT 1`, id)
    return results[0]
}

/**
 * 自定义 SQL 分页查询
 * @param {String} table 
 * @param {String} condition 
 * @param {Array|Number|String} params 
 * @param {Number} page 
 * @param {Number} pageSize 
 * @returns 
 */
exports.findByPageWithSQL = async (table, condition, params, page=1, pageSize=20)=>{
    let total = await count(table, condition, params)
    let data = []
    if(total > 0){
        if(!global.isPro)   logger.debug(`分页查询 TOTAL=`, total)
        let [ rows ]= await query(`SELECT * FROM ${table} ${condition?("WHERE "+condition):""} LIMIT ${(page-1) * pageSize}, ${pageSize}`, params)
        data = rows
    }
    return { data, total, success: true}
}

/**
 * 
 * @param {String} table 
 * @param {Object} form 
 * @param {Pagination} pagination 
 */
exports.findByPage = async (table, form, pagination)=>{
    pagination ??= { page:1, pageSize:20 }
    let sql = []
    let ps = []
    let sort = []
    
    const _push = (_sql, _v, special)=>{
        sql.push(_sql)
        ps.push(special===true? Number(_v):_v)
    }

    Object.keys(form).forEach(k=>{
        let t = k.split(UNDER)
        if(t.length < 2)
            return
        
        let v = form[k]
        if(v==null || v=="")    return

        let isSpecial = k.endsWith(UNDER) && !k.endsWith("__")
        switch (t[0].toUpperCase()) {
            case "LIKE":
                if(t.length == 2)
                    _push(`${t[1].replaceAll(AT, UNDER)} LIKE ?`, `%${v}%`)
                else{
                    let likes = []
                    for (let i = 1; i < t.length; i++){
                        likes.push(`${t[i].replaceAll(AT, UNDER)} LIKE ?`)
                        ps.push(`%${v}%`)
                    }
                    sql.push(`( ${likes.join(" OR ")} )`)
                }
                break
            case "EQ":
                _push(`${t[1]}=?`, v)
                break
            case "IN":
                let vs = []
                if(Array.isArray(v))
                    vs.push(...v)
                else
                    vs.push(v)
                _push(`${t[1]} in (?)`, vs)
                break
            case "LT":
                _push(`${t[1]}<?`, v, isSpecial)
                break
            case "LTE":
                _push(`${t[1]}<=?`, v, isSpecial)
                break
            case "GT":
                _push(`${t[1]}>?`, v, isSpecial)
                break
            case "GTE":
                _push(`${t[1]}>=?`, v, isSpecial)
                break
            case "NE":
                _push(`${t[1]}!=?`, v, isSpecial)
                break
            case "SORT":
                sort.push(`ORDER BY ${t.slice(1).join(",")} ${DESC.includes(v.toString())?"DESC":"ASC"}`)
                break
            default:
                break
        }
    })

    console.debug("分页查询：", sql, ps, sort)
    console.debug("分页参数：", pagination)

    return await this.findByPageWithSQL(
        table,
        (sql.join(" AND ")+" "+(sort.length?sort.join(","):"")).trim(),
        ps,
        pagination.page??1,
        pagination.pageSize??20
    )
}

/**
 * 保存数据到指定表
 * @param {Object} obj - 待保存对象（默认取全部的字段，排除_开头）
 * @param {String} table - 表名
 * @param {Array<String>} ignores - 忽略的字段
 * @returns
 */
exports.saveObjToTable = async (obj, table, ignores=[])=>{
    let fields = Object.keys(obj).filter(k=> !(k.startsWith("_")  || ignores.includes(k)))
    let [ results ] = await query(`INSERT INTO ${table} (${fields.join(",")}) VALUES (${fields.map(v=>'?').join(",")})`, fields.map(v=> obj[v]))

    return results
}

/**
 * 将对象保存到指定数据表
 * @param {Object} obj - 待保存对象（默认取全部的字段，排除_开头）
 * @param {String} table - 表名
 * @param {String} idField - 主键字段名
 * @param {Array<String>} ignores - 忽略的字段
 * @returns
 */
exports.updateObjToTable = async (obj, table, idField="id", ignores=[])=>{
    let fields = Object.keys(obj).filter(k=> !(k!=idField, k.startsWith("_")  || ignores.includes(k) || obj[k]===undefined))
    let [ results ] = await query(
        `UPDATE ${table} set ${fields.map(f=>`${f}=?`).join(",")} WHERE ${idField}=?`,
        fields.concat(idField).map(v=> obj[v])
    )
    return results
}

/**
 * 将对象的某个字段进行 JSON 处理
 * @param {Object} obj - 待处理对象
 * @param {Array<String>} fields - 待转换的属性清单
 * @param {Boolean} toString - 转换为字符串，false=反序列到JSON对象
 */
exports.dealJSONField = (obj, fields, toString = true)=> {
    if(typeof(obj) == 'object'){
        fields
            .filter(k=> k in obj)
            .forEach(k=> obj[k] = toString ? JSON.stringify(obj[k]) : JSON.parse(obj[k]))
    }
    return obj
}
