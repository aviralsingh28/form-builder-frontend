"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, Search } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { getAccessToken } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";
import { HomeSearchProvider, useHomeSearch } from "@/context/HomeSearchContext";

function TopBarSearch() {
  const { query, setQuery } = useHomeSearch();
  return (
    <div className="gf-topbar__search-wrap">
      <Search className="gf-topbar__search-icon" size={20} strokeWidth={2} aria-hidden />
      <input
        type="search"
        className="gf-topbar__search"
        placeholder="Search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search forms"
      />
    </div>
  );
}

function DashboardChrome({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isHydrated, logout } = useAuth();
  const { setQuery } = useHomeSearch();

  useEffect(() => {
    if (!isHydrated) return;
    if (!getAccessToken() || !user) {
      const from = pathname || "/";
      router.replace(`/login?from=${encodeURIComponent(from)}`);
    }
  }, [isHydrated, router, pathname, user]);

  useEffect(() => {
    if (pathname !== "/") setQuery("");
  }, [pathname, setQuery]);

  if (!isHydrated || !user || !getAccessToken()) {
    return (
      <div className="gf-auth-page">
        <p className="muted">Checking session…</p>
      </div>
    );
  }

  const editorLayout = pathname?.startsWith("/forms");
  const isHome = pathname === "/";
  const initial = user.name?.trim()?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <div className={`gf-app${editorLayout ? " gf-app--editor" : ""}`}>
      {!editorLayout && (
        <header className="gf-topbar">
            <Link href="/" className="gf-topbar__brand flex items-center gap-2">
  <Logo className="gf-topbar__brand-logo-img h-8 w-auto" />

  <span className="gf-topbar__brand-text text-xxxl font-semibold leading-none">
    <span style={{ color: '#001f7a' }}>F</span>
    <span style={{ color: '#16a34a' }}>o</span>
    <span style={{ color: '#001f7a' }}>rm </span>
    <span style={{ color: '#001f7a' }}>Builder</span>
  </span>
</Link>
          {isHome ? <TopBarSearch /> : <div className="gf-topbar__search-spacer" aria-hidden />}
          <div className="gf-topbar__right">
            {/* <button type="button" className="gf-topbar__icon-btn" aria-label="Google apps">
              <LayoutGrid size={22} strokeWidth={2} />
            </button> */}
            <details className="gf-user-menu">
              <summary className="gf-avatar" aria-label="Account menu" style={{ backgroundColor: '#001f7a', color: 'white' }}>
                {initial}
              </summary>
              <div className="gf-user-menu__panel">
                <div className="gf-user-menu__name">{user.name}</div>
                <button type="button" className="gf-user-menu__signout" onClick={logout}>
                  Sign out
                </button>
              </div>
            </details>
          </div>
        </header>
      )}
      <main
        className={
          editorLayout ? "gf-main gf-main--editor" : isHome ? "gf-main gf-main--home" : "gf-main"
        }
      >
        {children}
      </main>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <HomeSearchProvider>
      <DashboardChrome>{children}</DashboardChrome>
    </HomeSearchProvider>
  );
}
