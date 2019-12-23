const jwt = require("jsonwebtoken");
const { UserInputError, AuthenticationError } = require("apollo-server");
const Yup = require("yup");

const User = require("../../../models/User");

module.exports = {
  Mutatation: {
    async login(_, { email, password }) {
      const schema = Yup.object().shape({
        email: Yup.string().email(),
        password: Yup.string()
      });

      if (!(await schema.validateAt("email", { email }))) {
        throw new UserInputError("The email is invalid or not beign passed", {
          errors: {
            email: "The email is invalid or not beign passed"
          }
        });
      }

      if (!(await schema.validateAt("password", { password }))) {
        throw new UserInputError(
          "The password is invalid or not beign passed",
          {
            errors: {
              password: "The email is invalid or not beign passed"
            }
          }
        );
      }

      try {
        const user = await User.getAuthenticated(email, password);

        const { _id: id, username } = user;

        const token = jwt.sign(
          {
            id,
            username,
            email
          },
          process.env.APP_SECRET,
          {
            expiresIn: "1h"
          }
        );

        return {
          ...user._doc,
          id,
          token
        };
      } catch (err) {
        throw new AuthenticationError(`Authentication error ${err}`);
      }
    },
    async register(
      _,
      { registerInput: { username, email, password, confirmPassword } }
    ) {
      const schema = Yup.object().shape({
        username: Yup.string().required(),
        email: Yup.string()
          .email()
          .required(),
        password: Yup.string().required(),
        confirmPassword: Yup.string()
          .oneOf([Yup.ref("password"), null])
          .required()
      });

      const newUser = {
        username,
        email,
        password,
        confirmPassword
      };

      if (!(await schema.isValid(newUser))) {
        throw new UserInputError(
          "Some field are null or have an invalid value",
          {
            errors: {
              field: "Some field are null or have an invalid value"
            }
          }
        );
      }

      const userExists = await User.findOne({ email });

      if (userExists) {
        throw new UserInputError("User already exists", {
          errors: {
            email: "This email is already registered in the database"
          }
        });
      }

      const user = await new User({
        email,
        username,
        password, //: passwordHash,
        createdAt: new Date().toISOString()
      }).save();

      const { _id: id } = user;

      const token = jwt.sign(
        {
          id,
          email,
          username
        },
        process.env.APP_SECRET,
        { expiresIn: "1h" }
      );

      return {
        ...user._doc,
        id,
        token
      };
    }
  }
};
