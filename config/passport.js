const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/userSchema");
const env = require("dotenv");

// Load environment variables
env.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/user/auth/google/callback", // Update as per your environment
    },

    async (accessToken, refreshToken, profile, done) => {
      try {
        // Find the user by Google ID
        let user = await User.findOne({ googleID: profile.id });

        if (user) {
          // If user exists, return the user
          return done(null, user);
        } else {
          // Create a new user
          user = new User({
            name: profile.displayName,
            email: profile.emails[0].value, // Fixed 'emails' property
            googleID: profile.id,
          });
          await user.save();
          return done(null, user);
        }
      } catch (error) {
        return done(error, null); // Updated 'err' to 'error'
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null); // Updated 'err' to 'error'
    });
});

module.exports = passport;
