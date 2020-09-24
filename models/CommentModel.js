const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
    name: {
        type: String,
        required: true
    },

    body: {
        type: String,
        required: true
    },

    creationDate: {
        type: Date,
        default: Date.now()
    },

    commentIsApproved: {
        type: Boolean,
        default: true
    }
})

module.exports = mongoose.model( 'comments', CommentSchema)