const CREATE_TAG_ERROR_MESSAGES = {
    TAG_ALREADY_EXISTS: 'Tag already exists',
    INVALID_TAG_NAME: 'Invalid tag name',
};

export function mapCreateTagError(error) {
    const messageFromCode = CREATE_TAG_ERROR_MESSAGES[error?.code];

    if (error?.code === 'INVALID_TAG_NAME' || error?.status === 400) {
        return {
            target: 'field',
            message: messageFromCode || error?.message || 'Invalid tag name',
        };
    }

    if (messageFromCode) {
        return { target: 'form', message: messageFromCode };
    }

    if (error?.status === 401 || error?.status === 403) {
        return { target: 'form', message: 'Authorization required' };
    }

    return {
        target: 'form',
        message: error?.message || 'Failed to create tag',
    };
}

