
const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;


const operatorConfigSchema = new mongoose.Schema({

    wechatOpen: {
        ticket:             String,
        access_token:       String,
        expires_in:         Date
    }
});

const operatorConfigModel = mongoose.model('operatorConfig', operatorConfigSchema);


const GetTicket = exports.GetTicket = (param, callback) => {

    operatorConfigModel.findOne({ })
    .exec(function (err, operatorConfig) {
        if( !operatorConfig ||
            !operatorConfig.wechatOpen ||
            !operatorConfig.wechatOpen.ticket ) {
            callback(new Error('ticket is empty'));
        } else {
            callback(null, operatorConfig.wechatOpen.ticket);
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
        if( !operatorConfig ) {
            operatorConfigModel.create({
                wechatOpen: {
                    ticket: newTicket
                }
            }, callback);
        } else {
            operatorConfig.wechatOpen.ticket = newTicket;
            operatorConfig.save(callback);
        }
    });
}
