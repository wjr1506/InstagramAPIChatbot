const addUrl = require("node-fetch");
const res = require("express/lib/response");
const request = require("request");
const chanel = "instagram";
const MY_FB_PAGE_TOKEN = "";
const MY_VERIFY_TOKEN = "";

//Verificar Webhook

let getWebhook = (req, res) => {
    // Your verify token. Should be a random string.
    let VERIFY_TOKEN = MY_FB_PAGE_TOKEN;

    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    // Checks if a token and mode is in the query string of the request
    if (mode && token) {

        // Checks the mode and token sent is correct
        if (mode === 'subscribe' && token === MY_VERIFY_TOKEN) {

            // Responds with the challenge token from the request
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);

        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }
};

//Verificar Menssagem

let postWebhook = (req, res) => {
    let body = req.body;
    if(body.object === 'instagram') {
        body.entry.forEach(function (entry) {
            let webhook_event = entry.messaging[0];
            let sender_psid = webhook_event.sender.id;
            if (webhook_event.message) {
                handleMessage(sender_psid, webhook_event.message);
            }
        });
        res.status(200).send('EVENT_RECEIVED');
        
    }
     else {
        res.sendStatus(404);
    }
};

//Obter nome usuário IG

let getIGusername = (sender_psid) => {
    return new Promise((resolve, reject) => {
        let uri = `https://graph.facebook.com/${sender_psid}?IGUser&access_token=${MY_FB_PAGE_TOKEN}`;

        request({
            "uri": uri,
            "method": "GET",

        }, (err, res, body) => {
            if (!err) {
                body = JSON.parse(body)
                let username = `${body.name}`
                console.log(username)
                resolve(username);
            } else {
                reject("Unable to send message:" + err);
            }
        });
    });
};

//Tratamento de mensagens

async function handleMessage(sender_psid, received_message) {

    var user = await getIGusername(sender_psid);
    
    if (user != "undefined") {

        addUrl(`url/instagram?mensage=${received_message.text}&usuario=${user}&session=${sender_psid}&origem=${chanel}`)
            .then(res => res.json()).then(json => {
                console.log(json)
                json.forEach((item, index) => {
                    if (item.text) {
                        //listas
                        if (item.text.length > 110) {
                            console.log(item.tex)
                            let response = { "text": item.text }
                            setTimeout(() => { callSendAPI(sender_psid, response) }, 1500);
                        }//penultima mensagem
                        else if (item.text == "Se desejar que eu faça mais alguma pesquisa 🔎 digite *Video* ou *Corrigir*.") {
                            let response = { "text": "Se desejar que eu faça mais alguma pesquisa 🔎 digite *Video* ou *Corrigir*." }
                            setTimeout(() => { callSendAPI(sender_psid, response) }, 1900);
                        }//mensagens normais
                        else if (item.text.length < 109) {
                            console.log(item.text)
                            let response = { "text": item.text }
                            setTimeout(() => { callSendAPI(sender_psid, response) }, 100);
                        }
                    }
                    //ultima mensagem
                    if (item.title) {
                        let response =
                        {
                            "text": "📲 Opções ou digite o que desejar !",
                            "quick_replies": [
                                {
                                    "content_type": "text",
                                    "title": "Vídeo de treinamento",
                                    "payload": "Vídeo de treinamento",
                                }, {
                                    "content_type": "text",
                                    "title": "Corrigir um problema",
                                    "payload": "Corrigir um problema",
                                }, {
                                    "content_type": "text",
                                    "title": "Falar com consultor",
                                    "payload": "Falar com consultor",
                                }
                            ]
                        }
                        setTimeout(() => { callSendAPI(sender_psid, response) }, 2500);
                    }
                });
            })
    }
}

//Concatenar com cabeçalho

async function callSendAPI(sender_psid, response) {
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    }
    request({
        "uri": "https://graph.facebook.com/v12.0/me/messages",
        "qs": { "access_token": MY_FB_PAGE_TOKEN },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            console.log('message sent!')
        } else {
            console.error("Unable to send message:" + err);
        }
    });
}

//exportar arquivo
module.exports = {
    postWebhook: postWebhook,
    getWebhook: getWebhook
};
