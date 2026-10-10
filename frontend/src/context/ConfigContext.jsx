import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

const ConfigContext = createContext(null);

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(null);

  const refresh = async () => {
    try {
      const { data } = await api.get("/config");
      setConfig(data);
    } catch (e) {
      setConfig({
        settings: { announcement_enabled: false, prelaunch_mode: true, checkout_enabled: false, policies: {} },
        business: { whatsapp: "919675334567", phone: "9675334567" },
      });
    }
  };

  useEffect(() => { refresh(); }, []);

  return (
    <ConfigContext.Provider value={{ config, refresh }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  return useContext(ConfigContext);
}
