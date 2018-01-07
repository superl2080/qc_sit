
const toolHelper = require('../helpers/tool');

const YOUFENTONG_DELIVER_URL = 'http://admintest.51qingcheng.com/test/100';
const YOUFENTONG_SUBSCRIBE_URL = 'http://admintest.51qingcheng.com/test/101';
const YUNDAI_DELIVER_URL = 'http://admintest.51qingcheng.com/test/100';
const YUNDAI_SUBSCRIBE_URL = 'http://admintest.51qingcheng.com/test/101';


const DeliverChannelAd = exports.DeliverChannelAd = (param, callback) => {
    console.log('[CALL] DeliverChannelAd, param:');
    console.log(param);

    let url = '';
    if( param.channel == 'YOUFENTONG') {
        url = YOUFENTONG_DELIVER_URL;
    } else if( param.channel == 'YUNDAI') {
        url = YUNDAI_DELIVER_URL;
    } else {
        callback(new Error('DeliverChannelAd: param is error'));
    }

    toolHelper.PostJson({
        url: url,
        json: {
            userId: param.userId,
            appids: param.appids
        }
    }, function(err, result) {
        if(err
            || !result) {
            callback(err || new Error('DeliverChannelAd: callback result is empty'));
        } else {
            callback(null, result);
        }
    });
}

