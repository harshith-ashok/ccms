require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 8120;

// DB Pool
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

// =======================
// UPDATE USER SETTINGS
// =======================
app.put("/settings/profile", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { username, first_name, current_password, new_password } = req.body;

  if (!username || !first_name || !current_password) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  db.query(
    "SELECT password FROM users WHERE id = ?",
    [userId],
    async (err, results) => {
      if (err) return res.status(500).json({ error: "Server error" });
      if (results.length === 0)
        return res.status(404).json({ error: "User not found" });

      const valid = await bcrypt.compare(current_password, results[0].password);

      if (!valid)
        return res.status(401).json({ error: "Current password incorrect" });

      let query = "UPDATE users SET username=?, first_name=?";
      let values = [username, first_name];

      if (new_password) {
        const hashed = await bcrypt.hash(new_password, 10);
        query += ", password=?";
        values.push(hashed);
      }

      query += " WHERE id=?";
      values.push(userId);

      db.query(query, values, (err2) => {
        if (err2) return res.status(500).json({ error: "Update failed" });
        res.json({ message: "Profile updated successfully" });
      });
    },
  );
});

app.get("/transactions", authenticateToken, (req, res) => {
  const userId = req.user.id;

  const query = `
    SELECT 
      t.id,
      t.type,
      t.amount,
      t.description,
      t.category,
      t.transaction_date,
      c.bank
    FROM transactions t
    JOIN cards c ON t.card_id = c.id
    WHERE t.user_id = ?
    ORDER BY t.transaction_date DESC
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch transactions" });
    }

    res.json(results);
  });
});

app.post("/transactions", authenticateToken, (req, res) => {
  const userId = req.user.id;

  const { type, amount, description, category, card_id } = req.body;

  if (!type || !amount || !description || !category || !card_id) {
    return res.status(400).json({ error: "All fields required" });
  }

  const insertQuery = `
    INSERT INTO transactions 
    (user_id, card_id, type, amount, description, category, transaction_date)
    VALUES (?, ?, ?, ?, ?, ?, NOW())
  `;

  db.query(
    insertQuery,
    [userId, card_id, type, amount, description, category],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Insert failed" });
      }

      // Return inserted transaction with card bank name
      const selectQuery = `
        SELECT 
          t.id,
          t.type,
          t.amount,
          t.description,
          t.category,
          t.transaction_date,
          c.bank
        FROM transactions t
        JOIN cards c ON t.card_id = c.id
        WHERE t.id = ?
      `;

      db.query(selectQuery, [result.insertId], (err2, rows) => {
        if (err2) {
          console.error(err2);
          return res.status(500).json({ error: "Fetch failed" });
        }

        res.status(201).json(rows[0]);
      });
    },
  );
});

app.post("/cards", authenticateToken, (req, res) => {
  const userId = req.user.id;

  const {
    bank,
    card_number,
    card_holder,
    expires,
    credit_limit,
    monthly_due,
    due_date,
  } = req.body;

  if (
    !bank ||
    !card_number ||
    !card_holder ||
    !expires ||
    !credit_limit ||
    !monthly_due
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const query = `
    INSERT INTO cards 
    (user_id, bank, card_number, card_holder, expires, credit_limit, monthly_due, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    query,
    [
      userId,
      bank,
      card_number,
      card_holder,
      expires,
      credit_limit,
      monthly_due,
      due_date || 15,
    ],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to add card" });
      }

      res.status(201).json({
        message: "Card added successfully",
        cardId: result.insertId,
      });
    },
  );
});

// =======================
// DELETE CARD
// =======================
app.delete("/cards/:id", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const cardId = req.params.id;

  db.query(
    "DELETE FROM cards WHERE id=? AND user_id=?",
    [cardId, userId],
    (err) => {
      if (err) return res.status(500).json({ error: "Delete failed" });
      res.json({ message: "Card deleted" });
    },
  );
});

app.get("/cards", authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.query(
    "SELECT * FROM cards WHERE user_id = ?",
    [userId],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to fetch cards" });
      }

      res.json(results);
    },
  );
});

app.post("/register", async (req, res) => {
  const { username, password, first_name } = req.body;

  if (!username || !password || !first_name) {
    return res.status(400).json({ error: "All fields required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      "INSERT INTO users (username, password, first_name) VALUES (?, ?, ?)",
      [username, hashedPassword, first_name],
      (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "User creation failed" });
        }

        res.status(201).json({ message: "User created successfully" });
      },
    );
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// =======================
// HARD RESET (DELETE ALL TRANSACTIONS)
// =======================
app.delete("/settings/hard-reset", authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.query("DELETE FROM transactions WHERE user_id=?", [userId], (err) => {
    if (err) return res.status(500).json({ error: "Reset failed" });
    res.json({ message: "All transactions deleted" });
  });
});

// =======================
// RESET MONTHLY DUE
// =======================
app.post("/settings/reset-monthly", authenticateToken, (req, res) => {
  const userId = req.user.id;

  const getCardsQuery = "SELECT id FROM cards WHERE user_id=?";

  db.query(getCardsQuery, [userId], (err, cards) => {
    if (err) return res.status(500).json({ error: "Fetch cards failed" });

    if (cards.length === 0) return res.json({ message: "No cards found" });

    cards.forEach((card) => {
      const usageQuery = `
        SELECT SUM(
          CASE 
            WHEN type='debit' THEN amount
            WHEN type='credit' THEN -amount
          END
        ) as total
        FROM transactions
        WHERE user_id=? AND card_id=?
      `;

      db.query(usageQuery, [userId, card.id], (err2, result) => {
        if (err2) return;

        const total = result[0].total || 0;

        if (total !== 0) {
          const insertReset = `
            INSERT INTO transactions
            (user_id, card_id, type, amount, description, category, transaction_date)
            VALUES (?, ?, 'credit', ?, 'Monthly Reset', 'reset', NOW())
          `;

          db.query(insertReset, [userId, card.id, total]);
        }
      });
    });

    res.json({ message: "Monthly reset completed" });
  });
});

// =======================
// LOGIN ROUTE (SECURE)
// =======================
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.query(
    "SELECT id, first_name, password FROM users WHERE username=?",
    [username],
    async (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
      }

      if (results.length === 0) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const user = results[0];

      // Compare hashed password
      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Create JWT
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      res.json({
        access_token: token,
        user: {
          id: user.id,
          first_name: user.first_name,
        },
      });
    },
  );
});

// =======================
// AUTH MIDDLEWARE
// =======================
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// =======================
// PROTECTED ROUTE EXAMPLE
// =======================
app.get("/dashboard", authenticateToken, (req, res) => {
  res.json({ message: "Secure data", userId: req.user.id });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
