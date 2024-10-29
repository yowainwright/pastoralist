const pLimit = jest.fn(() => (fn) => fn()); // Just execute the function directly

export default pLimit;
