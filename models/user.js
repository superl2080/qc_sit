
const mongoose = require('mongoose');


var userSchema = new mongoose.Schema({

    createDate: { type: Date, default: new Date() },
    authId: {
        wechatId: String
    },
    
    info: {
        signType: String, //'WECHAT'
        lastDate: { type: Date, default: new Date() },
        loginTimes: { type: Number, default: 1 },
        nickname: String,
        sex: String,  //'NONE', 'MALE', 'FEMALE'
        city: String,
        province: String,
        country: String,
        tags: [String]
    }
});

const userModel = mongoose.model('user', userSchema);

