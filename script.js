$(document).ready(function () {
    var elements = [];
    var velocities = [];
    var isAnimating = true;
    var isElementActive = false;
    var normalSpeed = 0.4;
    var slowedSpeed = 0.1;

    var isMobileBrowser = $(window).width() < 1080;
    if (isMobileBrowser) {
        normalSpeed *= 2;
        slowedSpeed *= 2;
    }

    var maxElements = isMobileBrowser ? 35 : Infinity;
    var peopleCount = 0;
    var eventCount = 0;

    var specialNames = ["CV", "Tianshuo Lu", "Instagram"];

    function createFloatingElement(data, isPerson) {
        if (elements.length >= maxElements) return;

        var isSpecial = specialNames.includes(data.name);
        var specialIndex = specialNames.indexOf(data.name);

        var $element = $('<div>', {
            text: data.name,
            class: 'floatingText',
        }).appendTo('body');

        var lastClickTime = 0;
        $element.on('touchstart', function (event) {
            event.preventDefault();
        });
        $element.on('touchend', function (event) {
            var currentTime = new Date().getTime();
            if (currentTime - lastClickTime > 50) {
                handleInteraction(event, $(this), data, isPerson);
                lastClickTime = currentTime;
            }
        });
        $element.on('click', function (event) {
            handleInteraction(event, $(this), data, isPerson);
        });

        // 初期位置：中央付近
        var pos = {
            x: window.innerWidth / 2 - 50,
            y: window.innerHeight / 2 - 10
        };
        $element.css({
            left: pos.x + 'px',
            top: pos.y + 'px'
        });

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

        if (isSpecial) {
            $element.data('targetPos', { x: 10, y: 10 + specialIndex * 30 });
            $element.data('isFixed', false);
            $element.data('shouldMoveToTarget', false);

            // 3秒後にターゲット移動開始フラグをON
            setTimeout(() => {
                $element.data('shouldMoveToTarget', true);
            }, 3000);
        }

        var speedModifier = $(window).width() > $(window).height() ? { x: 1.5, y: 1 } : { x: 1, y: 1.5 };
        velocities.push({
            x: (Math.random() - 0.5) * normalSpeed * speedModifier.x,
            y: (Math.random() - 0.5) * normalSpeed * speedModifier.y
        });

        elements.push($element);
    }

    function toggleWord($ele, data, isPerson) {
        var randomYear;
        $ele.css('opacity', '1');
        var isName = $ele.data('isName');

        if (isName) {
            randomYear = isPerson ? Math.floor(Math.random() * (data.endYear - data.startYear + 1)) + data.startYear : data.year;
            $ele.text(randomYear).data({ isName: false, randomYear: randomYear }).addClass('yearElement');
            isElementActive = true;
        } else {
            $ele.text(data.name).data({ isName: true, randomYear: null }).removeClass('yearElement');
            isElementActive = false;
        }

        elements.forEach(function ($otherEle, index) {
            if ($otherEle.data('isName')) {
                adjustOpacityAndSpeed($otherEle, $otherEle.data(), randomYear, index);
            }
        });

        isAnimating = false;
        $('body').toggleClass('noYearActive', !isElementActive);
    }

    function adjustOpacityAndSpeed($ele, data, randomYear, index) {
        if ((data.startYear <= randomYear && data.endYear >= randomYear) || (data.year === randomYear)) {
            $ele.css('opacity', '1');
            velocities[index] = { x: (Math.random() - 0.5) * slowedSpeed, y: (Math.random() - 0.5) * slowedSpeed };

