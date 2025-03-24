import { Booking, User, Cruise } from "@shared/schema";
import nodemailer from "nodemailer";

// Configure email transporter
// For development, we'll use a test account
// In production, you would use real SMTP credentials
let transporter: nodemailer.Transporter;

async function createTestAccount() {
  // Generate test SMTP service account from ethereal.email
  const testAccount = await nodemailer.createTestAccount();

  // Create reusable transporter object using the default SMTP transport
  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
}

// Initialize the test account
createTestAccount().catch(console.error);

// Initialize email transporter based on environment
function getTransporter() {
  if (transporter) return transporter;
  
  // In production, use real email service
  if (process.env.NODE_ENV === "production" && process.env.EMAIL_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || "587"),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    // For development, log emails instead of sending
    transporter = {
      sendMail: async (options: any) => {
        console.log("=== EMAIL NOT SENT (DEVELOPMENT) ===");
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Body: ${options.text || options.html}`);
        console.log("======================================");
        return { messageId: `dev-${Date.now()}` };
      },
    } as any;
  }
  
  return transporter;
}

// Send booking confirmation email
export async function sendBookingConfirmation(booking: Booking, cruise: Cruise, user: User) {
  const transport = getTransporter();
  
  const formattedDepartureDate = new Date(booking.departureDate).toLocaleDateString();
  const formattedReturnDate = new Date(booking.returnDate).toLocaleDateString();
  
  // Create email content
  const emailContent = {
    to: booking.contactEmail,
    subject: "Your Cruise Booking Confirmation - Cruise Voyager",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #0073b1; padding: 20px; text-align: center; color: white;">
          <h1>Booking Confirmation</h1>
          <p>Booking ID: #${booking.id}</p>
        </div>
        
        <div style="padding: 20px; border: 1px solid #e9ecef; border-top: none;">
          <h2>Thank you for booking with Cruise Voyager!</h2>
          <p>Dear ${user.firstName || user.username},</p>
          <p>Your booking for the following cruise has been confirmed:</p>
          
          <div style="background-color: #f5f7fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="color: #0073b1; margin-top: 0;">${cruise.title}</h3>
            <p><strong>Ship:</strong> ${cruise.shipName}</p>
            <p><strong>Departure:</strong> ${formattedDepartureDate} from ${cruise.departurePort}</p>
            <p><strong>Return:</strong> ${formattedReturnDate}</p>
            <p><strong>Cabin Type:</strong> ${booking.cabinType}</p>
            <p><strong>Guests:</strong> ${booking.numberOfGuests}</p>
          </div>
          
          <div style="margin: 20px 0; padding-top: 20px; border-top: 1px solid #e9ecef;">
            <h3>Booking Details</h3>
            <p><strong>Total Amount:</strong> $${booking.totalPrice.toFixed(2)}</p>
            <p><strong>Payment Status:</strong> ${booking.paymentStatus}</p>
            <p><strong>Contact Email:</strong> ${booking.contactEmail}</p>
            ${booking.contactPhone ? `<p><strong>Contact Phone:</strong> ${booking.contactPhone}</p>` : ''}
          </div>
          
          <div style="margin: 20px 0; padding-top: 20px; border-top: 1px solid #e9ecef;">
            <h3>What's Next?</h3>
            <p>You can view your booking details and manage your reservation by logging into your Cruise Voyager account.</p>
            <p>If you have any questions or need to make changes to your booking, please contact our customer service team.</p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; text-align: center; color: #6c757d; font-size: 14px;">
            <p>Thank you for choosing Cruise Voyager!</p>
            <p>&copy; ${new Date().getFullYear()} Cruise Voyager. All rights reserved.</p>
          </div>
        </div>
      </div>
    `,
  };
  
  // Send the email
  await transport.sendMail(emailContent);
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  // Ensure transporter is initialized
  if (!transporter) {
    await createTestAccount();
  }

  const verificationLink = `http://localhost:5173/verify-email?token=${token}`;

  const mailOptions = {
    from: '"Cruise Voyager II" <noreply@cruisevoyager.com>',
    to: email,
    subject: "Verify your email address",
    text: `Welcome to Cruise Voyager II!\n\nPlease verify your email address by clicking on the following link:\n${verificationLink}\n\nThis link will expire in 24 hours.\n\nIf you did not create an account, please ignore this email.`,
    html: `
      <h1>Welcome to Cruise Voyager II!</h1>
      <p>Please verify your email address by clicking on the following link:</p>
      <p><a href="${verificationLink}">${verificationLink}</a></p>
      <p>This link will expire in 24 hours.</p>
      <p>If you did not create an account, please ignore this email.</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Verification email sent:", info.messageId);
    // For development: Log preview URL
    console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Failed to send verification email");
  }
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  // Ensure transporter is initialized
  if (!transporter) {
    await createTestAccount();
  }

  const resetLink = `http://localhost:5173/reset-password?token=${token}`;

  const mailOptions = {
    from: '"Cruise Voyager II" <noreply@cruisevoyager.com>',
    to: email,
    subject: "Reset your password",
    text: `You have requested to reset your password.\n\nPlease click on the following link to reset your password:\n${resetLink}\n\nThis link will expire in 1 hour.\n\nIf you did not request a password reset, please ignore this email.`,
    html: `
      <h1>Reset Your Password</h1>
      <p>You have requested to reset your password.</p>
      <p>Please click on the following link to reset your password:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request a password reset, please ignore this email.</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent:", info.messageId);
    // For development: Log preview URL
    console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
}
