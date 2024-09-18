import React, { createContext, useReducer, useContext } from 'react';

// Define the initial state
const initialState = { categoryID: '' };

// Create a reducer function
const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_CATEGORY_ID':
      return { ...state, categoryID: action.payload };
    default:
      return state;
  }
};

// Create a context
const CategoryIDContext = createContext();

// Create a provider component
export const CategoryIDProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <CategoryIDContext.Provider value={{ state, dispatch }}>{children}</CategoryIDContext.Provider>
  );
};

// Custom hook to use the context
export const useCategoryID = () => useContext(CategoryIDContext);
