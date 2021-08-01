var middlewareObj={};
middlewareObj.isLoggedIn=function(req,res,next){
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect("./views/modal_form.ejs"); //if not logged in, go to login page
	}
module.exports=middlewareObj;
