import { api } from "./client";
import type { User } from "../types/models";

export const authApi = {
  login: (username: string, password: string) =>
    api.post<{ user: User }>("/auth/login", { username, password }),
  logout: () => api.post<void>("/auth/logout"),
  me: () => api.get<{ user: User }>("/auth/me"), // 401 when there is no valid session
};
