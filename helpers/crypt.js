
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const xml2js = require('xml2js');
const xml2jsBuilder = new xml2js.Builder();
const xml2jsParser = new xml2js.Parser();


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

const RandomBytes = exports.RandomBytes = (byte) => {
    return crypto.pseudoRandomBytes(byte);
}

const DecodePKCS7 = exports.DecodePKCS7 = (buff) => {
    let pad = buff[buff.length - 1];
    if (pad < 1 || pad > 32) {
        pad = 0;
    }
    return buff.slice(0, buff.length - pad);
}

const EncodePKCS7 = exports.EncodePKCS7 = (buff) => {
    const blockSize = 32;
    const strSize = buff.length;
    const amountToPad = blockSize - (strSize % blockSize);
    const pad = new Buffer(amountToPad-1);
    pad.fill(String.fromCharCode(amountToPad));
    return Buffer.concat([buff, pad]);
}

const DecryptAes256Cbc = exports.DecryptAes256Cbc = (param) => {

    const decipher = crypto.createDecipheriv('aes-256-cbc', param.aesKey, param.aesIv);
    decipher.setAutoPadding(false);
    return Buffer.concat([decipher.update(param.data, 'base64'), decipher.final()]);
}

const EncryptAes256Cbc = exports.EncryptAes256Cbc = (param) => {

    const cipher = crypto.createCipheriv('aes-256-cbc', param.aesKey, param.aesIv);
    return Buffer.concat([cipher.update(param.data), cipher.final()]).toString('base64');
}

const EncryptSha1 = exports.EncryptSha1 = (data) => {

    const hash = crypto.createHash('sha1');
    hash.update(data);
    return hash.digest('hex');
}
