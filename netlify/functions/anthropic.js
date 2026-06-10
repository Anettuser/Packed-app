/* Proxy az Anthropic Messages API-hoz.
   A kulcs SOHA nem kerül a böngészőbe — itt, szerveroldalon olvassuk env-ből.
   Állítsd be a Netlify-on: Site settings -> Environment variables -> ANTHROPIC_API_KEY */

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Hiányzik az ANTHROPIC_API_KEY környezeti változó." }),
    };
  }
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: event.body,
    });
    const text = await res.text();
    return {
      statusCode: res.status,
      headers: { "Content-Type": "application/json" },
      body: text,
    };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: String(e) }) };
  }
};
