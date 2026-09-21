# Atelier

Türkçe sanatçı galerisi. React + Vite arayüzü, Convex veritabanı ve dosya depolaması.

## Ortamlar

- Dev: `https://marvelous-chickadee-389.eu-west-1.convex.cloud`
- Prod: `https://upbeat-lynx-61.eu-west-1.convex.cloud`
- Convex projesi: `ali-kaner/galery`

`.env.local` geliştirme ortamını seçer; `.env.production` üretim derlemesini production backend'e bağlar. Dev/prod verileri ayrıdır. Örnek eserler ve günlük kayıtları yalnızca dev ortamına eklendi.

```sh
npm install
npm run dev:all
```

Yalnızca arayüz: `npm run dev`. Yalnızca Convex: `npm run dev:backend`.

## Stüdyo erişimi

Galeri okumaları herkese açıktır. Ekleme, düzenleme, silme ve yükleme URL'si oluşturma işlemleri sunucuda `ATELIER_ADMIN_KEY` ile korunur. Bu tek sanatçılı sürümde hesap/parola sistemi yerine rastgele, 256-bit bir stüdyo anahtarı kullanılır.

İlk kurulumda `npm run setup:admin`, anahtarı git dışında, 0600 izinli `.env.admin.local` dosyasına yazar ve dev/prod Convex ortamlarına ekler. Var olan farklı bir anahtarın üzerine yazmaz. Anahtarı uygulamadaki “Sanatçı stüdyosu” girişine yapıştır. Anahtar sekmenin sessionStorage'ında saklanır; çıkışta temizlenir. Anahtarı `VITE_*` değişkenlerine koyma.

## Veri ve dosyalar

- `convex/schema.ts`: eser alanları, etiketler, profil ayarları, günlük kayıtları, dosya referansları ve aktarım indeksleri.
- `convex/works.ts`: gerçek zamanlı liste, yetkili CRUD, yükleme URL'leri ve sunucu doğrulaması.
- Yüklemede 900px WebP önizleme ve orijinal ayrı dosyalar olarak Convex Storage'a gönderilir. Liste önizlemeyi, detay orijinali indirir. En fazla 30 MB; JPG, PNG, WebP, GIF.
- Eser silinince veya görsel değiştirilince kullanılmayan bağlı dosyalar silinir. Yarım kalan, 24 saatten eski yüklemeler günlük görevle temizlenir.
- `updatedAt` revizyon kontrolü eşzamanlı düzenlemelerin birbirini ezmesini önler.
- Eski IndexedDB kayıtları varsa, stüdyoda “Yerel eserleri aktar” düğmesi görünür. Aktarım tekrar denenebilir; aynı kaynak kimliğine sahip eser ikinci kez eklenmez. Örnek eserlerdeki yerel düzenlemeler de korunur. Kaynak tarayıcı verileri silinmez. Dev'e aktarım prod'a aktarım yapmaz; her ortam ayrıdır.

## Profil ve görünüm

Stüdyodaki **Bilgi & görünüm** bölümünden isim, kısa unvan, hakkında yazısı, konum, e-posta, telefon, profil fotoğrafı, marka logosu ve 12 adede kadar bağlantı düzenlenir. Ana başlığın iki satırı, üst etiketi ve giriş yazısı da değiştirilebilir. Arka plan, vurgu ve metin rengi renk seçiciyle veya doğrudan hex kodu yazılarak ayarlanır; metin rengi boş bırakılırsa açık/koyu arka plana göre otomatik uyarlanır. Değişiklikler kaydedilmeden önce küçük bir site önizlemesinde görülür. Marka logosu yüklenirse başlıktaki ve altbilgideki çizgi imzasının yerini alır; SVG, PNG, JPG veya WebP olabilir, en fazla 5 MB. Fotoğraf ve logo sırasıyla 800px WebP ve orijinal formatında saklanır; değiştirilen veya kaldırılan dosyalar temizlenir. Tüm bilgiler ziyaretçilere açıktır.

Yıldızlar ve hazır ikon paketi kaldırıldı. `src/icons.jsx` portfolyoya özel açık konturlu SVG çizgiler içerir. Atmosfer efektleri ve müzik kaldırıldı; eser etiketleri ve filtreleme devam eder.

## Art journal

`convex/journal.ts` günlük kayıtlarını tarihe göre sıralar. Her kayıt başlık, tarih, metin ve 1–12 görsel içerir. Her görsele ayrı açıklama eklenebilir. Stüdyodaki **Art journal** bölümünde ekleme, düzenleme, görsel sıralama ve silme bulunur; ilk görsel kapaktır.

Galeri ve Günlüğüm sayfasındaki zaman çizgisi yatay kayar; oklar, yatay kaydırma ve mobil dokunma desteklenir. `/#journal/<id>` kalıcı bir kayıt bağlantısıdır. `/#journal/<id>/image/<index>` büyük görseli açar. Görsel görünümünde yön tuşları ve Escape desteklenir. Kartlar küçük önizleme yükler; büyük görünüm orijinali indirir. Kayıt silme ve görsel kaldırma dosyaları da temizler.

Geliştirme örnek günlüğü: `npx convex run journal:samples` (yalnızca günlük boşsa ekler).

## Dağıtım

```sh
npm run deploy:backend
npm run build
```

İlk komut Convex production backend'ini günceller. İkinci komut production Convex adresini kullanan `dist/` üretir; frontend hosting'e ayrıca dağıtılır. `npx convex dev --once` dev backend'ini günceller.

Örnek veri gerekirse yalnızca boş veritabanında: `npx convex run seed:samples`. Production'a örnekler otomatik eklenmez.

## Kontroller

```sh
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
```

Backend testleri izole convex-test ortamında yetki, doğrulama, revizyon çakışmaları, dosya temizliği, profil ayarları, günlük ve tekrar denenebilir aktarımı kontrol eder. E2E testi örnek verilerle hazırlanmış dev backend'i ve `.env.admin.local` gerektirir; geçici eser ve günlük kayıtları oluşturup farklı tarayıcı oturumunda görünmelerini, yükleme/düzenleme/silmeyi, profil ayarlarını, bağlantıları, büyük görselleri ve mobil yerleşimi test eder. Production üzerinde çalıştırılmamalıdır.

Convex kaynakları: [dosya yükleme](https://docs.convex.dev/file-storage/upload-files), [React istemcisi](https://docs.convex.dev/client/react/overview).
