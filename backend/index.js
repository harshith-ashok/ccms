const express = require("express"),
  bodyParser = require("body-parser");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
const PORT = 8080;
app.use(bodyParser.json());
app.use(cors());

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "P@ss4SQl",
  database: "ccms",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.query(
    "SELECT first_name,id FROM users WHERE username=? AND password=?",
    [username, password],
    (err, results) => {
      if (err) {
        console.error("Error fetching items:", err);
        return res.status(500).json({ error: "Internal server error" });
      }

      res.json(results);
    },
  );
});
