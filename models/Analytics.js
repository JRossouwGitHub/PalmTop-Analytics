const mongoose = require('mongoose')
const Schema = mongoose.Schema

const AnalyticsSchema = new Schema({
    account_id: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    page: {
        type: String,
        required: true
    },
    count: {
        type: Number,
        required: true
    },
    activity_date: {
        type: String,
        required: true
    },
    activity_time: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
})

module.exports = Analytics = mongoose.model('analytics', AnalyticsSchema)