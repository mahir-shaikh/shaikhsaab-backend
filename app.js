const details = require('./config.json')
const PORT = process.env.PORT || 9999;
const MongoDBURL = details.MongoURL;
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');

require('dotenv').config()

const app = express();
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`)
})

app.get("/", (req, res) => {
    res.send(
        "<h1 style='text-align:center'>Things are looking good!!!</h1>"
    );
})
//EMAIL SERVICE
app.post("/sendmail", (req, res) => {
    let data = req.body
    sendMail(data, info => {
        console.log('INFO in post', info)
        res.send(info)
    })

})

async function sendMail(data, callback) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD
        }
    });

    var mailOptions = {
        from: data.email,
        to: 'mahirthebest95@gmail.com',
        subject: data.name + ' is trying to contact you from using your website...',
        html: '<b>Name:</b> ' + data.name + '<br><b>Email:</b> ' + data.email + '<br><b>Message:</b> ' + data.message
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            callback({ success: false, response: error })
        } else {
            callback({ success: true, response: info })
        }
    })
}

//CMS SERVICES
mongoose.connect(MongoDBURL, { useUnifiedTopology: true, useNewUrlParser: true }).then(() => {
    console.log("MongoDB Connected Successfully");
}).catch((err) => {
    console.log("MongoDB Connecttion failed:", err);
})
var POST = require('./models/PostModel')
app.post('/newpost', (req, res) => {
    var post = new POST({
        // title: 'xyz',
        // narrative: 'sadsad'
        title: req.body.title,
        description: req.body.description,
        status: req.body.status,
        allowComments: req.body.allowComments,
    })

    post.save().then((info) => {
        res.send({ success: true, response: info })
    }).catch((err) => {
        res.send({ success: false, response: err })
    })
})

app.get('/getAllPosts', (req, res) => {
    POST.find().then(posts => {
        res.send(posts)
    })
})

app.post('/getPost', (req, res) => {
    const id = req.body.id
    POST.findById(id).then(posts => {
        res.send(posts)
    })
})

app.post('/editPost', (req, res) => {
    const id = req.body.id
    const data = req.body.post;
    POST.findById(id).then(post => {
        post.overwrite(data)
        post.save().then((info) => {
            res.send({ success: true, response: info })
        }).catch((err) => {
            res.send({ success: false, response: err })
        })
    })
})

app.post('/deletePost', (req, res) => {
    const id = req.body.id
    POST.findByIdAndDelete(id).then(deletedPost => {
        res.send({ success: true, response: deletedPost })

    }).catch((err) => {
        res.send({ success: false, response: err })
    })
})