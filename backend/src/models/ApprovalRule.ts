import pool from "../config/database";

export const VALID_CATEGORIES = [
  "Travel",
  "Meals",
  "Miscellaneous",
  "Equipment",
  "Software",
  "Hardware",
  "Training"
];

export interface ApprovalRule {
  id: string;
  company_id: string;
  name: string;
  category: string;
  is_manager_approver: boolean;
  rule_type: "PERCENTAGE" | "SPECIFIC_APPROVER" | "HYBRID";
  threshold_pct: number | null;
  key_approver_id: string | null;
  created_at: Date;
  updated_at: Date;
  approvers?: { id: string; name: string; sequence: number }[];
}

export const getRulesByCompany = async (companyId: string): Promise<ApprovalRule[]> => {
  const result = await pool.query(
    "SELECT * FROM approval_rules WHERE company_id = $1 ORDER BY created_at DESC",
    [companyId]
  );
  const rules = result.rows;

  if (rules.length === 0) return [];

  // Fetch all approvers for these rules
  const ruleIds = rules.map(r => r.id);
  const approversRes = await pool.query(
    `SELECT ra.approval_rule_id, ra.sequence, u.id, u.name 
     FROM rule_approvers ra
     JOIN users u ON ra.approver_id = u.id
     WHERE ra.approval_rule_id = ANY($1)
     ORDER BY ra.sequence ASC`,
    [ruleIds]
  );

  const approversMap = new Map<string, any[]>();
  for (const row of approversRes.rows) {
    if (!approversMap.has(row.approval_rule_id)) {
      approversMap.set(row.approval_rule_id, []);
    }
    approversMap.get(row.approval_rule_id)!.push({
      id: row.id,
      name: row.name,
      sequence: row.sequence
    });
  }

  // Attach approvers
  for (const rule of rules) {
    rule.approvers = approversMap.get(rule.id) || [];
  }

  return rules;
};

export const checkCategoryExists = async (companyId: string, category: string, excludeRuleId?: string): Promise<boolean> => {
  let query = "SELECT id FROM approval_rules WHERE company_id = $1 AND category = $2";
  const params: any[] = [companyId, category];

  if (excludeRuleId) {
    query += " AND id != $3";
    params.push(excludeRuleId);
  }

  const result = await pool.query(query, params);
  return result.rows.length > 0;
};

export const createRuleTransaction = async (
  companyId: string,
  name: string,
  category: string,
  is_manager_approver: boolean,
  rule_type: string,
  threshold_pct: number | null,
  key_approver_id: string | null,
  approverIds: string[]
): Promise<ApprovalRule | null> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const ruleRes = await client.query(
      `INSERT INTO approval_rules (company_id, name, category, is_manager_approver, rule_type, threshold_pct, key_approver_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [companyId, name, category, is_manager_approver, rule_type, threshold_pct, key_approver_id]
    );
    const rule = ruleRes.rows[0];

    for (let i = 0; i < approverIds.length; i++) {
      await client.query(
        `INSERT INTO rule_approvers (approval_rule_id, approver_id, sequence)
         VALUES ($1, $2, $3)`,
        [rule.id, approverIds[i], i + 1]
      );
    }

    await client.query("COMMIT");
    return rule;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const updateRuleTransaction = async (
  ruleId: string,
  companyId: string,
  name: string,
  category: string,
  is_manager_approver: boolean,
  rule_type: string,
  threshold_pct: number | null,
  key_approver_id: string | null,
  approverIds: string[]
): Promise<ApprovalRule | null> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const ruleRes = await client.query(
      `UPDATE approval_rules 
       SET name = $1, category = $2, is_manager_approver = $3, rule_type = $4, 
           threshold_pct = $5, key_approver_id = $6, updated_at = NOW()
       WHERE id = $7 AND company_id = $8
       RETURNING *`,
      [name, category, is_manager_approver, rule_type, threshold_pct, key_approver_id, ruleId, companyId]
    );

    if (ruleRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return null;
    }

    const rule = ruleRes.rows[0];

    // Wipe old approvers
    await client.query("DELETE FROM rule_approvers WHERE approval_rule_id = $1", [ruleId]);

    // Insert new approver chain
    for (let i = 0; i < approverIds.length; i++) {
      await client.query(
        `INSERT INTO rule_approvers (approval_rule_id, approver_id, sequence)
         VALUES ($1, $2, $3)`,
        [rule.id, approverIds[i], i + 1]
      );
    }

    await client.query("COMMIT");
    return rule;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};
