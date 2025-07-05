$(document).ready(function () {
    console.log(peopleData);
    console.log(eventData);

    /*** ─────────────────────────────
     *  グローバル変数・設定値
     * ───────────────────────────── */
    var elements = [];       // jQuery 要素の配列
    var velocities = [];     // 各要素の速度 {x, y}
    var isAnimating = true;  // requestAnimationFrame 実行可否
    var isElementActive = false; // 名前→年変換でアクティブか
    var normalSpeed = 0.4;
    var slowedSpeed = 0.1;

    // モバイル判定（幅 1080px 未満）
    var isMobileBrowser = $(window).width() < 1080;
    if (isMobileBrowser) {
        normalSpeed *= 2;
        slowedSpeed *= 2;
    }

    var maxElements = isMobileBrowser ? 35 : Infinity;
    var peopleCount = 0;
    var eventCount = 0;

    // 左上に固定させる特別要素
    var specialNames = ['Tianshuo Lu', 'Portfolio', 'Mail'];

    /*** ─────────────────────────────
     *  要素生成
     * ───────────────────────────── */
    function createFloatingElement(data, isPerson) {
        if (elements.length >= maxElements) return;

        var isSpecial = specialNames.includes(data.name);
        var specialIndex = specialNames.indexOf(data.name); // 0,1,2 or -1

        // DOM 作成
        var $element = $("<div>", {
            text: data.name,
            class: "floatingText",
        }).appendTo("body");

        /* --- クリック／タップ設定 --- */
        var lastClickTime = 0;
        $element.on("touchstart", function (e) { e.preventDefault(); });
        $element.on("touchend", function (e) {
            var now = Date.now();
            if (now - lastClickTime > 50) {
                handleInteraction(e, $(this), data, isPerson);
                lastClickTime = now;
            }
        });
        $element.on("click", function (e) {
            handleInteraction(e, $(this), data, isPerson);
        });

        // 生成位置（初期は画面中央）
        var elementW = $element.outerWidth();
        var elementH = $element.outerHeight();
        var pos = {
            x: ($(window).width() - elementW) / 2,
            y: ($(window).height() - elementH) / 2
        };
        $element.css({ left: pos.x + "px", top: pos.y + "px" });

        // データ登録（人物 or イベント）
        if (isPerson) {
            $element.data({
                isName: true,
                startYear: data.startYear,
                endYear: data.endYear,
                website: data.website
            });
        } else {
            $element.data({
                isName: true,
                year: data.year,
                website: data.website
            });
        }

        /* --- 特別要素用の目標座標・固定フラグ --- */
        if (isSpecial) {
            $element.data("targetPos", { x: 10, y: 10 + specialIndex * 30 }); // 30px 間隔
            $element.data("isFixed", false);
        }

        // 初期速度
        var speedMod = $(window).width() > $(window).height() ? { x: 1.5, y: 1 } : { x: 1, y: 1.5 };
        velocities.push({
            x: (Math.random() - 0.5) * normalSpeed * speedMod.x,
            y: (Math.random() - 0.5) * normalSpeed * speedMod.y
        });

        elements.push($element);
    }

    /*** ─────────────────────────────
     *  名前↔年 切替処理
     * ───────────────────────────── */
    function toggleWord($ele, data, isPerson) {
        var randomYear;
        $ele.css("opacity", "1");
        var isName = $ele.data("isName");

        if (isName) {
            randomYear = isPerson
                ? Math.floor(Math.random() * (data.endYear - data.startYear + 1)) + data.startYear
                : data.year;
            $ele.text(randomYear).data({ isName: false, randomYear: randomYear }).addClass("yearElement");
            isElementActive = true;
        } else {
            $ele.text(data.name).data({ isName: true, randomYear: null }).removeClass("yearElement");
            isElementActive = false;
        }

        // 他要素の透明度と速度を再計算
        elements.forEach(function ($other, idx) {
            if ($other.data("isName")) {
                adjustOpacityAndSpeed($other, $other.data(), randomYear, idx);
            }
        });

        isAnimating = false; // 一時停止
        $("body").toggleClass("noYearActive", !isElementActive);
    }

    function adjustOpacityAndSpeed($ele, d, yr, idx) {
        if ((d.startYear <= yr && d.endYear >= yr) || (d.year === yr)) {
            $ele.css("opacity", "1");
            velocities[idx] = { x: (Math.random() - 0.5) * slowedSpeed, y: (Math.random() - 0.5) * slowedSpeed };
        } else {
            $ele.css("opacity", "0.3");
            velocities[idx] = { x: (Math.random() - 0.5) * normalSpeed, y: (Math.random() - 0.5) * normalSpeed };
        }
    }

    /* ───────────────────────────── */

    /* データ投入 */
    peopleData.forEach(function (d) {
        if (isMobileBrowser && peopleCount < maxElements / 2) {
            createFloatingElement(d, true);
            peopleCount++;
        } else if (!isMobileBrowser) {
            createFloatingElement(d, true);
        }
    });
    eventData.forEach(function (d) {
        if (isMobileBrowser && eventCount < maxElements / 2) {
            createFloatingElement(d, false);
            eventCount++;
        } else if (!isMobileBrowser) {
            createFloatingElement(d, false);
        }
    });

    $("body").addClass("noYearActive");

    /* 画面外クリックでアニメ再開 */
    $(document).on("click touchend", function (e) {
        if (!$(e.target).closest(".floatingText").length) {
            isAnimating = true;
        }
    });

    /*** ─────────────────────────────
     *  アニメーション本体
     * ───────────────────────────── */
    function animateElements() {
        if (isAnimating) {
            elements.forEach(function ($ele, idx) {
                var name = $ele.text();
                var velocity = velocities[idx];

                /* ★ 特別3要素の収束ロジック ★ */
                if (specialNames.includes(name)) {
                    if ($ele.data("isFixed")) return; // 既に固定ならスキップ

                    var target = $ele.data("targetPos");
                    var cx = parseFloat($ele.css("left"));
                    var cy = parseFloat($ele.css("top"));
                    var dx = target.x - cx;
                    var dy = target.y - cy;

                    // 距離に比例したステップで近づく（0.05 は追従係数）
                    var stepX = dx * 0.05;
                    var stepY = dy * 0.05;

                    $ele.css({ left: cx + stepX + "px", top: cy + stepY + "px" });

                    // 十分近ければ到達とみなして固定
                    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
                        $ele.css({ left: target.x + "px", top: target.y + "px" });
                        $ele.data("isFixed", true);
                        velocities[idx] = { x: 0, y: 0 }; // 念のため速度ゼロ
                    }
                }
                /* 通常要素のランダム移動 */
                else {
                    var newPos = calculateNewPosition($ele, velocity);
                    $ele.css({ left: newPos.x, top: newPos.y });

                    if ($ele.data("isName") === false) {
                        velocities[idx] = {
                            x: (Math.random() - 0.5) * slowedSpeed,
                            y: (Math.random() - 0.5) * slowedSpeed
                        };
                    }
                }
            });
        }
        requestAnimationFrame(animateElements);
    }

    /*** ─────────────────────────────
     *  画面端で跳ね返る位置計算
     * ───────────────────────────── */
    function calculateNewPosition($ele, v) {
        var newPos = {
            x: parseFloat($ele.css("left")) + v.x,
            y: parseFloat($ele.css("top")) + v.y
        };
        var w = $ele.outerWidth();
        var h = $ele.outerHeight();
        var winW = $(window).width();
        var winH = $(window).height();

        if (newPos.x < 0 || newPos.x + w > winW) {
            v.x = -v.x;
            newPos.x = Math.max(0, Math.min(newPos.x, winW - w));
        }
        if (newPos.y < 0 || newPos.y + h > winH) {
            v.y = -v.y;
            newPos.y = Math.max(0, Math.min(newPos.y, winH - h));
        }
        return newPos;
    }

    /* ── アニメーション開始 ── */
    requestAnimationFrame(animateElements);

    /* ─────────────────────────────
     *  補助関数：クリック動作
     * ───────────────────────────── */
    function handleInteraction(e, $el, d, isP) {
        if (!isElementActive || $el.data("isName") === false) {
            toggleWord($el, d, isP);
        } else if ($el.data("isName")) {
            window.open(d.website, "_blank");
        }
    }
});
