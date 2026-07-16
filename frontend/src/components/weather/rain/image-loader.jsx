/**
 * 파일: src/components/weather/rain/image-loader.jsx
 * 분류: 날씨 시각 효과 모듈
 *
 * 역할
 * - 비 애니메이션 내부에서 image-loader 관련 계산 또는 WebGL 처리를 담당합니다.
 *
 * 사용 기술
 * - Canvas/WebGL 보조 모듈
 *
 * 이 구조를 사용한 이유
 * - 페이지에서 반복되는 UI와 상태 로직을 파일 단위로 분리해 수정 범위를 줄입니다.
 * - 기능별 하위 폴더와 동일한 CSS 구조를 사용해 관련 파일을 쉽게 찾을 수 있습니다.
 * - 외부에서는 필요한 props 또는 Redux 상태만 사용하게 하여 컴포넌트 간 결합도를 낮춥니다.
 */
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

// 다른 파일에서 이 모듈을 기본 import할 수 있도록 내보냅니다.
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
