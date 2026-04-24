const STORAGE_KEY = "results-data-v1";

const DEFAULT_DATA = {
  events: [
    {
      sim: "iRacing",
      series: "GT3",
      eventName: "Road Atlanta Sprint",
      round: 5,
      duration: "45 Minutes",
      fullResults: [
        { position: 1, driver: "J. Walker", carNum: "12", car: "Porsche 911 GT3", totalLaps: 28, bestLap: "1:22.845", totalTime: "45:13.300", dnf: false, dns: false },
        { position: 2, driver: "M. Davis", carNum: "77", car: "BMW M4 GT3", totalLaps: 28, bestLap: "1:23.101", totalTime: "45:19.902", dnf: false, dns: false },
        { position: 3, driver: "R. Payne", carNum: "22", car: "Ferrari 296 GT3", totalLaps: 28, bestLap: "1:23.442", totalTime: "45:24.980", dnf: false, dns: false }
      ]
    }
  ]
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store"
    }
  });
}

function normalizeData(data) {
  if (!data || !Array.isArray(data.events)) {
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }

  return {
    events: data.events.map((event) => ({
      sim: String(event.sim || "").trim(),
      series: String(event.series || "").trim(),
      eventName: String(event.eventName || "").trim(),
      round: Number.isFinite(Number(event.round)) ? Number(event.round) : 1,
      duration: String(event.duration || "").trim(),
      fullResults: Array.isArray(event.fullResults)
        ? event.fullResults.map((row) => ({
          position: Number.isFinite(Number(row.position)) ? Number(row.position) : 0,
          driver: String(row.driver || "").trim(),
          carNum: String(row.carNum || "").trim(),
          car: String(row.car || "").trim(),
          totalLaps: row.totalLaps ?? "",
          bestLap: row.bestLap ?? "",
          totalTime: row.totalTime ?? "",
          dnf: Boolean(row.dnf),
          dns: Boolean(row.dns)
        })).filter((row) => row.position > 0 && row.driver)
        : []
    }))
  };
}

async function loadData(env) {
  const raw = await env.RESULTS_KV.get(STORAGE_KEY, "json");
  if (!raw) return JSON.parse(JSON.stringify(DEFAULT_DATA));
  return normalizeData(raw);
}

async function saveData(env, data) {
  const normalized = normalizeData(data);
  await env.RESULTS_KV.put(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

export async function onRequestGet(context) {
  const { env } = context;
  if (!env.RESULTS_KV) {
    return jsonResponse({ error: "Missing RESULTS_KV binding in Cloudflare config." }, 500);
  }

  try {
    const data = await loadData(env);
    return jsonResponse(data, 200);
  } catch (error) {
    return jsonResponse({ error: "Failed to load results data." }, 500);
  }
}

export async function onRequestPost(context) {
  const { env, request } = context;
  if (!env.RESULTS_KV) {
    return jsonResponse({ error: "Missing RESULTS_KV binding in Cloudflare config." }, 500);
  }

  try {
    const body = await request.json();
    const data = normalizeData(body);
    const saved = await saveData(env, data);
    return jsonResponse(saved, 200);
  } catch (error) {
    return jsonResponse({ error: "Invalid JSON payload." }, 400);
  }
}

export async function onRequestDelete(context) {
  const { env } = context;
  if (!env.RESULTS_KV) {
    return jsonResponse({ error: "Missing RESULTS_KV binding in Cloudflare config." }, 500);
  }

  try {
    await saveData(env, DEFAULT_DATA);
    return jsonResponse({ ok: true }, 200);
  } catch (error) {
    return jsonResponse({ error: "Failed to reset results data." }, 500);
  }
}
