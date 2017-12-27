
const mongoose = require('mongoose');
const cryptHelper = require('../helpers/crypt');
const ObjectId = mongoose.Schema.Types.ObjectId;


const partnerSchema = new mongoose.Schema({

    id:                     { type: String,             required: true, index: true, unique: true },
    password:               { type: String,             required: true, set: cryptHelper.PasswordCrypt },
    name:                   { type: String,             required: true },
    createDate:             { type: Date,               default: new Date() },
    authId: {
        wechatId:           { type: String,             index: true },
    },

    balance:                { type: Number,             required: true },
    payout:                 { type: Number,             required: true },
    income:                 { type: Number,             required: true },
    character:              { type: String,             required: true }, // 'DAILI', 'ZHITUI'

    partnerBonus: {
        partnerId:          ObjectId
    },

    info: {
        lastDate:           Date,
        loginTimes:         { type: Number,             default: 0 },
        phone:              String,
        descript:           String
    }
});

const partnerModel = mongoose.model('partner', partnerSchema);


const CheckPassword = exports.CheckPassword = (param, callback) => {
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
