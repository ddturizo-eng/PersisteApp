/** Exposition mode (REQ-05): stored so it survives step and lesson changes. */
export const EXPOSITION_STORAGE_KEY = "persisteapp.exposition";
/** When the current exposition started, for the elapsed-time counter. */
export const EXPOSITION_STARTED_KEY = "persisteapp.exposition.startedAt";

/** Inline <head> script: restores exposition mode before first paint. */
export const expositionInitScript = `(function(){try{if(localStorage.getItem("${EXPOSITION_STORAGE_KEY}")==="on"){document.documentElement.setAttribute("data-exposition","")}}catch(e){}})();`;

/** Formats elapsed milliseconds as m:ss, or h:mm:ss past one hour. */
export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}` : `${minutes}:${seconds}`;
}
