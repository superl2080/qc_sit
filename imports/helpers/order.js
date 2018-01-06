
const async = require('async');
const adModel = require('../models/ad');
const tradeAdModel = require('../models/tradeAd');
const tradePayModel = require('../models/tradePay');
const partnerModel = require('../models/partner');
const pointOrderModel = require('../models/pointOrder');
const serviceApi = require('../api/service');
const qrcodeApi = require('../api/qrcode');
const wechatApi = require('../api/wechat');


const PointOrderDeliverAd = exports.PointOrderDeliverAd = (param, callback) => {

    let adInfo = {
        adId: param.ad._id
    }

    if( param.ad.type == 'WECHAT_MP_AUTH' ){
        adInfo.qrcode_url = param.ad.wechatMpAuthInfo.qrcode_url;
        adInfo.appid = param.ad.wechatMpAuthInfo.appid;
        adInfo.auth = false;
        async.auto({
            CheckAuth: (callback) => {
                console.log('[CALL] PointOrderDeliverAd, CheckAuth');
                if( param.ad.wechatMpAuthInfo.auth ){
                    callback(null);
                } else {
                    callback(new Error('PointOrderDeliverAd: no auth'));
                }
            },

            GetMpToken: ['CheckAuth', (result, callback) => {
                console.log('[CALL] PointOrderDeliverAd, GetMpToken');
                wechatHelper.GetMpToken({
                    ad: param.ad
                }, callback);
            }],

            GetQrcode: ['GetMpToken', (result, callback) => {
                console.log('[CALL] PointOrderDeliverAd, GetQrcode');
                wechatApi.MpQrcodeCreate({
                    token: result.GetMpToken,
                    scene_str: param.userId.toString()
                }, callback);
            }],

            GetQrcodeImageUrl: ['GetQrcode', (result, callback) => {
                console.log('[CALL] PointOrderDeliverAd, GetQrcodeImageUrl');
                qrcodeApi.GetQrcodeImageUrl({ url: results.GetQrcode.url }, callback);
            }]

        }, (err, result) => {
            console.log('[CALLBACK] PointOrderDeliverAd');
            if( !err ){
                adInfo.qrcode_url = result.GetQrcodeImageUrl;
                adInfo.auth = true;
            }
            pointOrderModel.DeliverAd({
                pointOrderId: param.pointOrder._id,
                adInfo: adInfo
            }, callback);
        });

    } else if( param.ad.type == 'WECHAT_MP_API'
        && param.ad.wechatMpApiInfo.channel == 'YOUFENTONG' ){
        
    } else if( param.ad.type == 'WECHAT_MP_API'
        && param.ad.wechatMpApiInfo.channel == 'YUNDAI' ){
        
    } else {
        callback(new Error('PointOrderDeliverAd: param is error'));
    }
        
}

const TestPointOrderDeliverAd = exports.TestPointOrderDeliverAd = (param, callback) => {

    let adInfo = {
        auth: true
    }

    async.auto({
        GetDefaultAd: (callback) => {
            console.log('[CALL] TestPointOrderDeliverAd, GetDefaultAd');
            adModel.GetDefaultAd(null, callback);
        },

        GetMpToken: ['CheckAuth', (result, callback) => {
            console.log('[CALL] TestPointOrderDeliverAd, GetMpToken');
            adInfo.adId = result.GetDefaultAd._id,
            adInfo.appid = result.GetDefaultAd.wechatMpAuthInfo.appid;
            wechatHelper.GetMpToken({
                ad: result.GetDefaultAd
            }, callback);
        }],

        GetQrcode: ['GetMpToken', (result, callback) => {
            console.log('[CALL] TestPointOrderDeliverAd, GetQrcode');
            wechatApi.MpQrcodeCreate({
                token: result.GetMpToken,
                scene_str: param.userId.toString()
            }, callback);
        }],

        GetQrcodeImageUrl: ['GetQrcode', (result, callback) => {
            console.log('[CALL] TestPointOrderDeliverAd, GetQrcodeImageUrl');
            qrcodeApi.GetQrcodeImageUrl({ url: results.GetQrcode.url }, callback);
        }]

    }, (err, result) => {
        console.log('[CALLBACK] TestPointOrderDeliverAd');
        if( err ){
            callback(err, result);
        } else {
            adInfo.qrcode_url = result.GetQrcodeImageUrl;
            pointOrderModel.DeliverAd({
                pointOrderId: param.pointOrder._id,
                adInfo: adInfo
            }, callback);
        }
    });
        
}

const CreatePointOrder = exports.CreatePointOrder = (param, callback) => {

    async.auto({
        CancelUserPointOrder: (callback) => {
            console.log('[CALL] CreatePointOrder, CancelUserPointOrder');
            pointOrderModel.CancelOnePointOrder({
                userId: params.user._id
            }, callback);
        },

        CreatePointOrder: ['CancelUserPointOrder', (result, callback) => {
            console.log('[CALL] CreatePointOrder, CreatePointOrder');
            pointOrderModel.CreatePointOrder({
                userId: params.user._id,
                pointId: params.point._id,
                payout: params.point.deployInfo.payout
            }, callback);
        }],

        GetUserSubscribeAppids: ['CreatePointOrder', (result, callback) => {
            console.log('[CALL] CreatePointOrder, GetUserSubscribeAppids');
            tradeAdModel.GetUserTradeAds({
                userId: params.user._id
            }, (err, tradeAds) => {
                let appids = new Array();
                if( !err ){
                    tradeAds.forEach((tradeAd, i) => {
                        appids[i] = tradeAd.appid;
                    });
                }
                callback(null, appids);
            });
        }],

        PointOrderDeliverAd: ['GetUserSubscribeAppids', (result, callback) => {
            console.log('[CALL] CreatePointOrder, PointOrderDeliverAd');
            adModel.DeliverAd({
                appids: result.GetUserSubscribeAppids,
                user: params.user,
                partnerId: params.point.partnerId
            }, (err, ad) => {
                if( err ){
                    if( params.point.state == 'TEST' ){
                        TestPointOrderDeliverAd({
                            userId: params.user._id,
                            pointOrder: result.CreatePointOrder
                        }, callback);
                    } else {
                        callback(null, { pointOrder: result.CreatePointOrder });
                    }
                } else {
                    PointOrderDeliverAd({
                        ad: ad,
                        userId: params.user._id,
                        appids: result.GetUserSubscribeAppids,
                        pointOrder: result.CreatePointOrder
                    }, (err, pointOrder) => {
                        if( err ){
                            if( params.point.state == 'TEST' ){
                                TestPointOrderDeliverAd({
                                    userId: params.user._id,
                                    pointOrder: result.CreatePointOrder
                                }, callback);
                            } else {
                                callback(null, { pointOrder: result.CreatePointOrder });
                            }
                        } else {
                            callback(null, { pointOrder: pointOrder });
                        }
                    });
                }
            });
        }]

    }, (err, result) => {
        console.log('[CALLBACK] CreatePointOrder');
        callback(err, {
            pointOrder: result.PointOrderDeliverAd.pointOrder
        });
    });

}

const AdSubscribe = exports.AdSubscribe = (param, callback) => {

    async.auto({
        SubscribePointOrder: (callback) => {
            console.log('[CALL] AdSubscribe, SubscribePointOrder');
            pointOrderModel.SubscribePointOrder(param, callback);
        },

        GetPointById: ['SubscribePointOrder', (result, callback) => {
            console.log('[CALL] AdSubscribe, GetPointById');
            pointModel.GetPointById({ pointId: result.SubscribePointOrder.pointId }, callback);
        }],

        GetAdById: ['GetPointById', (result, callback) => {
            console.log('[CALL] AdSubscribe, GetAdById');
            adModel.GetAdById({ adId: result.SubscribePointOrder.adId }, callback);
        }],

        CreateTradeAd: ['GetAdById', (result, callback) => {
            console.log('[CALL] AdSubscribe, CreateTradeAd');
            let newTradeAd = {
                pointOrderId: result.SubscribePointOrder._id,
                userId: result.SubscribePointOrder.userId,
                adId: result.SubscribePointOrder.adId,
                aderId: result.GetAdById.aderId,
                partnerId: result.GetPointById.partnerId,
                payout: result.GetAdById.deliverInfo.payout,
                income: result.GetAdById.deliverInfo.income,
                appid: param.appid
            };
            if( param.openId
                && param.event ) {
                newTradeAd.openId = param.openId;
                newTradeAd.event = param.event;
            }
            tradeAdModel.CreateTradeAd(newTradeAd, callback);
        }],

        FinishPointOrder: ['CreateTradePay', (result, callback) => {
            console.log('[CALL] FinishPay, FinishPointOrder');
            FinishPointOrder({
                trade: result.CreateTradePay,
                point: result.GetPointById,
                pointOrder: result.SubscribePointOrder,
                payInfo: {
                    type: 'AD',
                    lastDate: new Date(),
                    tradeAdId: result.CreateTradeAd._id
                }
            }, callback);
        }]

    }, (err, result) => {
        console.log('[CALLBACK] AdSubscribe');
        callback(err, result);
    });
}

const FinishPay = exports.FinishPay = (param, callback) => {

    async.auto({
        GetOpenPointOrder: (callback) => {
            console.log('[CALL] FinishPay, GetOpenPointOrder');
            if( !param
                || param.return_code != 'SUCCESS'
                || param.result_code != 'SUCCESS' ){
                callback(new Error('FinishPay: param is error'));
            } else {
                pointOrderModel.GetPointOrder({
                    pointOrderId: param.out_trade_no,
                    state: 'OPEN'
                }, callback);
            }
        },

        GetPointById: ['GetOpenPointOrder', (result, callback) => {
            console.log('[CALL] FinishPay, GetPointById');
            pointModel.GetPointById({ pointId: result.GetOpenPointOrder.pointId }, callback);
        }],

        GetPartnerById: ['GetPointById', (result, callback) => {
            console.log('[CALL] FinishPay, GetPartnerById');
            partnerModel.GetPartnerById({ partnerId: result.GetPointById.partnerId }, callback);
        }],

        CreateTradePay: ['GetPartnerById', (result, callback) => {
            console.log('[CALL] FinishPay, CreateTradePay');
            let newTradePay = {
                pointOrderId: result.GetOpenPointOrder._id,
                userId: result.GetOpenPointOrder.userId,
                partnerId: result.GetPointById.partnerId,
                payout: result.GetOpenPointOrder.payout,
                income: result.GetPartnerById.income,
                total_fee: param.total_fee
            };
            if( param.transaction_id ) { newTradePay.transaction_id = param.transaction_id; }
            tradePayModel.CreateTradePay(newTradePay, callback);
        }],

        FinishPointOrder: ['CreateTradePay', (result, callback) => {
            console.log('[CALL] FinishPay, FinishPointOrder');
            FinishPointOrder({
                trade: result.CreateTradePay,
                point: result.GetPointById,
                pointOrder: result.GetOpenPointOrder,
                payInfo: {
                    type: 'PAY',
                    lastDate: new Date(),
                    tradeAdId: result.CreateTradePay._id
                }
            }, callback);
        }]

    }, (err, result) => {
        console.log('[CALLBACK] FinishPay');
        callback(err, result);
    });
}


const FinishPointOrder = exports.FinishPointOrder = (param, callback) => {

    async.auto({
        PartnerIncome: (callback) => {
            console.log('[CALL] FinishPointOrder, PartnerIncome');
            partnerModel.PartnerIncome({
                partnerId: param.point.partnerId,
                income: param.trade.payout - param.trade.income
            }, callback);
        },

        TakeDeviceItem: ['PartnerIncome', (result, callback) => {
            console.log('[CALL] FinishPointOrder, TakeDeviceItem');
            if( param.point.type == 'ZHIJINJI'
                && param.point.deviceInfo ) {
                serviceApi.TakeDeviceItem({
                    pointOrderId: param.pointOrder._id,
                    devNo: param.point.deviceInfo.devNo
                }, callback);
            } else {
                callback(null, 'SUCCESS');
            }
        }],

        FinishPointOrder: ['TakeDeviceItem', (result, callback) => {
            console.log('[CALL] FinishPointOrder, FinishPointOrder');
            pointOrderModel.FinishPointOrder({
                pointOrderId: param.pointOrder._id,
                state: result.TakeDeviceItem,
                payInfo: param.payInfo
            }, callback);
        }]

    }, (err, result) => {
        console.log('[CALLBACK] FinishPointOrder');
        callback(err, result);
    });
}

