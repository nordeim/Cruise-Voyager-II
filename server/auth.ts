import { PassportStatic } from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { Request, Response, NextFunction } from "express";
import { IStorage } from "./storage";
import { User, InsertUser } from "@shared/schema";
import crypto from "crypto";
import { sendPasswordResetEmail, sendVerificationEmail } from "./email";

// Define custom types for authentication
interface AuthenticatedRequest extends Request {
  user?: User;
  isAuthenticated(): boolean;
}

interface PasswordResetToken {
  token: string;
  expires: Date;
}

export function configurePassport(passport: PassportStatic, storage: IStorage) {
  // Serialize user to store in session
  passport.serializeUser((user: User, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(new Error("User not found"));
      }
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Local strategy for username/password authentication
  passport.use(
    new LocalStrategy(
      {
        usernameField: "username",
        passwordField: "password",
      },
      async (username, password, done) => {
        try {
          // Find user by username
          const user = await storage.getUserByUsername(username);

          if (!user) {
            return done(null, false, { message: "Invalid username or password" });
          }

          // Check if email is verified
          if (!user.emailVerified) {
            return done(null, false, { message: "Please verify your email address" });
          }

          // Compare passwords
          const isMatch = await comparePassword(password, user.password);

          if (!isMatch) {
            return done(null, false, { message: "Invalid username or password" });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
}

// Helper function to hash passwords
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Helper function to compare passwords
export async function comparePassword(
  candidatePassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, hashedPassword);
}

// Generate password reset token
export async function generatePasswordResetToken(): Promise<PasswordResetToken> {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date();
  expires.setHours(expires.getHours() + 1); // Token expires in 1 hour
  
  return {
    token,
    expires,
  };
}

// Generate email verification token
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Middleware to check if user is authenticated
export function isAuthenticated(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Hook to hash password before storage
export async function prepareUserForStorage(user: InsertUser): Promise<InsertUser & { emailVerificationToken: string }> {
  // Hash password
  const hashedPassword = await hashPassword(user.password);
  
  // Generate email verification token
  const emailVerificationToken = generateVerificationToken();
  
  return {
    ...user,
    password: hashedPassword,
    emailVerificationToken,
  };
}

// Handle password reset request
export async function handlePasswordResetRequest(
  email: string,
  storage: IStorage
): Promise<void> {
  const user = await storage.getUserByEmail(email);
  
  if (!user) {
    // Don't reveal if email exists
    return;
  }
  
  const { token, expires } = await generatePasswordResetToken();
  
  // Store reset token in database
  await storage.storePasswordResetToken(user.id, token, expires);
  
  // Send password reset email
  await sendPasswordResetEmail(user.email, token);
}

// Validate password reset token
export async function validatePasswordResetToken(
  token: string,
  storage: IStorage
): Promise<boolean> {
  const resetToken = await storage.getPasswordResetToken(token);
  
  if (!resetToken) {
    return false;
  }
  
  if (new Date() > resetToken.expires) {
    await storage.deletePasswordResetToken(token);
    return false;
  }
  
  return true;
}

// Reset password
export async function resetPassword(
  token: string,
  newPassword: string,
  storage: IStorage
): Promise<boolean> {
  const resetToken = await storage.getPasswordResetToken(token);
  
  if (!resetToken || new Date() > resetToken.expires) {
    return false;
  }
  
  const hashedPassword = await hashPassword(newPassword);
  await storage.updateUserPassword(resetToken.userId, hashedPassword);
  await storage.deletePasswordResetToken(token);
  
  return true;
}

// Verify email
export async function verifyEmail(
  token: string,
  storage: IStorage
): Promise<boolean> {
  const user = await storage.getUserByVerificationToken(token);
  
  if (!user) {
    return false;
  }
  
  await storage.markEmailAsVerified(user.id);
  return true;
}
