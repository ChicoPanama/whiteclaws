import { render, screen, fireEvent } from '@testing-library/react';
import Input from '@/components/Input';

describe('Input', () => {
  it('renders without label', () => {
    render(<Input placeholder="No label" />);
    expect(screen.getByPlaceholderText('No label')).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(<Input label="Username" />);
    expect(screen.getByText('Username')).toBeInTheDocument();
  });

  it('forwards ref correctly', () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('handles value changes', () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('renders with error state', () => {
    render(<Input error="Required field" label="Name" />);
    expect(screen.getByText('Required field')).toBeInTheDocument();
  });

  it('renders different input types', () => {
    const { rerender } = render(<Input type="text" placeholder="Text" />);
    expect(screen.getByPlaceholderText('Text')).toHaveAttribute('type', 'text');

    rerender(<Input type="password" placeholder="Password" />);
    expect(screen.getByPlaceholderText('Password')).toHaveAttribute('type', 'password');

    rerender(<Input type="email" placeholder="Email" />);
    expect(screen.getByPlaceholderText('Email')).toHaveAttribute('type', 'email');
  });

  it('renders with helper text', () => {
    render(<Input helperText="Must be 8+ characters" label="Password" />);
    expect(screen.getByText('Must be 8+ characters')).toBeInTheDocument();
  });

  it('renders disabled state', () => {
    render(<Input disabled placeholder="Disabled" />);
    const input = screen.getByPlaceholderText('Disabled');
    expect(input).toBeDisabled();
  });

  it('renders required field', () => {
    render(<Input required label="Required" />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('accepts custom className', () => {
    render(<Input className="custom-input" placeholder="Custom" />);
    const input = screen.getByPlaceholderText('Custom');
    expect(input).toHaveClass('custom-input');
  });

  it('is full width by default', () => {
    render(<Input placeholder="Full" />);
    const input = screen.getByPlaceholderText('Full');
    expect(input).toHaveClass('w-full');
  });

  it('shows error styling', () => {
    render(<Input error="Error message" label="Error Field" />);
    const input = screen.getByRole('textbox');
    // The component applies border-red-500 and focus:ring-red-500 when error is present
    const errorMessage = screen.getByText('Error message');
    expect(errorMessage).toHaveClass('text-red-400');
  });

  it('prioritizes error over helperText', () => {
    render(
      <Input 
        error="Error message" 
        helperText="Helper text" 
        label="Field" 
      />
    );
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
  });
});
