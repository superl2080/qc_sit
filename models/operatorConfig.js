
const mongoose = require('mongoose');


const operatorConfigSchema = new mongoose.Schema({

    wechatOpen: {
        component_verify_ticket: String,
        component_access_token: String,
        expires_in: Date
    }
});

const operatorConfigModel = mongoose.model('operatorConfig', operatorConfigSchema);


const GetTicket = exports.GetTicket = (param, callback) => {

    operatorConfigModel.findOne({ })
    .exec(function (err, operatorConfig) {
        if( !operatorConfig ||
            !operatorConfig.wechatOpen ||
            !operatorConfig.wechatOpen.component_verify_ticket ) {
            callback(new Error('component_verify_ticket is empty'));
        } else {
            callback(null, operatorConfig.wechatOpen.component_verify_ticket);
        }
    });
}

const UpdateTicket = exports.UpdateTicket = (newTicket, callback) => {
    if( !newTicket ) {
        callback(new Error('newTicket is empty'));
        return ;
    }

    operatorConfigModel.findOne({ })
    .exec(function (err, operatorConfig) {
        if( !operatorConfig ||
            !operatorConfig.wechatOpen ) {
            callback(new Error('operatorConfig is empty'));
        } else {
            operatorConfig.wechatOpen.component_verify_ticket = newTicket;
            operatorConfig.save(callback);
        }
    });
}
