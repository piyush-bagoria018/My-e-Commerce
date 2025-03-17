import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // remove password and refresh token field from response
  // check for user creation
  // return response

  const { fullname, email, phone, password } = req.body;
  console.log("req.body", req.body);

  // Check if fullname or password is missing
  if ([fullname, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "Full Name and Password are required");
  }

  // Ensure at least one (email or phone) is provided
  if (![email, phone].some(field => field && typeof field === "string" && field.trim() !== "")) {
    throw new ApiError(400, "Either Email or Phone Number is required");
  }


  const existedUser = await User.findOne({
    $or: [{ email }, { phone }],
  });

  if (existedUser) {
    throw new ApiError(400, "User with email or phone is already exists");
  }

  const user = await User.create({
    fullname,
    email: email?.trim() || null,
    phone: phone?.trim() || null,
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something Went Wrong While Register The User");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registered Successfully"));
});


const loginUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user exists: username, email
  // check for password
  // check for refresh token
  // return response

  const { fullname, email, password } = req.body;
});






export { registerUser };
