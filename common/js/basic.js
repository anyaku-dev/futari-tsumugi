// Global variables
let displayMode = 'w'; // "w" or "n"
let resizeEventName = 'resize'; // "resize" or "orientationchange"
let device = 'pc'; // "pc" or "sp"
let isPC = true;
let touchDevice = false;
const userAgent = window.navigator.userAgent.toLowerCase();
const lclbody = document.body;
const lclheader = document.getElementById('header');

if (
  (userAgent.match(/(iphone|iPhone)/) > 0 && userAgent.match(/(ipad|iPad)/) == -1) ||
  userAgent.match(/(ipod|iPod)/) > 0 ||
  userAgent.match(/(android|Android)/) > 0
) {
  resizeEventName = 'orientationchange';
  device = 'sp';
}
if (window.ontouchstart === null) {
  touchDevice = true;
}

//FontAwesome5
window.FontAwesomeConfig = {
  searchPseudoElements: true,
};

(() => {
  /* ---------------------- utils ---------------------- */
  /**
   * 桁数を指定して切り捨てする関数
   * @param {number} value // 切り捨てする数値
   * @param {number} length // 桁数
   * @return {number}
   */
  function floor(value, length) {
    return Math.floor(value * 10 ** length) / 10 ** length;
  }

  /* ---------------------- function ---------------------- */
  /*------------------------------------------------
  setDisplayMode
  ------------------------------------------------*/
  const setDisplayMode = () => {
    const breakPoint = 759;
    displayMode = window.innerWidth <= breakPoint ? 'n' : 'w';
    isPC = displayMode == 'w';
  };
  setDisplayMode();

  // /*------------------------------------------------
  // changeRootFz
  // ------------------------------------------------*/
  // const changeRootFz = () => {
  //   let vw = document.documentElement.clientWidth;
  //   if (!isPC) {
  //     document.documentElement.style.setProperty('--fz', (vw / 375) * 10 + 'px');
  //   } else {
  //     const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  //     document.documentElement.style.setProperty('--scrollbar', `${scrollbarWidth}px`);

  //     const rootStyles = getComputedStyle(document.documentElement);
  //     const minWidth = rootStyles.getPropertyValue('--min-width');
  //     const maxWidth = rootStyles.getPropertyValue('--max-width');
  //     if (vw < parseFloat(minWidth)) {
  //       vw = parseFloat(minWidth);
  //     } else if (maxWidth && vw > parseFloat(maxWidth)) {
  //       vw = parseFloat(maxWidth);
  //     }
  //     document.documentElement.style.setProperty('--fz', floor((vw / 1300) * 10, 3) + 'px');
  //   }
  // };
  // // グローバルに公開する
  // window.changeRootFz = changeRootFz;
  // changeRootFz();

  /*------------------------------------------------
  MENU
  ------------------------------------------------*/
  let st = 0;
  const menu = document.querySelector('.menu');
  const nav = document.querySelector('.nav');

  /* メニューを開く ------------*/
  const menuOpen = () => {
    menu.classList.add('menu--open');
    nav.classList.add('nav--active');
    st = window.scrollY;
    lclbody.style.top = `${-st}px`;
    menu.setAttribute('aria-label', 'メニューを閉じる');
    lclbody.classList.add('oh-open');
  };
  /* メニューを閉じる ------------*/
  const menuClose = () => {
    menu.classList.remove('menu--open');
    nav.classList.remove('nav--active');
    lclbody.style.top = '0';
    lclbody.classList.remove('oh-open');
    window.scrollTo(0, st);
    menu.setAttribute('aria-label', 'メニューを開く');
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  };

  /*------------------------------------------------
  モーダル
  ------------------------------------------------*/
  // モーダルを開く処理
  const modalOpen = (targetId) => {
    if (!targetId) return false;
    const modal = document.getElementById(targetId);
    if (!modal) return false;

    lclbody.classList.add('is-modal');
    modal.showModal();
    modal.focus();
  };

  // モーダルを閉じる処理
  const modalClose = (targetId) => {
    if (!targetId) return false;
    const modal = document.getElementById(targetId);
    if (!modal) return false;

    if (modal.open) {
      lclbody.classList.remove('is-modal');
      modal.close();
    }
  };

  const headerHeight = lclheader ? lclheader.offsetHeight : 0;

  function anchorTarget(targetElement) {
    if (targetElement) {
      if (lclbody.classList.contains('oh-open')) {
        basic.menuClose();
      }
      // const position = targetElement.getBoundingClientRect().top + window.scrollY - headerHeight;
      const position = targetElement.getBoundingClientRect().top + window.scrollY;
      gsap.fromTo(
        window,
        {
          scrollTo: {
            y: window.scrollY,
          },
        },
        {
          duration: 0.48, // アニメーション時間（秒）
          scrollTo: {
            y: position,
          },
          ease: 'power2.inOut',
        }
      );
      targetElement.focus();
      if (document.activeElement !== targetElement) {
        targetElement.setAttribute('tabindex', -1);
        targetElement.focus();
      }
      if (targetElement.tagName === 'DETAILS' && !targetElement.hasAttribute('open')) {
        targetElement.setAttribute('open', 'true');
        targetElement.classList.add('details--open');
      }
    }
  }

  /*------------------------------------------------
  別ページからのページ内リンク
  ------------------------------------------------*/
  function hashAnchorTarget() {
    const initialHash = location.hash;
    // エンコードされたままのハッシュからIDを取得
    const encodedId = initialHash.substring(1);

    // デコードされたハッシュからIDを取得
    const decodedHash = decodeURIComponent(initialHash);
    const decodedId = decodedHash.substring(1);

    // 取得対象の要素を格納する変数
    let targetElementFromHash = null;

    // 最初にデコードされたIDで要素を検索（多くの場合はこれでOK）
    if (decodedId) {
      targetElementFromHash = document.getElementById(decodedId);
    }

    // デコードされたIDで見つからなかった場合、エンコードされたIDで再度検索
    // 日本語IDをURLエンコードしたものをIDとして設定している場合に対応
    if (!targetElementFromHash && encodedId !== decodedId) {
      // decodedIdとencodedIdが異なる（つまり日本語などが含まれている）場合のみ試行
      targetElementFromHash = document.getElementById(encodedId);
    }

    // 要素が見つかった場合の処理
    if (targetElementFromHash) {
      const position = targetElementFromHash.getBoundingClientRect().top + window.scrollY - headerHeight;

      gsap.to(window, {
        duration: 0, // アニメーション時間（秒）
        scrollTo: {
          y: position,
        },
      });

      // フォーカス処理
      targetElementFromHash.focus();
      if (document.activeElement !== targetElementFromHash) {
        targetElementFromHash.setAttribute('tabindex', -1);
        targetElementFromHash.focus();
      }

      // <details>要素のオープン処理
      if (targetElementFromHash.tagName === 'DETAILS' && !targetElementFromHash.hasAttribute('open')) {
        targetElementFromHash.setAttribute('open', 'true');
        targetElementFromHash.classList.add('details--open');
      }
    }
  }

  /* グローバル公開する関数を一つにまとめる ------------*/
  const basic = {
    setDisplayMode,
    // changeRootFz,
    menuOpen,
    menuClose,
    modalOpen,
    modalClose,
    anchorTarget,
    hashAnchorTarget,
  };
  // グローバルに公開する
  window.basic = basic;
})();

/* ---------------------- DOM_ready ---------------------- */
document.addEventListener('DOMContentLoaded', () => {
  'user strict';
  if (touchDevice) {
    lclbody.classList.add('touch');
  }
  /* resize_event -------------------- */
  let resizeTimeout;
  const resizeEvent = () => {
    basic.setDisplayMode();
    // basic.changeRootFz();

    if (isPC) {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      }, 500);
    }
  };
  resizeEvent();
  window.addEventListener('load', resizeEvent);
  window.addEventListener(resizeEventName, resizeEvent);

  /* キー操作を取得 ------------*/
  window.addEventListener('keyup', (e) => {
    if (e.key === 'Escape' && lclbody.classList.contains('oh-open')) {
      basic.menuClose();
    }
  });

  document.querySelectorAll('.menu, .overlay').forEach((el) => {
    el.addEventListener('click', () => {
      if (lclbody.classList.contains('oh-open')) {
        basic.menuClose();
      } else {
        basic.menuOpen();
      }
    });
  });

  /*------------------------------------------------
  モーダル
  ------------------------------------------------*/

  document.querySelectorAll('.modal-open').forEach((btn) => {
    btn.addEventListener('click', () => {
      basic.modalOpen(btn.getAttribute('data-target'));
    });
  });

  document.querySelectorAll('.modal-close, .lcl-staff-modal__btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const openModal = document.querySelector('.modal[open]');
      if (openModal) {
        basic.modalClose(openModal.id);
      }
    });
  });

  document.querySelectorAll('.modal').forEach((modal) => {
    modal.addEventListener('cancel', (e) => {
      basic.modalClose(modal.id);
    });
    modal.addEventListener('click', (e) => {
      if (!e.target.closest('.modal__inner')) {
        basic.modalClose(modal.id);
      }
    });
  });

  /*------------------------------------------------
  横スクロールコンテンツ
  ------------------------------------------------*/
  document.querySelectorAll(`.swipe, .swipe-${displayMode}`).forEach((element) => {
    if (element.scrollWidth <= element.clientWidth) {
      element.classList.add('swipe--swiped');
      return;
    }
    element.addEventListener(
      'scroll',
      () => {
        element.classList.add('swipe--swiped');
      },
      { once: true }
    );
  });

  document.querySelectorAll('.footer-box').forEach((element) => {
    element.addEventListener(
      'scroll',
      () => {
        element.classList.add('scrolled');
      },
      { once: true }
    );
  });

  /*------------------------------------------------
  アコーディオン
  ------------------------------------------------*/
  const animTiming = { duration: 250, easing: 'ease' };

  const closingAnimation = (inner) => [
    { height: inner.offsetHeight + 'px', opacity: 1 },
    { height: 0, opacity: 0 },
  ];
  const openingAnimation = (inner) => [
    { height: 0, opacity: 0 },
    { height: inner.offsetHeight + 'px', opacity: 1 },
  ];

  document.querySelectorAll('.details').forEach((element) => {
    const summary = element.querySelector('.details__summary');
    const inner = element.querySelector('.details__in');
    summary.addEventListener('click', (event) => {
      event.preventDefault();
      if (element.hasAttribute('open')) {
        element.classList.remove('details--open');
        const closingAnim = inner.animate(closingAnimation(inner), animTiming);
        closingAnim.onfinish = () => {
          element.removeAttribute('open');
          if (window.ScrollTrigger) ScrollTrigger.refresh();
        };
      } else {
        element.classList.add('details--open');
        element.setAttribute('open', 'true');
        const openingAnim = inner.animate(openingAnimation(inner), animTiming);
        openingAnim.onfinish = () => {
          if (window.ScrollTrigger) ScrollTrigger.refresh();
        };
      }
    });
  });
});

/* ---------------------- DOM_load ---------------------- */
window.addEventListener('load', () => {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);

  /* load_animation -------------------- */
  document.querySelectorAll('.js-load').forEach((el) => {
    setTimeout(() => {
      el.classList.add('js-load--on');
    }, 400);
  });

  /* anchor_link -------------------- */
  document.querySelectorAll("a[href^='#']").forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('href');
      const targetElement = document.getElementById(href.substring(1));
      basic.anchorTarget(targetElement);
    });
  });

  basic.hashAnchorTarget();

  /*------------------------------------------------
  GSAP ScrollTrigger
  ------------------------------------------------*/
  if (window.ScrollTrigger && window.gsap) {
    const stOptions = {
      start: isPC ? 'top 70%' : 'top 80%',
      once: true,
    };

    /* .scr-anin  -------------------- */
    gsap.utils.toArray('.scr-anin').forEach((el) => {
      ScrollTrigger.create({
        ...stOptions,
        trigger: el,
        onEnter: () => el.classList.add('scr-anin--on'),
      });
    });

    /* .fadein系  -------------------- */
    const fadeEls = gsap.utils.toArray(`.fadein,.fadein-${displayMode},
    .fadein-right,.fadein-right-${displayMode},
    .fadein-left,.fadein-left-${displayMode},
    .fadein-top,.fadein-top-${displayMode},
    .fadein-bottom,.fadein-bottom-${displayMode}`);
    fadeEls.forEach((el) => {
      ScrollTrigger.create({
        ...stOptions,
        trigger: el,
        onEnter: () => el.classList.add('scroll-fade'),
      });
    });

    /* header ------------*/
    if (lclheader) {
      ScrollTrigger.create({
        trigger: '#wrapper',
        start: 'top top',
        onEnter: () => {
          document.getElementById('header').classList.add('header--fixed');
        },
        onLeaveBack: () => {
          document.getElementById('header').classList.remove('header--fixed');
          lclheader.style.left = '';
        },
      });
      // ScrollTrigger.create({
      //   trigger: '#header',
      //   endTrigger: '#wrapper',
      //   start: () => `top top`,
      //   end: () => 'bottom top',
      //   pin: true,
      //   pinSpacing: false,
      // });
      ScrollTrigger.create({
        trigger: 'body',
        start: () => `${document.documentElement.clientHeight / 2} top`,
        onEnter: () => lclheader.classList.add('header--scroll'),
        onLeaveBack: () => lclheader.classList.remove('header--scroll'),
      });
      // ScrollTrigger.create({
      //   trigger: 'body',
      //   start: () => `${document.documentElement.clientHeight / 2} top`,
      //   onUpdate: (self) => {
      //     if (self.start <= window.scrollY && self.direction === 1) {
      //       header.classList.add('header--hidden');
      //     } else {
      //       header.classList.remove('header--hidden');
      //     }
      //   },
      // });
    }

    /* -------------------- */
    const pagetop = document.querySelector('.pagetop');
    if (pagetop) {
      const pagetopA = pagetop.querySelector('a');
      ScrollTrigger.create({
        trigger: 'body',
        start: `top top-=200`,
        onEnter: () => {
          pagetop.classList.add('pagetop--show');
        },
        onLeaveBack: () => {
          pagetop.classList.remove('pagetop--show');
        },
      });
    }
  }
});
/* ---------------------- DOM_load or scroll ---------------------- */
let prevTop = 0;
window.addEventListener('load', () => {
  if (isPC && lclheader && lclheader.classList.contains('header--fixed')) {
    lclheader.style.left = `-${window.scrollX}px`;
  }
});
window.addEventListener('scroll', () => {
  if (isPC && lclheader && lclheader.classList.contains('header--fixed')) {
    lclheader.style.left = `-${window.scrollX}px`;
  }
});
