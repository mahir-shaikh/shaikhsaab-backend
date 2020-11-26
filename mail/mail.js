const nodemailer = require('nodemailer');

module.exports = function(app){
    app.post("/sendmail", (req, res) => {
        let data = req.body
        sendMail(data, info => {
            console.log('INFO in post', info)
            res.send(info)
        })
    
    })
}

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