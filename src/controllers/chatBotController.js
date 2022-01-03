const addUrl = require("node-fetch");
const res = require("express/lib/response");
const request = require("request");
const chanel = "instagram";
const MY_FB_PAGE_TOKEN = "";
const MY_VERIFY_TOKEN = "";
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
let postWebhook = (req, res) => {
    // Parse the request body from the POST
    let body = req.body;
    // Check the webhook event is from a Page subscription
    if(body.object === 'instagram') {
        // Iterate over each entry - there may be multiple if batched
        body.entry.forEach(function (entry) {
            // Gets the body of the webhook event
            let webhook_event = entry.messaging[0];
            // Get the sender PSID
            let sender_psid = webhook_event.sender.id;
            // Check if the event is a message or postback and
            // pass the event to the appropriate handler function
            if (webhook_event.message) {
                handleMessage(sender_psid, webhook_event.message);
            }
        });
        // Return a '200 OK' response to all events
        res.status(200).send('EVENT_RECEIVED');
        
    }
     else {
        // Return a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
    }
};
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
async function handleMessage(sender_psid, received_message) {

    var user = await getIGusername(sender_psid);


    //Check if the message contains text
    if (user != "undefined") {

        addUrl(`https://node-red-yrbsr-2021-11-03.mybluemix.net/instagram?mensage=${received_message.text}&usuario=${user}&session=${sender_psid}&origem=${chanel}`)
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
async function callSendAPI(sender_psid, response) {
    // Construct the message body
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    }

    // Send the HTTP request to the Messenger Platform
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
module.exports = {
    postWebhook: postWebhook,
    getWebhook: getWebhook
};