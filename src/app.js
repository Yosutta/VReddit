import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import postRoute from "./routes/post.js";
import userRoute from "./routes/user.js";

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const allowedOrigins = ["http://localhost:3000", "http://localhost:3001"];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        var msg = "The CORS policy for this site does not " + "allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
  })
);

app.use("/posts", postRoute);
app.use("/users", userRoute);

app.get("/", (req, res) => {
  res.json({ data: "This is a robbery" });
});

export default app;
