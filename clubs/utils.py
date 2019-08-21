import bleach


def clean(text):
    """
    Uses bleach to sanitize HTML input with a larger group of exceptions.
    """
    return bleach.clean(
        text,
        tags=bleach.sanitizer.ALLOWED_TAGS + ['sub', 'sup', 'p', 'del', 'ins', 'span', 'div', 'h1', 'h2', 'h3', 'h4',
                                              'h5', 'h6', 'img', 'u', 'br', 'hr'],
        attributes={**bleach.sanitizer.ALLOWED_ATTRIBUTES, **{'*': ['style'], 'img': ['src', 'alt']}},
        styles=['color', 'background-color', 'text-align', 'font-size', 'font-family']
    )
