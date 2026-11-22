import { userService } from "./user.service.js";
import {
  createUserSchema,
  loginSchema,
  updateUserSchema,
} from "./user.validator.js";
import dotenv from "dotenv";

dotenv.config();

class UserController {
  // ----------------------------
  // AUTHENTICATION
  // ----------------------------

  // Returns { token, user } on success, 401 on invalid credentials, 400 on validation failure
  async login(req, res) {
    try {
      const { error, value } = loginSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error)
        return res
          .status(400)
          .json({ message: "Validation failed", details: error.details });

      // Convert username to lowercase
      const username = value.username.toLowerCase();
      const password = value.password;

      const result = await userService.login(username, password);

      if (!result) {
        return res
          .status(401)
          .json({ message: "Invalid username or password" });
      }

      // Format user for response: remove password, convert BigInt id to string
      const { password: _, ...formattedUser } = result.user;
      formattedUser.id = formattedUser.id.toString();
      formattedUser.branchId = formattedUser.branchId || null;

      // Set token in secure, HTTP-only cookie for cross-origin usage
      res.cookie("jwt", result.token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        //domain: ".monesize.com",
      });

      res
        .status(200)
        .json({ message: "Login successful", data: formattedUser });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  }

  // For JWT-based auth, logout is typically handled client-side by deleting the token
  async logout(req, res) {
    try {
      // Clear the JWT cookie
      res.clearCookie("jwt", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      });

      res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Logout failed" });
    }
  }

  // ----------------------------
  // PASSWORD MANAGEMENT
  // ----------------------------
  // Returns updated user on success, 400 on validation failure or incorrect old password
  async updatePassword(req, res) {
    try {
      const userId = req.params.id;
      const { old_password, new_password } = req.body;

      if (!old_password || !new_password) {
        return res
          .status(400)
          .json({ message: "Old password and new password are required" });
      }

      const updatedUser = await userService.updatePassword(
        userId,
        old_password,
        new_password,
      );

      if (!updatedUser) {
        return res
          .status(400)
          .json({ message: "Old password is incorrect or user not found" });
      }

      // Format user for response: remove password, convert BigInt id to string
      const { password, ...formattedUser } = updatedUser;
      formattedUser.id = formattedUser.id.toString();
      formattedUser.branchId = formattedUser.branchId || null;

      res.status(200).json({
        message: "Password updated successfully",
        data: formattedUser,
      });
    } catch (error) {
      console.error("Update password error:", error);
      res.status(500).json({ message: "Failed to update password" });
    }
  }

  // ----------------------------
  // CRUD OPERATIONS
  // ----------------------------

  // Returns created user on success, 400 if username already exists or validation fails
  async createUser(req, res) {
    try {
      const { error, value } = createUserSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error)
        return res
          .status(400)
          .json({ message: "Validation failed", details: error.details });

      // Convert username to lowercase
      value.username = value.username.toLowerCase();

      const newUser = await userService.createUser(value);
      if (!newUser)
        return res.status(400).json({ message: "Username already exists" });

      // Format user for response: remove password, convert BigInt id to string
      const { password, ...formattedUser } = newUser;
      formattedUser.id = formattedUser.id.toString();
      formattedUser.branchId = formattedUser.branchId || null;

      res
        .status(201)
        .json({ message: "User created successfully", data: formattedUser });
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  }

  // Returns user on success, 404 if not found
  async updateUser(req, res) {
    try {
      const { error, value } = updateUserSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error)
        return res
          .status(400)
          .json({ message: "Validation failed", details: error.details });

      const userId = req.params.id;
      const updatedUser = await userService.updateUser(userId, value);

      if (!updatedUser)
        return res.status(404).json({ message: "User not found" });

      // Format user for response: remove password, convert BigInt id to string
      const { password, ...formattedUser } = updatedUser;
      formattedUser.id = formattedUser.id.toString();
      formattedUser.branchId = formattedUser.branchId || null;

      res
        .status(200)
        .json({ message: "User updated successfully", data: formattedUser });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  }

  // Returns user on success, 404 if not found
  async findUserById(req, res) {
    try {
      const userId = req.params.id;
      const user = await userService.findUserById(userId);

      if (!user) return res.status(404).json({ message: "User not found" });

      const formattedUser = {
        ...user,
        id: user.id.toString(),
        branchId: user.branchId || null,
      };

      // Remove password explicitly
      delete formattedUser.password;

      res.status(200).json({ message: "User found", data: formattedUser });
    } catch (error) {
      console.error("Fetch user error:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  }

  // Returns array of users on success, 404 if no users found
  async getAllUsers(req, res) {
    try {
      const users = await userService.getAllUsers();
      if (!users) return res.status(404).json({ message: "No users found" });

      // Format each user: remove password, convert BigInt id to string
      const formattedUsers = users.map(({ password, ...user }) => ({
        ...user,
        id: user.id.toString(),
        branchId: user.branchId || null,
      }));

      res.status(200).json({ message: "Users found", data: formattedUsers });
    } catch (error) {
      console.error("Fetch users error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  }

  // Returns array of users for the branch on success, 404 if no users found or branchId not provided
  async getUsersByBranch(req, res) {
    try {
      const branchId = req.params.branchId;
      const users = await userService.getUsersByBranch(branchId);

      if (!users) {
        return res
          .status(404)
          .json({ message: "No users found for this branch" });
      }

      // Format each user: remove password, convert BigInt id to string
      const formattedUsers = users.map(({ password, ...user }) => ({
        ...user,
        id: user.id.toString(),
        branchId: user.branchId || null,
      }));

      res
        .status(200)
        .json({ message: "Branch users found", data: formattedUsers });
    } catch (error) {
      console.error("Get users by branch error:", error);
      res.status(500).json({ message: "Failed to fetch branch users" });
    }
  }

  // Returns success message on successful deletion, 404 if user not found
  async deleteUser(req, res) {
    try {
      const userId = req.params.id;
      const deletedUser = await userService.deleteUser(userId);

      if (!deletedUser)
        return res.status(404).json({ message: "User not found" });

      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  }

  // ----------------------------
  // CREATE GENERAL ADMIN VIA API KEY
  // ----------------------------
  async createGeneralAdmin(req, res) {
    try {
      // Check API key
      const apiKey = req.headers["x-api-key"];
      if (!apiKey || apiKey !== process.env.API_KEY) {
        return res.status(403).json({ message: "Forbidden: Invalid API key" });
      }

      const { firstName, lastName, username, password } = req.body;

      if (!firstName || !lastName || !username || !password) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Normalize username
      const normalizedUsername = username.toLowerCase();

      const newUser = await userService.createUser({
        firstName,
        lastName,
        username: normalizedUsername,
        password,
        role: "GENERAL_ADMIN",
      });

      if (!newUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Exclude password from response and convert BigInt id to string
      const { password: _, ...safeUser } = newUser;

      const formattedUser = {
        ...safeUser,
        id: newUser.id.toString(),
        branchId: newUser.branchId || null,
      };

      res
        .status(201)
        .json({ message: "General admin created", data: formattedUser });
    } catch (error) {
      console.error("Create general admin via API key error:", error);
      res.status(500).json({ message: "Failed to create general admin" });
    }
  }

  // ----------------------------
  // CREATE GENERAL ADMIN (JWT, only by GENERAL_ADMIN)
  // ----------------------------
  async createUserByAdmin(req, res) {
    try {
      const { firstName, lastName, username, password, role, branchId } =
        req.body;

      // Basic required fields validation
      if (!firstName || !lastName || !username || !password || !role) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Normalize username
      const normalizedUsername = username.toLowerCase();

      const newUser = await userService.createUser({
        firstName,
        lastName,
        username: normalizedUsername,
        password,
        role,
        branchId: branchId || null,
      });

      if (!newUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Exclude password and convert BigInt id to string
      const { password: _, ...safeUser } = newUser;

      const formattedUser = {
        ...safeUser,
        id: newUser.id.toString(),
        branchId: newUser.branchId || null,
      };

      res
        .status(201)
        .json({ message: "User created successfully", data: formattedUser });
    } catch (error) {
      console.error("Create user by admin error:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  }
}

export const userController = new UserController();
