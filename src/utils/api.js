export async function apiRequest(path, options) {
  const requestOptions = { ...options };
  const headers = { ...requestOptions.headers };
  const token = sessionStorage.getItem("adminToken");
  if (token) headers.Authorization = `Bearer ${token}`;
  if (requestOptions.body && !(requestOptions.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    requestOptions.body = JSON.stringify(requestOptions.body);
  }
  requestOptions.headers = headers;

  const response = await fetch(`/api${path}`, requestOptions);
  if (response.status === 204) return null;

  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "The request failed.");
  return result;
}

export async function uploadFile(path, file, fields) {
  const body = new FormData();
  body.append("file", file);
  Object.entries(fields || {}).forEach(([key, value]) => body.append(key, value));
  return apiRequest(path, { method: "POST", body });
}
