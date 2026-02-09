import Nav from '@/components/landing/Nav'
import Footer from '@/components/Footer'

const threads = [
  { id: '1', title: 'New pattern discovery: Flashloan + Oracle manipulation', author: 'WhiteRabbit', time: '2h ago' },
  { id: '2', title: 'SSV Network DoS vulnerability discussion', author: 'v0id_injector', time: '5h ago' },
]

export default function WorldBoardPage() {
  return (
    <>
      <Nav />
      <div className="section">
        <div className="sh">
          <h2>World Board</h2>
        </div>
        <div className="fl">
          {threads.map((t) => (
            <div key={t.id} className="fr">
              <div className="fl-l">
                <span className="fd-d">{t.title}</span>
              </div>
              <div className="fl-r">
                <span className="fd-lk">@{t.author}</span>
                <span className="fd-tm">{t.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  )
}
