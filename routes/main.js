'use strict';

const express = require('express');
const request = require('request');

const router = express.Router();
const SERVICE_URL = process.env.SERVICE_URL;


router.get('/scan/point/:pointId', function(req, res, next) {
    console.log('[GET] /scan/point/:pointId, pointId:' + req.params.pointId);
    
    var WECHAT_AGENT = new RegExp('MicroMessenger');

    if(WECHAT_AGENT.test(req.headers['user-agent'])) {
        let url = SERVICE_URL + '/user/scan/wechat?pointId=' + req.params.pointId;
        url += '&redirect_uri=' + encodeURIComponent('http://' + req.headers.host + '/order');
        res.redirect(url);

    } else {
        res.render('frame-error', {error: {message: '请使用微信扫描', status: '抱歉，目前仅支持微信扫描使用本产品'}});
    }
});


router.get('/subscribe/:appid', function(req, res, next) {
    console.log('[GET] /subscribe/:appid, appid:' + req.params.appid);
    
    if( !req.query.token ){
        var WECHAT_AGENT = new RegExp('MicroMessenger');

        if(WECHAT_AGENT.test(req.headers['user-agent'])) {
            let url = SERVICE_URL + '/user/login/wechat?redirect_uri=' + encodeURIComponent('http://' + req.headers.host + '/subscribe/' + req.params.appid);
            res.redirect(url);

        } else {
            res.render('frame-error', {error: {message: '请使用微信打开链接', status: '抱歉，目前仅支持微信客户端使用本产品'}});
        }
    } else {
        request.post({
            url: SERVICE_URL + '/channel/subscribe',
            method: 'POST',
            headers: {  
                'content-type': 'application/json',
            },
            json: {
                userId: req.query.token,
                appid: req.params.appid,
            },
        }, (err, ret, body) => {
            if(err
                || ret.statusCode != 200 ) {
                res.render('frame-error', { error: err });

            } else {
                res.redirect('http://' + req.headers.host + '/order?token=' + req.query.token + '&orderId=' + body.data.orderId);
            }
        });
    }
});


router.get('/order', function(req, res, next) {
    console.log('[GET] /order, query:');
    console.log(req.query);

    let url = SERVICE_URL + '/order?token=' + req.query.token;
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

});


router.post('/order/pay', function(req, res, next) {
    console.log('[POST] /order/pay');

    request.post({
        url: SERVICE_URL + '/order/prepay/wechat',
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
        const json = JSON.parse(body);
        res.send(json.data);
    });

});


router.post('/order/loading', function(req, res, next) {
    console.log('[POST] /order/loading');

    setTimeout(function () {
        res.end();
    }, 500);
});


module.exports.router = router;

