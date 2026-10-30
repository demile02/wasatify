/* Based on the RPM Generator feedback widget supplied with this project. */
(function () {
  if (window.__feedbackWidgetLoaded) return;
  window.__feedbackWidgetLoaded = true;

  var pickMode = false;
  var highlightEl = null;
  var selectedElement = null;
  var highlightUpdateScheduled = false;
  var modal = null;
  var previousFocus = null;
  var commentIcon = '<svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;pointer-events:none"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>';
  var closeIcon = '<svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;pointer-events:none"><path d="m18 6-12 12"/><path d="m6 6 12 12"/></svg>';

  var fab = document.createElement('button');
  fab.id = 'fb-widget-fab';
  fab.type = 'button';
  fab.setAttribute('aria-label', 'Aktifkan mode komentar');
  fab.setAttribute('aria-pressed', 'false');
  fab.innerHTML = commentIcon;
  fab.title = 'Mode komentar';
  fab.style.cssText = 'position:fixed;right:20px;bottom:20px;z-index:45;display:grid;place-items:center;box-sizing:border-box;width:56px;height:56px;min-width:56px;min-height:56px;padding:0;border:0;border-radius:50%;appearance:none;-webkit-appearance:none;background:#FFB7B2;color:#292524;line-height:0;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;box-shadow:0 4px 20px -2px rgba(0,0,0,.2);';
  document.body.appendChild(fab);

  function updatePosition() {
    var path = window.location.pathname;
    var mobile = window.matchMedia('(max-width: 1023px)').matches;
    fab.style.width = mobile ? '44px' : '56px';
    fab.style.height = mobile ? '44px' : '56px';
    fab.style.minWidth = mobile ? '44px' : '56px';
    fab.style.minHeight = mobile ? '44px' : '56px';
    fab.style.right = mobile ? '4px' : '20px';
    if (mobile && (path.indexOf('/demo/teacher') === 0 || path.indexOf('/teacher') === 0)) {
      fab.style.bottom = 'calc(10.5rem + env(safe-area-inset-bottom))';
    } else if (mobile && (path.indexOf('/demo/students') === 0 || path.indexOf('/student') === 0)) {
      fab.style.bottom = 'calc(4.75rem + env(safe-area-inset-bottom))';
    } else {
      fab.style.bottom = 'calc(20px + env(safe-area-inset-bottom))';
    }
  }
  updatePosition();
  window.addEventListener('resize', updatePosition);
  window.addEventListener('popstate', updatePosition);
  document.addEventListener('click', function () { window.setTimeout(updatePosition, 120); });

  function clearHighlight() {
    if (highlightEl) {
      highlightEl.remove();
      highlightEl = null;
    }
    selectedElement = null;
  }

  function positionHighlight(el) {
    var rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;
    if (!highlightEl) {
      highlightEl = document.createElement('div');
      highlightEl.setAttribute('aria-hidden', 'true');
      highlightEl.style.cssText = 'position:fixed;z-index:44;pointer-events:none;box-sizing:border-box;border:2px dashed #FFB7B2;background:rgba(255,183,178,.15);border-radius:8px;';
      document.body.appendChild(highlightEl);
    }
    highlightEl.style.left = (rect.left - 2) + 'px';
    highlightEl.style.top = (rect.top - 2) + 'px';
    highlightEl.style.width = (rect.width + 4) + 'px';
    highlightEl.style.height = (rect.height + 4) + 'px';
  }

  function showHighlight(el) {
    if (!(el instanceof Element) || fab.contains(el) || (modal && modal.contains(el))) return;
    selectedElement = null;
    positionHighlight(el);
  }

  function scheduleSelectedHighlightUpdate() {
    if (!selectedElement || highlightUpdateScheduled) return;
    highlightUpdateScheduled = true;
    window.requestAnimationFrame(function () {
      highlightUpdateScheduled = false;
      if (!selectedElement || !document.contains(selectedElement)) {
        clearHighlight();
        return;
      }
      positionHighlight(selectedElement);
    });
  }

  function setPickMode(on) {
    pickMode = on;
    fab.style.background = on ? '#292524' : '#FFB7B2';
    fab.style.color = on ? '#FDFCF8' : '#292524';
    fab.innerHTML = on ? closeIcon : commentIcon;
    fab.setAttribute('aria-label', on ? 'Keluar dari mode komentar' : 'Aktifkan mode komentar');
    fab.setAttribute('aria-pressed', on ? 'true' : 'false');
    document.body.style.cursor = on ? 'crosshair' : '';
    clearHighlight();
  }

  function getSelector(el) {
    if (!(el instanceof Element)) return '';
    if (el.id) return '#' + (window.CSS && CSS.escape ? CSS.escape(el.id) : el.id);
    var parts = [];
    var current = el;
    while (current && current.nodeType === 1 && current !== document.body && parts.length < 4) {
      var tag = current.tagName.toLowerCase();
      var classes = typeof current.className === 'string' ? current.className.trim().split(/\s+/).filter(Boolean).slice(0, 2) : [];
      var selector = tag;
      if (classes.length) {
        selector += '.' + classes.map(function (name) {
          return window.CSS && CSS.escape ? CSS.escape(name) : name.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
        }).join('.');
      }
      var siblings = current.parentNode ? Array.prototype.filter.call(current.parentNode.children, function (child) { return child.tagName === current.tagName; }) : [];
      if (siblings.length > 1) selector += ':nth-of-type(' + (siblings.indexOf(current) + 1) + ')';
      parts.unshift(selector);
      current = current.parentNode;
    }
    return parts.join(' > ');
  }

  function closeModal(restoreFocus) {
    if (modal) {
      modal.remove();
      modal = null;
      if (restoreFocus && previousFocus && document.contains(previousFocus)) previousFocus.focus();
      clearHighlight();
    }
  }

  function openModal(el) {
    closeModal(false);
    selectedElement = el;
    positionHighlight(el);
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : fab;
    var tag = (el.tagName || '').toLowerCase();
    var snippet = (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 200);
    var selector = getSelector(el);

    modal = document.createElement('section');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'fb-widget-title');
    modal.style.cssText = 'position:fixed;z-index:999999;left:16px;right:16px;bottom:calc(90px + env(safe-area-inset-bottom));max-height:calc(100dvh - 120px);overflow:auto;width:auto;max-width:420px;margin:0 auto;box-sizing:border-box;background:#FDFCF8;color:#292524;border:1px solid #E7E5E0;border-radius:24px;padding:20px;box-shadow:0 8px 32px rgba(0,0,0,.18);font-family:inherit;';

    var title = document.createElement('h2');
    title.id = 'fb-widget-title';
    title.textContent = 'Komentar untuk <' + tag + '>';
    title.style.cssText = 'font-size:14px;font-weight:600;margin:0 0 8px;color:#57534E;';
    if (snippet) {
      var excerpt = document.createElement('p');
      excerpt.textContent = '“' + snippet + (snippet.length === 200 ? '…' : '') + '”';
      excerpt.style.cssText = 'font-size:13px;line-height:1.5;margin:0 0 12px;color:#57534E;';
      modal.appendChild(title);
      modal.appendChild(excerpt);
    } else {
      modal.appendChild(title);
    }

    var selectorText = document.createElement('code');
    selectorText.textContent = selector;
    selectorText.style.cssText = 'display:block;overflow-wrap:anywhere;margin:0 0 12px;padding:7px 9px;border-radius:8px;background:#F1EEE6;color:#44403C;font-size:11px;';

    var label = document.createElement('label');
    label.htmlFor = 'fb-widget-comment';
    label.textContent = 'Komentar';
    label.style.cssText = 'display:block;margin-bottom:6px;font-size:13px;font-weight:600;';
    var textarea = document.createElement('textarea');
    textarea.id = 'fb-widget-comment';
    textarea.setAttribute('maxlength', '2000');
    textarea.setAttribute('required', 'required');
    textarea.setAttribute('aria-label', 'Tulis komentar revisi');
    textarea.placeholder = 'Tulis revisi yang diinginkan…';
    textarea.rows = 3;
    textarea.style.cssText = 'display:block;width:100%;box-sizing:border-box;border:1px solid #E7E5E0;border-radius:14px;padding:12px;font-size:16px;font-family:inherit;resize:vertical;color:#292524;background:#fff;';

    var actions = document.createElement('div');
    actions.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;margin-top:12px;justify-content:flex-end;';
    var cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.textContent = 'Batal';
    cancel.style.cssText = 'min-height:44px;padding:10px 18px;border-radius:9999px;border:1px solid #E7E5E0;background:#fff;color:#292524;font-family:inherit;font-size:14px;font-weight:600;cursor:pointer;';
    var send = document.createElement('button');
    send.type = 'button';
    send.textContent = 'Kirim';
    send.style.cssText = 'min-height:44px;padding:10px 22px;border-radius:9999px;border:0;background:#FFB7B2;color:#292524;font-family:inherit;font-size:14px;font-weight:600;cursor:pointer;';
    cancel.addEventListener('click', function () { closeModal(true); });
    send.addEventListener('click', function () {
      var comment = textarea.value.trim();
      if (!comment) {
        textarea.focus();
        return;
      }
      send.disabled = true;
      send.textContent = 'Mengirim…';
      sendFeedback({
        page_url: location.href.split('?')[0] + location.hash,
        selector: selector,
        tag: tag,
        text_snippet: snippet,
        comment: comment,
        viewport: window.innerWidth + 'x' + window.innerHeight
      }, function (ok) {
        closeModal(true);
        toast(ok ? 'Komentar terkirim ✓' : 'Gagal mengirim. Coba lagi.');
      });
    });
    actions.appendChild(cancel);
    actions.appendChild(send);
    modal.appendChild(selectorText);
    modal.appendChild(label);
    modal.appendChild(textarea);
    modal.appendChild(actions);
    document.body.appendChild(modal);
    textarea.focus();
  }

  function sendFeedback(payload, callback) {
    payload.timestamp = new Date().toISOString();
    fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (response) {
      return response.json().then(function (body) { return response.ok && body && body.status === 'ok'; });
    }).then(callback).catch(function () { callback(false); });
  }

  function toast(message) {
    var notice = document.createElement('div');
    notice.setAttribute('role', 'status');
    notice.setAttribute('aria-live', 'polite');
    notice.textContent = message;
    notice.style.cssText = 'position:fixed;bottom:calc(90px + env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);z-index:999999;max-width:calc(100vw - 32px);background:#292524;color:#FDFCF8;padding:12px 22px;border-radius:9999px;font-family:inherit;font-size:14px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,.25);';
    document.body.appendChild(notice);
    window.setTimeout(function () { notice.remove(); }, 2800);
  }

  fab.addEventListener('click', function (event) {
    event.stopPropagation();
    setPickMode(!pickMode);
  });

  document.addEventListener('mouseover', function (event) {
    if (pickMode && !modal) showHighlight(event.target);
  }, true);
  document.addEventListener('focusin', function (event) {
    if (pickMode && !modal) showHighlight(event.target);
  }, true);
  document.addEventListener('click', function (event) {
    if (!pickMode || !(event.target instanceof Element)) return;
    if (fab.contains(event.target) || (modal && modal.contains(event.target))) return;
    event.preventDefault();
    event.stopPropagation();
    openModal(event.target);
  }, true);
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      closeModal(true);
      setPickMode(false);
      return;
    }
    if (!modal || event.key !== 'Tab') return;
    var focusable = modal.querySelectorAll('textarea, button');
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  document.addEventListener('scroll', scheduleSelectedHighlightUpdate, { capture: true, passive: true });
  window.addEventListener('resize', scheduleSelectedHighlightUpdate, { passive: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('scroll', scheduleSelectedHighlightUpdate, { passive: true });
    window.visualViewport.addEventListener('resize', scheduleSelectedHighlightUpdate, { passive: true });
  }
})();
