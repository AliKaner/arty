import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  ArrowRight,
  Search,
  SlidersHorizontal,
  X,
  Plus,
  Folio,
  ImagePlus,
  Pencil,
  Trash2,
  Check,
  Maximize2,
  InkMark,
  LoopStudy,
} from "./icons";
import "./style.css";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useGallery, Login, LocalImport } from "./backend";
import {
  ArtistInfo,
  ProfileEditor,
  useProfileTheme,
  BrandMark,
} from "./Profile";
import { JournalSection, JournalReader, JournalStudio } from "./Journal";
function App() {
  const {
    works,
    ready,
    saveWork,
    deleteWork,
    key,
    login,
    logout,
    profile,
    saveProfile,
    entries,
    saveJournal,
    deleteJournal,
  } = useGallery();
  useProfileTheme(profile);
  const [showJournal, setShowJournal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [page, setPage] = useState("gallery"),
    [category, setCategory] = useState("Tüm eserler"),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState(false),
    [tag, setTag] = useState("Tümü"),
    [sort, setSort] = useState("curated"),
    [selected, setSelected] = useState(null),
    [editing, setEditing] = useState(null),
    [toast, setToast] = useState(""),
    [zoom, setZoom] = useState(false);
  useEffect(() => {
    if (!selected && !editing) return;
    const f = (e) => {
      if (e.key === "Escape") {
        setSelected(null);
        setEditing(null);
        setZoom(false);
      }
    };
    document.addEventListener("keydown", f);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", f);
      document.body.style.overflow = "";
    };
  }, [selected, editing]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);
  const displayed = works
    .filter(
      (w) =>
        (category === "Tüm eserler" || w.category === category) &&
        (tag === "Tümü" || w.tags.includes(tag)) &&
        `${w.title} ${w.tags.join(" ")} ${w.medium}`
          .toLocaleLowerCase("tr")
          .includes(query.toLocaleLowerCase("tr")),
    )
    .sort((a, b) =>
      sort === "newest"
        ? b.date.localeCompare(a.date)
        : sort === "oldest"
          ? a.date.localeCompare(b.date)
          : 0,
    );
  function open(w) {
    setSelected(w);
    setZoom(false);
  }
  return (
    <>
      <header>
        <a className="brand" href="#" onClick={() => setPage("gallery")}>
          {profile?.name || "atelier"}
          <BrandMark logo={profile?.logo} size={33} />
        </a>
        <nav>
          <button
            className={page === "gallery" ? "active" : ""}
            onClick={() => setPage("gallery")}
          >
            Eserler <span className="nav-dot" />
          </button>
          <button
            className={page === "about" ? "active" : ""}
            onClick={() => setPage("about")}
          >
            Hikâyem
          </button>
          <button
            className={page === "journal" ? "active" : ""}
            onClick={() => setPage("journal")}
          >
            Günlüğüm
          </button>
        </nav>
        <button
          className={`studio-button ${page === "admin" ? "chosen" : ""}`}
          onClick={() => {
            if (page === "admin") setPage("gallery");
            else if (key) setPage("admin");
            else setShowLogin(true);
          }}
        >
          <span className="status-dot" />
          {page === "admin" ? "Galeriye dön" : "Sanatçı stüdyosu"}
          <ArrowUpRight size={15} />
        </button>
      </header>
      <main>
        {page === "journal" ? (
          <JournalSection entries={entries} standalone />
        ) : page === "about" ? (
          <section className="about about-artist">
            <span className="eyebrow">SANATIN ARKASINDA</span>
            <h1>
              Gördüklerimden çok,
              <br />
              <em>hissettiklerim.</em>
            </h1>
            <ArtistInfo profile={profile} full />
            <button className="primary" onClick={() => setPage("gallery")}>
              Eserleri keşfet <ArrowRight size={16} />
            </button>
          </section>
        ) : (
          <>
            <section className={`hero ${page === "admin" ? "admin-hero" : ""}`}>
              <div>
                <div className="eyebrow">
                  <span />
                  {page === "admin"
                    ? "KENDİ YARATICI ALANIN"
                    : profile?.heroEyebrow || "GÖRSEL GÜNLÜĞÜM"}
                </div>
                <h1>
                  {page === "admin" ? (
                    <>
                      Sanatın burada.
                      <br />
                      <em>Söz şimdi sende.</em>
                    </>
                  ) : (
                    <>
                      {profile?.heroLine1 || "Biraz düş,"}
                      <br />
                      <em>{profile?.heroLine2 || "biraz dünya."}</em>
                      <LoopStudy className="hero-drawing" />
                    </>
                  )}
                </h1>
                <p>
                  {page === "admin"
                    ? "Eserlerimi, hikâyelerimi ve portfolyomu buradan düzenliyorum."
                    : profile?.heroIntro ||
                      "İçimden geçenleri renk, çizgi ve ışıkla anlatıyorum.\nHer eserimde, benden bir parça bırakıyorum."}
                </p>
              </div>
              {page === "admin" ? (
                <button
                  className="primary add-main"
                  onClick={() =>
                    setEditing({
                      title: "",
                      category: "Dijital sanat",
                      date: new Date().toISOString().slice(0, 10),
                      medium: "",
                      tags: [],
                      description: "",
                      image: "",
                      ratio: "medium",
                    })
                  }
                >
                  <Plus size={18} /> Yeni eser ekle
                </button>
              ) : (
                <div className="hero-note">
                  <InkMark size={44} />
                  <span>
                    Biriktirdiğim anlar,
                    <br />
                    <em>çizdiğim dünyalar.</em>
                  </span>
                  <svg viewBox="0 0 80 65">
                    <path d="M10 5 Q65 0 47 42 Q40 58 24 51 M24 51 L37 49 M24 51 L31 39" />
                  </svg>
                </div>
              )}
            </section>
            {page === "admin" && (
              <div className="studio-controls">
                <LocalImport saveWork={saveWork} onMessage={setToast} />
                <button onClick={() => setShowJournal(true)}>
                  Art journal
                </button>
                <button
                  disabled={!profile}
                  onClick={() => setShowProfile(true)}
                >
                  Bilgi & görünüm
                </button>
                <button
                  onClick={() => {
                    logout();
                    setPage("gallery");
                  }}
                >
                  Stüdyodan çıkış
                </button>
              </div>
            )}
            <section className="collection">
              <div className="collection-heading">
                <div>
                  <span className="section-index">01 /</span>
                  <h2>
                    {page === "admin" ? "Eser yönetimi" : "Seçtiğim eserler"}
                  </h2>
                  <span className="count">
                    {works.length.toString().padStart(2, "0")}
                  </span>
                </div>
                <span className="collection-note">
                  {page === "admin" ? (
                    "Bulut stüdyosu · Değişiklikler anında paylaşılır"
                  ) : (
                    <>
                      Her eserimde benden bir parça <ArrowUpRight size={14} />
                    </>
                  )}
                </span>
              </div>
              <div className="toolbar">
                <div className="tabs">
                  {[
                    "Tüm eserler",
                    "Dijital sanat",
                    "İllüstrasyon",
                    "Fotoğraf",
                  ].map((c) => (
                    <button
                      className={category === c ? "selected" : ""}
                      key={c}
                      onClick={() => setCategory(c)}
                    >
                      {c}
                      {c === "Tüm eserler" && <span>{works.length}</span>}
                    </button>
                  ))}
                </div>
                <div className="search-tools">
                  <label className="search">
                    <Search size={16} />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Bir şeyler ara…"
                      aria-label="Eser ara"
                    />
                    {query && (
                      <button
                        onClick={() => setQuery("")}
                        aria-label="Aramayı temizle"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </label>
                  <button
                    className={`filter-button ${filter ? "on" : ""}`}
                    onClick={() => setFilter(!filter)}
                  >
                    <SlidersHorizontal size={16} />
                    <span>Filtrele</span>
                    {tag !== "Tümü" && <b>1</b>}
                  </button>
                </div>
              </div>
              {filter && (
                <div className="filter-panel">
                  <label>
                    Etiket
                    <select
                      value={tag}
                      onChange={(e) => setTag(e.target.value)}
                    >
                      {["Tümü", ...new Set(works.flatMap((w) => w.tags))].map(
                        (t) => (
                          <option key={t}>{t}</option>
                        ),
                      )}
                    </select>
                  </label>
                  <label>
                    Sıralama
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                    >
                      <option value="curated">Sanatçının seçimi</option>
                      <option value="newest">En yeni</option>
                      <option value="oldest">En eski</option>
                    </select>
                  </label>
                  <button
                    onClick={() => {
                      setTag("Tümü");
                      setSort("curated");
                      setCategory("Tüm eserler");
                      setQuery("");
                    }}
                  >
                    Filtreleri sıfırla
                  </button>
                </div>
              )}
              {!ready ? (
                <p className="empty">Stüdyo hazırlanıyor…</p>
              ) : displayed.length === 0 ? (
                <div className="empty">
                  <Folio size={30} />
                  <h3>Burada henüz bir iz yok.</h3>
                  <p>Başka bir kelime veya etiketle yeniden dene.</p>
                  <button
                    onClick={() => {
                      setTag("Tümü");
                      setQuery("");
                      setCategory("Tüm eserler");
                    }}
                  >
                    Tüm eserleri göster
                  </button>
                </div>
              ) : (
                <div className="art-grid">
                  {displayed.map((w, i) => {
                    return (
                      <article
                        className={`art-card ${w.ratio}`}
                        key={w.id}
                        style={{ "--order": i }}
                      >
                        <button
                          className="art-image"
                          onClick={() => open(w)}
                          aria-label={`${w.title} eserini aç`}
                        >
                          <img
                            src={w.thumb || w.image}
                            alt={w.title}
                            loading={i < 4 ? "eager" : "lazy"}
                          />
                          <div className="image-shade" />
                          <span className="view-art">
                            <Maximize2 size={16} /> Yakından bak
                          </span>
                          <span className="art-number">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                        </button>
                        <div className="art-info">
                          <div>
                            <h3>
                              <button onClick={() => open(w)}>{w.title}</button>
                            </h3>
                            <p>
                              {w.category}
                              <span>·</span>
                              {w.date.slice(0, 4)}
                            </p>
                          </div>
                          {page === "admin" ? (
                            <button
                              className="edit-btn"
                              aria-label={`${w.title} düzenle`}
                              onClick={() => setEditing({ ...w })}
                            >
                              <Pencil size={16} />
                            </button>
                          ) : (
                            <ArrowUpRight size={18} />
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
              <div className="collection-bottom">
                <InkMark size={34} />
                <p>{displayed.length} eser, bir sürü his.</p>
                <span>Üretmeye, hayal etmeye devam ediyorum.</span>
              </div>
            </section>
            {page === "gallery" && (
              <>
                <JournalSection entries={entries} />
                <ArtistInfo profile={profile} />
              </>
            )}
          </>
        )}
      </main>
      <footer>
        <a className="brand" href="#" onClick={() => setPage("gallery")}>
          {profile?.name || "atelier"}
          <BrandMark logo={profile?.logo} size={33} />
        </a>
        <span>Biraz merak, bolca his ile üretiyorum.</span>
        <small>
          © {new Date().getFullYear()} {profile?.name || "Atelier"}
        </small>
      </footer>
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <section
            className={`viewer ${zoom ? "zoomed" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label={selected.title}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close"
              onClick={() => setSelected(null)}
              aria-label="Kapat"
            >
              <X />
            </button>
            <div className="viewer-image">
              <img
                src={
                  selected.image.startsWith("https:")
                    ? selected.image.replace("w=900", "w=2400")
                    : selected.image
                }
                alt={selected.title}
              />
              <button className="zoom-button" onClick={() => setZoom(!zoom)}>
                <Maximize2 size={16} />
                {zoom ? "Bilgileri göster" : "Tam görünüm"}
              </button>
            </div>
            <div className="viewer-detail">
              <span className="eyebrow">BU ESERİ NASIL YAPTIM</span>
              <h2>{selected.title}</h2>
              <p>{selected.description}</p>
              <dl>
                <dt>TEKNİK & MALZEME</dt>
                <dd>{selected.medium || selected.category}</dd>
                <dt>TARİH</dt>
                <dd>
                  {new Date(selected.date + "T12:00:00").toLocaleDateString(
                    "tr-TR",
                    { day: "numeric", month: "long", year: "numeric" },
                  )}
                </dd>
              </dl>
              <div className="tag-list">
                {selected.tags.map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTag(t);
                      setFilter(true);
                      setSelected(null);
                    }}
                  >
                    #{t}
                  </button>
                ))}
              </div>
              <span className="resolution">
                <span className="status-dot" /> Yüksek çözünürlüklü görünüm
              </span>
            </div>
          </section>
        </div>
      )}
      <JournalReader entries={entries} />
      {showJournal && (
        <JournalStudio
          entries={entries}
          saveJournal={saveJournal}
          deleteJournal={deleteJournal}
          onClose={() => setShowJournal(false)}
          onMessage={setToast}
        />
      )}
      {showProfile && profile && (
        <ProfileEditor
          profile={profile}
          onClose={() => setShowProfile(false)}
          onSave={async (value) => {
            await saveProfile(value);
            setToast("Bilgilerin ve galeri renklerin kaydedildi.");
          }}
        />
      )}
      {showLogin && (
        <Login
          onClose={() => setShowLogin(false)}
          onLogin={async (value) => {
            await login(value);
            setShowLogin(false);
            setPage("admin");
          }}
        />
      )}
      {editing && (
        <Editor
          work={editing}
          onClose={() => setEditing(null)}
          onSave={async (w) => {
            await saveWork(w);
            setEditing(null);
            setToast("Eserin stüdyoya kaydedildi.");
          }}
          onDelete={async () => {
            await deleteWork(editing);
            setEditing(null);
            setToast("Eser silindi.");
          }}
        />
      )}
      {toast && (
        <div className="toast">
          <Check size={17} />
          {toast}
        </div>
      )}
    </>
  );
}
function Editor({ work, onClose, onSave, onDelete }) {
  const [w, setW] = useState(work),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [confirmDelete, setConfirmDelete] = useState(false);
  const update = (k, v) => setW((s) => ({ ...s, [k]: v }));
  async function upload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
        file.type,
      )
    ) {
      setError("JPG, PNG, WebP veya GIF seç.");
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      setError("En fazla 30 MB yükleyebilirsin.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const url = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const img = new Image();
      img.src = url;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = Math.min(900, img.width);
      canvas.height = Math.round((img.height * canvas.width) / img.width);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      setW((s) => ({
        ...s,
        image: url,
        thumb: canvas.toDataURL("image/webp", 0.82),
        ratio: img.height > img.width ? "tall" : "short",
      }));
    } catch {
      setError("Görsel okunamadı. Başka bir dosya dene.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div
      className="modal-backdrop"
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      <form
        className="editor"
        role="dialog"
        aria-modal="true"
        aria-label="Eser düzenleyici"
        onClick={(e) => e.stopPropagation()}
        onSubmit={async (e) => {
          e.preventDefault();
          if (!w.image) {
            setError("Önce bir eser görseli yükle.");
            return;
          }
          setBusy(true);
          setError("");
          try {
            await onSave({
              ...w,
              title: w.title.trim(),
              tags: [...new Set(w.tags.filter(Boolean))],
            });
          } catch (err) {
            setError(
              err.data ||
                "Kaydedilemedi. Bağlantını ve stüdyo anahtarını kontrol et.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <button
          className="close"
          type="button"
          disabled={busy}
          onClick={onClose}
          aria-label="Kapat"
        >
          <X />
        </button>
        <span className="eyebrow">SANATÇI STÜDYOSU</span>
        <h2>{w.id ? "Hikâyene bir dokunuş." : "Yeni bir hikâye."}</h2>
        <label className={`upload ${w.image ? "has-image" : ""}`}>
          {w.image ? (
            <img src={w.thumb || w.image} alt="Eser önizlemesi" />
          ) : (
            <ImagePlus size={30} />
          )}
          <span>
            {w.image ? "Görseli değiştir" : "Eserini buraya yükle"}
            <small>
              JPG, PNG, WebP, GIF · En fazla 30 MB · Orijinal çözünürlük korunur
            </small>
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={upload}
          />
        </label>
        <label>
          Eser adı
          <input
            required
            maxLength={100}
            value={w.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="Her şey bir isimle başlar…"
          />
        </label>
        <div className="form-row">
          <label>
            Kategori
            <select
              value={w.category}
              onChange={(e) => update("category", e.target.value)}
            >
              {["Dijital sanat", "İllüstrasyon", "Fotoğraf"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Yapım tarihi
            <input
              required
              type="date"
              value={w.date}
              onChange={(e) => update("date", e.target.value)}
            />
          </label>
        </div>
        <label>
          Teknik & malzeme
          <input
            value={w.medium}
            onChange={(e) => update("medium", e.target.value)}
            placeholder="Örn. Procreate, suluboya, tuval…"
          />
        </label>
        <label>
          Eserin hikâyesi
          <textarea
            rows={3}
            value={w.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Nereden ilham aldın? Bu eser ne anlatıyor?"
          />
        </label>
        <label>
          Etiketler
          <input
            value={w.tags.join(",")}
            onChange={(e) => update("tags", e.target.value.split(","))}
            onBlur={() =>
              update("tags", w.tags.map((t) => t.trim()).filter(Boolean))
            }
            placeholder="Doğa, düşsel, pastel (virgülle ayır)"
          />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="editor-actions">
          {w.id && (
            <button
              type="button"
              className="delete"
              disabled={busy}
              onClick={async () => {
                if (!confirmDelete) {
                  setConfirmDelete(true);
                  return;
                }
                setBusy(true);
                try {
                  await onDelete();
                } catch (err) {
                  setError(err.data || "Silinemedi. Yeniden dene.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Trash2 size={16} />
              {confirmDelete ? "Silmeyi onayla" : "Eseri sil"}
            </button>
          )}
          <button type="submit" className="primary" disabled={busy}>
            {busy ? "Kaydediliyor…" : "Eseri kaydet"}
            <ArrowUpRight size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
const convexUrl = import.meta.env.VITE_CONVEX_URL;
const client = convexUrl ? new ConvexReactClient(convexUrl) : null;
createRoot(document.getElementById("root")).render(
  client ? (
    <ConvexProvider client={client}>
      <App />
    </ConvexProvider>
  ) : (
    <main className="about">
      <h1>Stüdyo bağlantısı eksik.</h1>
      <p>
        VITE_CONVEX_URL ortam değişkenini ayarla ve uygulamayı yeniden başlat.
      </p>
    </main>
  ),
);
