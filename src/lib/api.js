export async function fetchCharts(category) {
  const url = category ? `/api/charts?category=${encodeURIComponent(category)}` : '/api/charts';
  const res = await fetch(url);
  if (!res.ok) throw new Error(`charts request failed: ${res.status}`);
  return res.json();
}

export async function fetchHistoryDates() {
  const res = await fetch('/api/history');
  if (!res.ok) throw new Error(`history request failed: ${res.status}`);
  return res.json();
}

export async function fetchSnapshot(date) {
  const res = await fetch(`/api/history?date=${encodeURIComponent(date)}`);
  if (!res.ok) throw new Error(`history request failed: ${res.status}`);
  return res.json();
}

export async function fetchItemHistory(id, days = 30) {
  const res = await fetch(`/api/history?id=${encodeURIComponent(id)}&days=${days}`);
  if (!res.ok) throw new Error(`history request failed: ${res.status}`);
  return res.json();
}
