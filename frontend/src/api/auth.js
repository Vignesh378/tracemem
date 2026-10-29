import axios from "axios";

const auth = axios.create({
  baseURL: import.meta.env.VITE_AUTH_BASE,
  withCredentials: true
});

export const register = (data) => auth.post("/auth/register", data);
export const login = (data) => auth.post("/auth/login", data);
export const logout = () => auth.post("/auth/logout");
export const profile = () => auth.get("/auth/profile");