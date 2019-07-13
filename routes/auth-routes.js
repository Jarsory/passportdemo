const express = require("express")
const authRoutes = express.Router()
const passport = require("passport");

const User = require("../models/User")

const bcrypt = require("bcrypt")
const bcryptSalt = 10;
const ensureLogin = require("connect-ensure-login")

const GitHubStrategy = require('passport-github').Strategy;

passport.use(new GitHubStrategy({
  clientID: "0825ffbdda37d99ec6ea",
  clientSecret: "1ab1705344f7cb6ac80e25e83208afb38f817036",
  callbackURL: "http://localhost:3000/auth/github/callback"
},
function(accessToken, refreshToken, profile, cb) {
  // User.findOrCreate({ githubId: profile.id }, function (err, user) {
  //   return cb(err, user);
  // });
  console.log("Autenticado")
  console.log(profile)
  let { id, username } = profile;
  console.log( id,'--', username)
  User.findOne({ githubId: id })
  .then( resp => {
    if( resp == null ){
      User.create({ githubId: id })
      .then( resp => {
        console.log('User creado')
      })
    }else{
      console.log('El usuario ya existe')
      
    }
  })
  .catch( err => console.log(err))
}
));

authRoutes.get("/signup", (req, res, next) => {
  res.render("auth/signup")
})

authRoutes.post("/signup", (req, res, next) => {
  const username = req.body.username;
  const password = req.body.password;

  if (username === "" || password === "") {
    res.render("auth/signup", {
      message: "Indicate username and password"
    });
    return;
  }

  User.findOne({
      username
    })
    .then(user => {
      if (user !== null) {
        res.render("auth/signup", {
          message: "The username already exists"
        });
        return;
      }

      const salt = bcrypt.genSaltSync(bcryptSalt);
      const hashPass = bcrypt.hashSync(password, salt);

      const newUser = new User({
        username,
        password: hashPass
      });

      newUser.save((err) => {
        if (err) {
          res.render("auth/signup", {
            message: "Something went wrong"
          });
        } else {
          res.redirect("/");
        }
      });
    })
    .catch(error => {
      next(error)
    })
});
authRoutes.get("/login", (req, res, next) => {
  res.render("auth/login", {"message": req.flash("error")});
});

authRoutes.post("/login", passport.authenticate("local", {
  successRedirect: "/private-page",
  failureRedirect: "/login",
  failureFlash: true,
  passReqToCallback: true
}));

authRoutes.get("/private-page", ensureLogin.ensureLoggedIn(), (req, res) => {
  res.render("private-page", { user: req.user });
});


authRoutes.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/login");
});

module.exports = authRoutes;



