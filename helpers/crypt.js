
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const xml2js = require('xml2js');
const xml2jsBuilder = new xml2js.Builder({rootName: 'xml', cdata: true, headless: true});
const xml2jsParser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: true });

const CRYPTO_AES_KEY = new Buffer(process.env.WECHAT_OPEN_ENCODE_KEY + '=', 'base64');
const CRYPTO_IV = CRYPTO_AES_KEY.slice(0, 16);


const ParseJsonFromXml = exports.ParseJsonFromXml = (xml, callback) => {
    xml2jsParser.parseString(xml, callback);
}

const GetXmlFromJson = exports.GetXmlFromJson = (json) => {
    return xml2jsBuilder.buildObject(json);
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
        const decryptData = DecryptMsg(result.xml.Encrypt);
        ParseJsonFromXml(decryptData, (err, result) => {
            console.log('[CALLBACK] ParseDecryptMsg, msg:');
            callback(err, result.xml);
        });
    });
};

const CreateEncryptMsg = exports.CreateEncryptMsg = (param) => {
    console.log('[CALL] CreateEncryptMsg, param:');
    console.log(param);
    
    const msgXml = GetXmlFromJson(param.msg);
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
    return GetXmlFromJson(msgEncryptJson);
};

const DecryptMsg = (msgEncrypt) => {

    if( !msgEncrypt ) {
        return new Error('msgEncrypt is empty');
    }

    let decipheredBuff = DecryptAes256Cbc({ data: msgEncrypt, aesKey: CRYPTO_AES_KEY, aesIv: CRYPTO_IV });
    decipheredBuff = DecodePKCS7(decipheredBuff);

    let msg = decipheredBuff.slice(16);
    let msg_len = msg.slice(0, 4).readUInt32BE(0);
    let msg_content = msg.slice(4, msg_len + 4).toString('utf-8');
    let msg_appId =msg.slice(msg_len + 4).toString('utf-8');

    return msg_content;
};

const EncryptMsg = (msgDecrypt) => {

    if( !msgDecrypt ) {
        return new Error('msgDecrypt is empty');
    }

    let random16 = RandomBytes(16);
    let msg_content = new Buffer(msgDecrypt);
    let msg_len = new Buffer(4);
    msg_len.writeUInt32BE(msg_content.length, 0);
    let msg_appId = new Buffer(process.env.WECHAT_OPEN_APP_ID);
    let raw_msg = Buffer.concat([random16, msg_len, msg_content, msg_appId]);

    let msgEncrypt = EncryptAes256Cbc({ data: raw_msg, aesKey: CRYPTO_AES_KEY, aesIv: CRYPTO_IV });

    return msgEncrypt;
};

const RandomBytes = (byte) => {
    return crypto.pseudoRandomBytes(byte);
}

const DecodePKCS7 = (buff) => {
    let pad = buff[buff.length - 1];
    if (pad < 1 || pad > 32) {
        pad = 0;
    }
    return buff.slice(0, buff.length - pad);
}

const EncodePKCS7 = (buff) => {
    const blockSize = 32;
    const strSize = buff.length;
    const amountToPad = blockSize - (strSize % blockSize);
    const pad = new Buffer(amountToPad-1);
    pad.fill(String.fromCharCode(amountToPad));
    return Buffer.concat([buff, pad]);
}

const DecryptAes256Cbc = (param) => {

    const decipher = crypto.createDecipheriv('aes-256-cbc', param.aesKey, param.aesIv);
    decipher.setAutoPadding(false);
    return Buffer.concat([decipher.update(param.data, 'base64'), decipher.final()]);
}

const EncryptAes256Cbc = (param) => {

    const cipher = crypto.createCipheriv('aes-256-cbc', param.aesKey, param.aesIv);
    return Buffer.concat([cipher.update(param.data), cipher.final()]).toString('base64');
}

const EncryptSha1 = (data) => {

    const hash = crypto.createHash('sha1');
    hash.update(data);
    return hash.digest('hex');
}
