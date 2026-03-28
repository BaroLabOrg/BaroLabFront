import { useEffect, useState } from 'react';
import './ImageGallery.css';

function resolveImage(value) {
    const normalized = String(value || '').trim();
    return normalized || null;
}

function normalizeImages(mainImage, additionalImages, includeMainImage) {
    const result = [];

    const pushUnique = (value) => {
        const normalized = resolveImage(value);
        if (!normalized) return;
        if (!result.includes(normalized)) {
            result.push(normalized);
        }
    };

    if (includeMainImage) {
        pushUnique(mainImage);
    }

    if (Array.isArray(additionalImages)) {
        additionalImages.forEach(pushUnique);
    }

    return result;
}

function resolveLabel(value, index, image, fallback) {
    if (typeof value === 'function') {
        return value(index, image);
    }

    const normalized = String(value || '').trim();
    if (normalized) {
        return normalized;
    }

    return fallback;
}

export default function ImageGallery({
    className = '',
    title = '',
    heading = '',
    mainImage,
    additionalImages = [],
    includeMainImage = true,
    showEmptyPlaceholder = false,
    emptyPlaceholderText = 'Изображения отсутствуют.',
    previewAlt = (index) => `Изображение ${index + 1}`,
    thumbnailAriaLabel = (index) => `Показать изображение ${index + 1}`,
}) {
    const images = normalizeImages(mainImage, additionalImages, includeMainImage);
    const imagesKey = images.join('|');
    const [selectedImage, setSelectedImage] = useState(images[0] || null);

    useEffect(() => {
        setSelectedImage(images[0] || null);
    }, [imagesKey]);

    if (images.length === 0 && !showEmptyPlaceholder) {
        return null;
    }

    const sectionClassName = ['image-gallery', className].filter(Boolean).join(' ');
    const activeImage = images.includes(selectedImage) ? selectedImage : images[0] || null;
    const activeImageIndex = activeImage ? Math.max(images.indexOf(activeImage), 0) : -1;

    return (
        <section className={sectionClassName}>
            {heading && <h2>{heading}</h2>}

            {activeImage ? (
                <>
                    <div className="image-gallery-preview">
                        <img
                            src={activeImage}
                            alt={resolveLabel(previewAlt, activeImageIndex, activeImage, `${title || 'Preview'}`)}
                            loading="lazy"
                        />
                    </div>

                    <div className="image-gallery-thumbnails">
                        {images.map((image, index) => (
                            <button
                                key={`${image}-${index}`}
                                type="button"
                                onClick={() => setSelectedImage(image)}
                                className={`image-gallery-thumbnail${activeImage === image ? ' active' : ''}`}
                                aria-label={resolveLabel(
                                    thumbnailAriaLabel,
                                    index,
                                    image,
                                    `Показать изображение ${index + 1}`,
                                )}
                                style={{
                                    backgroundImage: `url(${image})`,
                                }}
                            />
                        ))}
                    </div>
                </>
            ) : (
                <div className="image-gallery-placeholder" role="status" aria-live="polite">
                    <span className="image-gallery-placeholder-icon" aria-hidden="true">🖼</span>
                    <p>{emptyPlaceholderText}</p>
                </div>
            )}
        </section>
    );
}
