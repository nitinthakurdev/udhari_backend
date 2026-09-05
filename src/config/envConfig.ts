import dotenv from "dotenv";
dotenv.config();

function parseClientUrls(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  const trimmedValue = value.trim();

  if (trimmedValue.startsWith("[")) {
    const parsedValue: unknown = JSON.parse(trimmedValue);

    if (
      !Array.isArray(parsedValue) ||
      !parsedValue.every((url): url is string => typeof url === "string")
    ) {
      throw new Error("CLIENT_URL must be an array of strings");
    }

    return parsedValue.map((url) => url.trim()).filter(Boolean);
  }

  return trimmedValue
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);
}

class Config {
  public NODE_ENV: string | undefined;
  public DATABASE_URL: string | undefined;
  public JWT_TOKEN: string | undefined;
  public CLIENT_URL: string[];

  constructor() {
    this.NODE_ENV = process.env["NODE_ENV"];
    this.DATABASE_URL = process.env["DATABASE_URL"];
    this.JWT_TOKEN = process.env["JWT_TOKEN"];
    this.CLIENT_URL = parseClientUrls(process.env["CLIENT_URL"]);
  }
}

export const config: Config = new Config();
