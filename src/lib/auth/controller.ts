import bcrypt from "bcryptjs";
import { generateToken } from "./jwt.js";
import { config } from "./config.js";
import { CustomError, catchAsync } from "./errors.js";
import { AuthRequest } from "./types.js";
import crypto from "crypto";
import prisma from "../db/client.js";

const sendVerificationEmail = async (email: string, name: string, token: string): Promise<void> => {
  const verificationUrl = `${config.app.url}/auth/verify-email/${token}`;
  
  if (config.email.user && config.email.pass) {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465,
      auth: { user: config.email.user, pass: config.email.pass },
    });

    await transporter.sendMail({
      from: config.email.from,
      to: email,
      subject: "Verify your email address",
      html: `
        <h1>Welcome ${name}!</h1>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
        <p>This link expires in 24 hours.</p>
      `,
    });
  } else {
    console.log(`[DEV] Verification email would be sent to ${email}: ${verificationUrl}`);
  }
};

const sendPasswordResetEmail = async (email: string, name: string, token: string): Promise<void> => {
  const resetUrl = `${config.app.url}/auth/reset-password/${token}`;
  
  if (config.email.user && config.email.pass) {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465,
      auth: { user: config.email.user, pass: config.email.pass },
    });

    await transporter.sendMail({
      from: config.email.from,
      to: email,
      subject: "Reset your password",
      html: `
        <h1>Password Reset</h1>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link expires in 1 hour.</p>
      `,
    });
  } else {
    console.log(`[DEV] Password reset email would be sent to ${email}: ${resetUrl}`);
  }
};

const signupHandler = catchAsync(async (req: any, res: any) => {
  const { name, email, password } = req.body as { name: string; email: string; password: string };

  const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existingUser) {
    throw CustomError.badRequest("User already exists with this email");
  }

  const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);
  const verificationToken = crypto.randomBytes(32).toString("hex");

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      name: name.trim(),
      passwordHash,
      verificationToken,
      verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  try {
    await sendVerificationEmail(email, name, verificationToken);
    res.status(201).json({
      status: "success",
      message: "Registration successful. Please check your email to verify your account.",
    });
  } catch (emailError) {
    console.error("Failed to send verification email:", emailError);
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationFailed: true },
    });
    res.status(201).json({
      status: "warning",
      message: "Account created but verification email could not be sent. Please contact support.",
      userId: user.id,
    });
  }
});

const loginHandler = catchAsync(async (req: any, res: any) => {
  const { email, password } = req.body as { email: string; password: string };

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    throw CustomError.unauthorized("Invalid credentials");
  }

  if (!user.isVerified) {
    throw CustomError.unauthorized("Please verify your email before logging in");
  }

  if (!user.passwordHash) {
    throw CustomError.unauthorized("Please login with OAuth or reset your password");
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw CustomError.unauthorized("Invalid credentials");
  }

  const token = generateToken({ userId: user.id, email: user.email });

  res.json({
    status: "success",
    data: {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    },
  });
});

const verifyEmailHandler = catchAsync(async (req: any, res: any) => {
  const { token } = req.params;

  const user = await prisma.user.findFirst({
    where: {
      verificationToken: token,
      verificationTokenExpires: { gt: new Date() },
    },
  });

  if (!user) {
    throw CustomError.badRequest("Invalid or expired verification token");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      verificationToken: null,
      verificationTokenExpires: null,
    },
  });

  res.json({
    status: "success",
    message: "Email verified successfully. You can now log in.",
  });
});

const forgotPasswordHandler = catchAsync(async (req: any, res: any) => {
  const { email } = req.body as { email: string };

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    throw CustomError.notFound("No account found with that email");
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: resetToken,
      resetPasswordExpires: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  try {
    await sendPasswordResetEmail(email, user.name || "", resetToken);
    res.json({
      status: "success",
      message: "Password reset instructions sent to your email",
    });
  } catch (emailError) {
    console.error("Failed to send password reset email:", emailError);
    await prisma.user.update({
      where: { id: user.id },
      data: { resetPasswordToken: null, resetPasswordExpires: null },
    });
    throw CustomError.internal("Failed to send password reset email. Please try again later.");
  }
});

const resetPasswordHandler = catchAsync(async (req: any, res: any) => {
  const { token } = req.params;
  const { password } = req.body as { password: string };

  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: token,
      resetPasswordExpires: { gt: new Date() },
    },
  });

  if (!user) {
    throw CustomError.badRequest("Invalid or expired reset token");
  }

  const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    },
  });

  res.json({
    status: "success",
    message: "Password reset successfully. You can now log in.",
  });
});

const getMeHandler = catchAsync(async (req: AuthRequest, res: any) => {
  if (!req.user) {
    throw CustomError.unauthorized("Not authenticated");
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) {
    throw CustomError.notFound("User not found");
  }

  res.json({
    status: "success",
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
      },
    },
  });
});

const logoutHandler = catchAsync(async (req: any, res: any) => {
  res.json({
    status: "success",
    message: "Logged out successfully",
  });
});

export const signup = signupHandler;
export const login = loginHandler;
export const verifyEmail = verifyEmailHandler;
export const forgotPassword = forgotPasswordHandler;
export const resetPassword = resetPasswordHandler;
export const getMe = getMeHandler;
export const logout = logoutHandler;