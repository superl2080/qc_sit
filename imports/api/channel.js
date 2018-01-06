
const cheerio = require('cheerio');
const toolHelper = require('../helpers/tool');


const GetQrcodeImageUrl = exports.GetQrcodeImageUrl = (param, callback) => {
    console.log('[CALL] GetQrcodeImageUrl, param:');
    console.log(param);

    toolHelper.GetJson({
        url: 'https://cli.im/api/qrcode/code?text=' + param.url + '&mhid=tUOUXlvpz50hMHctKddQPaI'
    }, function(err, result) {
        if(err) {
            callback(err || new Error('GetQrcodeImageUrl: callback error'));
        } else {
            var $ = cheerio.load(result);
            callback(null, $('img').attr('src'));
        }
    });
}

