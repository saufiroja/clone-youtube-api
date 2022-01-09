require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const { readFileSync } = require('fs');

const { User } = require('../database/models');
const { JWT_PUBLIC_KEY, JWT_EXPIRES_IN } = process.env;

// SIGNUP
exports.signup = async (req, res, next) => {
  try {
    const { firstName, lastName, username, email, password } = req.body;

    // check user email
    const isEmail = await User.findOne({ where: { email } });
    if (isEmail) {
      return next(createError(400, 'email already exists'));
    }

    // NEW USER
    const user = await User.create({
      firstName,
      lastName,
      username,
      email,
      password,
      isAdmin: false,
    });

    const accessToken = genereteAccessToken(user);

    return res.status(201).json({
      message: 'successfully signup user',
      code: 201,
      user,
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

// LOGIN
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // check if the email entered is correct!
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return next(createError(400, 'invalid email'));
    }

    // check if the password entered is correct!
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(createError(400, 'invalid password'));
    }

    const accessToken = genereteAccessToken(user);

    return res.status(200).json({
      message: 'successfully login user',
      code: 200,
      user,
    });
  } catch (error) {
    next(error);
  }
};

const genereteAccessToken = (user) => {
  const payload = { id: user.id, isAdmin: user.isAdmin };
  const secret = readFileSync(JWT_PUBLIC_KEY, { encoding: 'utf-8' });

  const token = jwt.sign(payload, secret, { expiresIn: JWT_EXPIRES_IN });
  return token;
};
