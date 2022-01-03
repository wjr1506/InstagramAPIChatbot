const express = require ("express");
const chatBotController = require ("../controllers/chatBotController");
let router = express.Router();
let initWebRoutes = (app)=> {
    router.get("/webhook", chatBotController.getWebhook);
    router.post("/webhook", chatBotController.postWebhook);
    return app.use("/", router);
};
module.exports = initWebRoutes;