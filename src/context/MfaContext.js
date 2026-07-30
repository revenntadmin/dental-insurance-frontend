import { createContext, useContext, useMemo, useState } from 'react';

const MfaContext = createContext({
  flow: null,
  setFlow: () => { },
  clearFlow: () => { },
});

export function MfaProvider({ children }) {
  const [flow, setFlowState] = useState(null);

  const value = useMemo(
    () => ({
      flow,
      setFlow: (next) => setFlowState(next),
      clearFlow: () => setFlowState(null),
    }),
    [flow],
  );

  return <MfaContext.Provider value={value}>{children}</MfaContext.Provider>;
}

export function useMfa() {
  return useContext(MfaContext);
}
