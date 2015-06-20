var app_root = __dirname,
express = require("express"),
path = require("path"),
request = require("request"),
bodyParser = require("body-parser"),
route = require("./router/routes.js"),
serveStatic = require("serve-static");

//server init

var app = express();
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

app.use(function(req,res,next){
    console.log("request path : "+req.url);
    next();
});

//create front acces to vendors and css folder
app.use("/vendors/",serveStatic(app_root+"/../vendors/"));
app.use("/css/",serveStatic(app_root+"/../css/"));

app.use(route);
//server start listening 

app.listen(8080);

// Database

var dbConnection = require("./db/dbConnection.js");

