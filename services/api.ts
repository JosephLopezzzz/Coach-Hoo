import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ─── Base URL ─────────────────────────────────────────────────────────────────
// Change this to your machine's local IP when testing on a physical device.
// For Android emulator use: http://10.0.2.2:5000
// For iOS simulator  use:   http://localhost:5000
const BASE_URL = 'http://10.0.2.2:5000'; // Android emulator default

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor — attach Local User ID ──────────────────────────────
api.interceptors.request.use(async (config) => {
  try {
    const storedUser = await SecureStore.getItemAsync('coach_hoo_user_data');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.id) {
        config.headers['X-User-ID'] = user.id;
      }
    }
  } catch (_) {}
  return config;
});

// ─── Response Interceptor ───────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // No more 401 handling for tokens
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (payload: any) => api.post('/auth/register', payload),
  login:    (email: string, password: string) => api.post('/auth/login', { email, password }),
  me:       () => api.get('/auth/me'),
  update:   (payload: any) => api.patch('/auth/profile', payload),
};

// ─── Foods ────────────────────────────────────────────────────────────────────
export const foodsApi = {
  search:     (q: string, category?: string) =>
    api.get('/foods/search', { params: { q, category, limit: 30 } }),
  getById:    (id: string) => api.get(`/foods/${id}`),
  categories: () => api.get('/foods/categories'),
  create:     (payload: any) => api.post('/foods', payload),
};

// ─── Recipes ──────────────────────────────────────────────────────────────────
export const recipesApi = {
  list:     (country?: string, meal_type?: string) =>
    api.get('/recipes', { params: { country, meal_type, limit: 30 } }),
  search:   (q: string) => api.get('/recipes/search', { params: { q } }),
  getById:  (id: string) => api.get(`/recipes/${id}`),
};

// ─── Meals ────────────────────────────────────────────────────────────────────
export const mealsApi = {
  log:    (payload: { meal_type: string; items: any[]; notes?: string; logged_date?: string }) =>
    api.post('/meals/log', payload),
  today:  (date?: string) => api.get('/meals/today', { params: { date } }),
  delete: (id: string) => api.delete(`/meals/${id}`),
};

// ─── Calculate ────────────────────────────────────────────────────────────────
export const calculateApi = {
  macros: (items: any[]) => api.post('/calculate/macros', { items }),
};

// ─── Recommend ────────────────────────────────────────────────────────────────
export const recommendApi = {
  meals:      (meal_type?: string, quantity?: number) =>
    api.get('/recommend/meals', { params: { meal_type, quantity } }),
  restaurant: (restaurant?: string) =>
    api.get('/recommend/restaurant', { params: { restaurant } }),
};

export default api;
