import React, { createContext, useState, useContext } from 'react';

const InferenceResultsContext = createContext();

export const InferenceResultsProvider = ({ children }) => {
  const [inferenceResults, setInferenceResults] = useState([]);

  const updateInferenceResults = (newInferenceResults) => {
    setInferenceResults(newInferenceResults);
  };

  return (
    <InferenceResultsContext.Provider value={{ inferenceResults, updateInferenceResults }}>
      {children}
    </InferenceResultsContext.Provider>
  );
};

export const useInferenceResults = () => {
  return useContext(InferenceResultsContext);
};
