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
  questionsAttempted: [
    {
      questionId: {
        type: String,
        required: true,
      },
      attemptedAt: {
        type: Date,
        required: true,
        default: Date.now,
      },
      partner: {
        type: String,
        default: null,
      },
    },
  ],
  questionStats: {
    easy: {
      type: Number,
      default: 0,
      min: 0,
    },
    medium: {
      type: Number,
      default: 0,
      min: 0,
    },
    hard: {
      type: Number,
      default: 0,
      min: 0,
    },
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
