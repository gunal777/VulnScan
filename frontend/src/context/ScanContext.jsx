import { createContext, useState} from "react";

const ScanContext = createContext();

export const ScanProvider = ({ children }) => {
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  return (
    <ScanContext.Provider value={{
      searchResults,
      setSearchResults,
      loading,
      setLoading
    }}>
      { children }
    </ScanContext.Provider>
  );
}

export default ScanContext;