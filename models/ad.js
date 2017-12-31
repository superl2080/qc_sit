
const mongoose = require('mongoose');
const aderModel = require('./ader');
const ObjectId = mongoose.Schema.Types.ObjectId;


const adSchema = new mongoose.Schema({

    createDate:             { type: Date,               default: new Date() },

    isDefault:              { type: Boolean,            default: false },
    aderId:                 { type: ObjectId,           required: true, index: true },
    type:                   { type: String,             required: true }, //'WECHAT_MP_AUTH', 'WECHAT_MP_API'
    state:                  { type: String,             default: 'CREATE' }, //'CREATE', 'OPEN', 'DELIVER', 'SUCESS', 'REPEAT', 'CANCEL'

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
        pre_auth_code:      String,
        appid:              String,
        qrcode_url:         String,
        auth:               Boolean,
        service_type:       Number,
        verify_type:        Number,
        access_token:       String,
        expires_in:         Date,
        refresh_token:      String,
        head_img:           String,
        nick_name:          String,
        user_name:          String
    },

    wechatMpApiInfo: {
        channel:            String //'YOUFENTONG', 'YUNDAI'
    }
});

let adModel = null;
try {
    adModel = mongoose.model('ad', adSchema);
} catch(err) {
    if (err.name === 'OverwriteModelError') {
        adModel = mongoose.model('ad');
    }
}


const CreateAuthAd = exports.CreateAuthAd = (param, callback) => {
    if( !param
        || !param.aderId ) {
        returncallback(new Error('CreateAuthAd: param is error'));
    }

    aderModel.GetAderById({ aderId: param.aderId }, (err, ader) => {
        if( err
            || !ader
            || ader.balance <= 0 ) {
            callback(err || new Error('CreateAuthAd: ader is not OK'));
            return ;
        }

        adModel.create({ 
            aderId: param.aderId,
            type: 'WECHAT_MP_AUTH',
            deliverInfo: {
                payout: ader.payout,
                income: ader.income
            }
        }, callback);
    });
}

const GetDefaultAd = exports.GetDefaultAd = (param, callback) => {
    adModel.findOne({ isDefault: true }, callback);
}

const GetAdById = exports.GetAdById = (param, callback) => {
    if( !param
        || !param.adId ) {
        return callback(new Error('GetAdById: param is error'));
    }

    adModel.findById(param.adId, callback);
}

const FinishAd = exports.FinishAd = (param, callback) => {
    if( !param
        || !param.adId ) {
        return callback(new Error('FinishAd: param is error'));
    }

    adModel.findById(param.adId)
    .exec(function (err, ad) {
        if( err
            || !ad ) {
            callback(err || new Error('FinishAd: ad is empty'));
        } else {
            ad.state = 'FAIL';
            ad.save(callback);
        }
    });
}

const UpdateWechatMpPreAuthCode = exports.UpdateWechatMpPreAuthCode = (param, callback) => {
    if( !param
        || !param.adId
        || !param.pre_auth_code ) {
        return callback(new Error('UpdateWechatMpPreAuthCode: param is error'));
    }

    adModel.findById(param.adId)
    .exec(function (err, ad) {
        if( err
            || !ad
            || ad.type != 'WECHAT_MP_AUTH'
            || ad.state != 'CREATE' ) {
            callback(new Error('UpdateWechatMpPreAuthCode: adId is error'));
        } else {
            if( !ad.wechatMpAuthInfo ) {
                ad.wechatMpAuthInfo = {
                    pre_auth_code: param.pre_auth_code
                };
            } else {
                ad.wechatMpAuthInfo.pre_auth_code = param.pre_auth_code;
            }
            ad.save(callback);
        }
    });
}

const UpdateWechatMpAuthInfo = exports.UpdateWechatMpAuthInfo = (param, callback) => {
    if( !param
        || !param.appid
        || !param.pre_auth_code
        || !param.qrcode_url
        || !param.access_token
        || !param.expires_in
        || !param.refresh_token ) {
        return callback(new Error('UpdateWechatMpAuthInfo: param is error'));
    }

    adModel.findOne({ 
        'wechatMpAuthInfo.appid': param.appid,
        'wechatMpAuthInfo.pre_auth_code': { $ne: param.pre_auth_code},
        state: { $in: ['OPEN', 'DELIVER'] } 
    }).exec(function (err, ad) {
        if( err
            || !ad ) {
            adModel.findOne({ 'wechatMpAuthInfo.pre_auth_code': param.pre_auth_code })
            .exec(function (err, ad) {
                if( err
                    || !ad
                    || ad.type != 'WECHAT_MP_AUTH' ) {
                    callback(new Error('UpdateWechatMpAuthInfo: can not find by pre_auth_code'));
                } else {
                    if( ad.state == 'CREATE' ) {
                        ad.state = 'OPEN';
                    }
                    ad.wechatMpAuthInfo.appid = param.appid;
                    ad.wechatMpAuthInfo.qrcode_url = param.qrcode_url;
                    ad.wechatMpAuthInfo.auth = param.auth;
                    ad.wechatMpAuthInfo.service_type = param.service_type;
                    ad.wechatMpAuthInfo.verify_type = param.verify_type;
                    ad.wechatMpAuthInfo.access_token = param.access_token;
                    ad.wechatMpAuthInfo.expires_in = param.expires_in;
                    ad.wechatMpAuthInfo.refresh_token = param.refresh_token;
                    ad.wechatMpAuthInfo.nick_name = param.nick_name;
                    ad.wechatMpAuthInfo.head_img = param.head_img;
                    ad.wechatMpAuthInfo.user_name = param.user_name;
                    ad.save(callback);
                }
            });
        } else {
            callback(new Error('wechatMpAuthInfo: appid is repeat'));
        }
    });
}

const CancelAdWechatMpAuthInfo = exports.CancelAdWechatMpAuthInfo = (appid, callback) => {
    if( !appid ) {
        callback(new Error('CancelAdWechatMpAuthInfo: appid is error'));
        return ;
    }

    adModel.findOne({ 'wechatMpAuthInfo.appid': appid, state: { $in: ['OPEN', 'DELIVER'] } })
    .exec(function (err, ad) {
        if( err
            || !ad ) {
            callback(null);
        } else {
            ad.state = 'CANCEL';
            ad.save(callback);
        }
    });
}

