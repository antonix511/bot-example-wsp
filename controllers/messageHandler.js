const {cleanNumber} = require('../utils/numbers');
const {getByMail, getListProducts, getProductByCode} = require('../db/queries');
const DELAY_TIME = 170;

let pairNumberLastContext = [];
const retryMessages = {
    1: 'Ha excedido el máximo de intentos fallidos en un mensaje. Intente todo el proceso denuevo, gracias!!!',
    2: 'Por favor brinde un email válido.',
    3: 'No se ha recibido un comando válido, intente denuevo porfavor'
}
/*
    structure:
        -number
        -lastInteraction (datetime)
        -lastState
        -lastData
        -intents
 */
/*
    states: welcome, email_given, failed_email, given_list, get_product
 */
let commands = {
    welcome: '!correo',
    email_given_product: '!producto',
    email_given_list: '!lista'
};
/*
    Commands:
    - !email
    - !producto
    - !final?
 */

// Function to update lastInteraction and  intents by number given


const msgHandler = (client, from, body, hasMedia = null) => {
    let dataByNumber = pairNumberLastContext.filter(res => {
        return res.number === from;
    });
    let lastContext = (dataByNumber.length > 0) ? dataByNumber[0].lastState : null;

    if (lastContext === null) {
        // First interaction
        welcome(client, from)
    } else {
        switch (dataByNumber[0].lastState) {
            case 'welcome':
                /*
                    Last interaction was 'welcome', this is 'given_email'
                 */
                if (!body.startsWith(commands['welcome'])) {
                    errorMessage(client, from, 3);
                    break;
                }

                let filteredMsg = body.replace(commands['welcome'], "");

                let mailsObtained = filteredMsg.match(/([a-zA-Z0-9._+-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);

                if (mailsObtained === null) {
                    givenEmailRetry(client, from, 2);
                } else {
                    const uniqueEmail = Array.from(new Set(mailsObtained));
                    const finalUniqueEmail = [];
                    for (let i = 0; i <= uniqueEmail.length; i++) {
                        let characterIs = String(uniqueEmail[i]).charAt(String(uniqueEmail[i]).length - 1);
                        if (characterIs === '.') {
                            finalUniqueEmail.push(String(uniqueEmail[i].slice(0, -1)));
                        } else {
                            finalUniqueEmail.push(uniqueEmail[i]);
                        }
                    }

                    if (!finalUniqueEmail.length) {
                        givenEmailRetry(client, from, 2);
                        break;
                    }

                    mailsObtained = finalUniqueEmail[0];
                    getByMail(mailsObtained).then((result) => {
                        if (!result[0].length) {
                            sendMessage(client, from, 'Ese email no esta registrado!, ingrese un email que esté registrado.');
                        } else {
                            updateLastStateByNumber(from, 'email_given', {email: mailsObtained});

                            sendMessage(client, from, `Hola ${result[0][0].name}, quieres solicitar un producto? \n\n▶️Para solicitar un producto escriba el comando !lista\n\n▶️ Para pedir un producto !producto codigo_de_producto - !producto LA-12`);
                        }
                    }).catch((error) => {
                        sendMessage(client, from, 'Ha ocurrido un error inesperado');
                    });
                }
                break;
            case 'email_given':
                let filteredMessage;

                if (body.startsWith(commands['email_given_list'])) {

                    let text = 'Tenemos los siguientes productos:\n';

                    getListProducts()
                        .then((result) => {
                            let i = 1;
                            result[0].forEach((product) => {
                                text += `${i}. ${product.name} - Código: ${product.code} \n`;
                                i++;
                            });

                            (!result[0].length) ? text += 'No se encontraron productos disponibles' : null;

                            sendMessage(client, from, text);
                        })
                        .catch((error) => {
                            sendMessage(client, from, 'Ha ocurrido un error inesperado, intentelo denuevo porfavor.');
                        });
                    break;
                }

                if (body.startsWith(commands['email_given_product'])) {
                    filteredMessage = body.replace(commands['email_given_product'], '').trim();
                    getProductByCode(filteredMessage)
                        .then((result) => {
                            let text = '';
                            result[0].forEach((product) => {
                                text += `Ha solicitado: ${product.name}, confirme porfavor.`;
                            });
                            (!result[0].length) ? text += 'No se ha encontrado el producto solicitado, intente con otro código' : null;

                            sendMessage(client, from, text);
                        })
                        .catch((error) => {
                            sendMessage(client, from, 'Ha ocurrido un error, porfavor intentelo denuevo.');
                        });
                    break;
                }
                errorMessage(client, from, 3);
                break;
            default:
                console.log('default');
                break;
        }
    }
}

const sendMessage = (client, to, message) => {
    setTimeout(() => {
        let number = cleanNumber(to);
        client.sendMessage(number, message);
    }, DELAY_TIME);
}

const givenEmailRetry = (client, to, messageIndex) => {
    if (checkAttempts(client, to)) return;

    updateIntentsByNumber(to);

    sendMessage(client, to, retryMessages[messageIndex]);
}

const welcome = (client, to) => {
    pairNumberLastContext.push({
        number: to,
        lastInteraction: new Date(),
        lastState: 'welcome',
        lastData: null,
        intents: 0
    });

    setTimeout(() => {
        // let number = cleanNumber(to);
        let message = [
            'Hola, bienvenido al sistema de prueba.',
            'Bienvenido, este es un sistema de prueba.',
            'Que tal, este es el sistema de prueba',
        ];

        // PONER COMANDOS AQUI
        let lastMessage = '✅\n\n  Para poder realizar su consulta, brindeme su correo escribiendo !correo su_email_aqui. Ej: !correo prueba@gmail.com'
        sendMessage(client, to, message[Math.floor(Math.random() * message.length)] + lastMessage);
        // client.sendMessage(number, message[Math.floor(Math.random() * message.length)]);
    });
}

const checkAttempts = (client, to) => {
    let tmp = pairNumberLastContext.filter(tmp => {
        return tmp.number === to;
    });

    if (tmp[0].intents >= 3) {
        let index = pairNumberLastContext.indexOf((tmp) => {
            return tmp.number === to;
        });
        pairNumberLastContext.splice(index);
        sendMessage(client, to, retryMessages[1])
        return true;
    }
    return false;
}

const errorMessage = (client, to, msgIndex) => {
    // VALIDACION DE ATTEMPTS AQUI TAMBIEN
    checkAttempts(client, to);

    updateIntentsByNumber(to);

    sendMessage(client, to, retryMessages[msgIndex]);
}

const updateIntentsByNumber = (to) => {
    pairNumberLastContext.forEach((tmp) => {
        if (tmp.number === to) {
            tmp.intents++;
        }
    });
}

const updateLastStateByNumber = (to, newState, setData = null) => {
    pairNumberLastContext.forEach(tmp => {
        if (tmp.number === to) {
            tmp.lastState = newState;
            tmp.lastInteraction = new Date();
            if (setData !== null) tmp.lastData = setData;
        }
    })
}

module.exports = {msgHandler}