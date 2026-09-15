import dotenv from "dotenv";
dotenv.config();

class Config {
  public NODE_ENV: string | undefined;
  public DATABASE_URL: string | undefined;
  public JWT_TOKEN: string | undefined;
  public CLIENT_URL: string | undefined;
  public COOKIE_DOMAIN: string | undefined;
  public SMTP_HOST: string | undefined;
  public SMTP_PORT: string | undefined;
  public SMTP_USER: string | undefined;
  public SMTP_PASS: string | undefined;
  public EMAIL_TRANSPORT: string | undefined;
  public GOOGLE_MAPS_API_KEY: string | undefined;
  public RAZORPAY_KEY_ID: string | undefined;
  public RAZORPAY_KEY_SECRET: string | undefined;
  public GOOGLE_PLAY_PACKAGE_NAME: string | undefined;
  public GOOGLE_PLAY_SERVICE_ACCOUNT_JSON: string | undefined;

  constructor() {
    this.NODE_ENV = process.env["NODE_ENV"];
    this.DATABASE_URL = process.env["DATABASE_URL"];
    this.JWT_TOKEN = process.env["JWT_TOKEN"];
    this.CLIENT_URL = process.env["CLIENT_URL"];
    const cookieDomain = process.env["COOKIE_DOMAIN"]?.trim();
    this.COOKIE_DOMAIN = cookieDomain === "" ? undefined : cookieDomain;
    this.SMTP_HOST = process.env["SMTP_HOST"];
    this.SMTP_PORT = process.env["SMTP_PORT"];
    this.SMTP_USER = process.env["SMTP_USER"];
    this.SMTP_PASS = process.env["SMTP_PASS"];
    this.EMAIL_TRANSPORT = process.env["EMAIL_TRANSPORT"];
    this.GOOGLE_MAPS_API_KEY = process.env["GOOGLE_MAPS_API_KEY"];
    this.RAZORPAY_KEY_ID = process.env["RAZORPAY_KEY_ID"];
    this.RAZORPAY_KEY_SECRET = process.env["RAZORPAY_KEY_SECRET"];
    this.GOOGLE_PLAY_PACKAGE_NAME = process.env["GOOGLE_PLAY_PACKAGE_NAME"];
    this.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON = process.env["GOOGLE_PLAY_SERVICE_ACCOUNT_JSON"];
  }
}

export const config: Config = new Config();
