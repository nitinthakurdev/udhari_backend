import { config } from "@/config/envConfig";
import { findUserByUsername } from "@/services/userServices";
import type http from "http";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { Server, type Socket } from "socket.io";

export type NotificationType =
  | "connection.requested"
  | "connection.responded"
  | "transition.created"
  | "transition.updated"
  | "transition.cancelled"
  | "transition.payment_received";

export interface RealtimeNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  created_at: string;
  data?: Record<string, string | number | boolean | null>;
}

type NotificationInput = Omit<RealtimeNotification, "id" | "created_at">;

interface AccessTokenPayload extends JwtPayload {
  username: string;
}

interface ClientToServerEvents {
  "notification:ack": (notificationId: string) => void;
}

interface ServerToClientEvents {
  notification: (notification: RealtimeNotification) => void;
}

interface InterServerEvents {
  ping: () => void;
}

interface SocketData {
  userId: number;
}

type AuthenticatedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

let socketServer:
  Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> | undefined;

const isAccessTokenPayload = (payload: string | JwtPayload): payload is AccessTokenPayload =>
  typeof payload !== "string" && typeof payload["username"] === "string";

const getAccessToken = (socket: AuthenticatedSocket): string | undefined => {
  const auth = socket.handshake.auth as Record<string, unknown>;
  const authToken = auth["token"];
  if (typeof authToken === "string" && authToken.trim()) return authToken.trim();

  const authorization = socket.handshake.headers.authorization;
  if (typeof authorization !== "string") return undefined;
  const [scheme, token] = authorization.split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : undefined;
};

const authenticateSocket = async (socket: AuthenticatedSocket): Promise<void> => {
  const accessToken = getAccessToken(socket);
  if (!accessToken || !config.JWT_TOKEN) throw new Error("Authentication required");

  const payload = jwt.verify(accessToken, config.JWT_TOKEN);
  if (!isAccessTokenPayload(payload)) throw new Error("Invalid access token");

  const user = await findUserByUsername(payload.username);
  if (!user) throw new Error("User not found");
  socket.data.userId = user.id;
};

const userRoom = (userId: number) => `user:${String(userId)}`;

export const initializeSocket = (server: http.Server): void => {
  socketServer = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(server, {
    cors: {
      origin: config.CLIENT_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  socketServer.use((socket, next) => {
    void authenticateSocket(socket)
      .then(() => {
        next();
      })
      .catch(() => {
        next(new Error("Authentication failed"));
      });
  });

  socketServer.on("connection", (socket) => {
    void socket.join(userRoom(socket.data.userId));
  });
};

export const notifyUsers = (
  userIds: readonly (number | null | undefined)[],
  notification: NotificationInput,
): void => {
  if (!socketServer) return;

  const payload: RealtimeNotification = {
    ...notification,
    id: randomUUID(),
    created_at: new Date().toISOString(),
  };

  const uniqueUserIds = new Set(
    userIds.filter((userId): userId is number => Number.isInteger(userId) && Number(userId) > 0),
  );
  uniqueUserIds.forEach((userId) => {
    socketServer?.to(userRoom(userId)).emit("notification", payload);
  });
};
