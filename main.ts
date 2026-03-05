import express, { Request, Response } from "express";
import Database from "better-sqlite3";

export function createApp(dbPath: string = "./users.db") {
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE
    )
  `);

  const app = express();
  app.use(express.json());

  app.get("/users", (_req: Request, res: Response) => {
    const users = db.prepare("SELECT id, name, email FROM users").all();
    res.json(users);
  });

  app.post("/users", (req: Request, res: Response) => {
    const { name, email } = req.body;

    const existing = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(email);
    if (existing) {
      res.status(400).json({ detail: "Email already registered" });
      return;
    }

    const result = db
      .prepare("INSERT INTO users (name, email) VALUES (?, ?)")
      .run(name, email);

    const user = db
      .prepare("SELECT id, name, email FROM users WHERE id = ?")
      .get(result.lastInsertRowid);

    res.status(201).json(user);
  });

  const close = () => db.close();

  return { app, close };
}

if (require.main === module) {
  const { app } = createApp();
  app.listen(3000);
}
