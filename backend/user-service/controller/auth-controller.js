import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { findUserByEmail as _findUserByEmail } from "../model/repository.js";
import { formatUserResponse } from "./user-controller.js";

export async function handleLogin(req, res) {
  const { email, password } = req.body;
  if (email && password) {
    try {
      const user = await _findUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Wrong email and/or password" });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ message: "Wrong email and/or password" });
      }

      const accessToken = jwt.sign(
        {
          id: user.id,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "1d",
        }
      );

      res.cookie("accessToken", accessToken, {
        httpOnly: true, // Cannot be accessed by JavaScript
        secure: process.env.NODE_ENV === "production", // HTTPS only in production
        sameSite: "strict", // CSRF protection
        maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
        path: "/", // Available for entire domain
      });

      return res.status(200).json({
        message: "User logged in",
        data: { ...formatUserResponse(user) },
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  } else {
    return res.status(400).json({ message: "Missing email and/or password" });
  }
}

export async function handleVerifyToken(req, res) {
  try {
    const verifiedUser = req.user;
    return res
      .status(200)
      .json({ message: "Token verified", data: verifiedUser });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function handleLogout(req, res) {
  try {
    // Clear the HttpOnly cookie
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    return res.status(200).json({ message: "User logged out successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
