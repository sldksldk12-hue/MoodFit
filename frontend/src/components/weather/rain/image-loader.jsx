function normalizeSource(value) {
  if (typeof value === "string") return value;
  if (value && typeof value.src === "string") return value.src;
  throw new Error("이미지 URL을 확인할 수 없습니다.");
}

function loadImage(source, index, onLoad) {
  return new Promise((resolve, reject) => {
    const item = typeof source === "string"
      ? { name: `image${index}`, src: source }
      : { ...source };

    const image = new Image();
    image.crossOrigin = "anonymous";
    item.img = image;

    image.addEventListener("load", () => {
      onLoad?.(image, index);
      resolve(item);
    });
    image.addEventListener("error", () => {
      reject(new Error(`이미지 로드 실패: ${normalizeSource(item.src)}`));
    });

    image.src = normalizeSource(item.src);
  });
}

export default async function loadImages(images, onLoad) {
  const loadedImages = await Promise.all(
    images.map((source, index) => loadImage(source, index, onLoad))
  );

  return Object.fromEntries(
    loadedImages.map((item) => [
      item.name,
      { img: item.img, src: normalizeSource(item.src) },
    ])
  );
}
