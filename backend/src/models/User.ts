import pool from "../config/database";

export interface User {
  id: string;
  company_id: string;
  name: string;
  email: string;
  password_hash: string;
  role: "ADMIN" | "MANAGER" | "EMPLOYEE";
  manager_id: string | null;
  created_at: Date;
}

export const findUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    return result.rows[0] as User || null;
  } catch (error) {
    console.error("Error finding user by email:", error);
    throw error;
  }
};

export const findUserById = async (id: string): Promise<User | null> => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    return result.rows[0] as User || null;
  } catch (error) {
    console.error("Error finding user by id:", error);
    throw error;
  }
};

export const createCompanyAndAdmin = async (
  company_name: string,
  email: string,
  password_hash: string,
  name: string
): Promise<{ companyId: string; user: User }> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Create company
    const companyResult = await client.query(
      "INSERT INTO companies (id, name) VALUES (gen_random_uuid(), $1) RETURNING *",
      [company_name]
    );
    const company = companyResult.rows[0];

    // Create user
    const userResult = await client.query(
      "INSERT INTO users (id, email, password_hash, name, role, company_id) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5) RETURNING *",
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

export const updateUser = async (
  id: string,
  updates: Partial<User>
): Promise<User | null> => {
  try {
    const fields = Object.keys(updates);
    if (fields.length === 0) return null;

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(", ");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const values = fields.map((field) => (updates as any)[field]);

    const result = await pool.query(
      `UPDATE users SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0] as User || null;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};
