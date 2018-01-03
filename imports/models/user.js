
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
                    signType: 'WECHAT'
                }
            }, callback);
        } else {
            user.info.lastDate = new Date();
            user.info.loginTimes += 1;
            user.save(callback);
        }
    });
}
