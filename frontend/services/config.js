(() => {
  // Single source of truth for frontend API base URL.
  // Set to a full URL only if frontend and API are hosted on different origins.
  const API_BASE_URL = "";
  const apiBase = API_BASE_URL.trim().replace(/\/+$/, "");

  window.APP_CONFIG = {
    API_BASE_URL: apiBase,
  };

  window.getApiUrl = (path = "") => {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${window.APP_CONFIG.API_BASE_URL}${normalizedPath}`;
  };
})();
