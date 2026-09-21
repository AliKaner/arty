import React, { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Plus,
  Pencil,
  Trash2,
  X,
  ImagePlus,
  InkMark,
} from "./icons";
import { prepareImage } from "./images";
const dateLabel = (date) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
const original = (image) =>
  image.storageId ? image.image : image.image?.replace("w=900", "w=2400");
const openEntry = (id, index) => {
  window.location.hash = `journal/${id}${index === undefined ? "" : `/image/${index}`}`;
};
function closeEntry() {
  history.replaceState(null, "", location.pathname + location.search);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}
function useDialog(onClose) {
  const ref = useRef(null),
    callback = useRef(onClose);
  callback.current = onClose;
  useEffect(() => {
    const before = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const keyboard = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        callback.current();
      }
      if (e.key === "Tab") {
        const targets = ref.current?.querySelectorAll(
          "button:not([disabled]),a[href],input:not([disabled]),textarea,select",
        );
        if (!targets?.length) return;
        const first = targets[0],
          last = targets[targets.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", keyboard);
    return () => {
      document.removeEventListener("keydown", keyboard);
      document.body.style.overflow = overflow;
      before?.focus?.();
    };
  }, []);
  return ref;
}
export function JournalSection({ entries, standalone = false }) {
  const rail = useRef(null),
    [edges, setEdges] = useState({ start: true, end: false });
  const measure = () => {
    const el = rail.current;
    if (el)
      setEdges({
        start: el.scrollLeft < 4,
        end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
      });
  };
  useEffect(() => {
    measure();
    const observer = new ResizeObserver(measure);
    if (rail.current) observer.observe(rail.current);
    return () => observer.disconnect();
  }, [entries]);
  return (
    <section
      className={`journal-section ${standalone ? "standalone" : ""}`}
      aria-label="Art journal"
    >
      <div className="journal-heading">
        <div>
          <span className="eyebrow">
            {standalone ? "GÖRSEL NOT DEFTERİM" : "02 / NOT DEFTERİMDEN"}
          </span>
          <h2>
            Art <em>journal.</em>
          </h2>
          <p>
            Bitmiş işlerin arasında; denediklerim, gördüklerim, aklımda
            kalanlar.
          </p>
        </div>
        <div className="journal-navigation">
          <span>Zamanın izinde</span>
          <button
            aria-label="Önceki günlük kayıtları"
            disabled={edges.start}
            onClick={() =>
              rail.current?.scrollBy({ left: -360, behavior: "smooth" })
            }
          >
            <ArrowRight className="arrow-back" size={20} />
          </button>
          <button
            aria-label="Sonraki günlük kayıtları"
            disabled={edges.end}
            onClick={() =>
              rail.current?.scrollBy({ left: 360, behavior: "smooth" })
            }
          >
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
      {entries === undefined ? (
        <p className="empty">Sayfalarım açılıyor…</p>
      ) : !entries.length ? (
        <div className="journal-empty">
          <InkMark size={40} />
          <p>Bu defterin ilk sayfası henüz yazılmadı.</p>
        </div>
      ) : (
        <div
          className="journal-rail"
          ref={rail}
          onScroll={measure}
          tabIndex={0}
          role="region"
          aria-label="Tarihe göre günlük kayıtları, yatay kaydır"
        >
          <div className="journal-track">
            {entries.map((entry, i) => (
              <article className="journal-card" key={entry.id}>
                <div className="journal-date">
                  <span className="timeline-dot" />
                  <time dateTime={entry.date}>{dateLabel(entry.date)}</time>
                  <span className="journal-sequence">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <button
                  className="journal-cover"
                  aria-label={`${entry.title} kapak görselini büyüt`}
                  onClick={() => openEntry(entry.id, 0)}
                >
                  <img
                    src={entry.images[0]?.thumb}
                    alt={entry.images[0]?.caption || entry.title}
                    loading="lazy"
                  />
                  <span className="journal-image-count">
                    {entry.images.length} kare
                  </span>
                </button>
                <button
                  className="journal-title"
                  onClick={() => openEntry(entry.id)}
                >
                  <h3>{entry.title}</h3>
                  <ArrowUpRight size={19} />
                </button>
                <p className="journal-excerpt">{entry.body}</p>
                <button
                  className="read-entry"
                  onClick={() => openEntry(entry.id)}
                >
                  Sayfayı aç <ArrowRight size={17} />
                </button>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
export function JournalReader({ entries }) {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const change = () => setHash(window.location.hash);
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  const match = hash.match(/^#journal\/([^/]+)(?:\/image\/(\d+))?$/);
  if (!match || entries === undefined) return null;
  const entry = entries.find((e) => e.id === match[1]);
  return (
    <JournalDetail
      entry={entry}
      imageIndex={match[2] === undefined ? null : Number(match[2])}
    />
  );
}
function JournalDetail({ entry, imageIndex }) {
  const image = entry && imageIndex !== null ? entry.images[imageIndex] : null;
  const close = () => (image ? openEntry(entry.id) : closeEntry());
  const ref = useDialog(close);
  useEffect(() => {
    if (!image) return;
    const handle = (e) => {
      if (e.key === "ArrowRight")
        openEntry(entry.id, (imageIndex + 1) % entry.images.length);
      if (e.key === "ArrowLeft")
        openEntry(
          entry.id,
          (imageIndex + entry.images.length - 1) % entry.images.length,
        );
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [entry, imageIndex, image]);
  return (
    <div
      className={`modal-backdrop ${image ? "lightbox-backdrop" : ""}`}
      onClick={close}
    >
      <section
        ref={ref}
        tabIndex={-1}
        className={image ? "journal-lightbox" : "journal-detail"}
        role="dialog"
        aria-modal="true"
        aria-label={
          image ? "Günlük görseli" : entry?.title || "Kayıt bulunamadı"
        }
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="close"
          aria-label={image ? "Görseli kapat" : "Günlük detayını kapat"}
          onClick={close}
        >
          <X />
        </button>
        {!entry ? (
          <div className="empty">
            <h2>Bu sayfayı bulamadım.</h2>
            <p>Kayıt kaldırılmış veya adres değişmiş olabilir.</p>
          </div>
        ) : image ? (
          <>
            <img
              className="lightbox-image"
              src={original(image)}
              alt={image.caption || entry.title}
            />
            <div className="lightbox-caption">
              <span>
                {imageIndex + 1} / {entry.images.length}
              </span>
              <p>{image.caption || entry.title}</p>
              <div>
                <button
                  aria-label="Önceki görsel"
                  disabled={entry.images.length < 2}
                  onClick={() =>
                    openEntry(
                      entry.id,
                      (imageIndex + entry.images.length - 1) %
                        entry.images.length,
                    )
                  }
                >
                  <ArrowRight className="arrow-back" />
                </button>
                <button
                  aria-label="Sonraki görsel"
                  disabled={entry.images.length < 2}
                  onClick={() =>
                    openEntry(entry.id, (imageIndex + 1) % entry.images.length)
                  }
                >
                  <ArrowRight />
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="journal-detail-header">
              <span className="eyebrow">
                ART JOURNAL / {dateLabel(entry.date)}
              </span>
              <h2>{entry.title}</h2>
              <p>{entry.body}</p>
            </div>
            <div className="journal-detail-images">
              {entry.images.map((img, i) => (
                <figure key={i}>
                  <button
                    onClick={() => openEntry(entry.id, i)}
                    aria-label={`${i + 1}. görseli büyüt`}
                  >
                    <img
                      src={img.thumb}
                      alt={img.caption || `${entry.title}, ${i + 1}. görsel`}
                      loading="lazy"
                    />
                    <span>
                      <ArrowUpRight size={20} />
                    </span>
                  </button>
                  {img.caption && (
                    <figcaption>
                      <span>{String(i + 1).padStart(2, "0")} /</span>
                      {img.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
            <div className="journal-detail-end">
              <InkMark size={35} />
              <span>Defterimden bir sayfa.</span>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
export function JournalStudio({
  entries,
  saveJournal,
  deleteJournal,
  onClose,
  onMessage,
}) {
  const [editing, setEditing] = useState(null);
  const ref = useDialog(() => {
    if (!editing) onClose();
  });
  if (editing)
    return (
      <JournalEditor
        entry={editing}
        onClose={() => setEditing(null)}
        onSave={async (value, progress) => {
          await saveJournal(value, progress);
          onMessage("Günlük kaydı yayımlandı.");
          setEditing(null);
        }}
        onDelete={async () => {
          await deleteJournal(editing);
          onMessage("Günlük kaydı silindi.");
          setEditing(null);
        }}
      />
    );
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        ref={ref}
        tabIndex={-1}
        className="editor journal-studio"
        role="dialog"
        aria-modal="true"
        aria-label="Günlük yönetimi"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="close"
          aria-label="Günlük yönetimini kapat"
          onClick={onClose}
        >
          <X />
        </button>
        <span className="eyebrow">NOT DEFTERİM</span>
        <h2>Arada kalan hikâyeler.</h2>
        <p className="settings-intro">
          Çalışma sürecimi, küçük keşiflerimi ve görsel notlarımı
          biriktiriyorum.
        </p>
        <button
          className="primary"
          onClick={() =>
            setEditing({
              title: "",
              date: new Date().toISOString().slice(0, 10),
              body: "",
              images: [],
            })
          }
        >
          <Plus size={17} /> Günlük kaydı ekle
        </button>
        <div className="journal-admin-list">
          {entries === undefined ? (
            <p>Yükleniyor…</p>
          ) : !entries.length ? (
            <p className="settings-intro">İlk sayfamı açmaya hazırım.</p>
          ) : (
            [...entries].reverse().map((entry) => (
              <button
                className="journal-admin-row"
                key={entry.id}
                onClick={() =>
                  setEditing({
                    ...entry,
                    images: entry.images.map((i) => ({ ...i })),
                  })
                }
              >
                <img src={entry.images[0]?.thumb} alt="" />
                <span>
                  <small>{dateLabel(entry.date)}</small>
                  <strong>{entry.title}</strong>
                  <small>{entry.images.length} görsel</small>
                </span>
                <Pencil size={18} />
              </button>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
function JournalEditor({ entry, onClose, onSave, onDelete }) {
  const [value, setValue] = useState(entry),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(""),
    [error, setError] = useState(""),
    [confirm, setConfirm] = useState(false);
  const ref = useDialog(() => {
    if (!busy) onClose();
  });
  const update = (key, val) => setValue((v) => ({ ...v, [key]: val }));
  async function addImages(e) {
    const files = [...e.target.files];
    e.target.value = "";
    if (value.images.length + files.length > 12) {
      setError("Bir kayda en fazla 12 görsel ekleyebilirsin.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const images = [];
      for (const [i, file] of files.entries()) {
        setProgress(`${i + 1}/${files.length} görsel hazırlanıyor…`);
        images.push(await prepareImage(file));
      }
      setValue((v) => ({ ...v, images: [...v.images, ...images] }));
    } catch (err) {
      setError(err.message || "Görseller okunamadı.");
    } finally {
      setBusy(false);
      setProgress("");
    }
  }
  function move(index, direction) {
    const images = [...value.images];
    [images[index], images[index + direction]] = [
      images[index + direction],
      images[index],
    ];
    update("images", images);
  }
  return (
    <div
      className="modal-backdrop"
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      <form
        className="editor journal-editor"
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Günlük kaydı düzenleyici"
        onClick={(e) => e.stopPropagation()}
        onSubmit={async (e) => {
          e.preventDefault();
          if (!value.images.length) {
            setError("En az bir görsel ekle.");
            return;
          }
          setBusy(true);
          setError("");
          try {
            await onSave(value, setProgress);
          } catch (err) {
            setError(err.data || "Kayıt yayımlanamadı. Tekrar dene.");
          } finally {
            setBusy(false);
            setProgress("");
          }
        }}
      >
        <button
          className="close"
          type="button"
          aria-label="Düzenleyiciyi kapat"
          disabled={busy}
          onClick={onClose}
        >
          <X />
        </button>
        <span className="eyebrow">ART JOURNAL</span>
        <h2>{entry.id ? "Bir sayfaya yeniden bakmak." : "Bugünden bir iz."}</h2>
        <label>
          Kayıt başlığı
          <input
            required
            maxLength={120}
            value={value.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="Aklımda kalan…"
          />
        </label>
        <label>
          Kayıt tarihi
          <input
            required
            type="date"
            value={value.date}
            onChange={(e) => update("date", e.target.value)}
          />
        </label>
        <label>
          Günlük metni
          <textarea
            rows={6}
            maxLength={20000}
            value={value.body}
            onChange={(e) => update("body", e.target.value)}
            placeholder="Bugün ne üzerinde çalıştım, neler gördüm, neler hissettim?"
          />
        </label>
        <div className="settings-section-heading">
          <h3>Görsel notlarım</h3>
          <span>{value.images.length}/12</span>
        </div>
        <p className="settings-intro">
          İlk görsel kapakta görünür. Sıralamayı oklarla değiştirebilirsin.
        </p>
        <div className="journal-image-editor">
          {value.images.map((image, index) => (
            <div className="journal-upload-row" key={index}>
              <img
                src={image.thumb || image.image}
                alt={`${index + 1}. görsel önizlemesi`}
              />
              <div>
                <label>
                  {index === 0 ? "Kapak görseli" : `${index + 1}. görsel`}
                  <textarea
                    rows={2}
                    maxLength={1000}
                    aria-label={`Görsel ${index + 1} açıklaması`}
                    placeholder="Bu kareye dair bir not…"
                    value={image.caption}
                    onChange={(e) =>
                      update(
                        "images",
                        value.images.map((img, i) =>
                          i === index
                            ? { ...img, caption: e.target.value }
                            : img,
                        ),
                      )
                    }
                  />
                </label>
                <div className="image-row-actions">
                  <button
                    type="button"
                    aria-label={`${index + 1}. görseli öne al`}
                    disabled={busy || index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowRight className="arrow-back" size={15} />
                  </button>
                  <button
                    type="button"
                    aria-label={`${index + 1}. görseli arkaya al`}
                    disabled={busy || index === value.images.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowRight size={15} />
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    aria-label={`${index + 1}. görseli kaldır`}
                    onClick={() =>
                      update(
                        "images",
                        value.images.filter((_, i) => i !== index),
                      )
                    }
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <label className="journal-upload">
          <ImagePlus size={22} />
          <span>
            Görselleri seç
            <small>Birlikte seçebilirsin · Her biri en fazla 30 MB</small>
          </span>
          <input
            aria-label="Günlük görselleri"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            disabled={busy || value.images.length >= 12}
            onChange={addImages}
          />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {progress && (
          <p className="settings-intro" role="status">
            {progress}
          </p>
        )}
        <div className="editor-actions">
          {entry.id && (
            <button
              type="button"
              className="delete"
              disabled={busy}
              onClick={async () => {
                if (!confirm) {
                  setConfirm(true);
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
              <Trash2 size={15} />
              {confirm ? "Kaydı silmeyi onayla" : "Kaydı sil"}
            </button>
          )}
          <button className="primary" type="submit" disabled={busy}>
            {busy ? "Kaydediliyor…" : "Kaydı yayımla"}
            <ArrowUpRight size={17} />
          </button>
        </div>
      </form>
    </div>
  );
}
