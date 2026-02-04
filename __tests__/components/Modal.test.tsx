import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Modal from '@/components/Modal';

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    title: 'Test Modal',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when isOpen is true', () => {
    render(
      <Modal {...defaultProps}>
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.getByText('Modal content')).toBeInTheDocument();
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <Modal {...defaultProps} isOpen={false}>
        <p>Hidden content</p>
      </Modal>
    );
    expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(
      <Modal {...defaultProps} onClose={onClose}>
        <p>Content</p>
      </Modal>
    );
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when pressing Escape key', () => {
    const onClose = jest.fn();
    render(
      <Modal {...defaultProps} onClose={onClose}>
        <p>Content</p>
      </Modal>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('has preventCloseOnOverlayClick option', () => {
    // Verify the prop is accepted without error
    const onClose = jest.fn();
    render(
      <Modal {...defaultProps} onClose={onClose} preventCloseOnOverlayClick>
        <p>Content</p>
      </Modal>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders with custom sizes', () => {
    const { rerender } = render(
      <Modal {...defaultProps} size="sm">
        <p>Small</p>
      </Modal>
    );
    expect(screen.getByRole('dialog')).toHaveClass('max-w-md');

    rerender(
      <Modal {...defaultProps} size="md">
        <p>Medium</p>
      </Modal>
    );
    expect(screen.getByRole('dialog')).toHaveClass('max-w-lg');

    rerender(
      <Modal {...defaultProps} size="lg">
        <p>Large</p>
      </Modal>
    );
    expect(screen.getByRole('dialog')).toHaveClass('max-w-2xl');

    rerender(
      <Modal {...defaultProps} size="xl">
        <p>Extra Large</p>
      </Modal>
    );
    expect(screen.getByRole('dialog')).toHaveClass('max-w-4xl');
  });

  it('renders without title', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()}>
        <p>Content without title</p>
      </Modal>
    );
    expect(screen.getByText('Content without title')).toBeInTheDocument();
    // Should still have close button
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('can hide close button', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()} showCloseButton={false}>
        <p>No close button</p>
      </Modal>
    );
    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
  });

  it('disables body scroll when open', () => {
    render(
      <Modal {...defaultProps}>
        <p>Content</p>
      </Modal>
    );
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body scroll when closed', async () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={jest.fn()}>
        <p>Content</p>
      </Modal>
    );
    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <Modal isOpen={false} onClose={jest.fn()}>
        <p>Content</p>
      </Modal>
    );
    
    await waitFor(() => {
      expect(document.body.style.overflow).toBe('unset');
    });
  });

  it('has accessibility attributes', () => {
    render(
      <Modal {...defaultProps}>
        <p>Accessible content</p>
      </Modal>
    );
    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('aria-modal', 'true');
  });

  it('closes properly when unmounting', () => {
    const { unmount } = render(
      <Modal {...defaultProps}>
        <p>Content</p>
      </Modal>
    );
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('unset');
  });

  it('displays title in header', () => {
    render(
      <Modal {...defaultProps} title="Important Message">
        <p>Content</p>
      </Modal>
    );
    const heading = screen.getByRole('heading', { name: /important message/i });
    expect(heading).toBeInTheDocument();
    expect(heading.tagName).toBe('H2');
  });

  it('renders complex children content', () => {
    render(
      <Modal {...defaultProps}>
        <div>
          <h3>Subtitle</h3>
          <p>Paragraph one</p>
          <p>Paragraph two</p>
          <button>Action</button>
        </div>
      </Modal>
    );
    expect(screen.getByText('Subtitle')).toBeInTheDocument();
    expect(screen.getByText('Paragraph one')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  it('handles rapid open/close state changes', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={jest.fn()}>
        <p>Content</p>
      </Modal>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();

    // Close
    rerender(
      <Modal isOpen={false} onClose={jest.fn()}>
        <p>Content</p>
      </Modal>
    );
    expect(screen.queryByText('Content')).not.toBeInTheDocument();

    // Re-open
    rerender(
      <Modal isOpen={true} onClose={jest.fn()}>
        <p>Content</p>
      </Modal>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('cleans up event listeners on unmount', () => {
    const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    const { unmount } = render(
      <Modal {...defaultProps}>
        <p>Content</p>
      </Modal>
    );
    
    // Should have added keyboard listener
    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    unmount();
    
    // Should remove listener on cleanup
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });
});
