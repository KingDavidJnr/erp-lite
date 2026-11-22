import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const secret_key = process.env.JWT_SECRET;
const token_expiry = process.env.TOKEN_EXPIRY;

/**
 * Generate JWT token
 * @param {Object} user - user object (must include user_id, role, and branch_id if applicable)
 * @returns {string} signed JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, secret_key, { expiresIn: token_expiry });
};

/**
 * Verify JWT token
 * @param {string} token - the JWT token to verify
 * @returns {Object} decoded payload or error object
 */
const verifyToken = (token) => {
  if (!token) {
    return { status: 401, message: "No token provided." };
  }

  try {
    return jwt.verify(token, secret_key);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return {
        status: 401,
        message: "Your JWT token has expired. Kindly log out and log in again.",
      };
    } else if (error.name === "JsonWebTokenError") {
      return {
        status: 401,
        message: "Invalid token. Please provide a valid token.",
      };
    }

    return { status: 500, message: "There was an error decoding the token." };
  }
};

export { generateToken, verifyToken };
