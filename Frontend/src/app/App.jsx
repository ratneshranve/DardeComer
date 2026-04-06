import { useState, useEffect } from "react";
import AppRoutes from "./routes";
import Splash from "@/Splash";

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  return loading ? <Splash /> : <AppRoutes />;
}

export default App;