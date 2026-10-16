import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../components/layout/App';

vi.mock('../services/authentication/msalConfig', () => ({
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

const mockFetch = (impl: () => Promise<unknown>) => {
  const fetchMock = vi.fn(impl);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

// Env stubs, global stubs and spies are undone after each test (see vite.config.ts).
beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', API_BASE_URL);
  vi.spyOn(console, 'log').mockImplementation(() => {});
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
  const user = userEvent.setup();
  const fetchMock = mockFetch(() =>
    Promise.resolve({ json: () => Promise.resolve({ message: 'hello from the api' }) })
  );

  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Click This' }));

  expect(await screen.findByText('Message from backend: hello from the api')).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/message`);
});

test('logs the error and keeps rendering when the API call fails', async () => {
  const user = userEvent.setup();
  const error = new Error('network down');
  mockFetch(() => Promise.reject(error));
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Click This' }));

  await waitFor(() => expect(consoleError).toHaveBeenCalledWith('There was an error!', error));
  expect(screen.getByText('Message from backend:')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Click This' })).toBeInTheDocument();
});
