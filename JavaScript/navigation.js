// File written by Gemini https://share.gemini.google/898FkB6DJSOU
document.addEventListener('click', function(event) {
    let element = event.target;
    while (element && element.tagName !== 'A')
    {
        element = element.parentNode;
    }
    if (element && element.hasAttribute('href'))
    {
        const href = element.getAttribute('href');
        if (href.startsWith('/') || href.includes(window.location.hostname))
        {
            event.preventDefault();
            window.location.href = href;
        }
    }
}, false);