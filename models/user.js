
const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;


var userSchema = new mongoose.Schema({

    createDate:             { type: Date,               default: new Date() },
    authId: {
        wechatId:           { type: String,             index: true },
    },
    
    info: {
        lastDate:           { type: Date,               default: new Date() },
        loginTimes:         { type: Number,             default: 1 },
        signType:           String, //'WECHAT'
        nickname:           String,
        sex:                Number, // 0: none, 1: male, 2: female
        city:               String,
        province:           String,
        country:            String,
        tags:               [String]
    }
});

const userModel = mongoose.model('user', userSchema);

