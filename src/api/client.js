const API_URL = import.meta.env.VITE_API_URL || '';

function authHeaders() {
  const token = localStorage.getItem('tattooroom_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function customerAuthHeaders() {
  const token = localStorage.getItem('tr_customer_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function jsonHeaders(extra = {}) {
  return { 'Content-Type': 'application/json', ...extra };
}

async function handle(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'خطایی رخ داد، دوباره تلاش کنید.');
  }
  return data;
}

export const api = {
  // ---- public ----
  getProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${API_URL}/api/products${qs ? `?${qs}` : ''}`).then(handle);
  },
  getProduct: (id) => fetch(`${API_URL}/api/products/${id}`).then(handle),

  // ---- reviews ----
  getReviews: (productId) => fetch(`${API_URL}/api/products/${productId}/reviews`).then(handle),
  addReview: (productId, payload) =>
    fetch(`${API_URL}/api/products/${productId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(handle),
  likeReview: (productId, reviewId, voterId) =>
    fetch(`${API_URL}/api/products/${productId}/reviews/${reviewId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voterId }),
    }).then(handle),

  // ---- product wishlist-like ----
  likeProduct: (productId, voterId) =>
    fetch(`${API_URL}/api/products/${productId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voterId }),
    }).then(handle),

  // ---- loyalty points / customer profile ----
  buyIntent: (productId, payload) =>
    fetch(`${API_URL}/api/products/${productId}/buy-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(handle),
  identifyCustomer: (payload) =>
    fetch(`${API_URL}/api/customers/identify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(handle),
  getCustomer: (phone) => fetch(`${API_URL}/api/customers/${phone}`).then(handle),

  // ---- auth ----
  login: (username, password) =>
    fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }).then(handle),

  // ---- protected (dashboard) ----
  createProduct: (formData) =>
    fetch(`${API_URL}/api/products`, {
      method: 'POST',
      headers: authHeaders(),
      body: formData,
    }).then(handle),

  updateProduct: (id, formData) =>
    fetch(`${API_URL}/api/products/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: formData,
    }).then(handle),

  deleteProduct: (id) =>
    fetch(`${API_URL}/api/products/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }).then(handle),

  // ---- blog (public) ----
  getArticles: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${API_URL}/api/articles${qs ? `?${qs}` : ''}`).then(handle);
  },
  getArticle: (idOrSlug) => fetch(`${API_URL}/api/articles/${idOrSlug}`).then(handle),

  // ---- blog (dashboard) ----
  getAllArticles: () =>
    fetch(`${API_URL}/api/articles?all=1`, { headers: authHeaders() }).then(handle),
  getArticleAdmin: (idOrSlug) =>
    fetch(`${API_URL}/api/articles/${idOrSlug}`, { headers: authHeaders() }).then(handle),
  createArticle: (formData) =>
    fetch(`${API_URL}/api/articles`, {
      method: 'POST',
      headers: authHeaders(),
      body: formData,
    }).then(handle),
  updateArticle: (id, formData) =>
    fetch(`${API_URL}/api/articles/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: formData,
    }).then(handle),
  deleteArticle: (id) =>
    fetch(`${API_URL}/api/articles/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }).then(handle),
  uploadArticleImage: (file) => {
    const fd = new FormData();
    fd.append('image', file);
    return fetch(`${API_URL}/api/articles/upload-image`, {
      method: 'POST',
      headers: authHeaders(),
      body: fd,
    }).then(handle);
  },

  // ---- customer account (real login, separate from the anonymous loyalty flow) ----
  registerCustomer: (payload) =>
    fetch(`${API_URL}/api/customers/register`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(payload),
    }).then(handle),
  loginCustomer: (payload) =>
    fetch(`${API_URL}/api/customers/login`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(payload),
    }).then(handle),
  getMyProfile: () =>
    fetch(`${API_URL}/api/customers/me`, { headers: customerAuthHeaders() }).then(handle),
  updateMyProfile: (payload) =>
    fetch(`${API_URL}/api/customers/me`, {
      method: 'PUT',
      headers: jsonHeaders(customerAuthHeaders()),
      body: JSON.stringify(payload),
    }).then(handle),
  addMyAddress: (payload) =>
    fetch(`${API_URL}/api/customers/me/addresses`, {
      method: 'POST',
      headers: jsonHeaders(customerAuthHeaders()),
      body: JSON.stringify(payload),
    }).then(handle),
  deleteMyAddress: (addressId) =>
    fetch(`${API_URL}/api/customers/me/addresses/${addressId}`, {
      method: 'DELETE',
      headers: customerAuthHeaders(),
    }).then(handle),
  getMyWishlist: () =>
    fetch(`${API_URL}/api/customers/me/wishlist`, { headers: customerAuthHeaders() }).then(handle),

  // ---- cart (requires customer login) ----
  getCart: () => fetch(`${API_URL}/api/cart`, { headers: customerAuthHeaders() }).then(handle),
  addToCart: (productId, qty = 1) =>
    fetch(`${API_URL}/api/cart`, {
      method: 'POST',
      headers: jsonHeaders(customerAuthHeaders()),
      body: JSON.stringify({ productId, qty }),
    }).then(handle),
  setCartItemQty: (productId, qty) =>
    fetch(`${API_URL}/api/cart/${productId}`, {
      method: 'PUT',
      headers: jsonHeaders(customerAuthHeaders()),
      body: JSON.stringify({ qty }),
    }).then(handle),
  removeCartItem: (productId) =>
    fetch(`${API_URL}/api/cart/${productId}`, {
      method: 'DELETE',
      headers: customerAuthHeaders(),
    }).then(handle),
  clearCart: () =>
    fetch(`${API_URL}/api/cart`, { method: 'DELETE', headers: customerAuthHeaders() }).then(handle),

  // ---- orders ----
  checkout: (payload) =>
    fetch(`${API_URL}/api/orders`, {
      method: 'POST',
      headers: jsonHeaders(customerAuthHeaders()),
      body: JSON.stringify(payload),
    }).then(handle),
  getMyOrders: () => fetch(`${API_URL}/api/orders/me`, { headers: customerAuthHeaders() }).then(handle),
  getMyOrder: (id) => fetch(`${API_URL}/api/orders/me/${id}`, { headers: customerAuthHeaders() }).then(handle),

  // ---- orders (dashboard/admin) ----
  getAllOrders: () => fetch(`${API_URL}/api/orders`, { headers: authHeaders() }).then(handle),
  setOrderStatus: (id, status) =>
    fetch(`${API_URL}/api/orders/${id}/status`, {
      method: 'PUT',
      headers: jsonHeaders(authHeaders()),
      body: JSON.stringify({ status }),
    }).then(handle),
};

export function imageUrl(path) {
  if (!path) return '';
  return path.startsWith('http') ? path : `${API_URL}${path}`;
}
