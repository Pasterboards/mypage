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

        setTimeout(function () {
            var elementWidth = $element.outerWidth();
            var elementHeight = $element.outerHeight();
            var pos = {
                x: ($(window).width() - elementWidth) / 2,
                y: ($(window).height() - elementHeight) / 2
            };
            $element.css({
                left: pos.x + 'px',
                top: pos.y + 'px'
            });
        }, 0);

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
        } else {
            $ele.css('opacity', '0.3');
            velocities[index] = { x: (Math.random() - 0.5) * normalSpeed, y: (Math.random() - 0.5) * normalSpeed };
        }
    }

    function handleInteraction(event, element, data, isPerson) {
        if (!isElementActive || element.data('isName') === false) {
            toggleWord(element, data, isPerson);
        } else if (element.data('isName')) {
            window.open(data.website, '_blank');
        }
    }

    peopleData.forEach(function (data) {
        if (isMobileBrowser && peopleCount < maxElements / 2) {
            createFloatingElement(data, true);
            peopleCount++;
        } else if (!isMobileBrowser) {
            createFloatingElement(data, true);
        }
    });

    eventData.forEach(function (data) {
        if (isMobileBrowser && eventCount < maxElements / 2) {
            createFloatingElement(data, false);
            eventCount++;
        } else if (!isMobileBrowser) {
            createFloatingElement(data, false);
        }
    });

    $('body').addClass('noYearActive');

    $(document).on('click touchend', function (event) {
        if (!$(event.target).closest('.floatingText').length) {
            isAnimating = true;
        }
    });

    function animateElements() {
        if (isAnimating) {
            elements.forEach(function ($ele, index) {
                var name = $ele.text();
                var velocity = velocities[index];

                if (specialNames.includes(name)) {
                    if ($ele.data('isFixed')) return;

                    var target = $ele.data('targetPos');
                    var currentX = parseFloat($ele.css('left'));
                    var currentY = parseFloat($ele.css('top'));
                    var dx = target.x - currentX;
                    var dy = target.y - currentY;

                    var stepX = dx * 0.05;
                    var stepY = dy * 0.05;

                    $ele.css({
                        left: currentX + stepX + 'px',
                        top: currentY + stepY + 'px'
                    });

                    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
                        $ele.css({
                            left: target.x + 'px',
                            top: target.y + 'px'
                        });
                        $ele.data('isFixed', true);
                        velocities[index] = { x: 0, y: 0 };
                    }
                } else {
                    var newPos = calculateNewPosition($ele, velocity);
                    $ele.css({ left: newPos.x, top: newPos.y });

                    if ($ele.data('isName') === false) {
                        velocities[index] = {
                            x: (Math.random() - 0.5) * slowedSpeed,
                            y: (Math.random() - 0.5) * slowedSpeed
                        };
                    }
                }
            });
        }
        requestAnimationFrame(animateElements);
    }

    function calculateNewPosition($ele, velocity) {
        var newPos = {
            x: parseFloat($ele.css('left')) + velocity.x,
            y: parseFloat($ele.css('top')) + velocity.y
        };
        var eleWidth = $ele.outerWidth();
        var eleHeight = $ele.outerHeight();
        var windowWidth = $(window).width();
        var windowHeight = $(window).height();

        if (newPos.x < 0 || newPos.x + eleWidth > windowWidth) {
            velocity.x = -velocity.x;
            newPos.x = Math.max(0, Math.min(newPos.x, windowWidth - eleWidth));
        }
        if (newPos.y < 0 || newPos.y + eleHeight > windowHeight) {
            velocity.y = -velocity.y;
            newPos.y = Math.max(0, Math.min(newPos.y, windowHeight - eleHeight));
        }

        return newPos;
    }

    requestAnimationFrame(animateElements);
});
