const { model, Schema } = require("mongoose");
const bcrypt = require("bcrypt");
const { isFuture, addHours } = require("date-fns");

SALT_WORK_FACOTR = 8;
MAX_LOGIN_ATTEMPTS = 5;

const userSchema = new Schema({
  username: String,
  password: String,
  email: String,
  loginAttempts: {
    type: Number,
    default: 10,
    min: 0,
    max: 10
  },
  lockUntil: {
    type: Number,
    default: 0,
    min: 0
  },
  createdAt: String
});

userSchema.statics.failedLogin = {
  NOT_FOUND: 0,
  PASSWORD_INCORRECT: 1,
  MAX_ATTEMPTS: 2
};

userSchema.virtual("isLocked").get(function() {
  return isFuture(this.lockUntil);
});

userSchema.pre("save", async function(next) {
  const user = this;

  if (!user.isModified()) return next();

  user.password = await bcrypt.hash(user.password, SALT_WORK_FACOTR);

  next();
});

userSchema.methods.comparePassword = async function(password) {
  const match = await bcrypt.compare(password, this.password);
  return match;
};

userSchema.methods.applyLoginAttempts = async function() {
  if (this.loginAttempts > 0) {
    await this.updateOne({
      $inc: { loginAttempts: -1 }
    });
    return this.loginAttempts;
  }

  if (this.loginAttempts <= 0 && this.isLocked) {
    await this.updateOne({
      $inc: { loginAttempts: 1 }
    });
    return this.loginAttempts;
  }

  await this.updateOne({
    $set: { lockUntil: addHours(Date.now, 2) }
  });

  return 0;
};

userSchema.methods.resetLoginAttempts = async function() {
  if (this.loginAttempts !== 10) {
    await this.updateOne({
      loginAttempts: 10,
      lockUntil: 0
    });
  }

  return;
};

userSchema.statics.getAuthenticated = async function(email, password) {
  const user = await this.findOne({ email });

  if (!user) {
    throw new Error("User doesnt exists in the database", {
      user: "User doesnt exists in the database"
    });
  }

  if (user.isLocked) {
    user.applyLoginAttempts();
    throw new Error(
      "Attempts to loggin to this account have been exceeded, please try again later"
    );
  }

  const passwordMatch = await user.comparePassword(password);

  if (!passwordMatch) {
    user.applyLoginAttempts();
    throw new Error("Password is incorrect");
  }

  user.resetLoginAttempts();

  return user;
};

module.exports = model("User", userSchema);
