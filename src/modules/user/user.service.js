import prisma from "../../lib/prisma.js";
import { hashPassword, comparePasswords } from "../../utils/bcrypt.util.js";
import { generateToken } from "../../utils/jwt.util.js";

class UserService {
  // ----------------------------
  // AUTHENTICATION
  // ----------------------------
  // Returns { token, user } on success, null on failure
  async login(username, password) {
    const user = await prisma.User.findUnique({ where: { username } });
    if (!user) return null;

    const passwordMatch = await comparePasswords(password, user.password);
    if (!passwordMatch) return null;

    const token = generateToken({
      user_id: String(user.id), // ← Convert BigInt to string
      role: user.role,
      branch_id: user.branchId ? String(user.branchId) : null, // ← Also convert this if it's BigInt
      user_name: `${user.firstName} ${user.lastName}`,
    });

    return { token, user };
  }

  // ----------------------------
  // PASSWORD MANAGEMENT
  // ----------------------------
  // Returns updated user on success, null on failure
  async updatePassword(userId, oldPassword, newPassword) {
    const user = await prisma.User.findUnique({
      where: { id: BigInt(userId) },
    });
    if (!user) return null; // user not found

    const isMatch = await comparePasswords(oldPassword, user.password);
    if (!isMatch) return null; // old password incorrect

    const hashed = await hashPassword(newPassword);

    return await prisma.User.update({
      where: { id: BigInt(userId) },
      data: { password: hashed, firstLogin: false },
    });
  }

  // ----------------------------
  // CRUD OPERATIONS
  // ----------------------------
  // Returns created user on success, null if username already exists
  async createUser(data) {
    const existing = await prisma.User.findUnique({
      where: { username: data.username },
    });
    if (existing) return null; // username already exists

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.User.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        password: hashedPassword,
        role: data.role,
        branchId: data.branchId || null,
      },
    });

    return user;
  }

  // Returns user on success, null if not found
  async findUserById(userId) {
    const user = await prisma.User.findUnique({
      where: { id: BigInt(userId) },
    });
    return user || null;
  }

  // Returns array of users on success, null if no users found
  async getAllUsers() {
    const users = await prisma.User.findMany({
      orderBy: { createdAt: "asc" },
    });
    return users.length ? users : null;
  }

  // Returns array of users for the branch on success, null if no users found or branchId not provided
  async getUsersByBranch(branchId) {
    if (!branchId) return null;

    const users = await prisma.User.findMany({
      where: { branchId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        role: true,
        branchId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return users.length ? users : null;
  }

  // Returns updated user on success, null if user not found
  async updateUser(userId, data) {
    // Only allow role and branchId to be updated
    const updateData = {};
    if (data.role) updateData.role = data.role;
    if (data.branchId !== undefined)
      updateData.branchId = data.branchId || null;

    const user = await prisma.User.update({
      where: { id: BigInt(userId) },
      data: updateData,
    });

    return user || null;
  }

  // Returns deleted user on success, null if user not found
  async deleteUser(userId) {
    const user = await prisma.User.delete({
      where: { id: BigInt(userId) },
    });
    return user || null;
  }
}

// Export a singleton instance of UserService
export const userService = new UserService();
