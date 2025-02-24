import mongoose from "mongoose";
import { DB_NAME } from "../constants";

const ConnectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URL}/${DB_NAME}`
    );
    console.log(
      `\n MongoDb connected !! DB HOST:${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error("ERROR", error);
    process.exit(1);
  }
};

export default ConnectDB;
