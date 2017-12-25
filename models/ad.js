
const mongoose = require('mongoose');


const adSchema = new mongoose.Schema({

    createDate: { type: Date, default: new Date() },

    isDefault: Boolean,
    aderId: mongoose.Schema.Types.ObjectId,
    type: String, //'WECHAT_MP'
    payout: Number,
    income: Number,

    partnerList: {
        type: String, //'ALL', 'WHITE', 'BLACK'
        partnerIds: [ mongoose.Schema.Types.ObjectId ]
    }

    wechatMpInfo: {
        type: String, //'AUTH', 'API'

        count: Number,
        state: String, //'OPEN', 'SUCCESS', 'FAIL'

        appid: String,
        qrcode_url: String,
        service_type: Number,
        verify_type: Number,
        access_token: String,
        expires_in: Date,
        refresh_token: String,
        nick_name: String,
        user_name: String
    }
});

const adModel = mongoose.model('ad', adSchema);

