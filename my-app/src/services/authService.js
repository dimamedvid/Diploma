const API = "http://localhost:4000/api";

async function parse(r) {
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

export async function register(payload) {
  const r = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parse(r);
}

export async function login(payload) {
  const r = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parse(r);
}

export async function me(token) {
  const r = await fetch(`${API}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parse(r);
}
