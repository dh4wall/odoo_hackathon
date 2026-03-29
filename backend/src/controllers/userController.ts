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

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const { companyId } = req;
    const { id } = req.params;
    const { role, manager_id, designation } = req.body;

    if (!companyId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userRes = await client.query("SELECT * FROM users WHERE id = $1 AND company_id = $2", [id, companyId]);
    if (userRes.rows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const targetUser = userRes.rows[0];

    // Managers demotion guard
    if (targetUser.role === "MANAGER" && role === "EMPLOYEE") {
      const pendingRes = await client.query(
        "SELECT COUNT(*) FROM approval_steps WHERE approver_id = $1 AND status = 'PENDING'", 
        [id]
      );
      if (parseInt(pendingRes.rows[0].count) > 0) {
        res.status(400).json({ error: "Cannot demote manager: they have pending expense approvals." });
        return;
      }

      const directReportsRes = await client.query(
        "SELECT COUNT(*) FROM users WHERE manager_id = $1",
        [id]
      );
      if (parseInt(directReportsRes.rows[0].count) > 0) {
        res.status(400).json({ error: "Cannot demote manager: please explicitly reassign their associated employees first." });
        return;
      }
    }

    let finalManagerId = manager_id;
    if (role === "MANAGER") {
      finalManagerId = null; 
    } else if (role === "EMPLOYEE" && manager_id) {
      const mgrRes = await client.query(
        "SELECT role FROM users WHERE id = $1 AND company_id = $2",
        [manager_id, companyId]
      );
      if (mgrRes.rows.length === 0 || mgrRes.rows[0].role !== "MANAGER") {
        res.status(400).json({ error: "Selected manager is invalid or not a MANAGER." });
        return;
      }
    }

    const result = await client.query(
      `UPDATE users 
       SET role = COALESCE($1, role), 
           manager_id = $2, 
           designation = COALESCE($3, designation),
           updated_at = NOW()
       WHERE id = $4 AND company_id = $5
       RETURNING id, name, email, role, manager_id, designation, created_at, updated_at`,
      [role, finalManagerId, designation, id, companyId]
    );

    res.json({ message: "User updated successfully", user: result.rows[0] });
  } catch (error: any) {
    console.error("Update user error:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
};
