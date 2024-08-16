const { initServer, logger, success, D, appConfig } = require("@app-meta/basic-service")

initServer({port: 10000}, app => {

    app.get("/time", (req, res)=>{
        logger.info(`获取当前时间...`, appConfig.custom)
        res.send(success(D.datetime()))
    })

    app.post("/list", async (req, res)=>{
        logger.info(`列表查询`, req.body)
        let result = success([{name:"集成显卡"}])
        result.total = 47

        res.send(result)
    })
})
