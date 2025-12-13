import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as authApi from "../services/authService";

const TOKEN_KEY = "token";
const USER_KEY = "user";

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

export const registerUser = createAsyncThunk(
  "auth/register",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await authApi.register(payload);
      return data;
    } catch (e) {
      return rejectWithValue(e.message || "Register failed");
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await authApi.login(payload);
      return data;
    } catch (e) {
      return rejectWithValue(e.message || "Login failed");
    }
  }
);

export const fetchMe = createAsyncThunk(
  "auth/me",
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) return rejectWithValue("No token");
      const data = await authApi.me(token);
      return data.user;
    } catch (e) {
      return rejectWithValue(e.message || "Unauthorized");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: loadInitialState(),
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      state.isLoggedIn = false;
      state.status = "idle";
      state.error = null;

      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const startLoading = (state) => {
      state.status = "loading";
      state.error = null;
    };

    const setAuth = (state, action) => {
      state.status = "succeeded";
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isLoggedIn = true;

      localStorage.setItem(TOKEN_KEY, action.payload.token);
      localStorage.setItem(USER_KEY, JSON.stringify(action.payload.user));
    };

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

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
