import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { findUsersByCompanyId, createUser, findUserByEmail, User } from "../models/User";
import { hashPassword } from "../utils/auth";
import crypto from "crypto";
import { sendPasswordEmail } from "../utils/email";
import pool from "../config/database";

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyId } = req;
    if (!companyId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const users = await findUsersByCompanyId(companyId);
    
    const userMap = new Map(users.map(u => [u.id, u]));

    const enrichedUsers = users.map(user => {
      let manager_name = null;
      if (user.manager_id && userMap.has(user.manager_id)) {
        manager_name = userMap.get(user.manager_id)!.name;
      }
      return { ...user, manager_name };
    });

    res.json(enrichedUsers);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createNewUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyId } = req;
    if (!companyId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { name, email, role, manager_id, designation } = req.body;

    if (!name || !email || !role) {
      res.status(400).json({ error: "name, email, and role are required" });
      return;
    }

    if (role !== "MANAGER" && role !== "EMPLOYEE") {
      res.status(400).json({ error: "Role must be MANAGER or EMPLOYEE" });
      return;
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      res.status(409).json({ error: "A user with this email already exists" });
      return;
    }

    const randomPlaceholder = crypto.randomBytes(16).toString("hex");
    const hashedPassword = await hashPassword(randomPlaceholder);

    const newUser = await createUser(
      companyId,
      name,
      email,
      hashedPassword,
      role as "MANAGER" | "EMPLOYEE",
      manager_id || null,
      designation || null
    );

    res.status(201).json({
      message: "User created successfully",
      user: newUser
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendCredentials = async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const { companyId } = req;
    const { id } = req.params;

    if (!companyId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const result = await client.query("SELECT * FROM users WHERE id = $1 AND company_id = $2", [id, companyId]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: "User not found or you don't have permission" });
      return;
    }
    const user = result.rows[0];

    const companyRes = await client.query("SELECT name FROM companies WHERE id = $1", [companyId]);
    const companyName = companyRes.rows[0]?.name || "Your Company";

    const rawRandomBytes = crypto.randomBytes(6).toString("hex");
    const newPasswordPlain = `Aura-${rawRandomBytes}!`; 
    
    const newPasswordHash = await hashPassword(newPasswordPlain);
    await client.query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [newPasswordHash, id]);

    await sendPasswordEmail({
      to: user.email,
      name: user.name,
      companyName,
      newPasswordPlain,
      role: user.role
    });

    res.json({ message: "Credentials completely reset and sent successfully via email." });
  } catch (error: any) {
    console.error("====== FATAL: sendCredentials error ======");
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    console.error("Full object:", error);
    res.status(500).json({ error: "Failed to send credentials email.", details: error.message || String(error) });
  } finally {
    client.release();
  }
};
