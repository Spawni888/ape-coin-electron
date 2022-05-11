const winFade = (
  win,
  cb = null,
  initialOpacity = null,
  duration = 200,
  fadeEveryXMs = 5,
) => {
  return new Promise((resolve) => {
    let opacity = win.getOpacity();
    if (initialOpacity !== null) {
      opacity = initialOpacity;
      win.setOpacity(opacity);
    }

    const targetOpacity = opacity === 1 ? 0 : 1;
    const targetZero = targetOpacity < opacity;
    const step = fadeEveryXMs / duration;

    const interval = setInterval(() => {
      if (targetZero && opacity > 0) {
        opacity -= step;
      } else if (!targetZero && opacity < 1) {
        opacity += step;
      } else {
        clearInterval(interval);
        if (cb !== null) cb(win);
        resolve();
      }

      win.setOpacity(opacity);
    }, fadeEveryXMs);
  });
};

const fadeOut = () =>

module.exports = winFade;
