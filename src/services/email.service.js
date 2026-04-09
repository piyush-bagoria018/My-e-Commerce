import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.FROM_EMAIL || "onboarding@resend.dev";
const fromName = process.env.FROM_NAME || "My eCommerce";

export const sendPriceAlertEmail = async ({ userEmail, productName, targetPrice, currentPrice }) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is missing");
    }

    const response = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: userEmail,
      subject: `Price Alert: ${productName} is now below your target!`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px;">
            <h2 style="color: #333;">Price Alert!</h2>
            <p style="color: #666; font-size: 16px;">
              Great news! <strong>${productName}</strong> has dropped in price.
            </p>
            <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 10px 0; color: #666;">
                <span style="display: inline-block; width: 120px;">Current Price:</span>
                <strong style="color: #27ae60; font-size: 18px;">₹${currentPrice.toFixed(2)}</strong>
              </p>
              <p style="margin: 10px 0; color: #666;">
                <span style="display: inline-block; width: 120px;">Your Target:</span>
                <strong style="color: #2980b9; font-size: 18px;">₹${targetPrice.toFixed(2)}</strong>
              </p>
              <p style="margin: 10px 0; color: #27ae60; font-weight: bold;">
                ✓ You're saving ₹${(targetPrice - currentPrice).toFixed(2)}!
              </p>
            </div>
            <p style="color: #666; margin: 20px 0;">
              Don't miss out! Check the product now before the price changes.
            </p>
            <a href="${process.env.FRONTEND_URL}/products" 
               style="display: inline-block; background-color: #27ae60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 10px;">
              View Product
            </a>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">
              This is an automated alert from My eCommerce. You received this email because you set a price alert for this product.
            </p>
          </div>
        </div>
      `,
    });

    return { success: true, messageId: response.id };
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};
