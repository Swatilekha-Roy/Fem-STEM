var mongoose=require("mongoose");
var commentSchema=new mongoose.Schema({
	author: {id: { type: mongoose.Schema.Types.ObjectId,
				 ref:"User"},
			username:String,
			mentor_status:Number,
		}
		, 
	text: String,
is_answered:Number});
module.exports= mongoose.model("Comment",commentSchema); 