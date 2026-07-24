document.addEventListener('DOMContentLoaded', () => {
  /*------------------------------------------------
  ページ内リンク動的生成
  ------------------------------------------------*/
  function createNavigation() {
    const demoNavs = document.querySelectorAll('.demo-nav');
    if (demoNavs.length === 0) return;

    const sections = document.querySelectorAll('.demo-section[id]');
    if (sections.length === 0) return;

    const fragment = document.createDocumentFragment();
    sections.forEach((section) => {
      const id = section.id;
      const link = document.createElement('a');
      link.href = `#${id}`;
      link.className = 'demo-nav__link';

      const paragraph = document.createElement('p');
      paragraph.className = 'demo-nav__txt';
      paragraph.textContent = id;

      link.appendChild(paragraph);
      fragment.appendChild(link);
    });

    demoNavs.forEach((nav) => {
      nav.appendChild(fragment.cloneNode(true));
    });
  }

  createNavigation();

  /*------------------------------------------------
  クリップボード
  ------------------------------------------------*/
  /* -------------- SVGコピーここから -------------- */
  const svgItems = document.querySelectorAll('.icons__item');
  svgItems.forEach((item) => {
    item.addEventListener('click', (event) => svgClipboard(item, event));
    item.addEventListener('dblclick', (event) => svgClipboard(item, event));
  });

  function svgClipboard(target, event) {
    const eventType = event.type;
    const dataSvg = target.dataset.svg;
    const clipboardText = eventType === 'click' ? `<?php echo get_svg("${dataSvg}"); ?>` : dataSvg;
    setClipboard(clipboardText);

    const toast = target.querySelector('.icons__toast');
    if (toast) {
      const toastText = eventType === 'click' ? 'PHP' : 'NAME';
      toast.textContent = toastText;
      toast.classList.add('icons__toast--done');
      setTimeout(() => {
        toast.classList.remove('icons__toast--done');
      }, 1000);
    }
  }
  /* -------------- SVGコピーここまで -------------- */

  /* -------------- DOMコピーここから -------------- */
  document.querySelectorAll('.clipboard').forEach((element) => {
    element.addEventListener('click', () => {
      let dom = element.innerHTML;
      while (dom.includes('<svg')) {
        const svgStartIndex = dom.indexOf('<svg');
        const svgEndIndex = dom.indexOf('</svg>') + 6;
        const svgString = dom.substring(svgStartIndex, svgEndIndex);

        const parser = new DOMParser();
        const doc = parser.parseFromString(svgString, 'image/svg+xml');
        const svgElement = doc.querySelector('svg');

        const svgClassList = svgElement ? svgElement.classList : [];
        const svgName = Array.from(svgClassList).find((name) => name !== 'ico_svg');

        dom = dom.replace(svgString, `<?php echo get_svg("${svgName}"); ?>`);
      }

      setClipboard(dom.trim());

      element.classList.add('clipboard--copied');
      setTimeout(() => {
        element.classList.remove('clipboard--copied');
      }, 1000);
    });
  });
  /* -------------- DOMコピーここまで -------------- */

  // クリップボードにコピー関数
  async function setClipboard(value) {
    // navigator.clipboard APIが利用可能かつセキュアなコンテキストであるかを確認
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(value);
      } catch (err) {
        // エラー発生時はフォールバック処理を実行
        fallbackClipboardWrite(value);
      }
    } else {
      // APIが利用できない場合もフォールバック処理を実行
      fallbackClipboardWrite(value);
    }
  }

  function fallbackClipboardWrite(value) {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    // 画面外に配置してユーザーに見えないようにする
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.body.removeChild(textarea);
  }
});
