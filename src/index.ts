import express from "express";
import { Start } from "./server";

const initServer = () => {
  const app = express();
  Start(app);
};

initServer();
