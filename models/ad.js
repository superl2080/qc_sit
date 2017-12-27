
const mongoose = require('mongoose');
const aderModel = require('./ader');
const ObjectId = mongoose.Schema.Types.ObjectId;


const adSchema = new mongoose.Schema({

    createDate:             { type: Date,               default: new Date() },

    isDefault:              { type: Boolean,            default: false },
    aderId:                 { type: ObjectId,           required: true, index: true },
    type:                   { type: String,             required: true }, //'WECHAT_MP_AUTH', 'WECHAT_MP_API'
    state:                  { type: String,             default: 'CREATE' }, //'CREATE', 'OPEN', 'DELIVER', 'CLOSE'

    deliverInfo: {
        payout:             { type: Number,             required: true },
        income:             { type: Number,             required: true },
        count:              Number,
        partnerType:        { type: String,             default: 'ALL' }, //'ALL', 'WHITE', 'BLACK'
        partnerIds:         [ ObjectId ],
        userType:           { type: String,             default: 'ALL' }, //'ALL', 'WHITE', 'BLACK'
        userTags:           [ String ]
    },

    wechatMpAuthInfo: {
        appid:              String,
        qrcode_url:         String,
        auth:               Boolean,
        service_type:       Number,
        verify_type:        Number,
        access_token:       String,
        expires_in:         Date,
        refresh_token:      String,
        nick_name:          String,
        user_name:          String
    },

    wechatMpApiInfo: {
        channel:            String //'YOUFENTONG', 'YUNDAI'
    }
});

try {
    const adModel = mongoose.model('ad', adSchema);
} catch(err) {
    if (err.name === 'OverwriteModelError') {
        const adModel = mongoose.model('ad');
    }
}


const CreateAuthAd = exports.CreateAuthAd = (param, callback) => {
    if( !param ||
        !param.aderId ) {
        callback(new Error('param is error'));
        return ;
    }

    aderModel.GetAderById({ aderId: param.aderId }, (err, ader) => {
        if( !ader ||
            ader.balance <= 0 ) {
            callback(new Error('ader is not OK'));
            return ;
        }

        adModel.create({ 
            aderId: param.aderId,
            type: 'WECHAT_MP_AUTH',
            deliverInfo: {
                payout: ader.payout,
                income: ader.income
            }
        })
        .exec(callback);
    });
}
