
const mongoose = require('mongoose');
const cryptHelper = require('../helpers/crypt');


const partnerSchema = new mongoose.Schema({

    id: { type: String, unique: true },
    name: String,
    password: { type: String, set: cryptHelper.PasswordCrypt },
    createDate: { type: Date, default: new Date() },
    authId: {
        wechatId: String
    },

    balance: Number,
    payout: Number,
    income: Number,
    character: String, // 'DAILI', 'ZHITUI'

    partnerBonus: {
        partnerId: mongoose.Schema.Types.ObjectId
    },

    info: {
        lastDate: { type: Date, default: new Date() },
        loginTimes: { type: Number, default: 1 },
        phone: String,
        descript: String
    }
});

const partnerModel = mongoose.model('partner', partnerSchema);


const CheckAuth = exports.CheckAuth = (param, callback) => {
    if( !param ||
        !param.id ||
        !param.password ) {
        callback(new Error('param is error'));
        return ;
    }

    partnerModel.findOne({ id: param.id })
    .exec(function (err, partner) {
        if( !partner ) {
            callback(new Error('can not find partner'));
        } else {
            callback(null, cryptHelper.PasswordCompare({
                passwordAuth: param.password,
                passwordCrypt: partner.password
            }));
        }
    });
}