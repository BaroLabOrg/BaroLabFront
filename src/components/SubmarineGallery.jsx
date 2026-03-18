import { useEffect, useState } from 'react';
import './SubmarineGallery.css';

function normalizeImages(mainImage, additionalImages) {
    const result = [];
    const pushIfValid = (value) => {
        const normalized = String(value || '').trim();
        if (!normalized) return;
        if (!result.includes(normalized)) {
            result.push(normalized);
        }
    };

    pushIfValid(mainImage);
    if (Array.isArray(additionalImages)) {
        additionalImages.forEach(pushIfValid);
    }

    return result;
}

export default function SubmarineGallery({ title, main_image, additional_images }) {
    const images = normalizeImages(main_image, additional_images);
    const [selectedImage, setSelectedImage] = useState(images[0] || null);
    const imagesKey = images.join('|');

    useEffect(() => {
        setSelectedImage(images[0] || null);
    }, [imagesKey]);

    if (images.length === 0) {
        return null;
    }

    const activeImage = images.includes(selectedImage) ? selectedImage : images[0];
    const activeImageIndex = Math.max(images.indexOf(activeImage), 0);

    return (
        <section className="submarine-section submarine-gallery glass-card">
            <h2>Галерея</h2>
            <div className="submarine-gallery-preview">
                <img
                    src={activeImage}
                    alt={`${title || 'Submarine'} - изображение ${activeImageIndex + 1}`}
                    loading="lazy"
                />
            </div>

            {images.length > 1 && (
                <div className="submarine-gallery-thumbnails">
                    {images.map((image, index) => (
                        <button
                            key={`${image}-${index}`}
                            type="button"
                            className={`submarine-gallery-thumb${activeImage === image ? ' active' : ''}`}
                            onClick={() => setSelectedImage(image)}
                            aria-label={`Показать изображение ${index + 1}`}
                        >
                            <img
                                src={image}
                                alt={`${title || 'Submarine'} - миниатюра ${index + 1}`}
                                loading="lazy"
                            />
                        </button>
                    ))}
                </div>
            )}
        </section>
    );
}
