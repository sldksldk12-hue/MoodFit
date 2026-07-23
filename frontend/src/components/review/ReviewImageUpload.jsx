


import { Camera, X } from "lucide-react";

const MAX_IMAGE_SIZE = 1024 * 1024; // 1MB

const ReviewImageUpload = ({
  image,
  previewUrl,
  onChange,
  disabled = false,
}) => {
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드할 수 있습니다.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      alert("이미지는 1MB 이하만 업로드할 수 있습니다.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      onChange?.({
        file,
        previewUrl: String(reader.result),
      });
    };

    reader.onerror = () => {
      alert("이미지를 읽는 중 오류가 발생했습니다.");
      event.target.value = "";
    };

    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    onChange?.({
      file: null,
      previewUrl: "",
    });
  };

  return (
    <div className="review-image-upload">
      <label className="review-upload">
        <Camera size={24} />
        사진 업로드

        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          hidden
          disabled={disabled}
          onChange={handleFileChange}
        />
      </label>

      {image && (
        <div className="review-image-preview-wrap">
          <div className="review-image-file-row">
            <p className="image-name">{image.name}</p>

            <button
              type="button"
              className="review-image-remove"
              onClick={handleRemove}
              disabled={disabled}
              aria-label="선택한 이미지 삭제"
            >
              <X size={18} />
            </button>
          </div>

          {previewUrl && (
            <img
              className="review-image-preview"
              src={previewUrl}
              alt="리뷰 이미지 미리보기"
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewImageUpload;