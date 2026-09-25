import Link from "next/link";

export default function NotFound() {
  return (
    <section style={{ minHeight: "80vh", display: "grid", placeItems: "center", padding: "120px var(--gutter) 60px", textAlign: "center" }}>
      <div style={{ display: "grid", gap: 20, justifyItems: "center" }}>
        <div
          aria-hidden="true"
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "#020203",
            boxShadow: "inset -8px 0 16px -6px rgba(255,170,90,.95), 0 0 0 1.5px rgba(255,122,26,.8), 0 0 50px rgba(255,122,26,.35)",
          }}
        />
        <h1 className="t-h2">Здесь пусто</h1>
        <p className="t-lead">Такой страницы нет. Возможно, ссылка устарела.</p>
        <Link href="/" className="btn btn--ghost">
          На главную
        </Link>
      </div>
    </section>
  );
}
