const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Setup storage for multer to save files in public/uploads with original filename
const uploadDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Optionally, add a timestamp or unique suffix here to avoid overwrites
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// Serve all files inside public folder as static assets
app.use(express.static(path.join(__dirname, "public")));

// File upload endpoint
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  // Build the URL to access the uploaded file
  const fileUrl = `/uploads/${req.file.filename}`;
  const username = req.body.username || "Anonymous";

  // Broadcast to all clients a message with file info
  io.emit("message", {
    user: username,
    text: fileUrl,
    isFile: true,
    mimeType: req.file.mimetype,
    originalName: req.file.originalname,
  });

  return res.json({ success: true, fileUrl });
});

// Socket.io connection and events
io.on("connection", (socket) => {
  socket.on("joined", (username) => {
    socket.username = username;
    io.emit("message", {
      user: "System",
      text: `${username} joined the chat.`,
    });
  });

  socket.on("message", (msg) => {
    io.emit("message", {
      user: socket.username,
      text: msg,
    });
  });
});

// Start server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
