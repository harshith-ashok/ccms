-- Cards
CREATE TABLE cards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  bank VARCHAR(100) NOT NULL,
  card_number VARCHAR(25) NOT NULL,
  card_holder VARCHAR(100) NOT NULL,
  expires VARCHAR(10) NOT NULL,
  credit_limit DECIMAL(12,2) DEFAULT 0,
  monthly_due DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_user_cards
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- TEST
INSERT INTO cards 
(user_id, bank, card_number, card_holder, expires, credit_limit, monthly_due)
VALUES
(5, 'PUNJAB NATIONAL BANK', '0210 8820 1150 0222', 'HARSHITH ASHOK', '29/08', 25000, 1500),
(5, 'STATE BANK OF INDIA', '9876 1234 5678 1111', 'HARSHITH ASHOK', '10/27', 50000, 3000),
(5, 'HDFC BANK', '4444 3333 2222 1111', 'HARSHITH ASHOK', '05/29', 75000, 12000);

INSERT INTO cards 
(user_id, bank, card_number, card_holder, expires, credit_limit, monthly_due)
VALUES
(5, 'AMERICAN EXPRESS', '0210 4567 1150 0222', 'HARSHITH ASHOK', '32/08', 50000, 1500);

-- TRANSACTIONS
CREATE TABLE transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  card_id INT NOT NULL,
  type ENUM('credit', 'debit') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description VARCHAR(255),
  category VARCHAR(100),
  transaction_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_transactions_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_transactions_card
    FOREIGN KEY (card_id)
    REFERENCES cards(id)
    ON DELETE CASCADE
);

INSERT INTO transactions 
(user_id, card_id, type, amount, description, category, transaction_date)
VALUES
(5, 6, 'credit', 1500, 'Amazon Purchase', 'Shopping', '2026-03-01'),
(5, 6, 'credit', 2500, 'Swiggy Order', 'Food', '2026-03-02'),
(5, 7, 'credit', 12000, 'Flight Ticket', 'Travel', '2026-03-03'),
(5, 9, 'credit', 5000, 'Card Payment', 'Payment', '2026-03-04');

INSERT INTO transactions 
(user_id, card_id, type, amount, description, category, transaction_date)
VALUES
(5, 6, 'debit', 1500, 'Amazon Purchase', 'Shopping', '2026-03-01'),
(5, 8, 'debit', 2500, 'Swiggy Order', 'Food', '2026-03-02'),
(5, 9, 'debit', 120000, 'Flight Ticket', 'Travel', '2026-03-03');

