import dotenv from "dotenv";
import ConnectDB from "./db/index.js";
import { app } from "./app.js";
import { startAlertScheduler } from "./services/alertScheduler.service.js";
import { startPriceUpdateScheduler } from "./services/priceUpdateScheduler.service.js";

dotenv.config({
  path: ".env",
});

ConnectDB()
  .then(() => {
      // Start alert scheduler
      startAlertScheduler();
      startPriceUpdateScheduler();

    app.listen(process.env.PORT || 4000, () => {
      console.log(`Server is running on port ${process.env.PORT || 4000} `);
    });
  })
  .catch((error) => console.error("Error connecting to MongoDB", error));
