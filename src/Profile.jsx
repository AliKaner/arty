import React, { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Mail,
  Phone,
  MapPin,
  Plus,
  Trash2,
  X,
  Camera,
  InkMark,
} from "./icons";
function isDarkBackground(hex) {
  const clean = hex.slice(1);
  const rgb = [0, 2, 4]
    .map((i) => parseInt(clean.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722 < 0.3;
}
function autoTextColor(backgroundColor) {
  return isDarkBackground(backgroundColor) ? "#f5f3eb" : "#302f2b";
}
function HexInput({ label, value, onChange }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  return (
    <input
      className="hex-input"
      aria-label={`${label} hex kodu`}
      value={text}
      maxLength={7}
      spellCheck={false}
      autoCapitalize="off"
      autoCorrect="off"
      onChange={(e) => {
        let raw = e.target.value.trim();
        if (raw && raw[0] !== "#") raw = `#${raw}`;
        setText(raw);
        if (/^#[0-9a-fA-F]{6}$/.test(raw)) onChange(raw);
      }}
    />
  );
}
export function BrandMark({ logo, size = 33 }) {
  if (logo)
    return (
      <img
        className="brand-mark"
        src={logo}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
      />
    );
  return <InkMark size={size} />;
}
export function useProfileTheme(profile) {
  useEffect(() => {
    if (!profile) return;
    const root = document.documentElement;
    const dark = isDarkBackground(profile.backgroundColor);
    root.style.setProperty("--paper", profile.backgroundColor);
    root.style.setProperty("--orange", profile.accentColor);
    root.style.setProperty(
      "--ink",
      profile.textColor || autoTextColor(profile.backgroundColor),
    );
    root.style.setProperty("--muted", dark ? "#c4c2b8" : "#85857b");
    root.style.setProperty("--line", dark ? "#ffffff30" : "#00000020");
    root.dataset.theme = dark ? "dark" : "light";
    document.title = `${profile.name} — Atelier`;
  }, [profile]);
}
export function ArtistInfo({ profile, full = false }) {
  if (!profile) return null;
  return (
    <section
      className={`artist-info ${full ? "full" : ""}`}
      aria-label="Sanatçı bilgileri"
    >
      <div className="artist-identity">
        {profile.avatar ? (
          <img
            className="profile-avatar"
            src={profile.avatar}
            alt={`${profile.name} profil fotoğrafı`}
          />
        ) : (
          <span className="profile-avatar avatar-placeholder">
            {profile.name.trim().slice(0, 1).toLocaleUpperCase("tr")}
          </span>
        )}
        <div>
          <span className="eyebrow">KISACA BEN</span>
          <h2>{profile.name}</h2>
          <p>{profile.headline}</p>
          {profile.location && (
            <span className="profile-location">
              <MapPin size={12} />
              {profile.location}
            </span>
          )}
        </div>
      </div>
      <div className="artist-details">
        {profile.bio && <p className="profile-bio">{profile.bio}</p>}
        <div className="contact-links">
          {profile.email && (
            <a href={`mailto:${profile.email}`}>
              <Mail size={14} />
              {profile.email}
            </a>
          )}
          {profile.phone && (
            <a href={`tel:${profile.phone.replace(/[^+\d]/g, "")}`}>
              <Phone size={14} />
              {profile.phone}
            </a>
          )}
        </div>
        {profile.links.length > 0 && (
          <div className="artist-links">
            {profile.links.map((link, i) => (
              <a
                key={`${link.url}-${i}`}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.label}
                <ArrowUpRight size={14} />
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
export function ProfileEditor({ profile, onSave, onClose }) {
  const [value, setValue] = useState(() => ({
      ...profile,
      links: profile.links.map((l) => ({ ...l })),
    })),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const update = (key, val) => setValue((v) => ({ ...v, [key]: val }));
  useEffect(() => {
    const handle = (e) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", handle);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handle);
      document.body.style.overflow = previous;
    };
  }, [busy, onClose]);
  async function photo(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setError("JPG, PNG veya WebP seç; en fazla 5 MB.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const img = new Image();
      img.src = data;
      await img.decode();
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 800 / Math.max(img.width, img.height));
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      update("avatar", canvas.toDataURL("image/webp", 0.9));
    } catch {
      setError("Fotoğraf okunamadı. Başka bir dosya dene.");
    } finally {
      setBusy(false);
    }
  }
  async function logoFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (
      !["image/svg+xml", "image/png", "image/jpeg", "image/webp"].includes(
        file.type,
      ) ||
      file.size > 5 * 1024 * 1024
    ) {
      setError("SVG, PNG, JPG veya WebP seç; en fazla 5 MB.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      update("logo", data);
    } catch {
      setError("Logo okunamadı. Başka bir dosya dene.");
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
        className="editor profile-editor"
        role="dialog"
        aria-modal="true"
        aria-label="Bilgi ve görünüm"
        onClick={(e) => e.stopPropagation()}
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await onSave(value);
            onClose();
          } catch (err) {
            setError(err.data || "Kaydedilemedi. Bağlantını kontrol et.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <button
          className="close"
          type="button"
          aria-label="Kapat"
          disabled={busy}
          onClick={onClose}
        >
          <X />
        </button>
        <span className="eyebrow">SENİN KÖŞEN</span>
        <h2>Biraz da seni tanıyalım.</h2>
        <p className="settings-intro">
          Buraya eklediğin bilgiler ziyaretçilerinle paylaşılır.
        </p>
        <div className="avatar-settings">
          {value.avatar ? (
            <img
              className="profile-avatar"
              src={value.avatar}
              alt="Profil önizlemesi"
            />
          ) : (
            <span className="profile-avatar avatar-placeholder">
              <Camera />
            </span>
          )}
          <div>
            <label className="avatar-upload">
              Profil fotoğrafı seç
              <input
                aria-label="Profil fotoğrafı"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={busy}
                onChange={photo}
              />
            </label>
            <small>JPG, PNG, WebP · En fazla 5 MB</small>
            {value.avatar && (
              <button
                className="remove-avatar"
                type="button"
                onClick={() =>
                  setValue((v) => ({ ...v, avatar: null, avatarId: undefined }))
                }
              >
                Fotoğrafı kaldır
              </button>
            )}
          </div>
        </div>
        <div className="form-row">
          <label>
            İsim / sanatçı adı
            <input
              required
              maxLength={100}
              value={value.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Seni nasıl tanıyalım?"
            />
          </label>
          <label>
            Kısa unvan
            <input
              maxLength={160}
              value={value.headline}
              onChange={(e) => update("headline", e.target.value)}
              placeholder="İllüstratör, dijital sanatçı…"
            />
          </label>
        </div>
        <div className="settings-section-heading">
          <h3>İlk karşılaşma</h3>
        </div>
        <label>
          Başlığın üstündeki kısa yazı
          <input
            maxLength={100}
            value={value.heroEyebrow}
            onChange={(e) => update("heroEyebrow", e.target.value)}
          />
        </label>
        <div className="form-row">
          <label>
            Ana başlık · 1. satır
            <input
              required
              maxLength={70}
              value={value.heroLine1}
              onChange={(e) => update("heroLine1", e.target.value)}
            />
          </label>
          <label>
            Ana başlık · 2. satır
            <input
              required
              maxLength={70}
              value={value.heroLine2}
              onChange={(e) => update("heroLine2", e.target.value)}
            />
          </label>
        </div>
        <label>
          Giriş yazısı
          <textarea
            rows={3}
            maxLength={600}
            value={value.heroIntro}
            onChange={(e) => update("heroIntro", e.target.value)}
          />
        </label>
        <label>
          Hakkında
          <textarea
            rows={4}
            maxLength={5000}
            value={value.bio}
            onChange={(e) => update("bio", e.target.value)}
            placeholder="Hikâyeni, ilhamını, üretme biçimini anlat…"
          />
        </label>
        <label>
          Konum
          <input
            maxLength={120}
            value={value.location}
            onChange={(e) => update("location", e.target.value)}
            placeholder="İstanbul, Türkiye"
          />
        </label>
        <div className="form-row">
          <label>
            E-posta
            <input
              type="email"
              maxLength={254}
              value={value.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="merhaba@ornek.com"
            />
          </label>
          <label>
            Telefon
            <input
              type="tel"
              maxLength={40}
              value={value.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="+90 555 123 45 67"
            />
          </label>
        </div>
        <div className="settings-section-heading">
          <h3>İnternetteki izlerin</h3>
          <span>{value.links.length}/12</span>
        </div>
        <p className="settings-intro">
          ArtStation, Behance, Instagram, kişisel siten…
        </p>
        <div className="social-fields">
          {value.links.map((link, index) => (
            <div className="social-field" key={index}>
              <input
                aria-label={`Bağlantı ${index + 1} adı`}
                required
                maxLength={60}
                placeholder="Platform / bağlantı adı"
                value={link.label}
                onChange={(e) =>
                  update(
                    "links",
                    value.links.map((l, i) =>
                      i === index ? { ...l, label: e.target.value } : l,
                    ),
                  )
                }
              />
              <input
                aria-label={`Bağlantı ${index + 1} adresi`}
                required
                type="url"
                maxLength={2048}
                placeholder="https://…"
                value={link.url}
                onChange={(e) =>
                  update(
                    "links",
                    value.links.map((l, i) =>
                      i === index ? { ...l, url: e.target.value } : l,
                    ),
                  )
                }
              />
              <button
                type="button"
                aria-label={`Bağlantı ${index + 1} sil`}
                onClick={() =>
                  update(
                    "links",
                    value.links.filter((_, i) => i !== index),
                  )
                }
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
        <button
          className="add-link"
          type="button"
          disabled={value.links.length >= 12}
          onClick={() =>
            update("links", [...value.links, { label: "", url: "" }])
          }
        >
          <Plus size={14} /> Bağlantı ekle
        </button>
        <div className="settings-section-heading">
          <h3>Marka logosu</h3>
        </div>
        <div className="avatar-settings logo-settings">
          <span className="logo-preview">
            <BrandMark logo={value.logo} size={30} />
          </span>
          <div>
            <label className="avatar-upload">
              Logo seç
              <input
                aria-label="Logo"
                type="file"
                accept="image/svg+xml,image/png,image/jpeg,image/webp"
                disabled={busy}
                onChange={logoFile}
              />
            </label>
            <small>SVG, PNG, JPG, WebP · En fazla 5 MB</small>
            {value.logo && (
              <button
                className="remove-avatar"
                type="button"
                onClick={() =>
                  setValue((v) => ({ ...v, logo: null, logoId: undefined }))
                }
              >
                Logoyu kaldır
              </button>
            )}
          </div>
        </div>
        <div className="settings-section-heading">
          <h3>Galerinin renkleri</h3>
        </div>
        <div className="color-fields">
          <label>
            Arka plan rengi
            <div>
              <input
                type="color"
                aria-label="Arka plan rengi"
                value={value.backgroundColor}
                onChange={(e) => update("backgroundColor", e.target.value)}
              />
              <HexInput
                label="Arka plan rengi"
                value={value.backgroundColor}
                onChange={(hex) => update("backgroundColor", hex)}
              />
            </div>
          </label>
          <label>
            Vurgu rengi
            <div>
              <input
                type="color"
                aria-label="Vurgu rengi"
                value={value.accentColor}
                onChange={(e) => update("accentColor", e.target.value)}
              />
              <HexInput
                label="Vurgu rengi"
                value={value.accentColor}
                onChange={(hex) => update("accentColor", hex)}
              />
            </div>
          </label>
          <label>
            Metin rengi
            <div>
              <input
                type="color"
                aria-label="Metin rengi"
                value={value.textColor || autoTextColor(value.backgroundColor)}
                onChange={(e) => update("textColor", e.target.value)}
              />
              <HexInput
                label="Metin rengi"
                value={value.textColor || autoTextColor(value.backgroundColor)}
                onChange={(hex) => update("textColor", hex)}
              />
            </div>
          </label>
        </div>
        <div className="color-presets">
          {[
            ["Kâğıt", "#f6f4ee", "#cb643e"],
            ["Gece", "#252a2d", "#eab181"],
            ["Lavanta", "#efedf6", "#80639e"],
            ["Adaçayı", "#eef1e8", "#6f8158"],
          ].map(([name, bg, accent]) => (
            <button
              key={name}
              type="button"
              onClick={() =>
                setValue((v) => ({
                  ...v,
                  backgroundColor: bg,
                  accentColor: accent,
                  textColor: "",
                }))
              }
            >
              <span style={{ background: bg, borderColor: accent }} />
              {name}
            </button>
          ))}
        </div>
        <div
          className="theme-preview"
          style={{
            background: value.backgroundColor,
            borderColor: value.accentColor,
            color: value.textColor || autoTextColor(value.backgroundColor),
          }}
        >
          <span className="theme-preview-brand" style={{ color: value.accentColor }}>
            <BrandMark logo={value.logo} size={20} /> {value.name || "Atelier"}
          </span>
          <strong className="theme-preview-heading">
            Biraz düş, biraz dünya.
          </strong>
          <p className="theme-preview-text">
            İçimden geçenleri renk, çizgi ve ışıkla anlatıyorum.
          </p>
          <span
            className="theme-preview-button"
            style={{ color: value.accentColor }}
          >
            <Plus size={12} /> Yeni eser ekle
          </span>
        </div>
        <p className="theme-preview-caption">Sitenin küçük önizlemesi</p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="editor-actions">
          <button type="button" disabled={busy} onClick={onClose}>
            Vazgeç
          </button>
          <button className="primary" disabled={busy}>
            {busy ? "Kaydediliyor…" : "Bilgileri kaydet"}
            <ArrowUpRight size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
