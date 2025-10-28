import bcrypt from "bcrypt";
import { isValidObjectId } from "mongoose";
import {
  createUser as _createUser,
  deleteUserById as _deleteUserById,
  findAllUsers as _findAllUsers,
  findUserByEmail as _findUserByEmail,
  findUserById as _findUserById,
  findUserByUsername as _findUserByUsername,
  findUserByUsernameOrEmail as _findUserByUsernameOrEmail,
  updateUserById as _updateUserById,
  updateUserPrivilegeById as _updateUserPrivilegeById,
} from "../model/repository.js";
import {
  isValidEmail,
  isValidPassword,
  isValidSkillLevel,
  isValidQuestionsAttempted,
} from "../utils/validation.js";

const QUESTION_SERVICE_URL = "http://localhost:8003";
const QUESTIONS_ENDPOINT = "/api/questions";

export async function createUser(req, res) {
  try {
    const { username, email, password, skillLevel, questionsAttempted } =
      req.body;

    if (!(username && email && password)) {
      return res.status(400).json({
        message: "username and/or email and/or password are missing",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and include upper and lower case letters and a number",
      });
    }

    let normalizedSkillLevel = "low";
    if (skillLevel !== undefined) {
      if (!isValidSkillLevel(skillLevel)) {
        return res.status(400).json({ message: "Invalid skill level" });
      }
      normalizedSkillLevel = skillLevel.toLowerCase();
    }

    let normalizedQuestionsAttempted = [];
    if (questionsAttempted !== undefined && questionsAttempted !== null) {
      if (!isValidQuestionsAttempted(questionsAttempted)) {
        return res.status(400).json({
          message:
            "questionsAttempted must be an array of objects with questionId, attemptedAt, and partner fields",
        });
      }
      normalizedQuestionsAttempted = questionsAttempted;
    }

    const existingUser = await _findUserByUsernameOrEmail(username, email);
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "username or email already exists" });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    const createdUser = await _createUser({
      username,
      email,
      password: hashedPassword,
      skillLevel: normalizedSkillLevel,
      questionsAttempted: normalizedQuestionsAttempted,
      questionStats: { easy: 0, medium: 0, hard: 0 },
    });
    return res.status(201).json({
      message: `Created new user ${username} successfully`,
      data: formatUserResponse(createdUser),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Unknown error when creating new user!" });
  }
}

export async function getUserProfile(req, res) {
  try {
    const userId = req.user.id;

    const user = await _findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Profile retrieved successfully",
      data: formatUserResponse(user),
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Unknown error when getting profile!" });
  }
}

export async function getUser(req, res) {
  try {
    const userId = req.params.id;
    if (!isValidObjectId(userId)) {
      return res.status(404).json({ message: `User ${userId} not found` });
    }

    const user = await _findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: `User ${userId} not found` });
    } else {
      return res.status(200).json({ message: `Found user`, data: formatUserResponse(user) });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Unknown error when getting user!" });
  }
}

export async function getAllUsers(req, res) {
  try {
    const users = await _findAllUsers();

    return res.status(200).json({ message: `Found users`, data: users.map(formatUserResponse) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Unknown error when getting all users!" });
  }
}

export async function updateUser(req, res) {
  try {
    const { username, email, password, skillLevel, questionsAttempted } =
      req.body;

    const hasUpdates =
      username !== undefined ||
      email !== undefined ||
      password !== undefined ||
      skillLevel !== undefined ||
      questionsAttempted !== undefined;

    if (!hasUpdates) {
      return res.status(400).json({
        message:
          "No field to update: username, email, password, skillLevel and questionsAttempted are all missing!",
      });
    }

    const userId = req.params.id;
    if (!isValidObjectId(userId)) {
      return res.status(404).json({ message: `User ${userId} not found` });
    }

    const user = await _findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: `User ${userId} not found` });
    }

    if (email !== undefined && !isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (password !== undefined && !isValidPassword(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and include upper and lower case letters and a number",
      });
    }

    if (skillLevel !== undefined && !isValidSkillLevel(skillLevel)) {
      return res.status(400).json({ message: "Invalid skill level" });
    }

    if (
      questionsAttempted !== undefined &&
      !isValidQuestionsAttempted(questionsAttempted)
    ) {
      return res.status(400).json({
        message:
          "questionsAttempted must be an array of objects with questionId, attemptedAt, and partner fields",
      });
    }

    if (username !== undefined) {
      const existingUser = await _findUserByUsername(username);
      if (existingUser && existingUser.id !== userId) {
        return res.status(409).json({ message: "username already exists" });
      }
    }

    if (email !== undefined) {
      const existingUser = await _findUserByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(409).json({ message: "email already exists" });
      }
    }

    let hashedPassword;
    if (password !== undefined) {
      const salt = bcrypt.genSaltSync(10);
      hashedPassword = bcrypt.hashSync(password, salt);
    }

    const updatedUser = await _updateUserById(userId, {
      username,
      email,
      password: hashedPassword,
      skillLevel: skillLevel ? skillLevel.toLowerCase() : undefined,
      questionsAttempted:
        questionsAttempted !== undefined ? questionsAttempted : undefined,
    });

    return res.status(200).json({
      message: `Updated data for user ${userId}`,
      data: formatUserResponse(updatedUser),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Unknown error when updating user!" });
  }
}

export async function updateUserPrivilege(req, res) {
  try {
    const { isAdmin } = req.body;

    if (isAdmin !== undefined) {  // isAdmin can have boolean value true or false
      const userId = req.params.id;
      if (!isValidObjectId(userId)) {
        return res.status(404).json({ message: `User ${userId} not found` });
      }
      const user = await _findUserById(userId);
      if (!user) {
        return res.status(404).json({ message: `User ${userId} not found` });
      }

      const updatedUser = await _updateUserPrivilegeById(userId, isAdmin === true);
      return res.status(200).json({
        message: `Updated privilege for user ${userId}`,
        data: formatUserResponse(updatedUser),
      });
    } else {
      return res.status(400).json({ message: "isAdmin is missing!" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Unknown error when updating user privilege!" });
  }
}

export async function deleteUser(req, res) {
  try {
    const userId = req.params.id;
    if (!isValidObjectId(userId)) {
      return res.status(404).json({ message: `User ${userId} not found` });
    }
    const user = await _findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: `User ${userId} not found` });
    }

    await _deleteUserById(userId);
    return res.status(200).json({ message: `Deleted user ${userId} successfully` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Unknown error when deleting user!" });
  }
}

export function formatUserResponse(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt,
    skillLevel: user.skillLevel,
    questionsAttempted: user.questionsAttempted,
    questionStats: user.questionStats,
  };
}

export async function addQuestionAttempted(req, res) {
  try {
    const userId = req.params.id;
    const { questionId, attemptedAt, partner } = req.body;

    if (!questionId) {
      return res.status(400).json({ message: "Question id is required" });
    }

    if (!isValidObjectId(userId)) {
      return res.status(404).json({ message: `User ${userId} not found` });
    }

    const user = await _findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: `User ${userId} not found` });
    }

    // Create new attempted question entry
    const attemptedQuestion = {
      questionId: questionId,
      attemptedAt: attemptedAt ? new Date(attemptedAt) : new Date(),
      partner: partner || null,
    };

    // Add to questionsAttempted array
    user.questionsAttempted.push(attemptedQuestion);
    await user.save();

    // Update the user's questionStats based on the question's difficulty
    try {
      // Fetch question based on question Id
      const url = `${QUESTION_SERVICE_URL}${QUESTIONS_ENDPOINT}/${questionId}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch question: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      const rawDiff = data?.data?.difficulty ?? data?.difficulty;
      const diff = typeof rawDiff === "string" ? rawDiff.toLowerCase() : null;

      if (!user.questionStats) {
        user.questionStats = { easy: 0, medium: 0, hard: 0 };
      }
      if (diff && ["easy", "medium", "hard"].includes(diff)) {
        user.questionStats[diff] = (user.questionStats[diff] || 0) + 1;
        await user.save();
      }

      return res.status(200).json({
        message: "Question attempted entry added successfully",
        data: formatUserResponse(user),
      });
    } catch (error) {
      console.error(
        `Error updating questionStats for question ${questionId}:`,
        error
      );
    }

    return res.status(200).json({
      message: "Question attempted entry added successfully",
      data: formatUserResponse(user),
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Unknown error when adding attempted question!" });
  }
}

export async function getQuestionsAttempted(req, res) {
  try {
    const userId = req.user.id;

    const user = await _findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Questions attempted retrieved successfully",
      data: user.questionsAttempted || [],
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Unknown error when getting questions completed!" });
  }
}