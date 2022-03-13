require("dotenv").config();
const express=require('express');
const mongoose= require('mongoose');
const bodyparser=require('body-parser');
const cookieParser=require('cookie-parser');
const User=require('./models/user');
const {auth} =require('./middlewares/auth');
const db=require('./config/config').get(process.env.NODE_ENV);


const app=express();
// app use
app.use(bodyparser.urlencoded({extended : true}));
app.use(bodyparser.json());
app.use(cookieParser());
app.use(express.static("public"));
app.set("view engine", "ejs");

// mongoose.connect("mongodb://localhost:27017/userDB");
mongoose.Promise=global.Promise;
mongoose.connect(db.DATABASE,{ useNewUrlParser: true,useUnifiedTopology:true },function(err){
    if(err) console.log(err);
    console.log("database is connected");
});


app.get("/", function(req,res){
  res.render("home");
})

app.get("/api/register", function(req,res){
  res.render("register");
})

app.get("/api/login", function(req,res){
  res.render("login");
})

// adding new user (sign-up route)
app.post('/api/register',function(req,res){
   // taking a user
   const newuser=new User(req.body);

   if(newuser.password!=newuser.password2)return res.render("error", {text: "Passwords do not match"})

   User.findOne({email:newuser.email},function(err,user){
       if(user) return res.render("error", {text: "email exists"});
       // status(400).json({ auth : false, message :"email exits"});
       newuser.save((err,doc)=>{
           if(err) {
               return res.render("error", {text: "User Validation failed"});};
           res.redirect("/api/login");
           // status(200).json({
           //     succes:true,
           //     user : doc
           // });
       });
   });
});


// login user
app.post('/api/login', function(req,res){
    let token=req.cookies.auth;
    User.findByToken(token,(err,user)=>{
        if(err) return  res(err);
        if(user) return res.render("error", {text: "You are already logged in"});
        // status(400).json({
        //     error :true,
        //     message:"You are already logged in"
        // });

        else{
            User.findOne({'email':req.body.email},function(err,user){
                if(!user) return res.render("error", {text: "Auth failed ,email not found"});
                // json({isAuth : false, message : ' Auth failed ,email not found'})

                user.comparepassword(req.body.password,(err,isMatch)=>{
                    if(!isMatch) return res.render("error", {text: "password doesn't match"});
                    // json({ isAuth : false,message : "password doesn't match"})

                user.generateToken((err,user)=>{
                    if(err) return res.status(400).send(err);
                    res.cookie('auth',user.token).render("logout", {user: user});
                    // json({
                    //     isAuth : true,
                    //     id : user._id,
                    //     email : user.email
                    // });
                });
            });
          });
        }
    });
});

//logout user
 app.get('/api/logout',auth,function(req,res){
        req.user.deleteToken(req.token,(err,user)=>{
            if(err) return res.status(400).send(err);
            res.redirect("/");
        });

    });

// get logged in user
app.get('/api/profile',auth,function(req,res){
        res.json({
            isAuth: true,
            id: req.user._id,
            email: req.user.email,
            name: req.user.firstname + req.user.lastname

        })
});

app.listen(process.env.PORT || 3000, function() {
  console.log("sever up on 3000");
})
