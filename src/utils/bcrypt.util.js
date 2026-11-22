import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const rounds = parseInt(process.env.SALT_ROUND, 10);

/**
 * Hash plain text password
 * @param {string} plainPassword
 * @returns {Promise<string>} hashed password
 */
const hashPassword = async (plainPassword) => {
  try {
    return await bcrypt.hash(plainPassword, rounds);
  } catch (err) {
    throw new Error("Error hashing plain password");
  }
};

/**
 * Compare plain password with hashed password
 * @param {string} plainPassword
 * @param {string} hashedPassword
 * @returns {Promise<boolean>} true if match
 */
const comparePasswords = async (plainPassword, hashedPassword) => {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (err) {
    throw new Error("Error comparing passwords");
  }
};

export { hashPassword, comparePasswords };
