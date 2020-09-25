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
    },
    comments: [
        {
            type: Schema.Types.ObjectId,
            ref: 'comments'
        }
    ]
})

module.exports = mongoose.model( 'posts', PostSchema)