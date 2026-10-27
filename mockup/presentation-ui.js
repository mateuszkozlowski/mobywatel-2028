/* The gallery has one navigation model in the page and in the full-screen view. */
(() => {
  const select = document.querySelector('#slideSelect');
  const dialog = document.querySelector('#deckDialog');
  if (!select || !dialog) return;
  const open = document.querySelector('#openDeck');
  const close = document.querySelector('#closeDeck');
  const mainImage = document.querySelector('#deckImage');
  const fullImage = document.querySelector('#fullscreenImage');
  const mainCaption = document.querySelector('#deckCaption');
  const fullCaption = document.querySelector('#fullscreenCaption');
  const mainDescription = document.querySelector('#deckDescription');
  const fullDescription = document.querySelector('#fullscreenDescription');
  const previous = [document.querySelector('#inlinePrevious'), document.querySelector('#previousSlide')];
  const next = [document.querySelector('#inlineNext'), document.querySelector('#nextSlide')];
  const fallback = [...select.options].map((option, index) => ({
    title: option.textContent.replace(/^\d+ \/ \d+ · /, ''),
    index: index + 1,
    png: 'png/slide-' + String(index + 1).padStart(2, '0') + '.png'
  }));
  let items = fallback;
  try {
    const data = JSON.parse(document.querySelector('#presentationData').textContent);
    if (Array.isArray(data.items) && data.items.length === fallback.length) items = data.items;
  } catch { /* The static first slide and the select labels remain usable. */ }
  let index = 0;
  let previousOverflow = '';

  function show(value) {
    index = Math.max(0, Math.min(items.length - 1, value));
    const item = items[index];
    const label = String(index + 1).padStart(2, '0') + ' / ' + items.length + ' · ' + item.title;
    mainImage.src = fullImage.src = '/materialy/r57/' + fallback[index].png;
    mainImage.alt = fullImage.alt = 'Plansza ' + (index + 1) + '. ' + item.title;
    mainCaption.textContent = fullCaption.textContent = label;
    mainDescription.textContent = fullDescription.textContent = item.description || item.summary || item.title;
    select.value = String(index);
    previous.forEach(button => { button.disabled = index === 0; });
    next.forEach(button => { button.disabled = index === items.length - 1; });
    const focused = document.activeElement;
    for (let group = 0; group < previous.length; group++) {
      if (focused === next[group] && next[group].disabled) previous[group].focus();
      if (focused === previous[group] && previous[group].disabled) next[group].focus();
    }
    // Load only the next picture, without starting any application scenario.
    if (index + 1 < items.length) {
      const image = new Image();
      image.src = '/materialy/r57/' + fallback[index + 1].png;
    }
  }
  select.addEventListener('change', () => show(Number(select.value)));
  previous.forEach(button => button.addEventListener('click', () => show(index - 1)));
  next.forEach(button => button.addEventListener('click', () => show(index + 1)));
  open.addEventListener('click', () => {
    previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    close.focus();
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.body.style.overflow = previousOverflow;
    open.focus({preventScroll: true});
  });
  dialog.addEventListener('keydown', event => {
    const actions = {ArrowRight: () => show(index + 1), ArrowLeft: () => show(index - 1), Home: () => show(0), End: () => show(items.length - 1)};
    if (actions[event.key]) { event.preventDefault(); actions[event.key](); }
  });
  show(0);
})();
