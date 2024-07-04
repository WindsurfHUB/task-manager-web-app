import dotenv from "dotenv";
import mongoose from "mongoose";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import authenticateToken from "./utils.js";
import User from "./models/user.model.js";
import Task from "./models/task.model.js";

dotenv.config();
mongoose.connect(process.env.MONGO_URI);

const PORT = process.env.PORT || 5000;
const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "*",
  })
);

//OPEN server
app.listen(PORT, () => {
  console.log("Server is running on port " + PORT);
});

//SERVER connect test
app.get("/", (req, res) => {
  res.json({ data: "res form backend" });
});

//API endpoint

//Create account
app.post("/create-acc", async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!email || !password || !fullName) {
    return res
      .status(400)
      .json({ error: true, message: "All fields are required" });
  }

  if (!fullName) {
    return res
      .status(400)
      .json({ error: true, message: "Full name is required" });
  }
  if (!email) {
    return res.status(400).json({ error: true, message: "Email is required" });
  }
  if (!password) {
    return res
      .status(400)
      .json({ error: true, message: "Password is required" });
  }

  const isUser = await User.findOne({ email });

  if (isUser) {
    return res.json({ error: true, message: "User already exists" });
  }

  const user = new User({
    fullName,
    email,
    password,
  });

  await user.save();

  const accessToken = jwt.sign({ user }, process.env.SECRET_TOKEN, {
    expiresIn: "36000m",
  });

  return res.json({
    error: false,
    user,
    accessToken,
    message: "Registration successfully",
  });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ error: true, message: "All fields are required" });
  }

  if (!email) {
    return res.status.json({ error: true, message: "Email is required" });
  }
  if (!password) {
    return res
      .status(400)
      .json({ error: true, message: "Password is required" });
  }

  const userInfo = await User.findOne({ email: email });

  if (!userInfo) {
    return res.status(400).json({ error: true, message: "User not found" });
  }

  if (userInfo.email === email && userInfo.password === password) {
    const user = { user: userInfo };
    const accessToken = jwt.sign(user, process.env.SECRET_TOKEN, {
      expireIn: "36000m",
    });

    return res.json({
      error: false,
      message: "Login successfully",
      email,
      accessToken,
    });
  } else {
    return res
      .status(400)
      .json({ error: true, message: "Invalid credentials" });
  }
});

//Task
//GET User
app.get("/get-user", authenticateToken, async (req, res) => {
  const { user } = req.user;

  const isUser = await User.findOne({ _id: user._id });

  if (!isUser) {
    return res.sendStatus(401);
  }

  return res.json({ user: isUser, message: "" });
});

//Add Task
app.post("/add-task", authenticateToken, async (req, res) => {
  const { title, content, tags } = req.body;
  const { user } = req.user;

  if (!title) {
    return res.status(400).json({ error: true, message: "Title is required" });
  }
  if (!content) {
    return res
      .status(400)
      .json({ error: true, message: "Content is required" });
  }

  try {
    const task = new Task({
      title,
      content,
      tags: tags || [],
      userId: user._id,
    });
    await task.save();

   res.json({ error: false, task, message: "Task added successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ error: true, message: "Internal server Error" });
  }
});

//Edit task
app.put("/edit-task/:taskId", authenticateToken, async (req, res) => {
  const taskId = req.params.taskId;
  const { title, content, tags, isPinned } = req.body;
  const { user } = req.user;

  if (!title && !content && !tags) {
    return res.status(400).json({ error: true, message: "No change provided" });
  }

  try {
    const task = await Task.findOne({ _id: taskId, userId: user._id });

    if (!task) {
      return res.status(404).json({ error: true, message: "Task not found" });
    }

    if (title) task.title = title;
    if (content) task.content = content;
    if (tags) task.tags = tags;
    if (isPinned) task.isPinned = isPinned;

    await task.save();

    return res.json({
      error: false,
      task,
      message: "Task updated successfully",
    });
  } catch (error) {
    return res.status(500)({
      error: true,
      message: "Internal server error",
    });
  }
});

// Update isPinned
app.put("/update-task-pinned/:taskId", authenticateToken, async (req, res) => {
  const taskId = req.params.taskId;
  const { isPinned } = req.body;
  const { user } = req.user;
  try {
    const task = await Task.findOne({ _id: taskId, userId: user._id });
    if (!task) {
      return res.status(404).json({ error: true, message: "Task not found" });
    }
    task.isPinned = isPinned;
    await task.save();
    return res.json({
      error: false,
      task,
      message: "Task pinned status updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});

// Get all task
app.get("/get-all-tasks", authenticateToken, async (req, res) => {
  const { user } = req.user;
  try {
    const task = await Task.find({ userId: user._id }).sort({ isPinned: -1 });
    return res.json({
      error: false,
      task,
      message: "All task retrieved successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});

// Delete task
app.delete("/delete-task/:taskId", authenticateToken, async (req, res) => {
  const taskId = req.params.taskId;
  const { user } = req.user;
  try {
    const task = await Task.findOne({ _id: taskId, userId: user._id });
    if (!task) {
      return res.status(404).json({ error: true, message: "Task not found" });
    }
    await Task.deleteOne({ _id: taskId, userId: user._id });
    return res.json({
      error: false,
      message: "Task deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});

// Search task
app.get("/search-task", authenticateToken, async (req, res) => {
  const { user } = req.user;
  const { query } = req.query;
  if (!query) {
    return res
      .status(400)
      .json({ error: true, message: "Search query is required" });
  }
  try {
    const matchingTask = await Task.find({
      userId: user._id,
      $or: [
        { title: { $regex: new RegExp(query, "i") } }, // Case-insensitive title match
        { content: { $regex: new RegExp(query, "i") } }, // Case-insensitive content match
      ],
    });
    return res.json({
      error: false,
      task: matchingTask,
      message: "Task matching the search query retrieved successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});

export default app;
