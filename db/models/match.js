var mongoose=require("mongoose");

var matchSchema=new mongoose.Schema({
    name: {
        type:String,
    },
	username:{
        type:String,
       
    },
    score:{
        type:Number
    },
    feeling:{
        type:Number
    }
});
module.exports=mongoose.model("Match",matchSchema);