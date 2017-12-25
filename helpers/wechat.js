
const operatorConfigModel = require('../models/operatorConfig');
const cryptHelper = require('./crypt');

const WECHAT_OPEN_APP_ID = process.env.WECHAT_OPEN_APP_ID;
const WECHAT_OPEN_APP_SECRET = process.env.WECHAT_OPEN_APP_SECRET;
const WECHAT_OPEN_ENCODE_KEY = process.env.WECHAT_OPEN_ENCODE_KEY;


const CRYPTO_AES_KEY = new Buffer(WECHAT_OPEN_ENCODE_KEY + '=', 'base64');
const CRYPTO_IV = CRYPTO_AES_KEY.slice(0, 16);

const Decrypt = exports.Decrypt = (msgEncrypt) => {
    console.log('[CALL] Decrypt, msgEncrypt:');
    console.log(msgEncrypt);

    if( !msgEncrypt ) {
        return new Error('msgEncrypt is empty');
    }

    let decipheredBuff = cryptHelper.DecryptAes256Cbc({ data: msgEncrypt, aesKey: CRYPTO_AES_KEY, aesIv: CRYPTO_IV });
    decipheredBuff = cryptHelper.DecodePKCS7(decipheredBuff);

    let msg = decipheredBuff.slice(16);
    let msg_len = msg.slice(0, 4).readUInt32BE(0);
    let msg_content = msg.slice(4, msg_len + 4).toString('utf-8');
    let msg_appId =msg.slice(msg_len + 4).toString('utf-8');

    console.log('[CALLBACK] Decrypt, msg_content:');
    console.log(msg_content);
    return msg_content;
};

const Encrypt = exports.Encrypt = (msgDecrypt) => {
    console.log('[CALL] Encrypt, msgDecrypt:');
    console.log(msgDecrypt);

    if( !msgDecrypt ) {
        return new Error('msgDecrypt is empty');
    }

    let random16 = cryptHelper.RandomBytes(16);
    let msg_content = new Buffer(msgDecrypt);
    let msg_len = new Buffer(4);
    msg_len.writeUInt32BE(msg_content.length, 0);
    let msg_appId = new Buffer(WECHAT_OPEN_APP_ID);
    let raw_msg = Buffer.concat([random16, msg_len, msg_content, msg_appId]);

    raw_msg = cryptHelper.EncodePKCS7(raw_msg);
    let msgEncrypt = cryptHelper.EncryptAes256Cbc({ data: raw_msg, aesKey: CRYPTO_AES_KEY, aesIv: CRYPTO_IV });

    console.log('[CALLBACK] Encrypt, msgEncrypt:');
    console.log(msgEncrypt);
    return msgEncrypt;
};
 
const UpdateTicket = exports.UpdateTicket = (newTicket, callback) => {
    operatorConfigModel.UpdateTicket(newTicket, callback);
}

