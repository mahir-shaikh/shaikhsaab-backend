const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const PostSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    image:{
        type: String
    },
    creationDate: {
        type: Date,
        default: Date.now()
    },
    status:{
        type: String
    },
    allowComments:{
        type: Boolean,
        default: false
    }
})

module.exports = mongoose.model( 'posts', PostSchema)