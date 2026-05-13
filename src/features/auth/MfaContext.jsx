import { createContext, useContext, useState, useMemo } from 'react';

const MfaContext = createContext({
  flow: null,
  set_flow: () => {},
  clear: () => {},
});

export function MfaProvider({ children }) {
  const [flow, set_flow_state] = useState(null);

  const value = useMemo(
    () => ({
      flow,
      set_flow: (next) => set_flow_state(next),
      clear: () => set_flow_state(null),
    }),
    [flow],
  );

  return <MfaContext.Provider value={value}>{children}</MfaContext.Provider>;
}

export function useMfa() {
  return useContext(MfaContext);
}
