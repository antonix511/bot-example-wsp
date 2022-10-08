require('dotenv').config();
const fs = require('fs');
const {isValidNumber} = require('./utils/numbers');
const qrCode = require('qrcode-terminal');
const {Client, LocalAuth, MessageMedia} = require('whatsapp-web.js');
const {firstSession, existSession, authFailed} = require('./controllers/sessionHandler');
const {printQrTerminal} = require('./controllers/qrHandler');
const {msgHandler} = require('./controllers/messageHandler');

const listenMessages = () => client.on('message', async msg => {
    const {from, body, hasMedia} = msg;

    if (!isValidNumber(from)) return ;

    if (from === 'status@broadcast') return ;

    if (hasMedia) {
        // Incluir hasmedia
        console.log('tiene archivo!');
    } else {
        await msgHandler(client, from, body);
    }
});

client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {headless: true}
});

client.on('qr', qr => {
    printQrTerminal(qr);
});

client.on('authenticated', () => {
    console.log('Autenticado!');
})

client.on('auth_failure', () => {
    console.log('Error de autenticación, volver a generar QR');
});

client.on('ready', () => {
    console.log('Cliente esta listo!');
    listenMessages();
})

client.initialize();

