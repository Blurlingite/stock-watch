import nodemailer from "nodemailer";
import {
  NEWS_SUMMARY_EMAIL_TEMPLATE,
  STOCK_ALERT_LOWER_EMAIL_TEMPLATE,
  STOCK_ALERT_UPPER_EMAIL_TEMPLATE,
  WELCOME_EMAIL_TEMPLATE,
} from "@/lib/nodemailer/templates";
import { escapeHtml } from "@/lib/utils";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILER_EMAIL!,
    pass: process.env.NODEMAILER_PASSWORD!,
  },
});

export const sendWelcomeEmail = async ({
  email,
  name,
  intro,
}: WelcomeEmailData) => {
  const htmlTemplate = WELCOME_EMAIL_TEMPLATE.replace(`{{name}}`, name).replace(
    `{{intro}}`,
    intro
  );

  const mailOptions = {
    from: `"Stock Watch" <stockwatch@gmail.com>`,
    to: email,
    subject: "Welcome to Stock Watch - your stock market toolkit is ready",
    text: "Thanks for joining Stock Watch",
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
};

export const sendNewsSummaryEmail = async ({
  email,
  date,
  newsContent,
}: {
  email: string;
  date: string;
  newsContent: string;
}): Promise<void> => {
  const htmlTemplate = NEWS_SUMMARY_EMAIL_TEMPLATE.replace(
    "{{date}}",
    date
  ).replace("{{newsContent}}", newsContent);

  const mailOptions = {
    from: `"Stock Watch News" <stockwatch@gmail.com>`,
    to: email,
    subject: `📈 Market News Summary Today - ${date}`,
    text: `Today's market news summary from Stock Watch`,
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
};

// sends email to user if stock is equal to or below their minimum value
export const sendMinValueStockEmail = async ({
  email,
  symbol,
  company,
  currentPrice,
  targetPrice,
  timestamp,
}: {
  email: string;
  symbol: string;
  company: string;
  currentPrice: string;
  targetPrice: string;
  timestamp: string;
}): Promise<void> => {
  const htmlTemplate = STOCK_ALERT_LOWER_EMAIL_TEMPLATE.replace(
    /{{symbol}}/g,
    escapeHtml(symbol)
  )
    .replace(/{{company}}/g, escapeHtml(company))
    .replace(/{{currentPrice}}/g, escapeHtml(currentPrice))
    .replace(/{{targetPrice}}/g, escapeHtml(targetPrice))
    .replace(/{{timestamp}}/g, escapeHtml(timestamp));

  const mailOptions = {
    from: `"Stock Watch News" <stockwatch@gmail.com>`,
    to: email,
    subject: `📈 ${symbol} price is around ${targetPrice}!`,
    text: `Your stock alert from Stock Watch`,
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
};

// sends email to user if stock is equal to or higher their maximum value
export const sendMaxValueStockEmail = async ({
  email,
  symbol,
  company,
  currentPrice,
  targetPrice,
  timestamp,
}: {
  email: string;
  symbol: string;
  company: string;
  currentPrice: string;
  targetPrice: string;
  timestamp: string;
}): Promise<void> => {
  const htmlTemplate = STOCK_ALERT_UPPER_EMAIL_TEMPLATE.replace(
    /{{symbol}}/g,
    escapeHtml(symbol)
  )
    .replace(/{{company}}/g, escapeHtml(company))
    .replace(/{{currentPrice}}/g, escapeHtml(currentPrice))
    .replace(/{{targetPrice}}/g, escapeHtml(targetPrice))
    .replace(/{{timestamp}}/g, escapeHtml(timestamp));

  const mailOptions = {
    from: `"Stock Watch News" <stockwatch@gmail.com>`,
    to: email,
    subject: `📈 ${symbol} price is around ${targetPrice}!`,
    text: `Your stock alert from Stock Watch`,
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
};
