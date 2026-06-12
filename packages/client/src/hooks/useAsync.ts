import { useState, useEffect, useCallback, useRef } from 'react';

type Idle = { status: 'idle' };
type Loading = { status: 'loading' };
type Success<T> = { status: 'success'; data: T };
type Failure = { status: 'error'; error: string };

export type AsyncState<T> = Idle | Loading | Success<T> | Failure;

export interface AsyncResult<T> {
  state: AsyncState<T>;
  reload: () => void;
}

export function useAsync<T>(
  fn: () => Promise<T>,
  deps: unknown[] = []
): AsyncResult<T> {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' });
  const runIdRef = useRef(0);

  const run = useCallback(() => {
    const id = ++runIdRef.current;
    setState({ status: 'loading' });
    fn()
      .then((data) => {
        if (runIdRef.current === id) {
          setState({ status: 'success', data });
        }
      })
      .catch((err: unknown) => {
        if (runIdRef.current === id) {
          setState({
            status: 'error',
            error: err instanceof Error ? err.message : String(err),
          });
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  return { state, reload: run };
}
