require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const fs = require('fs');
const axios = require('axios');
const shelljs = require('shelljs');
const mongoose = require('mongoose');
const cors = require('cors');
const connUri = "mongodb+srv://ypritwani:Yash2904%40@knowledgehub-database-zu4vn.mongodb.net/Creato9?retryWrites=true&w=majority";
const config = require('./config.json');
const { Client } = require('whatsapp-web.js');
const app = express();
const SESSION_FILE_PATH = process.env.SESSION_FILE_PATH || './session.json';

let sessionCfg;
if (fs.existsSync(SESSION_FILE_PATH)) {
    sessionCfg = require(SESSION_FILE_PATH);
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

mongoose.promise = global.Promise;
mongoose.connect(connUri, { useNewUrlParser: true});

const connection = mongoose.connection;
connection.once('open', () => console.log('MongoDB connection established successfully!'));
connection.on('error', (err) => {
    console.log("MongoDB connection error." + err);
    process.exit();
});

process.title = "whatsapp-node-api";
global.client = new Client({
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--unhandled-rejections=strict'
    ]},
    session: sessionCfg
});

global.authed = false;

const port = process.env.PORT || config.port;
//Set Request Size Limit 50 MB
app.use(bodyParser.json({ limit: '50mb' }));

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

client.on('qr', qr => {
    console.log("qr");
    fs.writeFileSync('./components/last.qr', qr);
});


client.on('authenticated', (session) => {
    console.log("AUTH!");
    if (session) {
        sessionCfg = session;

        fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
            if (err) {
                console.error(err);
            }
            authed = true;
        });
    } else {
        authed = true;
    }

    try {
        fs.unlinkSync('./components/last.qr')
    } catch(err) {}
});

client.on('auth_failure', () => {
    console.log("AUTH Failed !")
    sessionCfg = ""
    process.exit()
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', async msg => {
    if (config.webhook.enabled) {
        if (msg.hasMedia) {
            const attachmentData = await msg.downloadMedia()
            msg.attachmentData = attachmentData
        }
        axios.post(config.webhook.path, { msg })
    }
})
client.on('disconnected', () => {
    console.log("disconnected");
});
client.initialize();

const chatRoute = require('./components/chatting');
const groupRoute = require('./components/group');
const authRoute = require('./components/auth');
const contactRoute = require('./components/contact');

app.use(function(req, res, next){
    console.log(req.method + ' : ' + req.path);
    next();
});
app.use('/chat',chatRoute);
app.use('/group',groupRoute);
app.use('/auth',authRoute);
app.use('/contact',contactRoute);
app.get('/' , async (req,res) =>{
    res.send("successfully running server")
})

app.listen(port, () => {
    console.log("Server Running Live on Port : " + port);
});
