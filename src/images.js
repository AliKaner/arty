export async function prepareImage(file) {
  if (
    !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
      file.type,
    ) ||
    file.size > 30 * 1024 * 1024
  )
    throw new Error(
      "JPG, PNG, WebP veya GIF seç; her görsel en fazla 30 MB olabilir.",
    );
  const image = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Görsel okunamadı."));
    reader.readAsDataURL(file);
  });
  const img = new Image();
  img.src = image;
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = Math.min(900, img.width);
  canvas.height = Math.max(
    1,
    Math.round((img.height * canvas.width) / img.width),
  );
  canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
  return { image, thumb: canvas.toDataURL("image/webp", 0.82), caption: "" };
}
