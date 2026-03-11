const CREATE_TAG_ERROR_MESSAGES = {
    TAG_ALREADY_EXISTS: 'Тег уже существует',
    INVALID_TAG_NAME: 'Некорректное название тега',
};

export function mapCreateTagError(error) {
    const messageFromCode = CREATE_TAG_ERROR_MESSAGES[error?.code];

    if (error?.code === 'INVALID_TAG_NAME' || error?.status === 400) {
        return {
            target: 'field',
            message: messageFromCode || error?.message || 'Некорректное название тега',
        };
    }

    if (messageFromCode) {
        return { target: 'form', message: messageFromCode };
    }

    if (error?.status === 401 || error?.status === 403) {
        return { target: 'form', message: 'Нужна авторизация' };
    }

    return {
        target: 'form',
        message: error?.message || 'Не удалось создать тег',
    };
}

