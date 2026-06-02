import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from '../Login';

// Mock the entire services barrel so no real API calls or env-var loading
// issues occur during Login tests.
vi.mock('../../../services/api', () => ({
  authService: {
    login: vi.fn(),
  },
}));

// Import the mock AFTER vi.mock so we can configure it per-test.
import { authService } from '../../../services/api';
const mockLogin = vi.mocked(authService.login);

function renderLogin(onLogin = vi.fn()) {
  return render(
    <MemoryRouter>
      <Login onLogin={onLogin} />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mockLogin.mockReset();
});

describe('Login page', () => {
  it('renders the email and password fields', () => {
    renderLogin();
    expect(screen.getByPlaceholderText(/name@university/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/)).toBeInTheDocument();
  });

  it('renders the Student / Staff portal toggle', () => {
    renderLogin();
    // Use anchored regex so "Sign in as Student" submit button doesn't cause ambiguity.
    expect(screen.getByRole('button', { name: /^student$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^staff$/i })).toBeInTheDocument();
  });

  it('switches to the Staff portal on click', async () => {
    const user = userEvent.setup();
    renderLogin();
    const staffBtn = screen.getByRole('button', { name: /staff/i });
    await user.click(staffBtn);
    // The submit button label changes to "Sign in as Staff"
    expect(screen.getByRole('button', { name: /sign in as staff/i })).toBeInTheDocument();
  });

  it('shows validation errors when submitting with empty fields', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for a short password', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByPlaceholderText(/name@university/i), 'user@example.com');
    await user.type(screen.getByPlaceholderText(/••••••••/), '123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it('calls authService.login with the entered credentials', async () => {
    mockLogin.mockResolvedValueOnce({
      token: 'tok',
      user: { _id: '1', name: 'Alice', email: 'alice@ex.com', role: 'student', school: 'sch1', createdAt: '' },
    } as any);

    const user = userEvent.setup();
    const onLogin = vi.fn();
    renderLogin(onLogin);

    await user.type(screen.getByPlaceholderText(/name@university/i), 'alice@ex.com');
    await user.type(screen.getByPlaceholderText(/••••••••/), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('alice@ex.com', 'password123');
    });
  });

  it('calls the onLogin callback after a successful student login', async () => {
    mockLogin.mockResolvedValueOnce({
      token: 'tok',
      user: { _id: '1', name: 'Bob', email: 'bob@ex.com', role: 'student', school: 'sch1', createdAt: '' },
    } as any);

    const user = userEvent.setup();
    const onLogin = vi.fn();
    renderLogin(onLogin);

    await user.type(screen.getByPlaceholderText(/name@university/i), 'bob@ex.com');
    await user.type(screen.getByPlaceholderText(/••••••••/), 'securepass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(onLogin).toHaveBeenCalledTimes(1);
    });
  });

  it('displays an error message when login fails', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));

    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByPlaceholderText(/name@university/i), 'bad@ex.com');
    await user.type(screen.getByPlaceholderText(/••••••••/), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('shows a portal mismatch error when a staff user logs in via student portal', async () => {
    mockLogin.mockResolvedValueOnce({
      token: 'tok',
      user: { _id: '2', name: 'Carol', email: 'carol@ex.com', role: 'teacher', school: 'sch1', createdAt: '' },
    } as any);

    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByPlaceholderText(/name@university/i), 'carol@ex.com');
    await user.type(screen.getByPlaceholderText(/••••••••/), 'teacherpass');
    await user.click(screen.getByRole('button', { name: /sign in as student/i }));

    await waitFor(() => {
      expect(screen.getByText(/staff account/i)).toBeInTheDocument();
    });
  });
});
