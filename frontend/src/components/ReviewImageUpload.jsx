import { Camera } from "lucide-react";

const ReviewImageUpload = ({ image, setImage }) => {
    return (
        <>
            <label className="review-upload">
                <Camera size={24} />
                사진 업로드

                <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => setImage(e.target.files[0])}
                />
            </label>

            {image && (
                <p className="image-name">
                    {image.name}
                </p>
            )}
        </>
    );
};

export default ReviewImageUpload;