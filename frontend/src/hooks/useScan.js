import { useContext } from "react";
import ScanContext from "../context/ScanContext";

export const useScan = () => {
  const context = useContext(ScanContext);

  if(!context) {
    throw Error('useScan context must be used inside the Scan context provider');
  }

  return context;
}

export default useScan;