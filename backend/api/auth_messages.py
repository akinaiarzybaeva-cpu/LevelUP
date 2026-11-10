SUPPORTED_AUTH_LANGUAGES = {"ru", "ky", "en"}

AUTH_MESSAGES = {
    "email_required": {
        "ru": "Электронная почта обязательна.",
        "ky": "Электрондук почта милдеттүү.",
        "en": "Email is required.",
    },
    "full_name_required": {
        "ru": "Пожалуйста, укажите полное имя.",
        "ky": "Толук аты-жөнүңүздү киргизиңиз.",
        "en": "Please enter your full name.",
    },
    "invalid_email_format": {
        "ru": "Введите корректный email.",
        "ky": "Туура email дарегин киргизиңиз.",
        "en": "Please enter a valid email address.",
    },
    "password_too_short": {
        "ru": "Пароль должен содержать не менее 8 символов.",
        "ky": "Сырсөз кеминде 8 белгиден турушу керек.",
        "en": "Password must be at least 8 characters long.",
    },
    "email_exists": {
        "ru": "Этот электронный адрес уже зарегистрирован. Войдите в свой аккаунт.",
        "ky": "Бул электрондук почта менен аккаунт мурунтан эле катталган. Аккаунтуңузга кириңиз.",
        "en": "This email is already registered. Please log in to your account.",
    },
    "invalid_credentials": {
        "ru": "Неверный email или пароль.",
        "ky": "Email же сырсөз туура эмес.",
        "en": "Incorrect email or password.",
    },
    "inactive_account": {
        "ru": "Этот аккаунт отключен.",
        "ky": "Бул аккаунт өчүрүлгөн.",
        "en": "This account is disabled.",
    },
}


def resolve_auth_language(request=None, payload=None):
    data = payload or {}
    for key in ("preferred_language", "language"):
        value = str(data.get(key, "")).strip().lower()
        if value in SUPPORTED_AUTH_LANGUAGES:
            return value

    if request is not None:
        header = str(request.headers.get("Accept-Language", ""))
        for raw_part in header.split(","):
            part = raw_part.split(";")[0].strip().lower()
            base = part.split("-")[0]
            if base in SUPPORTED_AUTH_LANGUAGES:
                return base

    return "en"


def auth_message(key, language):
    item = AUTH_MESSAGES.get(key, {})
    return item.get(language) or item.get("en") or "Authentication error."
