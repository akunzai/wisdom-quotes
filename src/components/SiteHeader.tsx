import { ThemeToggle } from '@/components/ThemeToggle';
import type { PageId } from '@/i18n/types';
import { useI18n } from '@/i18n/useI18n';
import { baseUrl, withBase } from '@/lib/base-url';

interface SiteHeaderProps {
  activePage: PageId;
}

export function SiteHeader({ activePage }: SiteHeaderProps) {
  const { messages: m } = useI18n();
  const base = baseUrl();

  const links: { id: PageId; href: string; label: string }[] = [
    { id: 'quotes', href: base, label: m.nav.quotes },
    { id: 'authors', href: withBase('authors/'), label: m.nav.authors },
    { id: 'settings', href: withBase('settings/'), label: m.nav.settings },
  ];

  return (
    <header className="site-header">
      <a className="logo" href={base}>
        <div className="logo-mark">{m.app.name.charAt(0)}</div>
        <div>
          <span className="logo-text">{m.app.name}</span>
        </div>
      </a>

      <nav className="site-nav" aria-label={m.nav.main}>
        {links.map((link) => {
          const isActive = activePage === link.id;
          return (
            <a
              key={link.id}
              className={`nav-link${isActive ? ' active' : ''}`}
              href={link.href}
              aria-current={isActive ? 'page' : undefined}
            >
              {link.label}
            </a>
          );
        })}
      </nav>

      <div className="header-actions">
        <ThemeToggle />
      </div>
    </header>
  );
}