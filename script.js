$(document).ready(function() {
    console.log(peopleData);
    console.log(eventData);

    var elements = [];
    var velocities = [];
    var isAnimating = true;
    var isElementActive = false;
    var normalSpeed = 0.4;
    var slowedSpeed = 0.1;

    var isMobileBrowser = $(window).width() < 768;
    if (isMobileBrowser) {
        normalSpeed *= 2;
        slowedSpeed *= 2;
    }

    var maxElements = isMobileBrowser ? 35 : Infinity;

    var peopleCount = 0;
    var eventCount = 0;

    $(document).ready(function() {
        // 存储触摸开始时间和设置触摸时长的阈值
        var touchStartTime = 0;
        var minimumTouchDuration = 500;  // 触摸时长的阈值，单位为毫秒
    
        // 处理触摸开始事件
        $('body').on('touchstart click', '.floatingText', function(event) {
            touchStartTime = Date.now();  // 记录触摸开始时间
        });
    
        // 处理触摸结束和点击事件，同时适用于数字和文本的切换
        $('body').on('touchend click', '.floatingText', function(event) {
            var touchEndTime = Date.now();
            var touchDuration = touchEndTime - touchStartTime;
    
            // 当事件为 click 或触摸时间超过阈值时，执行相应逻辑
            if (event.type === 'click' || touchDuration > minimumTouchDuration) {
                var isName = $(this).data('isName');
                if (!isElementActive || !isName) {
                    toggleWord($(this), $(this).data(), $(this).data('isPerson'));
                } else if (isName) {
                    window.open($(this).data('website'), '_blank');
                }
            }
        });
    });
    
    // toggleWord 函数和其它部分保持不变
    
    
    
    
    function createFloatingElement(data, isPerson) {
        if (elements.length >= maxElements) {
            return;
        }

        var $element = $('<div>', {
            text: data.name,
            class: 'floatingText',
        }).appendTo('body').on('click touchend', function(event) {  // Changed touchstart to touchend
            if (!isElementActive || $(this).data('isName') === false) {
                toggleWord($(this), data, isPerson);
            } else if ($(this).data('isName')) {
                // Avoiding preventDefault to not block navigation
                window.open(data.website, '_blank');
            }
        });

        var elementWidth = $element.outerWidth();
        var elementHeight = $element.outerHeight();

        var pos = {
            x: ($(window).width() - elementWidth) / 2,
            y: ($(window).height() - elementHeight) / 2
        };

        $element.css({
            left: pos.x + 'px',
            top: pos.y + 'px',
        });

        $element.data(isPerson ? {
            isName: true,
            startYear: data.startYear,
            endYear: data.endYear,
            website: data.website  // Ensure website link is included
        } : {
            isName: true,
            year: data.year,
            website: data.website  // Ensure website link is included
        });

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

        elements.forEach(function($otherEle, index) {
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

    peopleData.forEach(function(data) {
        if (isMobileBrowser && peopleCount < maxElements / 2) {
            createFloatingElement(data, true);
            peopleCount++;
        } else if (!isMobileBrowser) {
            createFloatingElement(data, true);
        }
    });

    eventData.forEach(function(data) {
        if (isMobileBrowser && eventCount < maxElements / 2) {
            createFloatingElement(data, false);
            eventCount++;
        } else if (!isMobileBrowser) {
            createFloatingElement(data, false);
        }
    });

    $('body').addClass('noYearActive');

    $(document).on('click touchend', function(event) {  // Changed touchstart to touchend globally
        if (!$(event.target).closest('.floatingText').length) {
            isAnimating = true;
        }
    });

    function animateElements() {
        if (isAnimating) {
            elements.forEach(function($ele, index) {
                var velocity = velocities[index];
                var newPos = calculateNewPosition($ele, velocity);
                $ele.css({ left: newPos.x, top: newPos.y });

                if ($ele.data('isName') === false) {
                    velocities[index] = {
                        x: (Math.random() - 0.5) * slowedSpeed,
                        y: (Math.random() - 0.5) * slowedSpeed
                    };
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
