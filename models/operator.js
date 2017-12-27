
const mongoose = require('mongoose');
const cryptHelper = require('../helpers/crypt');
const ObjectId = mongoose.Schema.Types.ObjectId;


const operatorSchema = new mongoose.Schema({

    id:                     { type: String,             required: true, index: true, unique: true },
    password:               { type: String,             required: true, set: cryptHelper.PasswordCrypt },
    name:                   { type: String,             required: true },
    createDate:             { type: Date,               default: new Date() },

    character:              { type: String,             required: true }, //'MANAGER', 'NORMAL'

    info: {
        lastDate:           Date,
        loginTimes:         { type: Number,             default: 0 }
    }
});

const operatorModel = mongoose.model('operator', operatorSchema);


const CheckPassword = exports.CheckPassword = (param, callback) => {
    if( !param ||
        !param.id ||
        !param.password ) {
        callback(new Error('param is error'));
        return ;
    }

    operatorModel.findOne({ id: param.id })
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
