const randomInteger = (minimum: number, maximum: number): number =>
  Math.floor(Math.random() * (maximum - minimum + 1) + minimum);
  
const createAbortError = () => {
  const error = new Error('Delay aborted');
  error.name = 'AbortError';
  return error;
};

interface Options {
  value: any;
  signal: AbortSignal;
}

const createDelay = ({
  clearTimout: defaultClear,
  setTimeout: set,
  willResolve,
}: any) => (ms: number, options?: Options) => {
  if (options?.signal && options.signal.aborted) {
    return Promise.reject(createAbortError());
  }

  let timeoutId: any;
  let settle: any;
  let rejectFn: any;
  const clear = defaultClear || clearTimeout;
  
  const signalListener = () => {
    clear(timeoutId);
    rejectFn(createAbortError());
  };
  
  const cleanup = () => {
    if (options?.signal) {
      options?.signal.removeEventListener('abort', signalListener);
    }
  };
  
  let delayPromise: any;

  delayPromise = new Promise((resolve, reject) => {
    settle = () => {
      cleanup();
      if (willResolve) {
        resolve(options?.value);
      } else {
        reject(options?.value);
      }
    };

    rejectFn = reject;
    timeoutId = (set || setTimeout)(settle, ms);
  });

  if (options?.signal) {
    options?.signal.addEventListener('abort', signalListener, {once: true});
  }
  
  delayPromise.clear = () => {
    clear(timeoutId);
    timeoutId = null;
    settle();
  };

  return delayPromise;
};

export let delay: any;

delay = createDelay({ willResolve: true });
delay.reject = createDelay({ willResolve: false });
delay.range = (minimum: number, maximum: number, options: any) =>
  delay(randomInteger(minimum, maximum), options);
delay.createWithTimers = ({ clearTimeout, setTimeout }: any) => {
  delay = createDelay({ clearTimeout, setTimeout, willResolve: true });
  delay.reject = createDelay({ clearTimeout, setTimeout, willResolve: false });
  return delay;
};
