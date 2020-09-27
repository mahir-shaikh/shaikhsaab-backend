const details = require('./config.json')
const PORT = process.env.PORT || 9999;
const express = require('express');
//Mail
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
//DB/CMS
const mongoose = require('mongoose');
const MongoDBURL = details.MongoURL;
//Auth
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const uuid = require('node-uuid');
const SECRET_KEY = 'Wow.MoreOfAPassphraseThanAnActualPassword';

require('dotenv').config()

const app = express();
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());
app.use(cookieParser());

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
// Blog posts
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
        res.send({ success: true, message: "Post Created Successfully", response: info })
    }).catch((err) => {
        res.send({ success: false, message: "Error occurred while creating the post", response: err })
    })
})

app.get('/getAllPosts', (req, res) => {
    POST.find()
        .populate({path: 'comments', model: 'comments'}) //Update comments array with actual comments
        .then(posts => {
            res.send(posts)
        })
})

app.post('/getPost', (req, res) => {
    const id = req.body.id
    POST.findById(id)
        .populate({path: 'comments', model: 'comments'})
        .then(posts => {
            res.send(posts)
        })
})

app.post('/editPost', withAuthentication, (req, res) => {
    const id = req.body.id
    const data = req.body.post;
    POST.findByIdAndUpdate(id, data).then(post => {
        res.send({ success: true, message: "Post updated Successfully" , response: post })
    }).catch((err) => {
        res.send({ success: false, message: "Error occurred while updating the post" , response: err })
    })
})

app.post('/deletePost', withAuthentication, (req, res) => {
    const id = req.body.id
    POST.findByIdAndDelete(id).then(deletedPost => {
        res.send({ success: true, response: deletedPost })

    }).catch((err) => {
        res.send({ success: false, response: err })
    })
})
// Comments
var COMMENTS = require('./models/CommentModel')
app.post('/postComment', (req, res)=>{
    const postID = req.body.postID
    POST.findById(postID).then((post)=>{
        if(post){
            var comment = new COMMENTS({
                name: req.body.name,
                body: req.body.comment
            })

            //Add comment on that particular post
            post.comments.push(comment);
            post.save().then((postDaved)=>{
                //Push in comments DB
                comment.save().then((commentSaved)=>{
                    res.send({success: true})
                })
            })
        }
    }).catch(()=>{
        //No such post
        res.sendStatus(404)
    })
})

app.get('/fetchComments', (req, res)=>{
    const postID = req.body.postID
    POST.findById(postID).then((post)=>{
        if(post){


            //Add comment on that particular post
            post.comments.push(comment);
            post.save().then((postDaved)=>{
                //Push in comments DB
                comment.save().then((commentSaved)=>{
                    res.send({success: true})
                })
            })
        }
    }).catch(()=>{
        //No such post
        res.sendStatus(404)
    })
})

app.post('/editComment', withAuthentication, (req, res) => {
    const id = mongoose.Types.ObjectId(req.body.id)
    const data = req.body.comment;
    COMMENTS.findByIdAndUpdate(id, data).then(comment => {
        comment.save().then((info) => {
            res.send({ success: true, message: 'Comment updated successfully',  response: info })
        }).catch((err) => {
            res.send({ success: false, message: 'Error occured', response: err })
        })
    })
})

app.post('/deleteComment', withAuthentication, (req, res) => {
    const id = mongoose.Types.ObjectId(req.body.id)
    //Remove from comments array of the post
    //Need to write query to Remove from comments array of the post 

    //Remove from comments model
    COMMENTS.findByIdAndDelete(id).then(comment => {
        res.send({ success: true, message: 'Comment deleted successfully',  response: comment })
    }).catch((err) => {
        console.log(err)
        res.send({ success: false, message: 'Error occured', response: err })
    })
})

//Authentication Services
app.post('/login', (req, res)=>{
    const username = req.body.username,
            password = req.body.password;

    // TODO: Check username and password in MongoDB
    if(username == process.env.ADMIN_PANEL_USERNAME && password == process.env.ADMIN_PANEL_PASSWORD){
        const userID = "732798127398173"// findUserIdForEmail(usernmae)   fetch unique ID for that user from mongo; Random for now

        let options = {
            expiresIn: '2h',
            jwtid: uuid.v4()
        };

        let token = jwt.sign({
            user: userID
        }, SECRET_KEY, options);

        LoginResult = {
            JWT: token
        }

        // res.cookie("SESSIONID", token, {httpOnly:true, secure:true});
        res.send({success: true, LoginResult})

        // const jwtBearerToken = jwt.sign({}, RSA_PRIVATE_KEY, {
        //     algorithm: 'RS256',
        //     expiresIn: 120,
        //     subject: userID
        // })

        //Option 1: Send it back in cookie
        //Advantage: client request automatically attaches cookie, hence no coding on front end
        // set it in an HTTP Only + Secure Cookie
        // res.cookie("SESSIONID", jwtBearerToken, {httpOnly:true, secure:true});


        //Option 2: set it in the HTTP Response body
        //Disadvantage: Client calls will not have the token automatically. will require coding on front end to attach the token with each call
        // res.status(200).json({
        //     idToken: jwtBearerToken, 
        //     expiresIn: 120
        // });
    
    } else{
        res.send({errorCode: 203, success: false, message: "Invalid username or password"})
    }
})

function ValidateAccess(token){
    return new Promise((resolve, reject) => {
        try {
            let decoded = jwt.verify(token, SECRET_KEY, { algorithms: ["HS256"]})
            resolve(decoded);
        } catch (err) {
            reject(err);
        }
    });
} 

function withAuthentication(req, res, next) {
    console.log('withAuthentication')
    let token;
    if (req.headers.authorization) {
        token = req.headers.authorization;
        console.debug("[Access] Found a token");
    } else {
        console.debug("[Access] No Authorization header found");
        return res.status(401).send("No Authorization header found");
    }
    return ValidateAccess(token)
        .then((user) => {
            userData = user;
            console.info('[Access] Authorized user:', user)
            req.auth = user;
            next();
        })
        .catch((errNoAccess) => {
            console.info('[Access] Rejected user with error:', errNoAccess)
            res.status(401).send(errNoAccess);
        });
}