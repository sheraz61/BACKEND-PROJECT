import asyncHandler from '../utils/asyncHandler.js'
import { apiError } from '../utils/apiError.js'
import { apiResponse } from '../utils/apiResponse.js'
import { User } from '../models/user.models.js'
import { deleteInCloudinary, uploadOnCloudinary } from '../utils//cloudinary.js'
import jwt from 'jsonwebtoken'

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()
    //update user object in db
    user.refreshtoken = refreshToken
    //save user object in db
    await user.save({ validateBeforeSave: false })

    return { accessToken, refreshToken }

  } catch (error) {
    throw new apiError(500, "something went wrong while generating refresh and access token")
  }
}
const registerUser = asyncHandler(async (req, res) => {
  //get user detail from frontend
  const { fullname, email, username, password } = req.body
  //validation  - not empty
  //validate user input : not empty, not null, not undefined, not empty string
  if (
    [fullname, email, username, password].some((value) => value?.trim() === "")
  ) {
    throw new apiError(400, 'All fields are required')
  }
  //otherwise check each input using if else
  //   if(fullname===''){
  //     throw new apiError(400,'Fullname is required')
  //   }

  //check if user already exists : username and email
  const existedUser = await User.findOne({
    //option to check feild if user already exists
    $or: [
      { email }, { username }
    ]
  })
  if (existedUser) {
    throw new apiError(409, 'User already exists')
  }

  // console.log(req.files);

  //check if avatar exists : avatar ,check if cover image exists : cover
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImagePath=req.files?.coverimage[0]?.path;
  //2nd way to check cover image if null value then handle the conditon  
  let coverImagePath;
  if (req.files && Array.isArray(req.files.coverimage) && req.files.coverimage.length > 0) {
    coverImagePath = req.files.coverimage[0].path;
  }
  if (!avatarLocalPath) {
    throw new apiError(400, 'Avatar not found')
  }
  //upload them to cloudinary, avatar check after upload
  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverimage = await uploadOnCloudinary(coverImagePath)
  if (!avatar) {
    throw new apiError(400, 'Avatar not found')
  }
  //create user object - create entry in db
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverimage: coverimage?.url || '',
    email,
    password,
    username: username.toLowerCase()
  })
  //remove password and refresh token feild form response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshtoken"
  )
  //check for user creation
  if (!createdUser) {
    throw new apiError(500, 'User not created')
  }
  //return response

  return res.status(201).json(
    new apiResponse(200, createdUser, "User Registered Successfully")
  )
})

const loginUser = asyncHandler(async (req, res) => {
  //req.body-->data
  const { email, password, username } = req.body;
  //username or email to login
  // if (!(username || email)) {
  //   throw new apiError(400, 'Email or username is required')
  // }
  if (!username && !email) {
    throw new apiError(400, 'Email or username is required')
  }
  //find user
  const user = await User.findOne({
    $or: [
      { email }, { username }
    ]
  })
  if (!user) {
    throw new apiError(404, 'Invalid credentials')
  }
  //password check
  const isPasswordValid = await user.isPasswordCorrect(password)
  if (!isPasswordValid) {
    throw new apiError(401, 'Invalid password')
  }
  //access and refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
  //hide refresh token and password from user response
  const loggedInUser = await User.findById(user._id).select("-password -refreshtoken")
  //send cookies
  const options = {
    httpOnly: true,
    secure: true,
  }
  return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        200,
        {
          user: loggedInUser, accessToken, refreshToken
        },
        "User logged in successfully"
      )
    )
  //response for login
})
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id,
    {
      $unset: {
        refreshtoken: 1 // this removes the field  from documents
      }
    },
    {
      new: true
    }
  )
  const options = {
    httpOnly: true,
    secure: true,
  }
  return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, {}, "User logged out successfully"))
})


const refreshAccessTooken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken
  if (!incomingRefreshToken) {
    throw new apiError(401, 'Unautherized request')
  }
  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    const user = await User.findById(decodedToken?._id)
    if (!user) {
      throw new apiError(401, 'Invalid refresh token')
    }
    if (incomingRefreshToken !== user?.refreshtoken) {
      throw new apiError(401, 'Refresh token is expired or used')
    }
    const options = {
      httpOnly: true,
      secure: true,
    }
    const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id)
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new apiResponse(
          200,
          {
            accessToken, newRefreshToken
          },
          "Access token refresh successfully"
        )
      )
  } catch (error) {
    throw new apiError(401, error?.message || "invalid refresh token")
  }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
  if (!isPasswordCorrect) {
    throw new apiError(400, 'Invalid old password')
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false })

  return res.status(200)
    .json(
      new apiResponse(
        200,
        {},
        "Password changed successfully"
      )
    )
})


const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200)
    .json(
      new apiResponse(
        200,

        req.user,

        "User retrieved successfully"
      )
    )
});


const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;

  if (!fullname || !email) {
    throw new apiError(400, 'Fullname and email are required')
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname,
        email
      }
    },
    { new: true }

  ).select("-password")
  return res.status(200)
    .json(
      new apiResponse(200, user, "Acount details updated")
    )
})

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path

  if (!avatarLocalPath) {
    throw new apiError(400, 'Avatar not found')
  }

  const userForAvatar = await User.findById(req.user?._id)
  if (!userForAvatar) {
    throw new apiError(400, "No user found")
  }
  const oldAvatar = await deleteInCloudinary(userForAvatar.avatar)
  if (!oldAvatar) {
    throw new apiError(400, "Error while deleting avatar")
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath)
  if (!avatar.url) {
    throw new apiError(400, 'Error while uploading Avatar ')
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url
      }
    },
    { new: true }
  ).select("-password")
  return res.status(200)
    .json(
      new apiResponse(200, user, "Avatar updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path

  if (!coverImageLocalPath) {
    throw new apiError(400, 'Cover Image not found')
  }

  const userForCoverImage = await User.findById(req.user?._id)
  if (!userForCoverImage) {
    throw new apiErrorpiError(400, "No user Found")
  }

  const oldCoverImage = await deleteInCloudinary(userForCoverImage.coverImage)

  if (!oldCoverImage) {
    throw new apiError(400, "Error while deleting old file of CoverImage")
  }

  const coverimage = await uploadOnCloudinary(coverImageLocalPath)
  if (!coverimage.url) {
    throw new apiError(400, 'Error while uploading cover Image ')
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverimage: coverimage.url
      }
    },
    { new: true }
  ).select("-password")
  return res.status(200)
    .json(
      new apiResponse(200, user, "Cover Image updated successfully")
    )
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params
  if (!username?.trim()) {
    throw new apiError(400, 'Username is required')
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase()
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      }
    },
    {
      $addFields: {
        subscriberCount: {
          $size: "$subscribers"
        },
        channelSubscribedToCount: {
          $size: "$subscribedTo"
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        avatar: 1,
        coverimage: 1,
        subscriberCount: 1,
        channelSubscribedToCount: 1,
        isSubscribed: 1,
        email: 1,

      }
    }
  ])
  if (!channel?.length) {
    throw new apiError(404, "channel does not exist")
  }

  return res.status(200)
    .json(
      new apiResponse(200, channel[0], "User channel fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.types.ObjectId(req.user._id)
      }
    },
    {
      $lookup: {
        from: "Vedio",
        localField: "watchhistory",
        foreignField: "_id",
        as: "watchhistory",
        pipeline: [
          {
            $lookup: {
              from: "User",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              owner: {
                $first: "owner"
              }
            }
          }
        ]
      }
    }
  ])
  return res.status(200)
    .json(
      new apiResponse(200, user[0].watchhistory, "User watch history fetched successfully")
    )
})
export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessTooken,
  getCurrentUser,
  changeCurrentPassword,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
} 