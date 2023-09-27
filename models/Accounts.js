const mongoose = require('mongoose')
const Schema = mongoose.Schema

const AccountsSchema = new Schema({
    first_name: {
        type: String,
        required: true
    },
    last_name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    domain: {
        name: String,
        type: [String],
        required: true,
        unique: true,
        dropDups: true
    },
    is_verified: {
        type: Boolean,
        default: false
    },
    date: {
        type: Date,
        default: Date.now
    }
})

module.exports = Accounts = mongoose.model('accounts', AccountsSchema)