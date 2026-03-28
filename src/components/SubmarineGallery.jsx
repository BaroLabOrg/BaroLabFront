import ImageGallery from './ImageGallery';

export default function SubmarineGallery({ title, main_image, additional_images }) {
    return (
        <ImageGallery
            className="submarine-section submarine-gallery glass-card"
            title={title}
            heading="Галерея"
            mainImage={main_image}
            additionalImages={additional_images}
            includeMainImage
            showEmptyPlaceholder
            emptyPlaceholderText="Изображения отсутствуют."
            previewAlt={(index) => `${title || 'Submarine'} - изображение ${index + 1}`}
            thumbnailAriaLabel={(index) => `Показать изображение ${index + 1}`}
        />
    );
}
