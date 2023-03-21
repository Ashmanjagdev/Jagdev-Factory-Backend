
let express=require("express");

const https = require("https");
const qs = require("querystring");

const checksum_lib = require("./Paytm/checksum");
const config = require("./Paytm/config");

const app=express();
const port=process.env.PORT || 3000;
const parseUrl = express.urlencoded({ extended: false });
const parseJson = express.json({ extended: false });

let bodyParser=require("body-parser");
var _ = require('lodash');
const mongoose=require('mongoose');
const md5=require("md5");
const session = require('express-session');
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

var fs = require('fs');
var path = require('path');
require('dotenv').config()

app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(express.static(__dirname+'/public/'));

app.use(session({
  secret:"There is no secret",
  resave:false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb+srv://ashman:ashmanraju@cluster0.n8apx.mongodb.net/Jagdev-factory');


const userschema= new mongoose.Schema ({
  email:String,
  password: String,
  googleId:String
});

userschema.plugin(passportLocalMongoose);
userschema.plugin(findOrCreate);

const User=new mongoose.model("User",userschema);

passport.use(User.createStrategy());

passport.serializeUser(function(user,done){
  done(null,user.id);
});
passport.deserializeUser(function(id,done){
  User.findById(id,function(err,user){
    done(err,user);
  });
});
passport.deserializeUser(User.deserializeUser());

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://jagdev-factory.onrender.com/auth/google/jagdev-factory",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ username: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


var multer = require('multer');

var storage = multer.diskStorage({
    destination:"./public/uploads/",
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now()+path.extname(file.originalname));
    }
  });
  var upload = multer({ storage: storage }).single('file');

var sellitems = new mongoose.Schema({
  cards1:{
   name: String,
   checkname:String,
   address: String,
   price: String,
   desc: String,
   image:String,
   check:String
 },
cards2:{
 name: String,
 checkname:String,
 address: String,
 price: String,
 desc: String,
 image:String,
 check:String
}
});



const Item=mongoose.model('Item',sellitems);

var cartitems = new mongoose.Schema({
  id: String,
  name: String,
  price: String,
  image:String
});

const Cart=mongoose.model('Cart',cartitems);


app.listen(port,function(){
  console.log("hosted:3000");
});

app.post('/sellatcards1',upload, (req, res) => {

     var obj =new Item ({
      cards1:{
        name: req.body.name,
        checkname:_.kebabCase([string=req.body.name]),
        address: req.body.address,
        price: req.body.price,
        desc: req.body.desc,
        image: req.file.filename,
        check: ""
      },
      cards2:{
        check: "none"
      }
      });
    obj.save();
    res.redirect("/addatcards1");
});
app.post('/sellatcards2',upload, (req, res) => {

    var obj =new Item ({
      cards2:{
        name: req.body.name,
        checkname:_.kebabCase([string=req.body.name]),
        address: req.body.address,
        price: req.body.price,
        desc: req.body.desc,
        image: req.file.filename,
        check: ""
      },
      cards1:{
        check: "none"
      }
      });
    obj.save();
    res.redirect("/addatcards2");
});
app.get('/',function(req,res){
  if(req.isAuthenticated()){
    Item.find({}, (err, items) => {
    var value="Signup/login";
      res.render('index', { listItems: items,name:"logout"   });
      });
  }
  else{
    Item.find({}, (err, items) => {
var value="Signup/login";
      res.render('index', { listItems: items,name:"Signup/login" });
      });
  }
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

  app.get('/auth/google/jagdev-factory',
  passport.authenticate('google', { failureRedirect: '/Signup/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });

app.get('/addatcards1',function(req,res){
  res.render("sellatcards1", {name:"logout"   });
});
app.get('/addatcards2',function(req,res){
  res.render("sellatcards2", { name:"logout"   });
});
app.get('/position',function(req,res){
  if(req.isAuthenticated()){
    res.render("sell-position", { name:"logout"   });
  }
  else{
   res.redirect("/Signup/login");
  }
});
app.get('/Signup/login',function(req,res){
  res.render("login", { name:"Signup/login" });
});
app.post('/login', (req, res) => {
const user= new User({
  username: req.body.username,
  passwword: req.body.password
});
req.login(user,function(err){
  if(err){
    console.log(err);
  }
  else{
    passport.authenticate("local")(req,res, function(){
    res.redirect("/");
    });
  }
});

});
app.get('/signup',function(req,res){
  res.render("signup", { name:"Signup/login" });
});
app.post('/signup', (req, res) => {
User.register({username:req.body.username}, req.body.password,function(err, user){
  if(err){
    console.log(err);
    res.redirect("/signup");
  }
  else{
    passport.authenticate("local")(req,res, function(){
    res.redirect("/");
    });
  }
});
});
app.get('/product/:head',function(req,res){
  let requestedTitle=req.params.head;

  Item.find({},function(error,data){
    data.forEach((item) => {
      if(item.cards1.checkname===_.kebabCase([string=requestedTitle])){
      res.render("product",{heading:item.cards1.name,price:item.cards1.price,description:item.cards1.desc,image:item.cards1.image,name:"logout"});
}
      if(item.cards2.checkname===_.kebabCase([string=requestedTitle]))
      res.render("product",{heading:item.cards2.name,price:item.cards2.price,description:item.cards2.desc,image:item.cards2.image,name:"logout"});

  });
});
});

app.post('/product/:head',function(req,res){

  const finder=_.kebabCase([string=req.params.head]);

  if(req.isAuthenticated()){
  Item.find({},function(error,data){
    data.forEach((item) => {
      if(finder===_.kebabCase([string=item.cards1.checkname])){
        var cartitem =new Cart ({
            id: req.user.username,
            name: item.cards1.name,
            price: item.cards1.price,
            image: item.cards1.image
          });
        cartitem.save();
}

      if(finder===_.kebabCase([string=item.cards2.checkname])){
        var cartitem1 =new Cart ({
            id: req.user.username,
            name: item.cards2.name,
            price: item.cards2.price,
            image: item.cards2.image
          });
        cartitem1.save();
      }
  });

});
res.redirect("/product/"+ req.params.head);
}
else{
 res.redirect("/Signup/login");
}
});

app.get('/cart',function(req,res){
  if(req.isAuthenticated()){
    Cart.find({ id: req.user.username }, function (err, docs) {
      var total=0;
      docs.forEach((item) => {
        let ans=item.name;
        total=total+parseInt(item.price);
      });


        res.render("cart",{items:docs,subtotal:total,name:"logout" });

});
  }
  else{
   res.redirect("/Signup/login");
  }
});

app.post("/cart",function(req,res)
{
  const id=req.body.delete;
  Cart.findByIdAndRemove(id,function(err){
    if(!err)
    {
    res.redirect("/cart");
  }
  else {
    console.log(err);
  }
  });
});


app.post('/search',function(req,res){
  if(req.isAuthenticated()){
    const finder=_.kebabCase([string=req.body.search]);
    Item.find({},function(error,data){
      data.forEach((item) => {
        if(finder===_.kebabCase([string=item.cards1.checkname])){
          res.render('search', { item: item,name:"logout"   });
  }

  if(finder===_.kebabCase([string=item.cards2.checkname])){

  res.render('search', { item: item,result:req.body.search,name:"logout"   });
        }
    });

  });
  }
else{
  const finder=_.kebabCase([string=req.body.search]);
  Item.find({},function(error,data){
    data.forEach((item) => {
      if(finder===_.kebabCase([string=item.cards1.checkname])){
        res.render('search', { item: item,name:"logout"   });
}

if(finder===_.kebabCase([string=item.cards2.checkname])){

res.render('search', { item: item,result:req.body.search,name:"Signup/login"   });
      }
  });

});
}



});

app.post("/paynow", [parseUrl, parseJson], (req, res) => {
  // Route for making payment

  var paymentDetails = {
    amount: req.body.amount,
    customerId: req.body.name,
    customerEmail: req.body.email,
    customerPhone: req.body.phone
}
if(!paymentDetails.amount || !paymentDetails.customerId || !paymentDetails.customerEmail || !paymentDetails.customerPhone) {
    res.status(400).send('Payment failed')
} else {
    var params = {};
    params['MID'] = config.PaytmConfig.mid;
    params['WEBSITE'] = config.PaytmConfig.website;
    params['CHANNEL_ID'] = 'WEB';
    params['INDUSTRY_TYPE_ID'] = 'Retail';
    params['ORDER_ID'] = 'TEST_'  + new Date().getTime();
    params['CUST_ID'] = paymentDetails.customerId;
    params['TXN_AMOUNT'] = paymentDetails.amount;
    params['CALLBACK_URL'] = 'http://localhost:3000/callback';
    params['EMAIL'] = paymentDetails.customerEmail;
    params['MOBILE_NO'] = paymentDetails.customerPhone;


    checksum_lib.genchecksum(params, config.PaytmConfig.key, function (err, checksum) {
        var txn_url = "https://securegw-stage.paytm.in/theia/processTransaction"; // for staging
        // var txn_url = "https://securegw.paytm.in/theia/processTransaction"; // for production

        var form_fields = "";
        for (var x in params) {
            form_fields += "<input type='hidden' name='" + x + "' value='" + params[x] + "' >";
        }
        form_fields += "<input type='hidden' name='CHECKSUMHASH' value='" + checksum + "' >";

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write('<html><head><title>Merchant Checkout Page</title></head><body><center><h1>Please do not refresh this page...</h1></center><form method="post" action="' + txn_url + '" name="f1">' + form_fields + '</form><script type="text/javascript">document.f1.submit();</script></body></html>');
        res.end();
    });
}
});
app.post("/callback", (req, res) => {
  // Route for verifiying payment

  var body = '';

  req.on('data', function (data) {
     body += data;
  });

   req.on('end', function () {
     var html = "";
     var post_data = qs.parse(body);

     // received params in callback


     // verify the checksum
     var checksumhash = post_data.CHECKSUMHASH;
     // delete post_data.CHECKSUMHASH;
     var result = checksum_lib.verifychecksum(post_data, config.PaytmConfig.key, checksumhash);



     // Send Server-to-Server request to verify Order Status
     var params = {"MID": config.PaytmConfig.mid, "ORDERID": post_data.ORDERID};

     checksum_lib.genchecksum(params, config.PaytmConfig.key, function (err, checksum) {

       params.CHECKSUMHASH = checksum;
       post_data = 'JsonData='+JSON.stringify(params);

       var options = {
         hostname: 'securegw-stage.paytm.in', // for staging
         // hostname: 'securegw.paytm.in', // for production
         port: 443,
         path: '/merchant-status/getTxnStatus',
         method: 'POST',
         headers: {
           'Content-Type': 'application/x-www-form-urlencoded',
           'Content-Length': post_data.length
         }
       };


       // Set up the request
       var response = "";
       var post_req = https.request(options, function(post_res) {
         post_res.on('data', function (chunk) {
           response += chunk;
         });

         post_res.on('end', function(){

           var _result = JSON.parse(response);
             if(_result.STATUS == 'TXN_SUCCESS') {
                 res.send('payment sucess')
             }else {
                 res.send('payment failed')
             }
           });
       });

       // post the data
       post_req.write(post_data);
       post_req.end();
      });
     });
});

app.get('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});
