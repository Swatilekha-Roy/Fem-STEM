// Imports
require("dotenv").config({ path: ".env" });
const webPush = require("web-push");
var _ = require("lodash");
var lowerCase = require('lodash.lowercase');
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
var bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const ejs = require("ejs");

const { resolveSoa } = require("dns");

// Intialize the app
const app = express();

//passport authentication
var User = require("./db/models/users");
var Match = require("./db/models/match");
var Post = require("./db/models/post");
var MatchUser = require("./db/models/match");
var Group = require("./db/models/group");
var Comment=require("./db/models/comment");
var passport = require("passport");
var localStrategy = require("passport-local"),
  methodOverride = require("method-override");
app.use(
  require("express-session")({
    secret: "This is the decryption key",
    resave: false,
    saveUninitialized: false,
  })
);

// Database connect
mongoose.connect("mongodb+srv://chehak:123@cluster0.ca1bc.mongodb.net/UserDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(methodOverride("_method"));
app.use(passport.initialize()); //use to use passport in our code
app.use(passport.session());

passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false });
app.use(urlencodedParser);

// Template engine
app.set("view engine", "ejs");

// For parsing application/json
app.use(bodyParser.json());

// Loading static files
app.use(express.static("public"));
app.use(express.static("views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "views")));
app.use(function (req, res, next) {
  res.locals.currentUser = req.user;
  //res.locals.error=req.flash("error");
  //res.locals.success=req.flash("success");
  next();
});

var authRoutes = require("./routes/auth.js");
var counter = 0;
app.use("/", authRoutes);

// Homepage rendering
app.get("/", function (req, res) {
  res.render("index", { currentUser: req.user });
});

// Opportunities page rendering
app.get("/opportunities", function (req, res) {
  Post.find({}, function(err, post){
    res.render("opportunities", {
      currentUser: req.user,
      post: post
      });
  });
});

app.post("/opportunities",function(req,res){
  const post = new Post ({
    title: req.body.Title,
    description: req.body.Description,
    eligibility: req.body.Eligibility,
    deadline: req.body.Deadline,
    link: req.body.Link
  });

  post.save();
  res.redirect("/opportunities");
});

// Mentoring(help) page rendering
app.get("/help", function (req, res) {
Group.find({}, function(err, group){
    res.render("help", {
      currentUser: req.user,
      groups: group
      });
  });
});

app.post("/help",function(req,res){
  var newArray = [];
newArray.push.apply(newArray, req.user.skills);
  const group = new Group ({
    title: req.body.Title,
    description: req.body.Description,
    link: req.body.Link,
    skills:newArray,
    created_by: req.user.name
  });
 Group.create(group,function(err,newlyCreated){
		if(err)
		{console.log(err); res.redirect("/help");}
		else
		{res.redirect("/help");}
	});	
});

app.get("/help/:id", function (req, res) {
  // const requestedname = req.params.groupname;

  Group.findById(req.params.id).populate("comments").exec(function(err,found){ 
		if(err)
		{ console.log(err);}
			else
      res.render("grouppage",{
        currentUser: req.user,
        //mentorstat: req.user.is_mentor,
        /*title: group.title,
        description: group.description,
        link: group.link,*/
        group: found
       });
	});
  /*const requestedtitle=_.lowerCase(req.params.groupname);

  Group.find({}, function(err, groups){
  groups.forEach(function(group){
    const storedtitle=_.lowerCase(group.title);

    //  console.log(storedtitle);
    //  console.log(requestedtitle);
    if(storedtitle===requestedtitle){
       res.render("grouppage",{
        currentUser: req.user,
        //mentorstat: req.user.is_mentor,
        title: group.title,
        description: group.description,
        link: group.link,
       });
    }
  });
});*/
});

app.post("/help/:id",function(req,res){ 
	Group.findById(req.params.id,function(err,found){
		if(err){
		    console.log(err); 
	}
		else
			//create new comments
		{Comment.create(req.body.comment, function(err, newComment)
						  {
				if (err) {console.log(err); res.redirect("back");}
				else
				{ newComment.author.id=req.user._id;
				 newComment.author.username=req.user.name;
         newComment.author.mentor_status = req.user.is_mentor;
         newComment.is_answered=0; //if its answered, then 1, else 0
         newComment.text=req.body.text;
				 newComment.save();
					//add comment to campground
					found.comments.push(newComment);
				 //save comment
				found.save();
					//redirect to campground show page
				
				 res.redirect("/help/"+req.params.id);
				}
			})}
	})
})

// Groups page rendering
app.get("/grouppage", function(req, res) {
  res.render("grouppage", { currentUser: req.user });
});
app.post("/grouppage", function(req, res) {
  commentdbt = req.body.Commentans;
  is_answered = req.body.Answerstat;
  console.log(is_answered);
});

// Tutorials page rendering
app.get("/tutorials", function (req, res) {
  res.render("tutorials", { currentUser: req.user });
});

// Teammates page rendering
var skillarr = new Array();
var requser = new Array();
app.get("/teammates", function (req, res) {

  // requser.sort(function(a, b){
  //   var x = a._id;
  //   var y = b._id;
  //   if (x < y) {return -1;}
  //   if (x > y) {return 1;}
  //   return 0;
  // });

  // for(var i=0;i<requser.length;i++){
  //   console.log(requser[i].name);
  // }

  // console.log("i");

  // for(var i=1;i<requser.length;i++){
  //   console.log(requser[i-1].name);
  //   console.log(requser[i].name);
    
  //   if(requser[i]._id===requser[i-1]._id){
  //     cout<<"i";
  //     requser.splice(i+1,1);
  //     i--;
  //   }
  // }

//   requser.splice(3,1);

// console.log("i");

  
//   for(var i=1;i<requser.length;i++){
//     console.log(requser[i]._id);
//     // if(requser[i]===requser[i-1]){
//       // requser.splice(,1);
//       // i--;
//     // }
//   }

  // for(var i=0;i<requser.length;i++){
  //   console.log(requser[i]);
  // }

  // requser.sort();

  res.render("teammates", { 
    currentUser: req.user,
    requser: requser
  });

});

//teammates posting
app.post("/teammates", function (req, res) {
  
    for(var i=0; i<req.body.checked.length; i++)
    {
      skillarr[i] = req.body.checked[i];
      // console.log(skillarr[i]);
    }

    var j=0;
    for(var i=0;i<skillarr.length;i++){
       User.find({skills: { "$in" : [skillarr[i]]} }, function(err,requserdb){
       // User.find({skills: { "$in" : skillarr} }, function(err,requserdb){
        requserdb.forEach(function(user){
          requser[j]=user;
          j++;
        });
       
      });
    }
    res.redirect("/teammates");
});

requser=[];
skillarr = [];


// Profile page rendering
app.get("/profile", function (req, res) {
  res.render("profile", { currentUser: req.user});
});

// pride page rendering
app.get("/pride", function (req, res) {
  res.render("pride", { currentUser: req.user });
});
//adding comments
app.post("/comment",function(req,res){
	//lookup group using id
	Group.findById(req.params.id,function(err,found){
		if(err){
			req.flash("error","Sorry Campground not found");
		    console.log(err); 
			res.redirect("/campgrounds");}
		else
			//create new comments
		{Comment.create(req.body.comment, function(err, newComment)
						  {
				if (err) {req.flash("error","Unable to create new comment");console.log(err); res.redirect("back");}
				else
				{ newComment.author.id=req.user._id;
				 newComment.author.username=req.user.username;
				 newComment.save();
					//add comment to campground
					found.comments.push(newComment);
				 //save comment
				found.save();
					//redirect to campground show page
				 req.flash("success","Comment successfully created!");
				 res.redirect("/campgrounds/"+req.params.id);
				}
			})}
	})
})
// Ports
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Lazy bum on Port ${PORT}`);
});
