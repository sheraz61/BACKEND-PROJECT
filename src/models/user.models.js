import mongoose ,{Schema} from "mongoose";
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt';

const userSchema=new Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true, //for searching in database
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
       
    },
    fullname:{
        type:String,
        required:true,
        lowercase:true,
        trim:true,
       index:true, //for searching in database
    },
    avatar:{
        type:String, //cloudnary url
        required:true,
    },
    coverimage:{
        type:String, //cloudnary url
    },
    watchhistory:[
            {
                type:Schema.Types.ObjectId,
                ref:'Video',
            }
        ],
        password:{
            type:String,
            required:[true,'Password is required'],
            
        },
        refreshtokec:{
            type:String,
        }
    
},{timestamps:true})

//password incrypt using bcrypt
userSchema.pre('save',async function(next){
    if(!this.isModified("password")) return next();
    this.password=bcrypt.hash(this.password,10)
    next()
})
//check password using bcrypt
userSchema.methods.isPasswordCorrect=async function(password){
return await bcrypt.compare(password,this.password)
}
// Access Token
userSchema.methods.generateAccessToken= function(){
return jwt.sign(
    {
        _id:this._id,
        email:this.email,
        username:this.username,
        fullname:this.fullname,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
)
}
//Refresh Token
userSchema.methods.generateRefreshToken= function(){
    return jwt.sign(
        {
            _id:this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
export const User =mongoose.model('User',userSchema);