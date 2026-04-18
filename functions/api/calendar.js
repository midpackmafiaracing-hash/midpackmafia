export async function onRequestGet() {
  const url = "https://calendar.google.com/calendar/ical/midpackmafiaracing%40gmail.com/public/basic.ics";

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mid-Pack-Mafia-Calendar"
      }
    });

    if (!response.ok) {
      return new Response(`Failed to fetch calendar feed (${response.status})`, {
        status: response.status,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store"
        }
      });
    }

    const text = await response.text();

    return new Response(text, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=300"
      }
    });
  } catch (error) {
    return new Response("Failed to fetch calendar", {
      status: 500,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store"
      }
    });
  }
}
