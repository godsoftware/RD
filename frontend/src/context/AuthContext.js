import React, { createContext, useContext, useReducer } from 'react';

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: false,
  error: null
};

// Auth context
const AuthContext = createContext();

// Auth actions
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        loading: true,
        error: null
      };
      
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        loading: false,
        user: action.payload.user,
        token: action.payload.token,
        error: null
      };
      
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        loading: false,
        user: null,
        token: null,
        error: action.payload.error
      };
      
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        error: null
      };
      
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: action.payload.user
      };
      
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
      
    default:
      return state;
  }
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Login function
  const login = (user, token) => {
    localStorage.setItem('token', token);
    dispatch({
      type: AUTH_ACTIONS.LOGIN_SUCCESS,
      payload: { user, token }
    });
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  };

  // Update user function
  const updateUser = (user) => {
    dispatch({
      type: AUTH_ACTIONS.UPDATE_USER,
      payload: { user }
    });
  };

  // Start login process
  const startLogin = () => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
  };

  // Login failure
  const loginFailure = (error) => {
    localStorage.removeItem('token');
    dispatch({
      type: AUTH_ACTIONS.LOGIN_FAILURE,
      payload: { error }
    });
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Context value
  const value = {
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    login,
    logout,
    updateUser,
    startLogin,
    loginFailure,
    clearError,
    isAuthenticated: !!state.user && !!state.token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;
