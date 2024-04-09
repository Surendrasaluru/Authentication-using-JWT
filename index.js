const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const ejs = require("ejs");
const User = require("./models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
dotenv.config();

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("./public"));

//custom middleware
const isAuthenticated = (req, res, next) => {
  if (req.headers.token) {
    try {
      jwt.verify(req.headers.token, process.env.JWT_SECRET_KEY);
    } catch (error) {
      res.send({ Status: "failure of post", message: "please signup first" });
    }
    next();
  }

  User.findOne({ email }).then((user) => {
    if (user.password === password) {
      next();
    }
  });
  res.send({ Status: "failure of post", message: "please signup first" });
};
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.json({ message: "all going goodd" });
});

app.post("/register", async (req, res) => {
  const { email, password, isAdmin } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user) {
      return res.send({
        Status: "Failed",
        Message: "Already accoun exists",
      });
    }
    const encryptedPassword = await bcrypt.hash(password, 10);
    User.create({
      email,
      password: encryptedPassword,
      isAdmin,
    })
      .then(() => {
        res.send({
          Status: "success of post",
          Message: "user created succesfully",
        });
      })
      .catch(() => {
        res.send({ Status: "failure of post" });
      });
  } catch (error) {}
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  User.findOne({ email })
    .then((user) => {
      if (user) {
        let passwordMatch = bcrypt.compare(password, user.password);
        if (passwordMatch) {
          const jwtToken = jwt.sign(
            { email, isAdmin: user.isAdmin },
            process.env.JWT_SECRET_KEY,
            { expiresIn: 60 }
          );
          return res.send({
            Status: "success of login",
            Message: "user loggedin succesfully",
            jwtToken,
          });
        }
      }

      return res.send({ message: "incoorect credentials" });
    })
    .catch(() => {
      res.send({ Status: "failure of post" });
    });
});
//pnly loggedin users can access
app.get("/private-route", isAuthenticated, (req, res) => {
  res.json({ message: "all going goodd" });
});
//only loggedinusers+admin users can access
app.get("/admin-panel", (req, res) => {
  res.json({ message: "all going goodd" });
});

app.listen(process.env.PORT, () => {
  mongoose
    .connect(process.env.MONGODB_URL)
    .then(() => {
      console.log("server is running on given port");
    })
    .catch((error) => console.log(error));
});
