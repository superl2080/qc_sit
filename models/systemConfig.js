
const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;


const systemConfigSchema = new mongoose.Schema({

    wechatOpen: {
        ticket:             String,
        access_token:       String,
        expires_in:         Date
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


const GetTicket = exports.GetTicket = (param, callback) => {

    systemConfigModel.findOne({ })
    .exec(function (err, systemConfig) {
        if( !systemConfig ||
            !systemConfig.wechatOpen ||
            !systemConfig.wechatOpen.ticket ) {
            callback(new Error('ticket is empty'));
        } else {
            callback(null, systemConfig.wechatOpen.ticket);
        }
    });
}

const UpdateTicket = exports.UpdateTicket = (newTicket, callback) => {
    if( !newTicket ) {
        callback(new Error('newTicket is empty'));
        return ;
    }

    systemConfigModel.findOne({ })
    .exec(function (err, systemConfig) {
        if( !systemConfig ) {
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
