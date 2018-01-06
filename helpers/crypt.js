
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const xml2js = require('xml2js');
const myXml2jsHelper = require('./myXml2js');
const xml2jsBuilderForceCData = new myXml2jsHelper.Builder({rootName: 'xml', cdata: true, headless: true});
const xml2jsBuilder = new xml2js.Builder({rootName: 'xml', cdata: true, headless: true});
const xml2jsParser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: true });

const WECHAT_PAY_KEY = process.env.WECHAT_PAY_KEY || '';
const WECHAT_OPEN_APP_ID = process.env.WECHAT_OPEN_APP_ID || '';
const WECHAT_OPEN_ENCODE_KEY = process.env.WECHAT_OPEN_ENCODE_KEY || '';
const CRYPTO_AES_KEY = new Buffer(WECHAT_OPEN_ENCODE_KEY + '=', 'base64');
const CRYPTO_IV = CRYPTO_AES_KEY.slice(0, 16);


const ParseJsonFromXml = exports.ParseJsonFromXml = (xml, callback) => {
    xml2jsParser.parseString(xml, (err, result) => {
        callback(err, result.xml);
    });
}

const GetXmlFromJson = exports.GetXmlFromJson = (json) => {
    return xml2jsBuilder.buildObject(json);
}

const GetXmlFromJsonForceCData = exports.GetXmlFromJsonForceCData = (json) => {
    return xml2jsBuilderForceCData.buildObject(json);
}

const PasswordCrypt = exports.PasswordCrypt = (password) => {
    return bcrypt.hashSync(password, bcrypt.genSaltSync());
}

const PasswordCompare = exports.PasswordCompare = (param) => {
    return bcrypt.compareSync(param.passwordAuth, param.passwordCrypt);
}

const ParseDecryptMsg = exports.ParseDecryptMsg = (param, callback) => {
    console.log('[CALL] ParseDecryptMsg, param:');
    console.log(param);
    
    ParseJsonFromXml(param.msg, (err, result) => {
        const decryptData = DecryptMsg(result.Encrypt);
        ParseJsonFromXml(decryptData, callback);
    });
}

const CreateEncryptMsg = exports.CreateEncryptMsg = (param) => {
    console.log('[CALL] CreateEncryptMsg, param:');
    console.log(param);
    
    const msgXml = GetXmlFromJsonForceCData(param.msg);
    const encryptData = EncryptMsg(msgXml);
    const msgSignatureArray = new Array(
        param.token, 
        param.timestamp, 
        param.nonce, 
        encryptData
    );
    const msgEncryptJson = {
        Encrypt: encryptData,
        MsgSignature: EncryptSha1(msgSignatureArray.sort().join('')),
        TimeStamp: param.timestamp,
        Nonce: param.nonce
    };
    console.log('[CALLBACK] CreateEncryptMsg, msg:');
    console.log(msgEncryptJson);
    return GetXmlFromJsonForceCData(msgEncryptJson);
}

const EncryptString = exports.EncryptString = (param) => {
    console.log('[CALL] EncryptString, param:');
    console.log(param);

    let strEncrypt = new Buffer(param);
    strEncrypt = strEncrypt.toString('base64');
    strEncrypt = strEncrypt.replace('/\+/g', '-');
    strEncrypt = strEncrypt.replace('/\//g', '_');

    console.log('[CALLBACK] EncryptString, string:');
    console.log(strEncrypt);
    return strEncrypt;
}

const DecryptString = exports.DecryptString = (param) => {
    console.log('[CALL] DecryptString, param:');
    console.log(param);
    
    param = param.replace('/\-/g', '+');
    param = param.replace('/\_/g', '/');
    const strDecrypt = new Buffer(param, 'base64')
    strDecrypt = strDecrypt.toString('utf-8');

    console.log('[CALLBACK] DecryptString, string:');
    console.log(strDecrypt);
    return strDecrypt;
}

const WechatPaySign = exports.WechatPaySign = (param) => {
    console.log('[CALL] WechatPaySign, param:');
    console.log(param);
    
    let keys = Object.keys(param);
    keys = keys.sort()
    let newArgs = {};
    keys.forEach(function (key) {
        newArgs[key] = param[key];
    });

    let stringSign = '';
    for (let k in newArgs) {
        stringSign += '&' + k + '=' + newArgs[k];
    }
    stringSign = stringSign.substr(1);
    stringSign += '&key=' + WECHAT_PAY_KEY;

    console.log('[CALLBACK] WechatPaySign, stringSign:');
    console.log(stringSign);
    return EncryptMd5(stringSign);
}

const RandomBytes = exports.RandomBytes = (byte) => {
    return crypto.pseudoRandomBytes(byte);
}

const EncryptMsg = (msgDecrypt) => {

    if( !msgDecrypt ) {
        return new Error('msgDecrypt is empty');
    }

    const msg_content = new Buffer(msgDecrypt);
    const msg_len = new Buffer(4);
    msg_len.writeUInt32BE(msg_content.length, 0);
    const msg_appId = new Buffer(WECHAT_OPEN_APP_ID);
    const msg = Buffer.concat([RandomBytes(16), msg_len, msg_content, msg_appId]);

    const cipher = crypto.createCipheriv('aes-256-cbc', CRYPTO_AES_KEY, CRYPTO_IV);
    const msgEncrypt = Buffer.concat([cipher.update(msg), cipher.final()]).toString('base64');

    return msgEncrypt;
}

const DecryptMsg = (msgEncrypt) => {

    if( !msgEncrypt ) {
        return new Error('msgEncrypt is empty');
    }

    const decipher = crypto.createDecipheriv('aes-256-cbc', CRYPTO_AES_KEY, CRYPTO_IV);
    decipher.setAutoPadding(false);
    const decipheredBuff = Buffer.concat([decipher.update(msgEncrypt, 'base64'), decipher.final()]);

    const msg = DecodePKCS7(decipheredBuff).slice(16);
    const msg_len = msg.slice(0, 4).readUInt32BE(0);
    const msg_content = msg.slice(4, msg_len + 4).toString('utf-8');
    const msg_appId =msg.slice(msg_len + 4).toString('utf-8');

    return msg_content;
}

const EncodePKCS7 = (buff) => {
    const blockSize = 32;
    const strSize = buff.length;
    const amountToPad = blockSize - (strSize % blockSize);
    const pad = new Buffer(amountToPad-1);
    pad.fill(String.fromCharCode(amountToPad));
    return Buffer.concat([buff, pad]);
}

const DecodePKCS7 = (buff) => {
    let pad = buff[buff.length - 1];
    if (pad < 1 || pad > 32) {
        pad = 0;
    }
    return buff.slice(0, buff.length - pad);
}

const EncryptSha1 = (data) => {

    const hash = crypto.createHash('sha1');
    hash.update(data);
    return hash.digest('hex').toUpperCase();
}

const EncryptMd5 = (data) => {

    const hash = crypto.createHash('md5');
    hash.update(data);
    return hash.digest('hex').toUpperCase();
}
