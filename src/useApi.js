import { useEffect, useState } from "react";

export function useApi(fetcher) {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    fetcher()
      .then((data) => !cancelled && setState({ data, loading: false, error: null }))
      .catch((error) => !cancelled && setState({ data: null, loading: false, error }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}
