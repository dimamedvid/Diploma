import { createSlice } from "@reduxjs/toolkit";

const AUTH_STORAGE_KEY = "auth";

function loadAuthState() {
  try {
    const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);

    if (!savedAuth) {
      return {
        user: null,
        token: null,
      };
    }

    const parsedAuth = JSON.parse(savedAuth);

    return {
      user: parsedAuth.user || null,
      token: parsedAuth.token || null,
    };
  } catch {
    return {
      user: null,
      token: null,
    };
  }
}

function saveAuthState(state) {
  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      user: state.user,
      token: state.token,
    }),
  );
}

function clearAuthState() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

const initialState = loadAuthState();

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action) {
      state.user = action.payload.user;
      state.token = action.payload.token;

      saveAuthState(state);
    },

    logout(state) {
      state.user = null;
      state.token = null;

      clearAuthState();
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;

export default authSlice.reducer;