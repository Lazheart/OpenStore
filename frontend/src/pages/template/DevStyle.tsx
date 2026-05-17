import { useState } from 'react';
import type { ThemeViewProps } from '../storefront/themeTypes';
import { hasConfiguredHeroTitle, readHeroSubtitle, readHeroTitle } from '../storefront/themeTypes';

// ─── Shared Product Data ──────────────────────────────────────────────────────
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  badge?: string;
  stars: number;
  downloads?: string;
  version?: string;
}

// ─── Star Component ───────────────────────────────────────────────────────────
function Stars({ count }: { count: number }) {
  return (
    <span style={{ color: '#39ff14', fontSize: '0.75rem', letterSpacing: '2px' }}>
      {'█'.repeat(count)}{'░'.repeat(5 - count)}
    </span>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function DevProductCard({ product, onAdd }: { product: Product; onAdd: (p: Product) => void }) {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAdd(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const badgeColors: Record<string, string> = {
    HOT: '#ff5f57',
    NEW: '#39ff14',
    SALE: '#ffd60a',
    FREE: '#0af0ff',
  };

  return (
    <div className="dev-card">
      <div className="dev-card-header">
        <span className="dev-prompt">$&gt;</span>
        <span className="dev-pkg-name">{product.name.toLowerCase().replace(/\s+/g, '-')}</span>
        {product.badge && (
          <span
            className="dev-badge"
            style={{ color: badgeColors[product.badge] ?? '#fff', borderColor: badgeColors[product.badge] ?? '#fff' }}
          >
            [{product.badge}]
          </span>
        )}
      </div>

      <div className="dev-card-meta">
        <span className="dev-meta-item">version: <em>{product.version}</em></span>
        <span className="dev-meta-item">downloads: <em>{product.downloads}</em></span>
      </div>

      <p className="dev-description">// {product.description}</p>

      <div className="dev-card-footer">
        <Stars count={product.stars} />
        <div className="dev-actions">
          <span className="dev-price">${product.price}.00</span>
          <button className="dev-btn" onClick={handleAdd}>
            {added ? '✓ Added!' : '$ install --save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────────────────────
function readColors(themeConfig: import('../storefront/themeTypes').ShopThemeJson | null) {
  const c = themeConfig?.colors as Record<string, string> | undefined;
  return {
    primary: c?.primaryColor ?? '#39ff14',
    bg: c?.bgColor ?? '#0d1117',
    text: c?.textColor ?? '#c9d1d9',
    accent: c?.accentColor ?? '#58a6ff',
    headerName: (themeConfig?.headerName as string) ?? '',
  };
}

export default function DevStyle({ shopId, shopName, themeConfig, catalogProducts }: ThemeViewProps) {
  const [cart, setCart] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [terminalLog, setTerminalLog] = useState<string[]>([
    '> OpenStore DevShop v2.0.0 initialised...',
    '> Fetching package registry...',
    '> 6 packages found. Ready.',
  ]);

  const productSource = catalogProducts ?? [];
  const showCustomHero = hasConfiguredHeroTitle(themeConfig);
  const colors = readColors(themeConfig);
  const displayHeader = colors.headerName || shopName || 'openStore.dev';
  const hasProducts = productSource.length > 0;
  const EMPTY_PRODUCTS_MESSAGE = 'Your query returned 0 products. Try again later.';

  const filtered = productSource.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCart((prev) => [...prev, product]);
    setTerminalLog((prev) => [
      ...prev,
      `> npm install ${product.name.toLowerCase().replace(/\s+/g, '-')} --save`,
      `  ✓ added to cart (total: ${cart.length + 1} pkg)`,
    ]);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Code+Pro:ital,wght@0,300;0,400;0,600;0,700;1,400&display=swap');
        :root {
          --dev-primary: ${colors.primary};
          --dev-bg: ${colors.bg};
          --dev-text: ${colors.text};
          --dev-accent: ${colors.accent};
        }

        .dev-root {
          min-height: 100vh;
          background: var(--dev-bg);
          color: var(--dev-text);
          font-family: 'Source Code Pro', 'Fira Code', monospace;
          padding: 0;
        }

        /* ── Header ── */
        .dev-header {
          background: color-mix(in srgb, var(--dev-bg) 85%, #000);
          border-bottom: 1px solid color-mix(in srgb, var(--dev-primary) 20%, transparent);
          padding: 1rem 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .dev-logo {
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--dev-primary);
          letter-spacing: -0.5px;
        }
        .dev-logo span { color: var(--dev-accent); }
        .dev-header-right {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        .dev-cart-pill {
          background: color-mix(in srgb, var(--dev-bg) 70%, #000);
          border: 1px solid color-mix(in srgb, var(--dev-primary) 30%, transparent);
          color: var(--dev-accent);
          padding: 0.4rem 1rem;
          border-radius: 4px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: border-color 0.2s;
          font-family: inherit;
        }
        .dev-cart-pill:hover { border-color: var(--dev-primary); color: var(--dev-primary); }

        /* ── Hero ── */
        .dev-hero {
          background: color-mix(in srgb, var(--dev-bg) 90%, #000);
          border-bottom: 1px solid color-mix(in srgb, var(--dev-primary) 20%, transparent);
          padding: 3rem 2rem 2rem;
          position: relative;
          overflow: hidden;
        }
        .dev-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 20% 50%, color-mix(in srgb, var(--dev-primary) 6%, transparent) 0%, transparent 60%),
                      radial-gradient(ellipse at 80% 20%, color-mix(in srgb, var(--dev-accent) 7%, transparent) 0%, transparent 50%);
          pointer-events: none;
        }
        .dev-hero-label {
          color: var(--dev-primary);
          font-size: 0.7rem;
          letter-spacing: 3px;
          text-transform: uppercase;
          margin-bottom: 0.75rem;
        }
        .dev-hero h1 {
          font-size: clamp(1.6rem, 4vw, 2.8rem);
          font-weight: 700;
          color: var(--dev-text);
          margin-bottom: 0.5rem;
          line-height: 1.2;
        }
        .dev-hero h1 .accent { color: var(--dev-primary); }
        .dev-hero h1 .accent2 { color: var(--dev-accent); }
        .dev-hero-sub {
          color: color-mix(in srgb, var(--dev-text) 60%, transparent);
          font-size: 0.9rem;
          margin-bottom: 0;
          font-style: italic;
        }
        .dev-scan-line {
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--dev-primary), transparent);
          margin-top: 2rem;
          opacity: 0.4;
          animation: devScan 3s ease-in-out infinite;
        }
        @keyframes devScan {
          0%, 100% { opacity: 0.1; transform: scaleX(0.3); }
          50% { opacity: 0.6; transform: scaleX(1); }
        }

        /* ── Search & Filter bar ── */
        .dev-toolbar {
          background: color-mix(in srgb, var(--dev-bg) 90%, #000);
          border-bottom: 1px solid color-mix(in srgb, var(--dev-primary) 15%, transparent);
          padding: 1rem 2rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .dev-search-wrapper {
          position: relative;
          flex: 1;
          min-width: 220px;
        }
        .dev-search-prefix {
          position: absolute;
          left: 0.8rem;
          top: 50%;
          transform: translateY(-50%);
          color: #39ff14;
          font-size: 0.85rem;
          pointer-events: none;
        }
        .dev-search {
          width: 100%;
          background: color-mix(in srgb, var(--dev-bg) 60%, #000);
          border: 1px solid color-mix(in srgb, var(--dev-primary) 20%, transparent);
          color: var(--dev-text);
          padding: 0.55rem 0.75rem 0.55rem 3.5rem;
          border-radius: 4px;
          font-family: 'Source Code Pro', monospace;
          font-size: 0.85rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .dev-search:focus { border-color: var(--dev-primary); }
        .dev-search::placeholder { color: color-mix(in srgb, var(--dev-text) 30%, transparent); }
        .dev-search-prefix { color: var(--dev-primary); }

        .dev-filter-group {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
        }
        .dev-filter-btn {
          background: color-mix(in srgb, var(--dev-bg) 60%, #000);
          border: 1px solid color-mix(in srgb, var(--dev-primary) 15%, transparent);
          color: color-mix(in srgb, var(--dev-text) 60%, transparent);
          padding: 0.4rem 0.9rem;
          border-radius: 4px;
          font-size: 0.75rem;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
          text-transform: lowercase;
        }
        .dev-filter-btn:hover { border-color: var(--dev-accent); color: var(--dev-accent); }
        .dev-filter-btn.active { border-color: var(--dev-primary); color: var(--dev-primary); background: color-mix(in srgb, var(--dev-primary) 7%, transparent); }

        /* ── Grid ── */
        .dev-main {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 0;
          min-height: calc(100vh - 200px);
        }
        @media (max-width: 900px) {
          .dev-main { grid-template-columns: 1fr; }
          .dev-terminal { display: none; }
        }

        .dev-products-area {
          padding: 2rem;
          border-right: 1px solid #21262d;
        }

        .dev-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1rem;
        }

        /* ── Card ── */
        .dev-card {
          background: color-mix(in srgb, var(--dev-bg) 90%, #000);
          border: 1px solid color-mix(in srgb, var(--dev-primary) 15%, transparent);
          border-radius: 6px;
          padding: 1.25rem;
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
          cursor: default;
          position: relative;
          overflow: hidden;
        }
        .dev-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--dev-primary), var(--dev-accent));
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s;
        }
        .dev-card:hover {
          border-color: var(--dev-primary);
          box-shadow: 0 0 20px color-mix(in srgb, var(--dev-primary) 12%, transparent);
          transform: translateY(-2px);
        }
        .dev-card:hover::before { transform: scaleX(1); }

        .dev-card-header {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          flex-wrap: wrap;
        }
        .dev-prompt { color: var(--dev-primary); font-size: 0.85rem; flex-shrink: 0; }
        .dev-pkg-name {
          color: var(--dev-accent);
          font-size: 0.95rem;
          font-weight: 700;
          flex: 1;
          word-break: break-all;
        }
        .dev-badge {
          font-size: 0.65rem;
          font-weight: 700;
          border: 1px solid;
          padding: 0 0.4rem;
          border-radius: 2px;
          letter-spacing: 1px;
          flex-shrink: 0;
        }

        .dev-card-meta {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 0.75rem;
          font-size: 0.72rem;
          color: #484f58;
        }
        .dev-meta-item em { color: #8b949e; font-style: normal; }

        .dev-description {
          font-size: 0.8rem;
          color: #6e7681;
          line-height: 1.6;
          margin-bottom: 1rem;
          font-style: italic;
        }

        .dev-card-footer {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .dev-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }
        .dev-price {
          color: color-mix(in srgb, var(--dev-primary) 80%, #ff0);
          font-weight: 700;
          font-size: 1.05rem;
        }
        .dev-btn {
          background: color-mix(in srgb, var(--dev-bg) 60%, #000);
          border: 1px solid var(--dev-primary);
          color: var(--dev-primary);
          padding: 0.45rem 1rem;
          border-radius: 4px;
          font-size: 0.78rem;
          font-family: 'Source Code Pro', monospace;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .dev-btn:hover {
          background: color-mix(in srgb, var(--dev-primary) 12%, transparent);
          box-shadow: 0 0 10px color-mix(in srgb, var(--dev-primary) 30%, transparent);
        }
        .dev-btn:active { transform: scale(0.97); }

        /* ── Terminal Sidebar ── */
        .dev-terminal {
          background: color-mix(in srgb, var(--dev-bg) 50%, #000);
          border-left: 1px solid color-mix(in srgb, var(--dev-primary) 15%, transparent);
          padding: 1.5rem;
          font-size: 0.75rem;
          color: #8b949e;
          overflow-y: auto;
          max-height: calc(100vh - 200px);
          position: sticky;
          top: 120px;
        }
        .dev-terminal-title {
          color: var(--dev-primary);
          font-size: 0.7rem;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 1rem;
          border-bottom: 1px solid #21262d;
          padding-bottom: 0.5rem;
        }
        .dev-terminal-line {
          margin-bottom: 0.35rem;
          line-height: 1.5;
          animation: devFadeIn 0.3s ease;
        }
        .dev-terminal-line:nth-child(odd) { color: var(--dev-primary); }
        .dev-terminal-line:nth-child(even) { color: color-mix(in srgb, var(--dev-text) 60%, transparent); padding-left: 1rem; }
        .dev-cursor {
          display: inline-block;
          width: 8px;
          height: 14px;
          background: var(--dev-primary);
          vertical-align: middle;
          animation: devBlink 1s step-end infinite;
        }
        @keyframes devBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes devFadeIn { from { opacity: 0; transform: translateX(-5px); } to { opacity: 1; transform: translateX(0); } }

        /* ── Empty ── */
        .dev-empty {
          text-align: center;
          padding: 4rem 2rem;
          color: #484f58;
          font-size: 0.85rem;
        }
        .dev-empty-code {
          font-size: 2rem;
          margin-bottom: 0.5rem;
          color: #21262d;
        }

        /* ── Cart total strip ── */
        .dev-cart-strip {
          background: color-mix(in srgb, var(--dev-bg) 90%, #000);
          border-top: 1px solid color-mix(in srgb, var(--dev-primary) 20%, transparent);
          padding: 0.75rem 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.8rem;
          position: sticky;
          bottom: 0;
        }
        .dev-cart-total { color: color-mix(in srgb, var(--dev-text) 60%, transparent); }
        .dev-cart-total span { color: color-mix(in srgb, var(--dev-primary) 80%, #ff0); font-weight: 700; }
        .dev-checkout-btn {
          background: linear-gradient(135deg, var(--dev-primary), var(--dev-accent));
          border: none;
          color: color-mix(in srgb, var(--dev-bg) 90%, #000);
          padding: 0.5rem 1.5rem;
          border-radius: 4px;
          font-family: 'Source Code Pro', monospace;
          font-weight: 700;
          font-size: 0.8rem;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.2s;
        }
        .dev-checkout-btn:hover { opacity: 0.85; transform: translateY(-1px); }
      `}</style>

      <div className="dev-root">
        {/* Header */}
        <header className="dev-header">
          <div className="dev-logo">
            {displayHeader.includes(' ') ? (
              <>{displayHeader.split(' ')[0]}<span>{displayHeader.split(' ').slice(1).join(' ')}</span></>
            ) : (
              <>{displayHeader}<span>.dev</span></>
            )}
          </div>
          <div className="dev-header-right">
            <span style={{ color: '#484f58', fontSize: '0.75rem' }}>
              {shopName ? `${shopName} · storefront` : 'registry.openstore.sh/v2'}
              {shopId ? ` · ${shopId.slice(0, 8)}…` : ''}
            </span>
            <button className="dev-cart-pill">
              📦 cart [{cart.length}]
            </button>
          </div>
        </header>

        {/* Hero */}
        <section className="dev-hero">
          <div className="dev-hero-label">// marketplace for developers</div>
          {showCustomHero ? (
            <>
              <h1>{readHeroTitle(themeConfig, shopName)}</h1>
              <p className="dev-hero-sub">
                {readHeroSubtitle(
                  themeConfig,
                  '> Catálogo de la tienda. Productos cargados desde el backend.',
                )}
              </p>
            </>
          ) : (
            <>
              <h1>
                <span className="accent">pkg</span> install{' '}
                <span className="accent2">--save</span> your-next-tool
              </h1>
              <p className="dev-hero-sub">
                {'>'} 6 battle-tested packages for serious engineers. No fluff. Just code.
              </p>
            </>
          )}
          <div className="dev-scan-line" />
        </section>

        {/* Toolbar */}
        <div className="dev-toolbar">
          <div className="dev-search-wrapper">
            <span className="dev-search-prefix">$ search</span>
            <input
              className="dev-search"
              type="text"
              placeholder="grep -i 'package-name'"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Main */}
        <div className="dev-main">
          <div className="dev-products-area">
            {!hasProducts ? (
              <div className="dev-empty" style={{ padding: '3rem 1rem', textAlign: 'center', color: '#8b949e' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--dev-text)' }}>{EMPTY_PRODUCTS_MESSAGE}</h3>
              </div>
            ) : filtered.length === 0 ? (
              <div className="dev-empty">
                <div className="dev-empty-code">404</div>
                <div>No packages match your query.</div>
                <div style={{ marginTop: '0.5rem', color: '#30363d' }}>
                  try: `grep -ri 'something else'`
                </div>
              </div>
            ) : (
              <div className="dev-grid">
                {filtered.map((p) => (
                  <DevProductCard key={p.id} product={p} onAdd={addToCart} />
                ))}
              </div>
            )}
          </div>

          {/* Terminal Log */}
          <aside className="dev-terminal">
            <div className="dev-terminal-title">// activity log</div>
            {terminalLog.map((line, i) => (
              <div key={i} className="dev-terminal-line">{line}</div>
            ))}
            <div className="dev-terminal-line">
              &gt; <span className="dev-cursor" />
            </div>
          </aside>
        </div>

        {/* Cart strip */}
        {cart.length > 0 && (
          <div className="dev-cart-strip">
            <div className="dev-cart-total">
              {cart.length} pkg · total:{' '}
              <span>${cart.reduce((a, p) => a + p.price, 0)}.00</span>
            </div>
            <button className="dev-checkout-btn">$ checkout --confirm</button>
          </div>
        )}
      </div>
    </>
  );
}
