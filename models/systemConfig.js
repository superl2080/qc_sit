
const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;


const systemConfigSchema = new mongoose.Schema({

    wechatOpen: {
        ticket:             String,
        access_token:       String,
        expires_in:         Date,
        auto_reply:         String
    }
});

let systemConfigModel = null;
try {
    systemConfigModel = mongoose.model('systemConfig', systemConfigSchema);
} catch(err) {
    if (err.name === 'OverwriteModelError') {
        systemConfigModel = mongoose.model('systemConfig');
    }
}


const GetWechatOpen = exports.GetWechatOpen = (param, callback) => {

    systemConfigModel.findOne({ })
    .exec(function (err, systemConfig) {
        if( err
            || !systemConfig
            || !systemConfig.wechatOpen ) {
            callback(err || new Error('GetWechatOpen: wechatOpen is empty'));
        } else {
            callback(null, systemConfig.wechatOpen);
        }
    });
}

const UpdateWechatOpenTicket = exports.UpdateWechatOpenTicket = (newTicket, callback) => {
    if( !newTicket ) {
        return callback(new Error('UpdateWechatOpenTicket: newTicket is empty'));
    }

    systemConfigModel.findOne({ })
    .exec(function (err, systemConfig) {
        if( err
            || !systemConfig ) {
            systemConfigModel.create({
                wechatOpen: {
                    ticket: newTicket
                }
            }, callback);
        } else {
            systemConfig.wechatOpen.ticket = newTicket;
            systemConfig.save(callback);
        }
    });
}

const UpdateWechatOpenToken = exports.UpdateWechatOpenToken = (param, callback) => {
    if( !param
        || !param.access_token
        || !param.expires_in ) {
        return callback(new Error('UpdateWechatOpenToken: param is error'));
    }

    systemConfigModel.findOne({ })
    .exec(function (err, systemConfig) {
        if( err
            || !systemConfig ) {
            callback(err || new Error('UpdateWechatOpenToken: systemConfig is empty'));
        } else {
            systemConfig.wechatOpen.access_token = param.access_token;
            systemConfig.wechatOpen.expires_in = param.expires_in;
            systemConfig.save(callback);
        }
    });
}

