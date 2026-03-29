import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import pool from "../config/database";

// GET /api/admin/stats
// Returns aggregated statistics for the admin dashboard.
// Standalone — does not touch any other controller.
export const getAdminStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyId } = req;
    if (!companyId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const [
      userCountRes,
      expenseStatsRes,
      categoryBreakdownRes,
      monthlyVolumeRes,
    ] = await Promise.all([
      // Total users (excluding ADMIN) per role
      pool.query(
        `SELECT role, COUNT(*) AS count
         FROM users WHERE company_id = $1
         GROUP BY role`,
        [companyId]
      ),

      // Expense totals by status
      pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE status = 'PENDING')  AS pending,
           COUNT(*) FILTER (WHERE status = 'APPROVED') AS approved,
           COUNT(*) FILTER (WHERE status = 'REJECTED') AS rejected,
           COUNT(*) FILTER (WHERE status = 'DRAFT')    AS draft,
           COUNT(*)                                    AS total,
           COALESCE(SUM(amount_in_base) FILTER (WHERE status = 'APPROVED'), 0) AS total_approved_amount,
           COALESCE(SUM(amount_in_base) FILTER (WHERE status = 'PENDING'), 0)  AS total_pending_amount
         FROM expenses WHERE company_id = $1`,
        [companyId]
      ),

      // Breakdown by category
      pool.query(
        `SELECT category, COUNT(*) AS count,
           COALESCE(SUM(amount_in_base), 0) AS total_amount
         FROM expenses WHERE company_id = $1
         GROUP BY category
         ORDER BY count DESC
         LIMIT 6`,
        [companyId]
      ),

      // Monthly submission volume (last 6 months)
      pool.query(
        `SELECT
           TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') AS month,
           DATE_TRUNC('month', created_at) AS month_date,
           COUNT(*) AS count
         FROM expenses
         WHERE company_id = $1
           AND created_at >= NOW() - INTERVAL '6 months'
         GROUP BY month_date
         ORDER BY month_date ASC`,
        [companyId]
      ),
    ]);

    // Shape user counts into a map
    const userRoles: Record<string, number> = {};
    for (const row of userCountRes.rows) {
      userRoles[row.role] = parseInt(row.count, 10);
    }

    const stats = expenseStatsRes.rows[0];

    res.json({
      users: {
        employees: userRoles["EMPLOYEE"] ?? 0,
        managers: userRoles["MANAGER"] ?? 0,
        total: Object.values(userRoles).reduce((a, b) => a + b, 0),
      },
      expenses: {
        pending:  parseInt(stats.pending,  10),
        approved: parseInt(stats.approved, 10),
        rejected: parseInt(stats.rejected, 10),
        draft:    parseInt(stats.draft,    10),
        total:    parseInt(stats.total,    10),
        totalApprovedAmount: parseFloat(stats.total_approved_amount),
        totalPendingAmount:  parseFloat(stats.total_pending_amount),
      },
      categoryBreakdown: categoryBreakdownRes.rows.map((r) => ({
        category: r.category,
        count: parseInt(r.count, 10),
        totalAmount: parseFloat(r.total_amount),
      })),
      monthlyVolume: monthlyVolumeRes.rows.map((r) => ({
        month: r.month,
        count: parseInt(r.count, 10),
      })),
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
