const details = require('./config.json')
const PORT = process.env.PORT || 9999;
const express = require('express');
//Mail
const cors = require('cors');
const bodyParser = require('body-parser');
const mail = require('./mail/mail.js')
//DB/CMS
const mongoose = require('mongoose');
const MongoDBURL = process.env.MongoURL || details.MongoURL //|| "mongodb://localhost:27017/shaikhsaab-blog";
//Auth
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const uuid = require('node-uuid');
const SECRET_KEY = 'Wow.MoreOfAPassphraseThanAnActualPassword';
//Upload Services
const multer = require('multer');
const imageUploadFolder = 'uploads/images/';
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
var publicDir = require('path').join(__dirname,'/uploads'); 
//JSON CRUD Operations
//fs already imported
const experienceJsonPath = 'uploads/data/Experience.json';

require('dotenv').config()

const app = express();
app.use(cors({ origin: '*' }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(cookieParser());
app.use(express.static(publicDir)); 


app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`)
})

app.get("/", (req, res) => {
    res.send(
        "<h1 style='text-align:center'>Things are looking good!!!</h1>"
    );
})
//EMAIL SERVICE
mail(app);

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
        .populate({ path: 'comments', model: 'comments' }) //Update comments array with actual comments
        .then(posts => {
            res.send(posts)
        })
})

app.post('/getPost', (req, res) => {
    const id = req.body.id
    POST.findById(id)
        .populate({ path: 'comments', model: 'comments' })
        .then(posts => {
            res.send(posts)
        })
})

app.post('/editPost', withAuthentication, (req, res) => {
    const id = req.body.id
    const data = req.body.post;
    POST.findByIdAndUpdate(id, data).then(post => {
        res.send({ success: true, message: "Post updated Successfully", response: post })
    }).catch((err) => {
        res.send({ success: false, message: "Error occurred while updating the post", response: err })
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
app.post('/postComment', (req, res) => {
    const postID = req.body.postID
    POST.findById(postID).then((post) => {
        if (post) {
            var comment = new COMMENTS({
                name: req.body.name,
                body: req.body.comment
            })

            //Add comment on that particular post
            post.comments.push(comment);
            post.save().then((postDaved) => {
                //Push in comments DB
                comment.save().then((commentSaved) => {
                    res.send({ success: true })
                })
            })
        }
    }).catch(() => {
        //No such post
        res.sendStatus(404)
    })
})

app.get('/fetchComments', (req, res) => {
    const postID = req.body.postID
    POST.findById(postID).then((post) => {
        if (post) {


            //Add comment on that particular post
            post.comments.push(comment);
            post.save().then((postDaved) => {
                //Push in comments DB
                comment.save().then((commentSaved) => {
                    res.send({ success: true })
                })
            })
        }
    }).catch(() => {
        //No such post
        res.sendStatus(404)
    })
})

app.post('/editComment', withAuthentication, (req, res) => {
    const id = mongoose.Types.ObjectId(req.body.id)
    const data = req.body.comment;
    COMMENTS.findByIdAndUpdate(id, data).then(comment => {
        comment.save().then((info) => {
            res.send({ success: true, message: 'Comment updated successfully', response: info })
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
        res.send({ success: true, message: 'Comment deleted successfully', response: comment })
    }).catch((err) => {
        console.log(err)
        res.send({ success: false, message: 'Error occured', response: err })
    })
})

//Authentication Services
app.post('/login', (req, res) => {
    const username = req.body.username,
        password = req.body.password;

    // TODO: Check username and password in MongoDB
    if (username == process.env.ADMIN_PANEL_USERNAME && password == process.env.ADMIN_PANEL_PASSWORD) {
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
        res.send({ success: true, LoginResult })

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

    } else {
        res.send({ errorCode: 203, success: false, message: "Invalid username or password" })
    }
})

function ValidateAccess(token) {
    return new Promise((resolve, reject) => {
        try {
            let decoded = jwt.verify(token, SECRET_KEY, { algorithms: ["HS256"] })
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

//Upload Services
let storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, imageUploadFolder);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
});

let upload = multer({
    storage: storage
});

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const cloudinaryuploads = (file, folder) => {
    return new Promise(resolve => {
        cloudinary.uploader.upload(file, {
            resource_type: "auto",
            folder: folder,
            use_filename: true,
            overwrite: true,
            unique_filename: false
        }).then((result) => {
            resolve({
                url: result.url,
                id: result.public_id
            })
        })
    })
}

const uploader = async (path) => await cloudinaryuploads(path, 'images');


// let upload = multer({dest: imageUploadFolder})

// fs.readdir(imageUploadFolder, (err, files) => {
//   files.forEach(file => {
//     console.log(file);
//   });
// });

// POST File
// this method will store files in cloudinary
app.post('/uploadImagesOnCloud', upload.array('files'), async function (req, res) {
    const urls = []
    const files = req.files;
    for (const file of files) {
      const { path } = file;
      const newPath = await uploader(path)
      urls.push(newPath)
      fs.unlinkSync(path)
      console.log(urls)
    }

    res.status(200).json({
      message: 'images uploaded successfully',
      data: urls
    })
});

// This method stores file in nodejs folder
app.post('/uploadImages', upload.array('files'), function (req, res) {
    const files = req.files;
    console.log(files)
    if (!files) {
        console.log("No file is available!");
        return res.send({
            success: false,
            message: "No image selected"
        });

    } else {
        console.log('File is available!');
        return res.send({
            success: true,
            message: "Image uploaded successfully",
            data: files
        })
    }
});


// This method deletes file from nodejs folder
app.post('/deleteImage', (req, res) => {
    let path = req.body.path
    fs.unlink(path, (err)=>{
        if(err){
            res.send({
                success: false,
                message: "Unable to delete file",
                error: err
            })
            return
        }

        res.send({
            success: true,
            message: "File deleted successfully"
        })
    })
});
// this method will delete files from cloudinary
app.post('/deleteImageFromCloud', (req, res) => {
    let publicId = req.body.path
    cloudinary.uploader.destroy(publicId, {}, (err)=>{
        if(err){
            res.send({
                success: false,
                message: "Unable to delete file",
                error: err
            })
            return
        }

        res.send({
            success: true,
            message: "File deleted successfully"
        })
    });
});

//This method will get all images from nodejs folder
app.get('/getAllImages',(req, res)=>{
    fs.readdir(imageUploadFolder, (err, files) => {
        let all = files.map((file)=>{
            return imageUploadFolder+file;
        })
        res.send(all)
    });
})
//This method will get all images from cloudinary
app.get('/getAllImagesFromCloud',(req, res)=>{
    cloudinary.api.resources({
        type: 'upload',
        prefix: 'images/',
        max_results: 500
    }, 
    function(error, result){
        console.log('getAllImagesFromCloud - err', error)
        console.log('getAllImagesFromCloud - result', result)
        res.send(result)
    });
})

app.use('/uploads', express.static('uploads'));


//JSON CRUD Operations

// helper methods
function readFile(callback, filePath = dataPath, returnJson = false, encoding = 'utf8'){
    fs.readFile(filePath, encoding, (err, data) => {
        if (err) {
            throw err;
        }

        callback(returnJson ? JSON.parse(data) : data);
    });
};

function writeFile(fileData, filePath = dataPath, callback, encoding = 'utf8'){
    fs.writeFile(filePath, fileData, encoding, (err) => {
        if (err) {
            throw err;
        }
        callback();
    });
};

// READ
app.get('/getExperience', (req, res) => {
    console.log(req)
    fs.readFile(experienceJsonPath, 'utf8', (err, data) => {
        if (err) {
            throw err;
        }

        res.send(JSON.parse(data));
    });
});
//WRITE
app.post('/postExperience', withAuthentication, (req, res) => {
    const data = req.body
    writeFile(JSON.stringify(data, null, 2), experienceJsonPath ,(x) => {
        res.send({
            success: true,
            message: "JSON updated successfully"
        })
    });
});

// CREATE
// app.post('/addNewExperience', (req, res) => {

//     readFile((data) => {
//         // const newExpId = Object.keys(data).length + 1;

//         // add the new user
//         data.push(req.body);

//         writeFile(JSON.stringify(data, null, 2), () => {
//             res.status(200).send('new exp added');
//         });
//     },experienceJsonPath, true);
// });


// // UPDATE
// app.put('/updateExperience/:id', (req, res) => {

//     readFile((data) => {

//         // add the new user
//         const userId = req.params["id"];
//         data[userId] = req.body;

//         writeFile(JSON.stringify(data, null, 2), () => {
//             res.status(200).send(`users id:${userId} updated`);
//         });
//     },experienceJsonPath, true);
// });


// // DELETE
// app.delete('/deleteExperience/:id', (req, res) => {

//     readFile(data => {

//         // add the new user
//         const userId = req.params["id"];
//         delete data[userId];

//         writeFile(JSON.stringify(data, null, 2), () => {
//             res.status(200).send(`users id:${userId} removed`);
//         });
//     },experienceJsonPath, true);
// });