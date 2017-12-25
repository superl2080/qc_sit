
const mongoose = require('mongoose');
const cryptHelper = require('../helpers/crypt');


const operatorSchema = new mongoose.Schema({

    email: { type: String, unique: true },
    name: String,
    password: { type: String, set: cryptHelper.PasswordCrypt },
    createDate: { type: Date, default: new Date() },

    character: String, //'MANAGER', 'NORMAL'

    info: {
        lastDate: Date,
        loginTimes: { type: Number, default: 0 }
    }
});

const operatorModel = mongoose.model('operator', operatorSchema);


const CheckAuth = exports.CheckAuth = (param, callback) => {
    if( !param ||
        !param.id ||
        !param.password ) {
        callback(new Error('param is error'));
        return ;
    }

    operatorModel.findOne({ email: param.id })
    .exec(function (err, operator) {
        if( !operator ) {
            callback(new Error('can not find operator'));
        } else {
            callback(null, cryptHelper.PasswordCompare({
                passwordAuth: param.password,
                passwordCrypt: operator.password
            }));
        }
    });
}