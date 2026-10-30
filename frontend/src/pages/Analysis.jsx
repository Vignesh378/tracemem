import { useEffect, useState } from "react";
import { runAnalysis, getAnalysis } from "../api/analysis";
import { getApiErrorMessage } from "../api/apiError";
import ResultsTable from "../components/ResultsTable";

export default function Analysis() {
  const [query, setQuery] = useState("my final year research is about memorization");
  const [modelFile, setModelFile] = useState(null);
  const [datasetFile, setDatasetFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState("");
  const [status, setStatus] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [loading]);

  const pollJob = async (id) => {
    try {
      const res = await getAnalysis(id);
      const st = res.data.status;
      setStatus(st);

      if (st === "completed") {
        setResult(res.data);
        setLoading(false);
        return;
      }
      if (st === "failed") {
        setError(res.data.error || "Analysis failed");
        setLoading(false);
        return;
      }
      setTimeout(() => pollJob(id), 2000);
    } catch (err) {
      setError(getApiErrorMessage(err, "analysis", "VITE_ANALYSIS_BASE"));
      setLoading(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setJobId("");
    setStatus("");
    setSeconds(0);

    if (!query || !modelFile || !datasetFile) {
      setError("Query, model file, and dataset file are required.");
      return;
    }

    const formData = new FormData();
    formData.append("query", query);
    formData.append("model", modelFile);
    formData.append("dataset", datasetFile);

    try {
      setLoading(true);
      const res = await runAnalysis(formData);
      const id = res.data.jobId;
      setJobId(id);
      setStatus(res.data.status || "queued");
      pollJob(id);
    } catch (err) {
      setError(getApiErrorMessage(err, "analysis", "VITE_ANALYSIS_BASE"));
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">TraceMem Analysis</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Upload model and dataset, then attribute the query to influential training examples.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-lg border border-zinc-200 bg-white p-5">
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600">Query</span>
          <textarea
            rows={3}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-600">Model file</span>
            <input
              type="file"
              className="block w-full text-sm"
              onChange={(e) => setModelFile(e.target.files?.[0] || null)}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-600">Dataset file</span>
            <input
              type="file"
              className="block w-full text-sm"
              onChange={(e) => setDatasetFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>

        <button
          disabled={loading}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {loading ? "Running analysis..." : "Run Analysis"}
        </button>
      </form>

      {(jobId || status || error) && (
        <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-4 text-sm">
          {jobId && <p><span className="text-zinc-500">Job ID:</span> {jobId}</p>}
          {status && <p><span className="text-zinc-500">Status:</span> {status}</p>}
          {loading && <p><span className="text-zinc-500">Elapsed:</span> {seconds}s</p>}
          {error && <p className="mt-1 text-red-600">{error}</p>}
        </div>
      )}

      {result?.result?.top_k && <ResultsTable items={result.result.top_k} />}

      {(result?.modelKey || result?.datasetKey) && (
        <div className="mt-4 text-xs text-zinc-500">
          {result.modelKey && <p>Model S3: {result.modelKey}</p>}
          {result.datasetKey && <p>Dataset S3: {result.datasetKey}</p>}
        </div>
      )}
    </div>
  );
}