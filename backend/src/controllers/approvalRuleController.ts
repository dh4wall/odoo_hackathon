import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { 
  getRulesByCompany, 
  checkCategoryExists, 
  createRuleTransaction, 
  updateRuleTransaction,
  VALID_CATEGORIES
} from "../models/ApprovalRule";
import pool from "../config/database";

export const getCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  res.json(VALID_CATEGORIES);
};

export const getRules = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyId } = req;
    if (!companyId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const rules = await getRulesByCompany(companyId);
    res.json(rules);
  } catch (error) {
    console.error("Get rules error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createRule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyId } = req;
    if (!companyId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { name, category, is_manager_approver, rule_type, threshold_pct, key_approver_id, approvers } = req.body;

    if (!name || !category || !rule_type || !Array.isArray(approvers)) {
      res.status(400).json({ error: "name, category, rule_type, and an approvers array are required." });
      return;
    }

    if (!VALID_CATEGORIES.includes(category)) {
      res.status(400).json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` });
      return;
    }

    if (rule_type === "PERCENTAGE" && typeof threshold_pct !== "number") {
      res.status(400).json({ error: "threshold_pct is required for PERCENTAGE rule type." });
      return;
    }

    if (rule_type === "SPECIFIC_APPROVER" && !key_approver_id) {
      res.status(400).json({ error: "key_approver_id is required for SPECIFIC_APPROVER rule type." });
      return;
    }

    // Uniqueness validation per company and category
    const exists = await checkCategoryExists(companyId, category);
    if (exists) {
      res.status(409).json({ error: `A rule already exists for the category: ${category}` });
      return;
    }

    const newRule = await createRuleTransaction(
      companyId,
      name,
      category,
      is_manager_approver || false,
      rule_type,
      threshold_pct || null,
      key_approver_id || null,
      approvers
    );

    res.status(201).json({ message: "Approval rule created successfully", rule: newRule });
  } catch (error: any) {
    if (error.code === '23503') { // Foreign key violation (likely bad key_approver_id or approvers)
      res.status(400).json({ error: "One or more provided User IDs do not exist." });
      return;
    }
    console.error("Create rule error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateRule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyId } = req;
    const id = req.params.id as string;
    if (!companyId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { name, category, is_manager_approver, rule_type, threshold_pct, key_approver_id, approvers } = req.body;

    if (!name || !category || !rule_type || !Array.isArray(approvers)) {
      res.status(400).json({ error: "name, category, rule_type, and an approvers array are required." });
      return;
    }

    if (!VALID_CATEGORIES.includes(category)) {
      res.status(400).json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` });
      return;
    }

    const exists = await checkCategoryExists(companyId, category, id);
    if (exists) {
      res.status(409).json({ error: `Cannot change category to ${category} because a rule already exists for it.` });
      return;
    }

    const updatedRule = await updateRuleTransaction(
      id,
      companyId,
      name,
      category,
      is_manager_approver || false,
      rule_type,
      threshold_pct || null,
      key_approver_id || null,
      approvers
    );

    if (!updatedRule) {
      res.status(404).json({ error: "Rule not found or does not belong to you." });
      return;
    }

    res.json({ message: "Approval rule updated successfully", rule: updatedRule });
  } catch (error: any) {
    if (error.code === '23503') { 
      res.status(400).json({ error: "One or more provided User IDs do not exist." });
      return;
    }
    console.error("Update rule error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteRule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyId } = req;
    const id = req.params.id as string;
    
    // Deleting the rule will automatically cascade to rule_approvers because of ON DELETE CASCADE in the schema
    const result = await pool.query(
      "DELETE FROM approval_rules WHERE id = $1 AND company_id = $2 RETURNING id",
      [id, companyId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Rule not found" });
      return;
    }

    res.json({ message: "Rule deleted successfully" });
  } catch (error) {
    console.error("Delete rule error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
