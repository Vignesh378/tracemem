import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

// ESM replacement for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Calls the Python TraceMem core pipeline
 */
export async function runCorePipeline({
  modelPath,
  datasetPath,
  query,
  maxExamples = Number(process.env.MAX_EXAMPLES || 500)
}) {
  return new Promise((resolve, reject) => {
    const pythonPath = process.env.PYTHON_PATH || "python";

    const scriptPath = path.resolve(
      process.env.CORE_SCRIPT_PATH ||
        path.join(__dirname, "../../../core-service/scripts/run_pipeline.py")
    );

    const args = [
      scriptPath,
      "--model", modelPath,
      "--dataset", datasetPath,
      "--query", query,
      "--max_examples", String(maxExamples)
    ];

    const child = spawn(pythonPath, args, {
      cwd: path.resolve(
        process.env.CORE_WORKDIR ||
          path.join(__dirname, "../../../core-service")
      )
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("error", (err) => {
      reject(new Error(`Failed to start TraceMem core: ${err.message}`));
    });

    child.on("close", (code) => {
      if (code !== 0) {
        return reject(
          new Error(stderr || `TraceMem core exited with code ${code}`)
        );
      }

      try {
        const startMarker = "===TRACE_MEM_JSON_START===";
        const endMarker = "===TRACE_MEM_JSON_END===";

        const start = stdout.indexOf(startMarker);
        const end = stdout.indexOf(endMarker);

        if (start !== -1 && end !== -1 && end > start) {
          const jsonText = stdout
            .slice(start + startMarker.length, end)
            .trim();

          const parsed = JSON.parse(jsonText);
          return resolve(parsed);
        }

        return reject(new Error("TraceMem JSON markers not found in output"));
      } catch (err) {
        return reject(
          new Error(
            `Failed to parse TraceMem JSON: ${err.message}\n\n${stdout}`
          )
        );
      }
    });
  });
}