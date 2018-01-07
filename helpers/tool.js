
const request = require('request');
const cryptHelper = require('./crypt');


const CreateTimeStamp = exports.CreateTimeStamp = (date) => {
    
    return parseInt(date.getTime() / 1000).toString();
}

const CreateExpiresInDate = exports.CreateExpiresInDate = (expires_in) => {
    let expiresInDate = new Date();
    expiresInDate.setTime(expiresInDate.getTime() + expires_in * 1000 - 5 * 60 * 1000);
    return expiresInDate;
}

const CheckExpiresInDate = exports.CheckExpiresInDate = (expiresInDate) => {
    let currentDate = new Date();
    return currentDate.getTime() < expiresInDate.getTime();
}

const PostJson = exports.PostJson = (param, callback) => {

    let option = {
        url: param.url,
        method: 'POST',
        headers: {  
            'content-type': 'application/json'
        },
        json: param.json
    };

    console.log('[CALL] PostJson, post:');
    console.log(option);
    request.post(option, function(err, ret, body) {
        console.log('[CALLBACK] PostJson, post return:');
        console.log(body);
        if( err 
            || !ret.statusCode
            || ret.statusCode != 200
            || !body ) {
            callback(err || new Error('post return is error'));
        } else {
            callback(null, body);
        }
    });
}

const PostXml = exports.PostXml = (param, callback) => {

    let option = {
        url: param.url,
        method: 'POST',
        headers: {  
            'content-type': 'text/xml;charset=UTF-8'
        },
        body: cryptHelper.GetXmlFromJson(param.xml)
    };

    console.log('[CALL] PostXml, post:');
    console.log(option);
    request.post(option, (err, ret, body) => {
        console.log('[CALLBACK] PostXml, post return:');
        console.log(body);
        if( err 
            || !ret.statusCode
            || ret.statusCode != 200
            || !body ) {
            callback(err || new Error('post return is error'));
        } else {
            cryptHelper.ParseJsonFromXml(body, callback);
        }
    });
}

const GetJson = exports.GetJson = (param, callback) => {

    let option = {
        url: param.url
    };

    console.log('[CALL] GetJson, get:');
    console.log(option);
    request.get(option, (err, ret, body) => {
        console.log('[CALLBACK] GetJson, get return:');
        if( err 
            || !ret.statusCode
            || ret.statusCode != 200
            || !body ) {
            callback(err || new Error('get return is error'));
        } else {
            callback(null, body);
        }
    });
}
