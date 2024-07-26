const { initServer, logger, success, D } = require("@app-meta/basic-service")

initServer({port: 10000}, (app, config)=>{

    app.get("/time", (req, res)=>{
        logger.debug(`获取当前时间...`)
        res.send(success(D.datetime()))
    })

    app.post("/list", async (req, res)=>{
        logger.debug(`列表查询`, req.body)
        let result = success([{name:"集成显卡"}])
        result.total = 47

        res.send(result)
    })
})
