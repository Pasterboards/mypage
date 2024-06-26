$(document).ready(function() {
    console.log(peopleData);
    console.log(eventData);

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

    
    function createFloatingElement(data, isPerson) {
        if (elements.length >= maxElements) {
            return;
        }

        var $element = $('<div>', {
            text: data.name,
            class: 'floatingText',
        }).appendTo('body');
        
        var lastClickTime = 0;  // 初始化最后一次点击时间
        
        $element.on('touchstart', function(event) {
            event.preventDefault();  // 阻止默认行为，如双击放大
        });
        
        $element.on('touchend', function(event) {
            var currentTime = new Date().getTime();
            if (currentTime - lastClickTime > 50) {  // 秒内无法再次点击
                handleInteraction(event, $(this), data, isPerson);
                lastClickTime = currentTime;  // 更新最后一次点击时间
            }
        });
        
        $element.on('click', function(event) {
            // 对于非触摸设备，保留click事件处理
            handleInteraction(event, $(this), data, isPerson);
        });
        
        function handleInteraction(event, element, data, isPerson) {
            if (!isElementActive || element.data('isName') === false) {
                toggleWord(element, data, isPerson);
            } else if (element.data('isName')) {
                window.open(data.website, '_blank');
            }
        }
        

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
