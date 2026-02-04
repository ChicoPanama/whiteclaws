import { render, screen } from '@testing-library/react';
import ProtocolCard from '@/components/ProtocolCard';
import '@testing-library/jest-dom';

// Mock next/link - must pass through className for styling tests
jest.mock('next/link', () => {
  return ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => {
    return <a href={href} data-testid="protocol-link" className={className}>{children}</a>;
  };
});

describe('ProtocolCard', () => {
  const defaultProps = {
    name: 'Aave V3',
    slug: 'aave-v3',
    description: 'Decentralized lending protocol',
    chain: 'Ethereum',
    bountyPool: 2500000,
    maxBounty: 500000,
    assetsInScope: 10,
    tvl: '$5.2B',
    tags: ['DeFi', 'Lending', 'Stablecoins'],
  };

  describe('Rendering', () => {
    it('renders complete protocol information', () => {
      render(<ProtocolCard {...defaultProps} />);
      
      expect(screen.getByText('Aave V3')).toBeInTheDocument();
      expect(screen.getByText('Decentralized lending protocol')).toBeInTheDocument();
      expect(screen.getByText('Ethereum')).toBeInTheDocument();
      expect(screen.getByText('$2,500,000')).toBeInTheDocument();
      expect(screen.getByText('$5.2B')).toBeInTheDocument();
      expect(screen.getByText('DeFi')).toBeInTheDocument();
    });

    it('handles missing optional props gracefully', () => {
      render(<ProtocolCard name="Basic" slug="basic" />);
      
      expect(screen.getByText('Basic')).toBeInTheDocument();
      expect(screen.getByText('$0')).toBeInTheDocument();
      expect(screen.queryByText('assets in scope')).not.toBeInTheDocument();
    });

    it('prioritizes bountyPool over maxBounty', () => {
      render(<ProtocolCard {...defaultProps} bountyPool={1000000} maxBounty={500000} />);
      expect(screen.getByText('$1,000,000')).toBeInTheDocument();
    });

    it('correctly pluralizes assets count', () => {
      const { rerender } = render(<ProtocolCard {...defaultProps} assetsInScope={1} />);
      expect(screen.getByText(/1.*asset in scope/)).toBeInTheDocument();
      
      rerender(<ProtocolCard {...defaultProps} assetsInScope={5} />);
      expect(screen.getByText(/5.*assets in scope/)).toBeInTheDocument();
    });

    it('renders all tags', () => {
      render(<ProtocolCard {...defaultProps} tags={['DeFi', 'Lending', 'Oracle', 'DAO']} />);
      expect(screen.getByText('DeFi')).toBeInTheDocument();
      expect(screen.getByText('Lending')).toBeInTheDocument();
      expect(screen.getByText('Oracle')).toBeInTheDocument();
      expect(screen.getByText('DAO')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('links to correct protocol detail page', () => {
      render(<ProtocolCard {...defaultProps} />);
      const link = screen.getByTestId('protocol-link');
      expect(link).toHaveAttribute('href', '/protocols/aave-v3');
    });

    it('constructs URLs with special characters correctly', () => {
      render(<ProtocolCard {...defaultProps} slug="protocol-name_v2.3" />);
      const link = screen.getByTestId('protocol-link');
      expect(link).toHaveAttribute('href', '/protocols/protocol-name_v2.3');
    });
  });

  describe('Styling', () => {
    it('has proper card styling', () => {
      render(<ProtocolCard {...defaultProps} />);
      const link = screen.getByTestId('protocol-link');
      
      expect(link).toHaveClass('bg-gray-800');
      expect(link).toHaveClass('block');
      expect(link).toHaveClass('rounded-lg');
    });

    it('has hover effects for interactivity', () => {
      render(<ProtocolCard {...defaultProps} />);
      const link = screen.getByTestId('protocol-link');
      
      expect(link).toHaveClass('hover:border-indigo-500');
      expect(link).toHaveClass('transition-colors');
    });
  });

  describe('Edge Cases', () => {
    it('handles very large bounty amounts', () => {
      render(<ProtocolCard {...defaultProps} bountyPool={100000000} />);
      expect(screen.getByText('$100,000,000')).toBeInTheDocument();
    });

    it('handles zero bounty', () => {
      render(<ProtocolCard {...defaultProps} bountyPool={0} />);
      expect(screen.getByText('$0')).toBeInTheDocument();
    });

    it('hides optional elements when not provided', () => {
      render(<ProtocolCard name="Minimal" slug="minimal" />);
      
      expect(screen.queryByText('Ethereum')).not.toBeInTheDocument();
      expect(screen.queryByText(/.*asset.*/i)).not.toBeInTheDocument();
    });

    it('handles empty tags array', () => {
      render(<ProtocolCard {...defaultProps} tags={[]} />);
      expect(screen.getByText('Aave V3')).toBeInTheDocument();
      expect(screen.queryByText('DeFi')).not.toBeInTheDocument();
    });
  });

  describe('Visual Hierarchy', () => {
    it('displays name with larger font than description', () => {
      render(<ProtocolCard {...defaultProps} />);
      
      const name = screen.getByText('Aave V3');
      const description = screen.getByText('Decentralized lending protocol');
      
      expect(name.className).toContain('text-xl');
      expect(description.className).toContain('text-sm');
    });

    it('displays bounty in emphasized styling', () => {
      render(<ProtocolCard {...defaultProps} />);
      const bounty = screen.getByText('$2,500,000');
      expect(bounty.className).toContain('font-medium');
    });
  });

  describe('Accessibility', () => {
    it('ensures link is keyboard navigable', () => {
      render(<ProtocolCard {...defaultProps} />);
      const link = screen.getByTestId('protocol-link');
      expect(link).toHaveAttribute('href');
      // Link element is present and clickable
      expect(link.tagName).toBe('A');
    });
  });
});
