const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

const details = require('./config.json');

const app = express();
app.use(cors({origin: '*'}));
app.use(bodyParser.json());

app.listen(9999, ()=>{
    console.log("Server started on port 9999")
})

app.get("/",(req, res)=>{
    res.send(
        "<h1 style='text-align:center'>Things are looking good!!!</h1>"
    );
})





app.post("/sendmail", (req, res)=>{
    let data = req.body
    sendMail(data, info =>{
        console.log('INFO in post', info)
        res.send(info)
    })

})

async function sendMail(data, callback){
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: details.email,
          pass: details.pwd
        }
    });

    var mailOptions = {
        from: data.email,
        to: 'mahirthebest95@gmail.com',
        subject: data.name + ' is trying to contact you from using your website...',
        html: '<b>Name:</b> ' + data.name + '<br><b>Email:</b> ' + data.email + '<br><b>Message:</b> ' + data.message
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            callback({success: false, response: error})
        } else {
            callback({success: true, response: info})
        }
    })
}


