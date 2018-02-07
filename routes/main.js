'use strict';

const express = require('express');
const request = require('request');

const router = express.Router();
const SERVICE_URL = process.env.SERVICE_URL;


router.get('/scan/point/:pointId', function(req, res, next) {
    console.log('[GET] /scan/point/:pointId, pointId:' + req.params.pointId);
    
    var WECHAT_AGENT = new RegExp('MicroMessenger');

    if(WECHAT_AGENT.test(req.headers['user-agent'])) {
        let url = SERVICE_URL + '/sit/user/wechatScanPoint?pointId=' + req.params.pointId;
        url += '&redirect_uri=' + encodeURIComponent('http://' + req.headers.host + '/order');
        res.redirect(url);

    } else {
        res.render('frame-error', {error: {message: '请使用微信扫描', status: '抱歉，目前仅支持微信扫描使用本产品'}});
    }
});


router.get('/subscribe/:appid', function(req, res, next) {
    console.log('[GET] /subscribe/:appid, appid:' + req.params.appid);
    
    var WECHAT_AGENT = new RegExp('MicroMessenger');

    if(WECHAT_AGENT.test(req.headers['user-agent'])) {
        let url = SERVICE_URL + '/sit/user/wechatSubscribeMp?appid=' + req.params.appid;
        url += '&redirect_uri=' + encodeURIComponent('http://' + req.headers.host + '/order');
        res.redirect(url);

    } else {
        res.render('frame-error', {error: {message: '请使用微信打开链接', status: '抱歉，目前仅支持微信客户端使用本产品'}});
    }
});


router.get('/order', function(req, res, next) {
    console.log('[GET] /order, query:');
    console.log(req.query);

    if( req.query.subscribe === '0' ){
        let url = SERVICE_URL + '/sit/order/pre?token=' + req.query.token;
        url += '&pointId=' + req.query.pointId;

        request.get({
            url: url,
        }, (err, ret, body) => {
            if(err
                || ret.statusCode != 200 ) {
                res.render('frame-error', { error: err });

            } else {
                const json = JSON.parse(body);
                res.render('order', {
                    qrcodeUrl: json.data.qrcodeUrl,
                    page: 'PRE',
                });
            }
        });
    } else if( req.query.orderId !== undefined
        && req.query.token !== undefined ){
        let url = SERVICE_URL + '/sit/order?token=' + req.query.token;
        url += '&orderId=' + req.query.orderId;

        request.get({
            url: url,
        }, (err, ret, body) => {
            if(err
                || ret.statusCode != 200 ) {
                res.render('frame-error', { error: err });

            } else {
                const json = JSON.parse(body);
                let order;
                if( json.code === 0 ) order = json.data;
                res.render('order', {
                    order: order,
                    page: req.query.page,
                });
            }
        });
    } else {
        res.render('frame-error', {error: {message: '请重新扫码领取', status: '抱歉，网络出现异常，请重新扫码尝试领取。'}});
    }

});


router.post('/order/pay', function(req, res, next) {
    console.log('[POST] /order/pay');

    request.post({
        url: SERVICE_URL + '/sit/order/wechatPrepay',
        method: 'POST',
        headers: {  
            'content-type': 'application/json',
        },
        json: {
            token: req.body.token,
            orderId: req.body.orderId,
            body: '青橙 - 领取纸巾',
            spbill_create_ip: req.headers['x-real-ip'],
        }
    }, (err, ret, body) => {
        res.send(body.data);
    });

});


router.post('/order/loading', function(req, res, next) {
    console.log('[POST] /order/loading');

    setTimeout(function () {
        res.end();
    }, 500);
});


module.exports.router = router;

