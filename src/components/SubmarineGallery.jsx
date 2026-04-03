import ImageGallery from './ImageGallery';

export default function SubmarineGallery({ title, main_image, additional_images }) {
    return (
        <ImageGallery
            className="submarine-section submarine-gallery glass-card"
            title={title}
            heading="Gallery"
            mainImage={main_image}
            additionalImages={additional_images}
            includeMainImage
            showEmptyPlaceholder
            emptyPlaceholderText="No images available."
            previewAlt={(index) => `${title || 'Submarine'} - image ${index + 1}`}
            thumbnailAriaLabel={(index) => `Show image ${index + 1}`}
        />
    );
}
