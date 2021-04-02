export default function useTooltip({
  el,
  text,
  maxWidth = null,
  duration = 200,
  id,
}) {
  el = el.$el ? el.$el : el;
  let timer;

  el.onmouseover = () => {
    let tooltip = document.getElementsByClassName(`tooltip-${id}`)[0];
    if (tooltip) {
      clearTimeout(timer);
      tooltip.style.opacity = '1';
      return;
    }

    tooltip = document.createElement('div');
    const coords = el.getBoundingClientRect();

    tooltip.classList.add('tooltip');
    tooltip.classList.add(`tooltip-${id}`);
    tooltip.innerText = text;
    tooltip.style.transform = 'scale(0)';
    document.body.append(tooltip);
    if (maxWidth !== null) {
      tooltip.style.maxWidth = `${maxWidth}px`;
    }
    tooltip.style.transition = `${duration}ms ease-in-out`;
    tooltip.style.top = `${coords.top - tooltip.clientHeight - 12}px`;
    tooltip.style.left = `${coords.left - tooltip.clientWidth / 2 + el.clientWidth / 2}px`;
    tooltip.style.opacity = '1';
    tooltip.style.transform = 'scale(1)';
  };

  const removeTooltip = () => {
    const tooltip = document.getElementsByClassName(`tooltip-${id}`)[0];

    if (!tooltip) return;

    tooltip.style.opacity = 0;
    timer = setTimeout(() => {
      tooltip.remove();
    }, duration);
  };

  el.onmouseout = removeTooltip;

  let wasInDom = document.body.contains(el);
  const observer = new MutationObserver(() => {
    if (document.body.contains(el)) {
      wasInDom = true;
    } else if (wasInDom) {
      wasInDom = false;

      removeTooltip();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
