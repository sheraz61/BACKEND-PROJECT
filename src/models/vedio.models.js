import mongoose ,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const vedioSchema=new Schema({
vediofile:{
type: String, //cloudinary url
required:true,
},
thumbnail:{
    type: String, //cloudinary url
    required:true,
},
title:{
    type: String,
    required:true,
},
discription:{
    type: String,
    required:true,
},
duration:{
    type: Number, //cloudinary url
    required:true,
},
veiws:{
    type: Number,
    default:0,
},
ispublished:{
    type: Boolean,
    default:true,
},
owner:{
    type:Schema.Types.ObjectId,
    ref:'User'
}
},{timestamps:true})

vedioSchema.plugin(mongooseAggregatePaginate)
export const Vedio=mongoose.model('Vedio',vedioSchema);