import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import {
  findUserByEmail,
  createCompanyAndAdmin,
  findUserById,
  findCompanyById,
  updateUser,
} from "../models/User";
import { hashPassword, comparePassword, generateToken } from "../utils/auth";
import { getCurrencyForCountry } from "../services/countryService";

export const signup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, name, company_name, country_code } = req.body;

    if (!email || !password || !name || !company_name || !country_code) {
      res.status(400).json({
        error: "email, password, name, company_name, and country_code are required",
      });
      return;
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      res.status(409).json({ error: "A user with this email already exists" });
      return;
    }

    let currency: string;
    try {
      currency = await getCurrencyForCountry(country_code);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Invalid country code" });
      return;
    }

    const hashedPassword = await hashPassword(password);

    const { user } = await createCompanyAndAdmin(
      company_name,
      email,
      hashedPassword,
      name,
      currency,
      country_code.toUpperCase()
    );

    const token = generateToken(user.id, user.role, user.company_id);

    res.status(201).json({
      message: "Company and Admin account created successfully",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company_id: user.company_id,
        currency,
        country_code: country_code.toUpperCase(),
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
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const user = await findUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const company = await findCompanyById(user.company_id);
    const token = generateToken(user.id, user.role, user.company_id);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.designation,
        company_id: user.company_id,
        currency: company?.currency,
        country_code: company?.country_code,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const logout = async (_req: AuthRequest, res: Response): Promise<void> => {
  res.json({ message: "Logged out successfully" });
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await findUserById(req.userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const company = await findCompanyById(user.company_id);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.designation,
        company_id: user.company_id,
        currency: company?.currency,
        country_code: company?.country_code,
        company_name: company?.name,
      },
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: "Both currentPassword and newPassword are required" });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: "New password must be at least 6 characters long" });
      return;
    }

    const user = await findUserById(req.userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const isPasswordValid = await comparePassword(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      res.status(401).json({ error: "Incorrect current password" });
      return;
    }

    const hashedPassword = await hashPassword(newPassword);

    await updateUser(req.userId, { password_hash: hashedPassword });

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
