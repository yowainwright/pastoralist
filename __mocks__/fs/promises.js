const mockFiles = {};

const readFile = jest.fn((path, encoding) => {
  if (mockFiles[path]) {
    return Promise.resolve(mockFiles[path]);
  } else {
    return Promise.reject(new Error(`File not found: ${path}`));
  }
});

const writeFile = jest.fn((path, data) => {
  mockFiles[path] = data;
  return Promise.resolve();
});

export { readFile, writeFile };
