const qrCode = require('qrcode-terminal');

const printQrTerminal = (qr) => {
    console.log('QR Generado', qr);
    qrCode.generate(qr, {small: true})
}

module.exports = {printQrTerminal}