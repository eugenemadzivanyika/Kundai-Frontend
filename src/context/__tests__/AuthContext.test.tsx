import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../AuthContext';

// Helper component that surfaces the context values via the DOM.
function Consumer() {
  const { selectedCourse, setSelectedCourse } = useAuth();
  return (
    <div>
      <span data-testid="course">{selectedCourse ? selectedCourse.name : 'none'}</span>
      <button
        onClick={() =>
          setSelectedCourse({ id: '1', _id: '1', code: 'MATH', name: 'Mathematics' })
        }
      >
        Select course
      </button>
      <button onClick={() => setSelectedCourse(null)}>Clear course</button>
    </div>
  );
}

describe('AuthProvider / useAuth', () => {
  it('renders children without crashing', () => {
    render(
      <AuthProvider>
        <p>Hello</p>
      </AuthProvider>,
    );
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('provides null selectedCourse initially', () => {
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );
    expect(screen.getByTestId('course').textContent).toBe('none');
  });

  it('updates selectedCourse when setSelectedCourse is called', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );
    await user.click(screen.getByRole('button', { name: /select course/i }));
    expect(screen.getByTestId('course').textContent).toBe('Mathematics');
  });

  it('clears selectedCourse when set to null', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );
    await user.click(screen.getByRole('button', { name: /select course/i }));
    await user.click(screen.getByRole('button', { name: /clear course/i }));
    expect(screen.getByTestId('course').textContent).toBe('none');
  });

  it('throws when useAuth is used outside AuthProvider', () => {
    // Suppress the expected error boundary noise in the test output.
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Consumer />)).toThrow('useAuth must be used within an AuthProvider');
    consoleSpy.mockRestore();
  });
});
