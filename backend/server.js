// backend/server.js

// ✅ Importing Express (Web Framework)
const express = require("express");
const path = require("path");
const app = express();
const PORT = 5000;

// Middleware to parse JSON bodies
app.use(express.json());

// ✅ Serving Static Files (Your Frontend HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "../frontend")));

// ✅ Main Route (Loads the Main HTML File)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// Example: Handle login (authentication)
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  // Here you would check the username/password in your database
  if (username === "admin" && password === "password") {
    res.json({ success: true, message: "Login successful!" });
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});

// Example: Serve posts (serves data)
app.get("/posts", (req, res) => {
  // This would come from your database in a real app
  res.json([
    { id: 1, author: "Alice", content: "Hello world!" },
    { id: 2, author: "Bob", content: "Hi there!" },
  ]);
});

// Example: Save a comment (works with database)
app.post("/comment", (req, res) => {
  const { postId, comment } = req.body;
  // Here you would save the comment to your database
  res.json({ success: true, message: "Comment saved!" });
});

// Example: Business logic (only admins can delete posts)
app.delete("/post/:id", (req, res) => {
  const userRole = req.header("x-user-role"); // e.g., 'admin' or 'user'
  if (userRole !== "admin") {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  // Delete post from database here
  res.json({ success: true, message: "Post deleted!" });
});

// ✅ Starting the Server
app.listen(PORT, () => {
  console.log(`✅ Noctive Server running at http://localhost:${PORT}`);
});


