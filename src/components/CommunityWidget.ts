export function mountCommunityWidget(): void {
  // Discord invite links have been removed from the public UI.
}

  const widget = document.createElement('div');
  widget.className = 'community-widget';
  setTrustedHtml(widget, trustedHtml(`
    <div class="cw-pill">
      <a class="cw-cta" href="${DISCUSSION_URL}" target="_blank" rel="noopener">Join the Discord Community</a>
      <button class="cw-close" aria-label="${t('common.close')}">&times;</button>
    </div>
  `, "legacy direct innerHTML migration"));

  const dismiss = () => {
    setDismissed(DISMISSED_KEY);
    widget.classList.add('cw-hiding');
    setTimeout(() => widget.remove(), 300);
  };

  widget.querySelector('.cw-close')!.addEventListener('click', dismiss);

  document.body.appendChild(widget);
}
