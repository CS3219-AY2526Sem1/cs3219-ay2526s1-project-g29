import UserModel from "./user-model.js";
import "dotenv/config";
import { connect } from "mongoose";

export async function connectToDB() {
  let mongoDBUri =
    process.env.ENV === "PROD"
      ? process.env.USER_DB_CLOUD_URI || process.env.DB_CLOUD_URI
      : process.env.USER_DB_LOCAL_URI || process.env.DB_LOCAL_URI;

  console.log(`Connecting to User Service MongoDB...`);

  await connect(mongoDBUri);
}

export async function createUser({
  username,
  email,
  password,
  skillLevel = "low",
  questionsCompleted = 0,
  questionStats = { easy: 0, medium: 0, hard: 0 },
}) {
  return new UserModel({
    username,
    email,
    password,
    skillLevel,
    questionsCompleted,
    questionStats,
  }).save();
}

export async function findUserByEmail(email) {
  return UserModel.findOne({ email });
}

export async function findUserById(userId) {
  return UserModel.findById(userId);
}

export async function findUserByUsername(username) {
  return UserModel.findOne({ username });
}

export async function findUserByUsernameOrEmail(username, email) {
  return UserModel.findOne({
    $or: [
      { username },
      { email },
    ],
  });
}

export async function findAllUsers() {
  return UserModel.find();
}

export async function updateUserById(userId, updates) {
  const updatePayload = {};

  if (updates.username !== undefined) {
    updatePayload.username = updates.username;
  }

  if (updates.email !== undefined) {
    updatePayload.email = updates.email;
  }

  if (updates.password !== undefined) {
    updatePayload.password = updates.password;
  }

  if (updates.skillLevel !== undefined) {
    updatePayload.skillLevel = updates.skillLevel;
  }

  if (updates.questionsCompleted !== undefined) {
    updatePayload.questionsCompleted = updates.questionsCompleted;
  }

  if (Object.keys(updatePayload).length === 0) {
    return UserModel.findById(userId);
  }

  return UserModel.findByIdAndUpdate(
    userId,
    { $set: updatePayload },
    { new: true },
  );
}

export async function updateUserPrivilegeById(userId, isAdmin) {
  return UserModel.findByIdAndUpdate(
    userId,
    {
      $set: {
        isAdmin,
      },
    },
    { new: true },
  );
}

export async function deleteUserById(userId) {
  return UserModel.findByIdAndDelete(userId);
}
