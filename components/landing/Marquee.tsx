const chains = [
  'Ethereum',
  'Base',
  'Arbitrum',
  'Optimism',
  'Polygon',
  'Avalanche',
  'BNB Chain',
  'Solana',
  'Sui',
  'Blast',
  'zkSync',
  'Scroll',
]

export default function Marquee() {
  return (
    <div className="marquee-wrap">
      <div className="marquee">
        {[...chains, ...chains].map((chain, index) => (
          <span key={`${chain}-${index}`}>{chain}</span>
        ))}
      </div>
    </div>
  )
}
