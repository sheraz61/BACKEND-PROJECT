import asyncHandler from '../utils/asyncHandler.js'
import {apiError} from '../utils/apiError.js'
import {apiResponse} from '../utils/apiResponse.js'
import {User} from '../models/user.models.js'
import {uploadOnCloudinary} from '../utils//cloudinary.js'

const registerUser= asyncHandler(async (req,res)=>{
  //get user detail from frontend
  const{fullname,email,username,password}=req.body
  //validation  - not empty
   //validate user input : not empty, not null, not undefined, not empty string
   if(
    [ fullname,email,username,password].some((value)=>value?.trim()==="")
  ){
    throw new apiError(400,'All fields are required')
  }
  //otherwise check each input using if else
//   if(fullname===''){
//     throw new apiError(400,'Fullname is required')
//   }

  //check if user already exists : username and email
const existedUser=User.findOne({
    //option to check feild if user already exists
    $or:[
        {email},{username}
    ]
})
if(existedUser){
    throw new apiError(409,'User already exists')
}


  //check if avatar exists : avatar ,check if cover image exists : cover
  const avatarLocalPath=req.files?.avatar[0]?.path;
const coverImagePath=req.files?.coverimage[0]?.path;
if(!avatarLocalPath){
throw new apiError(400,'Avatar not found')
}
  //upload them to cloudinary, avatar check after upload
const avatar=await uploadOnCloudinary(avatarLocalPath)
const coverimage=await uploadOnCloudinary(coverImagePath)
if(!avatar){
throw new apiError(400,'Avatar not found')
}
  //create user object - create entry in db
 const user=await User.create({
    fullname,
    avatar:avatar.url,
    coverimage:coverimage?.url || '',
    email,
    password,
    username:username.toLowerCase()
  })
  //remove password and refresh token feild form response
  const createdUser=await User.findById(user._id).select(
      "-password -refreshtoken"
    )
    //check for user creation
if(!createdUser){
    throw new apiError(500,'User not created')
}
  //return response
  
return res.status(201).json(
    new apiResponse(200,createdUser,"User Registered Successfully")
)
})


export { registerUser} 