
const cheerio = require('cheerio');
const toolHelper = require('../helpers/tool');


const GetQrcodeImageUrl = exports.GetQrcodeImageUrl = (param, callback) => {
    console.log('[CALL] GetQrcodeImageUrl, param:');
    console.log(param);

    let mhid = 'vEvEWg26zsMhMHctLdZVOaw';
    if( param.type == 'SCAN' ) {
        mhid = 'skTHBF3tnJ4hMHctLdZVOaI';
    }

    toolHelper.GetJson({
        url: 'https://cli.im/api/qrcode/code?text=' + encodeURIComponent(param.url) + '&mhid=' + mhid
    }, function(err, result) {
        if(err) {
            callback(err || new Error('GetQrcodeImageUrl: callback error'));
        } else {
            var $ = cheerio.load(result);
            callback(null, 'http:' + $('img').attr('src'));
        }
    });
}
