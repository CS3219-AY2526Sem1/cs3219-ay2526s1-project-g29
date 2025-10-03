import mongoose from "mongoose";

const Schema = mongoose.Schema;

const UserModelSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  skillLevel: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "low",
  },
  questionsCompleted: {
    type: Number,
    default: 0,
    min: 0,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now, // Setting default to the current date/time
  },
  isAdmin: {
    type: Boolean,
    required: true,
    default: false,
  },
});

export default mongoose.model("UserModel", UserModelSchema);
