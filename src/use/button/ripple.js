export default function useRipple(event) {
  function getCoords(elem) { // crossbrowser version
    const box = elem.getBoundingClientRect();

    const { body } = document;
    const docEl = document.documentElement;

    const scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
    const scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;

    const clientTop = docEl.clientTop || body.clientTop || 0;
    const clientLeft = docEl.clientLeft || body.clientLeft || 0;

    const top = box.top + scrollTop - clientTop;
    const left = box.left + scrollLeft - clientLeft;

    return { top: Math.round(top), left: Math.round(left) };
  }

  const button = event.currentTarget;
  const circle = document.createElement('span');
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;

  const buttonCoords = getCoords(button);
  // eslint-disable-next-line no-multi-assign
  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - (buttonCoords.left + radius)}px`;
  circle.style.top = `${event.clientY - (buttonCoords.top + radius)}px`;
  circle.classList.add('ripple');

  const ripple = button.getElementsByClassName('ripple')[0];

  if (ripple) {
    ripple.remove();
  }

  button.appendChild(circle);
}
