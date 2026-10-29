import axios from "axios";

const analysis = axios.create({
  baseURL: import.meta.env.VITE_ANALYSIS_BASE,
  withCredentials: true
});

export const runAnalysis = (formData) =>
  analysis.post("/analysis/run", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });

export const getAnalysis = (jobId) => analysis.get(`/analysis/${jobId}`);