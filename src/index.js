import dotenv from "dotenv";
import ConnectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./env",
});

ConnectDB()
  .then(() => {
    app.listen(process.env.PORT || 4000, () => {
      console.log(`Server is running on port ${process.env.PORT || 4000} `);
    });
  })
  .catch((error) => console.error("Error connecting to MongoDB", error));
