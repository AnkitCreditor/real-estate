import dotenv from "dotenv";
import { app } from "./app.js";
import connectDB from "./config/db.js";

// 🌍 Load environment variables
dotenv.config({ path: "./.env" });

// 🔌 Start server after DB connection
connectDB()
  .then(() => {
    const PORT = process.env.PORT || 8000;

    app.listen(PORT, () => {
      console.log(`✅ Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to connect to database:", err);
    process.exit(1);
  });
