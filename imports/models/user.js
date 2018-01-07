
const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;


var userSchema = new mongoose.Schema({

    createDate:             { $type: Date,               default: new Date() },
    authId: {
        wechatId:           { $type: String,             index: true },
    },
    
    info: {
        lastDate:           { $type: Date,               default: new Date() },
        loginTimes:         { $type: Number,             default: 1 },
        signType:           String, //'WECHAT'
        nickname:           String,
        sex:                Number, // 0: none, 1: male, 2: female
        city:               String,
        province:           String,
        country:            String,
        tags:               [String]
    }
}, { typeKey: '$type' });

let userModel = null;
try {
    userModel = mongoose.model('user', userSchema);
} catch(err) {
    if (err.name === 'OverwriteModelError') {
        userModel = mongoose.model('user');
    }
}


const WechatLogin = exports.WechatLogin = (param, callback) => {
    if( !param
        || !param.wechatId ) {
        return callback(new Error('WechatLogin: param is error'));
    }

    userModel.findOne({ 'authId.wechatId': param.wechatId }, (err, user) => {
        if( err
            || !user ) {
            userModel.create({ 
                authId: {
                    wechatId: param.wechatId
                },
                info: {
                    signType: 'WECHAT',
                    tags: ['微信']
                }
            }, callback);
        } else {
            user.info.lastDate = new Date();
            user.info.loginTimes += 1;
            user.save(callback);
        }
    });
}

const UpdateUserInfo = exports.UpdateUserInfo = (param, callback) => {
    if( !param
        || !param.userId ) {
        return callback(new Error('UpdateUserInfo: param is error'));
    }

    userModel.findById(param.userId)
    .exec(function (err, user) {
        if( err ) {
            callback(new Error('UpdateUserInfo: can not find'));
        } else {
            user.info.nickname = param.nickname;
            user.info.sex = param.sex;
            user.info.city = param.city;
            user.info.province = param.province;
            user.info.country = param.country;
            if( user.info.sex == 1 ){
                if ( user.info.tags.indexOf('男') < 0 ) user.info.tags.push('男');
            } else if( user.info.sex == 2 ){
                if ( user.info.tags.indexOf('女') < 0 ) user.info.tags.push('女');
            }
            if ( user.info.tags.indexOf(user.info.city) < 0 ) user.info.tags.push(user.info.city);
            if ( user.info.tags.indexOf(user.info.province) < 0 ) user.info.tags.push(user.info.province);
            user.save(callback);
        }
    });
}
