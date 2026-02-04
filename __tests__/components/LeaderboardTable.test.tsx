import { render, screen } from '@testing-library/react';
import LeaderboardTable from '@/components/LeaderboardTable';
import '@testing-library/jest-dom';

describe('LeaderboardTable', () => {
  const mockAgents = [
    { id: '1', handle: 'WhiteRabbit', score: 15420, rank: 1 },
    { id: '2', handle: 'v0id_injector', score: 12890, rank: 2 },
    { id: '3', handle: 'BigHoss', score: 9450, rank: 3 },
    { id: '4', handle: 'Yuji', score: 8230, rank: 4 },
    { id: '5', handle: 'Sipher', score: 7100, rank: 5 },
  ];

  describe('Rendering', () => {
    it('renders all agents in the leaderboard', () => {
      render(<LeaderboardTable agents={mockAgents} />);
      
      // Handles are displayed with @ prefix
      mockAgents.forEach(agent => {
        expect(screen.getByText(`@${agent.handle}`)).toBeInTheDocument();
      });
    });

    it('displays correct ranks', () => {
      render(<LeaderboardTable agents={mockAgents} />);
      
      mockAgents.forEach(agent => {
        expect(screen.getByText(`#${agent.rank}`)).toBeInTheDocument();
      });
    });

    it('displays formatted scores with thousand separators', () => {
      render(<LeaderboardTable agents={mockAgents} />);
      
      expect(screen.getByText('15,420')).toBeInTheDocument();
      expect(screen.getByText('12,890')).toBeInTheDocument();
      expect(screen.getByText('9,450')).toBeInTheDocument();
    });
  });

  describe('Table Structure', () => {
    it('renders correct table headers', () => {
      render(<LeaderboardTable agents={mockAgents} />);
      
      expect(screen.getByText('Rank')).toBeInTheDocument();
      expect(screen.getByText('Agent')).toBeInTheDocument();
      expect(screen.getByText('Score')).toBeInTheDocument();
    });

    it('renders empty table when no agents provided', () => {
      const { container } = render(<LeaderboardTable agents={[]} />);
      
      // Should still render table structure
      const table = container.querySelector('table');
      expect(table).toBeInTheDocument();
      
      // Headers should still be present
      expect(screen.getByText('Rank')).toBeInTheDocument();
    });

    it('maintains proper table layout', () => {
      const { container } = render(<LeaderboardTable agents={mockAgents} />);
      
      const table = container.querySelector('table');
      expect(table).toHaveClass('w-full');
      
      const headerRow = container.querySelector('thead tr');
      expect(headerRow).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles agents with very high scores', () => {
      const highScores = [
        { id: '99', handle: 'SuperAgent', score: 999999999, rank: 1 }
      ];
      render(<LeaderboardTable agents={highScores} />);
      
      expect(screen.getByText('999,999,999')).toBeInTheDocument();
    });

    it('handles agents with zero scores', () => {
      const zeroScores = [
        { id: '0', handle: 'Newbie', score: 0, rank: 100 }
      ];
      render(<LeaderboardTable agents={zeroScores} />);
      
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('@Newbie')).toBeInTheDocument();
    });

    it('handles large number of agents', () => {
      const manyAgents = Array.from({ length: 50 }, (_, i) => ({
        id: String(i + 1),
        handle: `Agent${i + 1}`,
        score: 1000 - i * 10,
        rank: i + 1
      }));
      
      render(<LeaderboardTable agents={manyAgents} />);
      
      expect(screen.getByText('@Agent1')).toBeInTheDocument();
      expect(screen.getByText('@Agent50')).toBeInTheDocument();
    });

    it('handles special characters in handles', () => {
      const specialAgents = [
        { id: '10', handle: 'Agent_007', score: 5000, rank: 1 },
        { id: '11', handle: 'Code-Ninja', score: 4500, rank: 2 },
        { id: '12', handle: 'Dev.one', score: 4000, rank: 3 }
      ];
      
      render(<LeaderboardTable agents={specialAgents} />);
      
      expect(screen.getByText('@Agent_007')).toBeInTheDocument();
      expect(screen.getByText('@Code-Ninja')).toBeInTheDocument();
      expect(screen.getByText('@Dev.one')).toBeInTheDocument();
    });

    it('handles single agent', () => {
      render(<LeaderboardTable agents={[mockAgents[0]]} />);
      
      expect(screen.getByText('@WhiteRabbit')).toBeInTheDocument();
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('15,420')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies background styling to container', () => {
      const { container } = render(<LeaderboardTable agents={mockAgents} />);
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('bg-gray-800');
    });

    it('applies header styling', () => {
      const { container } = render(<LeaderboardTable agents={mockAgents} />);
      
      const header = container.querySelector('thead');
      expect(header).toHaveClass('bg-gray-700');
    });

    it('separates rows with dividers', () => {
      const { container } = render(<LeaderboardTable agents={mockAgents} />);
      
      const tbody = container.querySelector('tbody');
      expect(tbody).toHaveClass('divide-y');
    });
  });
});
