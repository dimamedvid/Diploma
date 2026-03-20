import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as authApi from "../services/authService";

/**
 * Ключ для збереження JWT-токена в localStorage.
 *
 * @constant {string}
 */
const TOKEN_KEY = "token";

/**
 * Ключ для збереження даних користувача в localStorage.
 *
 * @constant {string}
 */
const USER_KEY = "user";

/**
 * Формує початковий стан модуля авторизації.
 *
 * Функція зчитує токен і дані користувача з localStorage,
 * відновлює сесію після перезавантаження сторінки
 * та повертає початковий стан Redux slice.
 *
 * Якщо дані користувача в localStorage пошкоджені
 * або не можуть бути розібрані як JSON, значення `user`
 * встановлюється в `null`.
 *
 * @returns {{
 *   token: string | null,
 *   user: Object | null,
 *   isLoggedIn: boolean,
 *   status: string,
 *   error: string | null
 * }} Початковий стан модуля авторизації.
 */
function loadInitialState() {
  const token = localStorage.getItem(TOKEN_KEY);
  const rawUser = localStorage.getItem(USER_KEY);
  let user = null;

  try {
    user = rawUser ? JSON.parse(rawUser) : null;
  } catch {
    user = null;
  }

  return {
    token: token || null,
    user,
    isLoggedIn: !!token,
    status: "idle",
    error: null,
  };
}

/**
 * Асинхронна дія для реєстрації нового користувача.
 *
 * Викликає API-метод `authApi.register`, а у випадку помилки
 * повертає текст помилки через `rejectWithValue`.
 *
 * @async
 * @function registerUser
 * @param {Object} payload - Дані користувача для реєстрації.
 * @param {string} payload.login - Логін користувача.
 * @param {string} payload.firstName - Ім'я користувача.
 * @param {string} payload.lastName - Прізвище користувача.
 * @param {string} payload.email - Email користувача.
 * @param {string} payload.password - Пароль користувача.
 * @returns {Promise<Object>} Об'єкт з токеном і даними користувача.
 */
export const registerUser = createAsyncThunk(
  "auth/register",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await authApi.register(payload);
      return data;
    } catch (e) {
      return rejectWithValue(e.message || "Register failed");
    }
  },
);

/**
 * Асинхронна дія для входу користувача в систему.
 *
 * Викликає API-метод `authApi.login`, а у випадку помилки
 * повертає текст помилки через `rejectWithValue`.
 *
 * @async
 * @function loginUser
 * @param {Object} payload - Облікові дані користувача.
 * @param {string} payload.login - Логін або email користувача.
 * @param {string} payload.password - Пароль користувача.
 * @returns {Promise<Object>} Об'єкт з токеном і даними користувача.
 */
export const loginUser = createAsyncThunk(
  "auth/login",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await authApi.login(payload);
      return data;
    } catch (e) {
      return rejectWithValue(e.message || "Login failed");
    }
  },
);

/**
 * Асинхронна дія для отримання даних поточного користувача.
 *
 * Отримує токен зі стану Redux, викликає API-метод `authApi.me`
 * і повертає об'єкт користувача. Якщо токен відсутній
 * або сервер повернув помилку, дія завершується зі статусом rejected.
 *
 * @async
 * @function fetchMe
 * @returns {Promise<Object>} Дані поточного авторизованого користувача.
 */
export const fetchMe = createAsyncThunk(
  "auth/me",
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue("No token");
      }
      const data = await authApi.me(token);
      return data.user;
    } catch (e) {
      return rejectWithValue(e.message || "Unauthorized");
    }
  },
);

/**
 * Redux slice для керування станом авторизації користувача.
 *
 * Slice відповідає за:
 * - збереження токена і даних користувача;
 * - відновлення сесії з localStorage;
 * - обробку станів асинхронних запитів авторизації;
 * - очищення помилок;
 * - вихід користувача із системи.
 */
const authSlice = createSlice({
  name: "auth",
  initialState: loadInitialState(),
  reducers: {
    /**
     * Виконує вихід користувача із системи.
     *
     * Очищає стан авторизації в Redux store
     * та видаляє токен і дані користувача з localStorage.
     *
     * @param {Object} state - Поточний стан slice.
     * @returns {void}
     */
    logout(state) {
      state.token = null;
      state.user = null;
      state.isLoggedIn = false;
      state.status = "idle";
      state.error = null;

      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    },

    /**
     * Очищає поточне повідомлення про помилку авторизації.
     *
     * Використовується під час повторного введення даних
     * у формах входу або реєстрації.
     *
     * @param {Object} state - Поточний стан slice.
     * @returns {void}
     */
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    /**
     * Переводить стан авторизації у режим виконання запиту.
     *
     * @param {Object} state - Поточний стан slice.
     * @returns {void}
     */
    const startLoading = (state) => {
      state.status = "loading";
      state.error = null;
    };

    /**
     * Оновлює стан після успішної авторизації або реєстрації.
     *
     * Зберігає токен і дані користувача в Redux store
     * та дублює їх у localStorage для відновлення сесії.
     *
     * @param {Object} state - Поточний стан slice.
     * @param {Object} action - Redux action з даними користувача.
     * @param {Object} action.payload - Дані відповіді сервера.
     * @param {string} action.payload.token - JWT-токен доступу.
     * @param {Object} action.payload.user - Дані користувача.
     * @returns {void}
     */
    const setAuth = (state, action) => {
      state.status = "succeeded";
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isLoggedIn = true;

      localStorage.setItem(TOKEN_KEY, action.payload.token);
      localStorage.setItem(USER_KEY, JSON.stringify(action.payload.user));
    };

    /**
     * Зберігає повідомлення про помилку в стані slice.
     *
     * @param {Object} state - Поточний стан slice.
     * @param {Object} action - Redux action з текстом помилки.
     * @returns {void}
     */
    const setError = (state, action) => {
      state.status = "failed";
      state.error = action.payload || "Error";
    };

    builder
      .addCase(registerUser.pending, startLoading)
      .addCase(registerUser.fulfilled, setAuth)
      .addCase(registerUser.rejected, (state, action) => setError(state, action))

      .addCase(loginUser.pending, startLoading)
      .addCase(loginUser.fulfilled, setAuth)
      .addCase(loginUser.rejected, (state, action) => setError(state, action))

      .addCase(fetchMe.pending, startLoading)
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
        state.isLoggedIn = true;
      })
      .addCase(fetchMe.rejected, (state, action) => setError(state, action));
  },
});

/**
 * Дії модуля авторизації.
 *
 * @type {{logout: Function, clearAuthError: Function}}
 */
export const { logout, clearAuthError } = authSlice.actions;

/**
 * Reducer модуля авторизації.
 *
 * @type {Function}
 */
export default authSlice.reducer;