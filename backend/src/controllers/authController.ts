import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { findUserByEmail, createCompanyAndAdmin, findUserById } from "../models/User";
import { hashPassword, comparePassword, generateToken } from "../utils/auth";

export const signup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log("Received signup request:", req.body);
    const { email, password, name, company_name } = req.body;

    if (!email || !password || !name || !company_name) {
      console.log("Missing fields");
      res
        .status(400)
        .json({
          error: "Email, password, name, and company_name are required",
          message: "Email, password, name, and company_name are required"
        });
      return;
    }

    console.log("Checking existing user...");
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      console.log("User exists");
      res.status(409).json({
        error: "User already exists",
        message: "User already exists"
      });
      return;
    }

    console.log("Hashing password...");
    const hashedPassword = await hashPassword(password);

    console.log("Creating company and user in DB...");
    const { user } = await createCompanyAndAdmin(company_name, email, hashedPassword, name);

    console.log("Generating token...");
    const token = generateToken(user.id);

    console.log("Success!");
    res.status(201).json({
      message: "User and Company created successfully",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        company_id: user.company_id
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        error: "Email and password are required",
        message: "Email and password are required"
      });
      return;
    }

    const user = await findUserByEmail(email);
    if (!user) {
      res.status(401).json({
        error: "Invalid credentials",
        message: "Invalid credentials"
      });
      return;
    }

    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      res.status(401).json({
        error: "Invalid credentials",
        message: "Invalid credentials"
      });
      return;
    }

    const token = generateToken(user.id);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        company_id: user.company_id
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Unauthorized"
      });
      return;
    }

    const user = await findUserById(req.userId);
    if (!user) {
      res.status(404).json({
        error: "User not found",
        message: "User found"
      });
      return;
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        company_id: user.company_id
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
