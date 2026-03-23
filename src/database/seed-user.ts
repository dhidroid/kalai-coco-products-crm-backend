import pkg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function seedUser() {
  const client = await pool.connect();

  try {
    const email = 'kalaiyarasan@gmail.com';
    const password = 'Welcome@123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get Admin role_id
    const roleResult = await client.query("SELECT role_id FROM roles WHERE name = 'Admin'");
    const roleId = roleResult.rows[0]?.role_id || 1;

    // Check if user exists
    const existingUser = await client.query('SELECT user_id FROM users WHERE email = $1', [email]);

    if (existingUser.rows.length > 0) {
      console.log('User already exists, updating password...');
      await client.query('UPDATE users SET password_hash = $1, role_id = $2 WHERE email = $3', [
        hashedPassword,
        roleId,
        email,
      ]);
    } else {
      // Create user
      const userResult = await client.query(
        'INSERT INTO users (email, password_hash, role_id) VALUES ($1, $2, $3) RETURNING user_id',
        [email, hashedPassword, roleId]
      );
      const userId = userResult.rows[0].user_id;

      // Create user details
      await client.query(
        'INSERT INTO user_details (user_id, first_name, last_name) VALUES ($1, $2, $3)',
        [userId, 'Kalai', 'Yarasan']
      );
    }

    console.log('User created successfully!');
    console.log(`Email: ${email}`);
    console.log('Password: Welcome@123');
    console.log('Role: Admin');
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedUser();
