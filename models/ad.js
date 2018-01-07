
const mongoose = require('mongoose');
const aderModel = require('./ader');
const ObjectId = mongoose.Schema.Types.ObjectId;


const adSchema = new mongoose.Schema({

    createDate:             { $type: Date,               default: new Date() },

    isDefault:              { $type: Boolean,            default: false },
    aderId:                 { $type: ObjectId,           required: true, index: true },
    type:                   { $type: String,             required: true }, //'WECHAT_MP_AUTH', 'WECHAT_MP_API'
    state:                  { $type: String,             default: 'CREATE' }, //'CREATE', 'OPEN', 'DELIVER', 'SUCESS', 'CANCEL'

    deliverInfo: {
        payout:             { $type: Number,             required: true },
        income:             { $type: Number,             required: true },
        priority:           { $type: Number,             default: 10 },
        count:              Number,
        partnerType:        { $type: String,             default: 'ALL' }, //'ALL', 'WHITE', 'BLACK'
        partnerIds:         [ ObjectId ],
        userType:           { $type: String,             default: 'ALL' }, //'ALL', 'WHITE', 'BLACK'
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
}, { typeKey: '$type' });

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
        return callback(new Error('CreateAuthAd: param is error'));
    }

    aderModel.GetAderById({ aderId: param.aderId }, (err, ader) => {
        if( err
            || !ader
            || ader.balance <= 0 ) {
            return callback(err || new Error('CreateAuthAd: ader is not OK'));
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
}

const CancelAdWechatMpAuthInfo = exports.CancelAdWechatMpAuthInfo = (appid, callback) => {
    if( !appid ) {
        return callback(new Error('CancelAdWechatMpAuthInfo: appid is error'));
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

const DeliverAd = exports.DeliverAd = (param, callback) => {
    if( !param ) {
        return callback(new Error('DeliverAd: param is error'));
    }

    adModel.find({ state: 'DELIVER' })
    .gt('deliverInfo.count', 0)
    .nin('wechatMpAuthInfo.appid', param.appids)
    .$where(function () {
        if( this.deliverInfo.partnerType == 'WHITE' ){
            return this.deliverInfo.partnerIds.indexOf(param.partnerId) >= 0;
        } else if( this.deliverInfo.partnerType == 'BLACK' ){
            return this.deliverInfo.partnerIds.indexOf(param.partnerId) < 0;
        } else {
            return true;
        }
    })
    .sort('-deliverInfo.priority createDate')
    .exec(function (err, ads) {
        if( err
            || !ads ) {
            callback(err || new Error('DeliverAd: ad is empty'));
        } else {
            aderDeliverAd({
                i: 0,
                ads: ads
            }, callback);
        }
    });
}

const aderDeliverAd = (param, callback) => {
    aderModel.DeliverAd({
        aderId: param.ads[param.i].aderId,
        payout: param.ads[param.i].deliverInfo.payout
    }, (err, result) => {
        if( err
            && param.i + 1 < ads.length ){
            aderDeliverAd({
                i: param.i + 1,
                ads: ads
            }, callback);
        } else if( err ){
            callback(err);
        } else {
            param.ads[param.i].deliverInfo.count -= 1;
            param.ads[param.i].save(callback);
        }
    });
}

const CancelAd = exports.CancelAd = (param, callback) => {
    if( !param
        || !param.adId ) {
        return callback(new Error('CancelAd: param is error'));
    }

    adModel.findById(param.adId)
    .exec(function (err, ad) {
        if( err
            || !ad ) {
            callback(err || new Error('CancelAd: ad is empty'));
        } else {
            ad.deliverInfo.count += 1;
            ad.save((err, result) => {
                if( err ){
                    callback(err, result);
                } else {
                    aderModel.CancelAd({
                        aderId: ad.aderId,
                        payout: ad.deliverInfo.payout
                    }, (err, result) => {
                        callback(err, ad);
                    });
                }
            });
        }
    });
}

const GetWechatMpAuthInfo = exports.GetWechatMpAuthInfo = (param, callback) => {

    adModel.findById(param.adId)
    .exec(function (err, ad) {
        if( err
            || !ad ) {
            callback(err || new Error('GetWechatMpAuthInfo: ad is empty'));
        } else {
            callback(null, ad.wechatMpAuthInfo);
        }
    });
}

const RefreshWechatMpAuthInfo = exports.RefreshWechatMpAuthInfo = (param, callback) => {
    if( !param
        || !param.adId
        || !param.access_token
        || !param.expires_in
        || !param.refresh_token ) {
        return callback(new Error('RefreshWechatMpAuthInfo: param is error'));
    }

    adModel.findById(param.adId)
    .exec(function (err, ad) {
        if( err
            || !ad ) {
            callback(err || new Error('RefreshWechatMpAuthInfo: ad is empty'));
        } else {
            ad.wechatMpAuthInfo.access_token = param.access_token;
            ad.wechatMpAuthInfo.expires_in = param.expires_in;
            ad.wechatMpAuthInfo.refresh_token = param.refresh_token;
            ad.save(callback);
        }
    });
}


