// (() => {
//   // 即時実行
// })();
// loading から hero animation まで
document.addEventListener('DOMContentLoaded', () => {
  const bnr = document.querySelector('.lcl-fixbnr');
  const bnrClose = document.querySelector('.lcl-fixbnr__close');
  if (bnr && bnrClose) {
    bnrClose.addEventListener('click', () => {
      bnr.classList.add('lcl-fixbnr--hidden');
    });
  }
});
