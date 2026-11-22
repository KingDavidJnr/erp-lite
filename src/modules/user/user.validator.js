import Joi from "joi";

export const createUserSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(8).max(128).required(),
  role: Joi.string()
    .valid("GENERAL_ADMIN", "BRANCH_ADMIN", "BRANCH_MEMBER", "BRANCH_VIEWER", "GENERAL_VIEWER")
    .required(),
  branchId: Joi.string().uuid().optional(),
});

export const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

export const updateUserSchema = Joi.object({
  role: Joi.string()
    .valid("GENERAL_ADMIN", "BRANCH_ADMIN", "BRANCH_MEMBER", "BRANCH_VIEWER", "GENERAL_VIEWER")
    .trim()
    .required(), // role must be provided
  branchId: Joi.string().uuid().allow(null).optional(), // branchId can be missing or null
});
