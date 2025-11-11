import axios from "axios";
import { BASE_URL } from "./config";


// create axios instance
const api = axios.create({
  baseURL: BASE_URL, 
});

// attach token to every request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
