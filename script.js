/* ------------------------------------------------------------------
 *  Floating Text Visualizer  (完全版・修正版)
 *  変更点:
 *    1. 「CV」「Tianshuo Lu」「Instagram」を左上に固定表示。
 *    2. 上記 3 要素はアニメーション対象から除外。
 *    3. そのほかの挙動（クリックで年⇔名前切替、リンク遷移等）は維持。
 * ------------------------------------------------------------------ */

$(document).ready(function () {
    console.log(peopleData);
    console.log(eventData);

    // ――― 設定値 ―――
    const elements = [];    // 生成した jQuery 要素
    const velocities = [];  // 各要素の速度ベクトル
    let   isAnimating   = true;  // requestAnimationFrame を回すか否か
    let   isElementActive = false;  // 何かの年がアクティブか
    let   normalSpeed = 0.4;
    let   slowedSpeed = 0.1;

    const isMobileBrowser = $(window).width() < 1080;
    if (isMobileBrowser) {            // モバイルは 2 倍速
        normalSpeed *= 2;
        slowedSpeed *= 2;
    }

    const maxElements = isMobileBrowser ? 35 : Infinity;

    // 左上に固定する特別要素
    const specialNames = ['Tianshuo Lu', 'Portfolio', 'Mail'];
    const specialPos   = { x: 10, yStart: 10, gap: 30 }; // 左上配置基準

    // カウンタ
    let peopleCount = 0;
    let eventCount  = 0;

    /* ==============================================================
     *  要素生成
     * ============================================================== */
    function createFloatingElement(data, isPerson) {
        if (elements.length >= maxElements) return;

        const isSpecial = specialNames.includes(data.name);

        // --- 要素作成 ---
        const $element = $('<div>', {
            text: data.name,
            class: 'floatingText',
        }).appendTo('body');

        // --- クリック / タップイベント ---
        let lastClickTime = 0;
        $element.on('touchstart', e => e.preventDefault());
        $element.on('touchend',  e => {
            const now = Date.now();
            if (now - lastClickTime > 50) {
                handleInteraction(e, $element, data, isPerson, isSpecial);
                lastClickTime = now;
            }
        });
        $element.on('click', e => handleInteraction(e, $element, data, isPerson, isSpecial));

        // --- 初期位置 ---
        let pos;
        if (isSpecial) {
            const idx = specialNames.indexOf(data.name);
            pos = { x: specialPos.x, y: specialPos.yStart + idx * specialPos.gap };
        } else {
            // 画面中央
            const w = $element.outerWidth();
            const h = $element.outerHeight();
            pos = { x: ($(window).width() - w) / 2, y: ($(window).height() - h) / 2 };
        }
        $element.css({ left: pos.x, top: pos.y });

        // --- データ属性登録 ---
        if (isPerson) {
            $element.data({ isName: true, startYear: data.startYear, endYear: data.endYear, website: data.website });
        } else {
            $element.data({ isName: true, year: data.year, website: data.website });
        }

        // --- 速度設定 ---
        if (isSpecial) {
            velocities.push({ x: 0, y: 0 }); // 固定
        } else {
            const sm = $(window).width() > $(window).height() ? { x: 1.5, y: 1 } : { x: 1, y: 1.5 };
            velocities.push({
                x: (Math.random() - 0.5) * normalSpeed * sm.x,
                y: (Math.random() - 0.5) * normalSpeed * sm.y
            });
        }

        elements.push($element);
    }

    /* ==============================================================
     *  インタラクション（名前⇔年、リンク遷移）
     * ============================================================== */
    function handleInteraction(event, $ele, data, isPerson, isSpecial) {
        // 固定要素でも通常トグルは許可（年を出したい場合）
        if (!isElementActive || $ele.data('isName') === false) {
            toggleWord($ele, data, isPerson);
        } else if ($ele.data('isName')) {
            window.open(data.website, '_blank');
        }
    }

    function toggleWord($ele, data, isPerson) {
        let randomYear;
        const isName = $ele.data('isName');

        if (isName) {
            randomYear = isPerson
                ? Math.floor(Math.random() * (data.endYear - data.startYear + 1)) + data.startYear
                : data.year;

            $ele.text(randomYear)
                .data({ isName: false, randomYear })
                .addClass('yearElement');
            isElementActive = true;
        } else {
            $ele.text(data.name)
                .data({ isName: true, randomYear: null })
                .removeClass('yearElement');
            isElementActive = false;
        }

        // 他要素の透明度と速度調整
        elements.forEach(($otherEle, idx) => {
            if ($otherEle.data('isName')) {
                adjustOpacityAndSpeed($otherEle, $otherEle.data(), randomYear, idx);
            }
        });

        isAnimating = false;
        $('body').toggleClass('noYearActive', !isElementActive);
    }

    function adjustOpacityAndSpeed($ele, data, randomYear, idx) {
        const match = (data.startYear && data.endYear)
            ? (data.startYear <= randomYear && data.endYear >= randomYear)
            : (data.year === randomYear);

        if (match) {
            $ele.css('opacity', '1');
            velocities[idx] = { x: (Math.random() - 0.5) * slowedSpeed, y: (Math.random() - 0.5) * slowedSpeed };
        } else {
            $ele.css('opacity', '0.3');
            velocities[idx] = { x: (Math.random() - 0.5) * normalSpeed, y: (Math.random() - 0.5) * normalSpeed };
        }
    }

    /* ==============================================================
     *  データから要素生成
     * ============================================================== */
    peopleData.forEach(d => {
        if (isMobileBrowser && peopleCount >= maxElements / 2) return;
        createFloatingElement(d, true);
        peopleCount++;
    });

    eventData.forEach(d => {
        if (isMobileBrowser && eventCount >= maxElements / 2) return;
        createFloatingElement(d, false);
        eventCount++;
    });

    $('body').addClass('noYearActive');

    // 画面外をクリック／タップで再アニメーション
    $(document).on('click touchend', e => {
        if (!$(e.target).closest('.floatingText').length) {
            isAnimating = true;
        }
    });

    /* ==============================================================
     *  アニメーションループ
     * ============================================================== */
    function animateElements() {
        if (isAnimating) {
            elements.forEach(($ele, idx) => {
                const name = $ele.text();
                // 特別要素は動かさない
                if (specialNames.includes(name)) return;

                const vel = velocities[idx];
                const newPos = calculateNewPosition($ele, vel);
                $ele.css({ left: newPos.x, top: newPos.y });

                // 年が表示中なら減速
                if ($ele.data('isName') === false) {
                    velocities[idx] = {
                        x: (Math.random() - 0.5) * slowedSpeed,
                        y: (Math.random() - 0.5) * slowedSpeed
                    };
                }
            });
        }
        requestAnimationFrame(animateElements);
    }

    function calculateNewPosition($ele, vel) {
        let x = parseFloat($ele.css('left')) + vel.x;
        let y = parseFloat($ele.css('top')) + vel.y;

        const w = $ele.outerWidth();
        const h = $ele.outerHeight();
        const winW = $(window).width();
        const winH = $(window).height();

        if (x < 0 || x + w > winW) {
            vel.x = -vel.x;
            x = Math.max(0, Math.min(x, winW - w));
        }
        if (y < 0 || y + h > winH) {
            vel.y = -vel.y;
            y = Math.max(0, Math.min(y, winH - h));
        }
        return { x, y };
    }

    requestAnimationFrame(animateElements);
});
