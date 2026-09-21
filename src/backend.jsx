import React, { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { X, ArrowUpRight } from "./icons";
const sessionKey = "atelier-admin";
export function useGallery() {
  const rows = useQuery(api.works.list);
  const profile = useQuery(api.profile.get),
    updateProfile = useMutation(api.profile.save);
  const save = useMutation(api.works.save),
    remove = useMutation(api.works.remove),
    getUploadUrl = useMutation(api.works.generateUploadUrl),
    discard = useMutation(api.works.discardUploads),
    verify = useMutation(api.works.verifyAdmin);
  const entries = useQuery(api.journal.list),
    writeJournal = useMutation(api.journal.save),
    removeJournal = useMutation(api.journal.remove);
  const [key, setKey] = useState(
    () => sessionStorage.getItem(sessionKey) || "",
  );
  async function login(value) {
    await verify({ key: value });
    sessionStorage.setItem(sessionKey, value);
    setKey(value);
  }
  function logout() {
    sessionStorage.removeItem(sessionKey);
    setKey("");
  }
  async function upload(data, ids) {
    const blob = await (await fetch(data)).blob();
    const url = await getUploadUrl({ key });
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": blob.type },
      body: blob,
    });
    if (!response.ok) throw new Error("Görsel yüklenemedi.");
    const { storageId } = await response.json();
    ids.push(storageId);
    return storageId;
  }
  async function saveWork(w, migrationKey) {
    const uploaded = [];
    try {
      const work = Object.fromEntries(
        [
          "title",
          "category",
          "date",
          "medium",
          "description",
          "tags",
          "ratio",
        ].map((k) => [k, w[k]]),
      );
      if (w.image.startsWith("data:")) {
        work.storageId = await upload(w.image, uploaded);
        work.thumbnailId = await upload(w.thumb || w.image, uploaded);
      } else if (w.storageId) {
        work.storageId = w.storageId;
        work.thumbnailId = w.thumbnailId;
      } else {
        work.externalImage = w.externalImage || w.image;
        work.externalThumbnail = w.externalThumbnail || w.thumb || w.image;
      }
      return await save({
        key,
        work,
        ...(migrationKey
          ? { migrationKey }
          : w.id
            ? { id: w.id, expectedUpdatedAt: w.updatedAt }
            : {}),
      });
    } catch (error) {
      if (uploaded.length)
        await discard({ key, ids: uploaded }).catch(() => {});
      throw error;
    }
  }
  async function saveProfile(value) {
    const uploaded = [];
    try {
      const profile = Object.fromEntries(
        [
          "name",
          "headline",
          "bio",
          "location",
          "email",
          "phone",
          "links",
          "backgroundColor",
          "accentColor",
          "heroLine1",
          "heroLine2",
          "heroIntro",
          "heroEyebrow",
        ].map((k) => [k, value[k]]),
      );
      if (value.avatar?.startsWith("data:"))
        profile.avatarId = await upload(value.avatar, uploaded);
      else if (value.avatarId) profile.avatarId = value.avatarId;
      await updateProfile({
        key,
        profile,
        expectedUpdatedAt: value.updatedAt || 0,
      });
    } catch (error) {
      if (uploaded.length)
        await discard({ key, ids: uploaded }).catch(() => {});
      throw error;
    }
  }
  async function saveJournal(value, onProgress = () => {}) {
    const uploaded = [];
    try {
      const images = [];
      for (const [index, image] of value.images.entries()) {
        onProgress(`${index + 1}/${value.images.length} görsel kaydediliyor…`);
        if (image.image.startsWith("data:"))
          images.push({
            storageId: await upload(image.image, uploaded),
            thumbnailId: await upload(image.thumb, uploaded),
            caption: image.caption,
          });
        else if (image.storageId)
          images.push({
            storageId: image.storageId,
            thumbnailId: image.thumbnailId,
            caption: image.caption,
          });
        else
          images.push({
            externalImage: image.externalImage || image.image,
            externalThumbnail:
              image.externalThumbnail || image.thumb || image.image,
            caption: image.caption,
          });
      }
      return await writeJournal({
        key,
        entry: {
          title: value.title,
          date: value.date,
          body: value.body,
          images,
        },
        ...(value.id
          ? { id: value.id, expectedUpdatedAt: value.updatedAt }
          : {}),
      });
    } catch (error) {
      if (uploaded.length)
        await discard({ key, ids: uploaded }).catch(() => {});
      throw error;
    }
  }
  return {
    entries,
    saveJournal,
    deleteJournal: (entry) =>
      removeJournal({ key, id: entry.id, expectedUpdatedAt: entry.updatedAt }),
    profile,
    saveProfile,
    works: rows || [],
    ready: rows !== undefined,
    key,
    login,
    logout,
    saveWork,
    deleteWork: (w) =>
      remove({ key, id: w.id, expectedUpdatedAt: w.updatedAt }),
  };
}
export function Login({ onClose, onLogin }) {
  const [value, setValue] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="editor login"
        role="dialog"
        aria-modal="true"
        aria-label="Stüdyo girişi"
        onClick={(e) => e.stopPropagation()}
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await onLogin(value);
          } catch (err) {
            setError(err.data || "Giriş yapılamadı. Bağlantını kontrol et.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <button
          type="button"
          className="close"
          onClick={onClose}
          aria-label="Kapat"
        >
          <X />
        </button>
        <span className="eyebrow">SANATÇI STÜDYOSU</span>
        <h2>Yeniden hoş geldin.</h2>
        <label>
          Stüdyo anahtarı
          <input
            autoFocus
            required
            type="password"
            autoComplete="current-password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="primary" disabled={busy}>
          {busy ? "Kontrol ediliyor…" : "Stüdyoya gir"}
          <ArrowUpRight size={16} />
        </button>
      </form>
    </div>
  );
}
// Read the previous version without modifying/deleting its IndexedDB records.
async function readLegacy() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("atelier-store", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("works");
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("works")) {
        db.close();
        resolve([]);
        return;
      }
      const read = db.transaction("works").objectStore("works").get("all");
      read.onsuccess = () => {
        db.close();
        resolve(read.result || []);
      };
      read.onerror = () => {
        db.close();
        reject(read.error);
      };
    };
  });
}
export function LocalImport({ saveWork, onMessage }) {
  const [local, setLocal] = useState([]),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    readLegacy()
      .then(setLocal)
      .catch(() => {});
  }, []);
  if (!local.length) return <span>Tüm eserlerin güvenle saklanıyor.</span>;
  return (
    <button
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        let count = 0;
        try {
          for (const work of local) {
            await saveWork(work, `legacy:${work.id}`);
            count++;
          }
          onMessage("Yerel eserler aktarıldı. Eski kayıtların korundu.");
          setLocal([]);
        } catch (err) {
          onMessage(
            `${count} eser işlendi. ${err.data || "Aktarım tamamlanamadı; tekrar deneyebilirsin."}`,
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? "Eserler aktarılıyor…" : `Yerel eserleri aktar (${local.length})`}
    </button>
  );
}
