const express = require('express');
const bodyParser = require("body-parser");
const mongodb = require('mongodb');
const cookieParser = require("cookie-parser");
const { v4: uuidv4 } = require('uuid');

let app = express();
app.set("view-engine","ejs");
const parser = bodyParser.json();

app.use(parser);
app.use(cookieParser());

const uri = 'mongodb://localhost:27017';
const client = new mongodb.MongoClient(uri);


let dbo = null;
async function dbinit(){
    await client.connect();
    dbo = client.db("ITI");
    app.listen(5000, function() {
        console.log('Server Started');
    })
}
dbinit();


app.get('/login', function(req, res) {
    res.render('login.ejs');
})

async function auth(req,res,next){
    if(req.cookies.sid){
        let user = await dbo.collection("users").findOne({sid:req.cookies.sid});

        if(user){
            req.user = user;
            next();
        }else{
            res.send({msg:"Error: Not Authenticated User"});
        }
    }else{
        res.send({msg:"Error: Not Authenticated User"});
    }
}

app.post('/login', async function(req, res) {
    let data = req.body;
    if(data.username !="" && data.password.length>=8){
        let user = await dbo.collection("users").findOne({username:data.username,password:data.password});
        if(user){
            const uuid = uuidv4();
            await dbo.collection("users").updateOne({_id:user._id},{$set:{sid:uuid}});
            res.cookie("sid",uuid);
            res.send({msg:"Success"})
        }else{
            res.send({msg:"User Not Found"})
        }
    }else{
        res.send({msg:"User Not Found"})
    }
})

app.get("/",async function(req,res){
    let users = await dbo.collection("users").find().toArray();
    res.send({msg:"welcome"});
})

app.get("/index",async function(req,res){
    res.render("index.ejs");
})

app.get("/currentuser",auth,async function(req,res){
    res.send(req.user);
})


app.get("/logout",auth,function(req,res){
    dbo.collection("users").updateOne({_id:req.user._id},{$set:{sid:""}})
    res.cookie("sid","");
    res.send({msg:"logout success"})
})