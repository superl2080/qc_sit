
const request = require('request');


const MakeCData = exports.MakeCData = (str) => {
    return '<![CDATA[' + str + ']]>';
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
