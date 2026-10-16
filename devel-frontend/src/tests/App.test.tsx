import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../components/layout/App';

// Plain functions (not jest.fn) because CRA's Jest config sets resetMocks: true,
// which would wipe jest.fn implementations created in this factory before each test.
jest.mock('../services/authentication/msalConfig', () => ({
  msalInstance: {
    initialize: () => Promise.resolve(),
    handleRedirectPromise: () => Promise.resolve(null),
    getAllAccounts: () => [],
    loginPopup: () => Promise.resolve(),
    loginRedirect: () => Promise.resolve(),
    logoutRedirect: () => Promise.resolve(),
  },
}));

const API_BASE_URL = 'https://api.example.test/api';
const originalApiBaseUrl = process.env.REACT_APP_API_BASE_URL;
const originalFetch = global.fetch;

const mockFetch = (impl: () => Promise<unknown>) => {
  const fetchMock = jest.fn(impl);
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
};

beforeEach(() => {
  process.env.REACT_APP_API_BASE_URL = API_BASE_URL;
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  if (originalApiBaseUrl === undefined) {
    delete process.env.REACT_APP_API_BASE_URL;
  } else {
    process.env.REACT_APP_API_BASE_URL = originalApiBaseUrl;
  }
  global.fetch = originalFetch;
  jest.restoreAllMocks();
});

test('renders the message area, fetch button and login button', () => {
  render(<App />);

  expect(screen.getByText('Message from backend:')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Click This' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
});

test('does not call the API until the button is clicked', () => {
  const fetchMock = mockFetch(() => Promise.resolve({ json: () => Promise.resolve({}) }));

  render(<App />);

  expect(fetchMock).not.toHaveBeenCalled();
});

test('fetches the message from the API and displays it', async () => {
  const fetchMock = mockFetch(() =>
    Promise.resolve({ json: () => Promise.resolve({ message: 'hello from the api' }) })
  );

  render(<App />);
  userEvent.click(screen.getByRole('button', { name: 'Click This' }));

  expect(await screen.findByText('Message from backend: hello from the api')).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/message`);
});

test('logs the error and keeps rendering when the API call fails', async () => {
  const error = new Error('network down');
  mockFetch(() => Promise.reject(error));
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

  render(<App />);
  userEvent.click(screen.getByRole('button', { name: 'Click This' }));

  await waitFor(() => expect(consoleError).toHaveBeenCalledWith('There was an error!', error));
  expect(screen.getByText('Message from backend:')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Click This' })).toBeInTheDocument();
});
