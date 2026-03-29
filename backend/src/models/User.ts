import pool from "../config/database";

export interface User {
  id: string;
  company_id: string;
  name: string;
  email: string;
  password_hash: string;
  role: "ADMIN" | "MANAGER" | "EMPLOYEE";
  manager_id: string | null;
  designation: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Company {
  id: string;
  name: string;
  currency: string;
  country_code: string;
  created_at: Date;
}

// ─── Queries ────────────────────────────────────────────────────────────────

export const findUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    return (result.rows[0] as User) || null;
  } catch (error) {
    console.error("Error finding user by email:", error);
    throw error;
  }
};

export const findUserById = async (id: string): Promise<User | null> => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    return (result.rows[0] as User) || null;
  } catch (error) {
    console.error("Error finding user by id:", error);
    throw error;
  }
};

export const findCompanyById = async (id: string): Promise<Company | null> => {
  try {
    const result = await pool.query("SELECT * FROM companies WHERE id = $1", [id]);
    return (result.rows[0] as Company) || null;
  } catch (error) {
    console.error("Error finding company by id:", error);
    throw error;
  }
};

// ─── Create Company + Admin (transactional) ──────────────────────────────────

export const createCompanyAndAdmin = async (
  company_name: string,
  email: string,
  password_hash: string,
  name: string,
  currency: string,
  country_code: string
): Promise<{ companyId: string; user: User }> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Create company with currency + country_code
    const companyResult = await client.query(
      `INSERT INTO companies (id, name, currency, country_code)
       VALUES (gen_random_uuid(), $1, $2, $3)
       RETURNING *`,
      [company_name, currency, country_code]
    );
    const company = companyResult.rows[0] as Company;

    // Create admin user
    const userResult = await client.query(
      `INSERT INTO users (id, email, password_hash, name, role, company_id)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
       RETURNING *`,
      [email, password_hash, name, "ADMIN", company.id]
    );
    const user = userResult.rows[0] as User;

    await client.query("COMMIT");
    return { companyId: company.id, user };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating company and admin:", error);
    throw error;
  } finally {
    client.release();
  }
};

// ─── Update User ─────────────────────────────────────────────────────────────

export const updateUser = async (
  id: string,
  updates: Partial<User>
): Promise<User | null> => {
  try {
    const fields = Object.keys(updates);
    if (fields.length === 0) return null;

    const setClause = fields
      .map((field, index) => `${field} = $${index + 2}`)
      .join(", ");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const values = fields.map((field) => (updates as any)[field]);

    const result = await pool.query(
      `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return (result.rows[0] as User) || null;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

// ─── Find Users By Company ───────────────────────────────────────────────────

export const findUsersByCompanyId = async (company_id: string): Promise<User[]> => {
  try {
    const result = await pool.query(
      "SELECT id, company_id, name, email, role, manager_id, designation, created_at, updated_at FROM users WHERE company_id = $1 ORDER BY created_at DESC",
      [company_id]
    );
    return result.rows as User[];
  } catch (error) {
    console.error("Error finding users by company:", error);
    throw error;
  }
};

// ─── Create User ─────────────────────────────────────────────────────────────

export const createUser = async (
  company_id: string,
  name: string,
  email: string,
  password_hash: string,
  role: "MANAGER" | "EMPLOYEE",
  manager_id: string | null = null,
  designation: string | null = null
): Promise<User> => {
  try {
    const result = await pool.query(
      `INSERT INTO users (id, company_id, name, email, password_hash, role, manager_id, designation)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)
       RETURNING id, company_id, name, email, role, manager_id, designation, created_at, updated_at`,
      [company_id, name, email, password_hash, role, manager_id, designation]
    );
    return result.rows[0] as User;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};
