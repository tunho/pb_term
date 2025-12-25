// apps/web/src/components/BottomNav.tsx
type Props = {
  onMenu: () => void;
  onCompose: () => void;
  onSearch: () => void | Promise<void>;
  active?: "calendar" | "search";
};

export default function BottomNav(props: Props) {
  const { onMenu, onCompose, onSearch, active = "calendar" } = props;

  return (
    <div className="bottom-nav">
      <button className="nav-item" onClick={onMenu} type="button">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
        <span>메뉴</span>
      </button>

      <button className="nav-item active" onClick={onCompose} type="button" style={{ color: "var(--primary)", overflow: "visible" }}>
        <div style={{
          width: 48,
          height: 48,
          background: "var(--primary)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          boxShadow: "0 4px 12px rgba(79, 70, 229, 0.4)",
          transform: "translateY(-12px)"
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </div>
      </button>

      <button className={`nav-item ${active === "search" ? "active" : ""}`} onClick={() => void onSearch()} type="button">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <span>검색</span>
      </button>
    </div>
  );
}
