const express = require("express");
const moongoose = require("mongoose");
const dotenv = require("dotenv");
const scanRoutes = require("./routes/scanRoutes");
const morgan = require('morgan');
dotenv.config();

const app = express();

app.use(express.json());

app.use(morgan("dev"));

app.use("/api/scans", scanRoutes);

moongoose.connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(process.env.PORT || 5000, () => {
      console.log("listening and connected to the db", process.env.PORT);
    });
  })
  .catch((err) => {
    console.log(err);
  });
