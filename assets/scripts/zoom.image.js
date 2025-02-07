/*!
 * image zoom.js v1.0.0
 * Copyright 2021-present inuHa
 *
 */
(function($){
    
    $.fn.imgZoom  = function(o){
        return this.each(function(){
            $(this).data('viewer', new $iz(this, o));
        });
    }

    var defaults = {
        class: {
            active: "zoom-active",
            visible: "zoom-visible",
            transition: "zoom-transition",
            drag: "zoom-drag"
        },
        scaleDefault: 2,
        scaleDifference: 0.5,
        scaleMax: 10,
        scaleMin: 1,
        transitionDuration: 200,
        doubleclickDelay: 300,
        swipeThreshold: 100, //px
        onZoom: null,
        onClick: null,
        onSwipe: null,
        initCallback: null,
        onStartLoad: null,
        onFinishLoad: null,
        onErrorLoad: null
    };

    $.imgZoom = function(e, o){

        var me = this;
        this.img_object = {};
        this.image_loaded = false;

        this.settings = $.extend({}, defaults, o || {});
        this.targetScale = 1;
        
        if(this.settings.src === null){
            return;
        }

        this.support_3D_transform = true;
        if (["iPad Simulator", "iPhone Simulator", "iPod Simulator", "iPad", "iPhone", "iPod"].indexOf(navigator.platform) > -1 || (navigator.userAgent.includes("Mac") && "ontouchend" in document)) {
            var ua = navigator.userAgent.toLowerCase();
            if (ua.indexOf("safari") > -1 && ua.indexOf("chrome") === -1) {
                this.support_3D_transform = false;
            }
        }

        this.container = $(e);
        this.update_container_size();

        this.img_object.scale = 1;
        this.img_object.x = 0;
        this.img_object.y = 0;
        this.initialPointerOffsetX;
        this.initialPointerOffsetY;
        this.initialOffsetX;
        this.initialOffsetY;
        this.pinchOffsetX;
        this.pinchOffsetY;
        this.initialPinchDistance;


        this.capture = false;
        this.touchable = false;
        this.doubleClickMonitor = [null];
        this.mousemoveCount = 0;
        this.doubleTapMonitor = [null];
        this.touchCount = 0;

        this.swipeX = null;
        this.swipeY = null;
        this.swipeDiffX = 0;
        this.swipeDiffY = 0;

        this.img_object.object = $("<img/>").
        on("mousedown", function(e){
            return me.eventMouseDown(e);
        }).
        on("mousemove", function(e){
            return me.eventMouseMove(e);
        }).
        on("mouseup", function(e){
            return me.eventMouseUp(e)
        }).
        on("mouseleave", function(e){
            return me.eventMouseUp(e);
        }).
        on("touchstart", function(e){
            me.touchable = true;
            return me.eventTouchStart(e);
        }).
        on("touchmove", function(e){
            return me.eventTouchMove(e);
        }).
        on("touchend", function(e){
            me.eventTouch(e);
            return me.eventTouchEnd(e)
        }).
        on("touchcancel", function(e){
            me.eventTouch(e);
            return me.eventTouchEnd(e);
        }).
        on("click", function(e){
            return me.eventClick(e);
        }).
        on("wheel", function(e){
            return me.eventWheel(e);  
        });

        this.img_object.object.prependTo(this.container);
        this.loadImage(this.settings.src);

        $(window).on("resize", function(){
            me.update_container_size();
            me.update_image_size();
            me.fit();
        });

        if(this.settings.initCallback)
        {
            this.settings.initCallback.call(this);
        }
    };

    
    var $iz = $.imgZoom;
    
    $iz.fn = $iz.prototype = {
        imgZoom : "1.0"
    };

    $iz.fn.extend = $iz.extend = $.extend;
    
    $iz.fn.extend({
        loadImage: function(src){
            var me = this;

            me.targetScale = 1;
            me.image_loaded = false;
            
            if(me.settings.onStartLoad){
               me.settings.onStartLoad.call(me);
            }

            me.img_object.object.off('load').
                removeAttr("src").
                removeAttr("style").
                on("load", function(){
                    me.image_loaded = true;
                    me.img_object.width = me.img_object.orig_width = this.width;
                    me.img_object.height = me.img_object.orig_height = this.height;

                    if(me.settings.onFinishLoad)
                    {
                       me.settings.onFinishLoad.call(me);
                    }
                }).
                on("error", function(){
                    if(me.settings.onErrorLoad)
                    {
                       me.settings.onErrorLoad.call(me);
                    }
            }).attr("src", src);
        },
        update_container_size: function(){
            this.settings.height = this.container.height();
            this.settings.width = this.container.width();
        },
        update_image_size: function(){
            this.img_object.height = this.img_object.object.height();
            this.img_object.width = this.img_object.object.width();
        },
        updateTransition: function(scale, x, y){
            scale = scale || this.img_object.scale;
            x = (x || this.img_object.x)  + 'px';
            y = (y || this.img_object.y) + 'px';

            if(!this.image_loaded){
                return;
            }

            if(this.settings.onZoom && this.settings.onZoom.call(this, scale) == false)
            {
                return;
            }
            if (this.support_3D_transform) {
                this.img_object.object.css({
                    "-moz-transform": "translate(" + x + ", " + y + ") " + "scale(" + scale + ")",
                    "-ms-transform": "translate(" + x + ", " + y + ") scale(" + scale + ")",
                    "-o-transform": "translate(" + x + ", " + y + ") " + "scale(" + scale + ")",
                    "-webkit-transform": "translate(" + x + ", " + y + ") " + "scale(" + scale + ")",
                    "transform": "translate3d(" + x + ", " + y + ", 0) scale3d(" + scale + ", " + scale + ", 1)"
                });
            } else {
                this.img_object.object.css({
                    "-moz-transform": "translate(" + x + ", " + y + ") " + "scale(" + scale + ")",
                    "-ms-transform": "translate(" + x + ", " + y + ") scale(" + scale + ")",
                    "-o-transform": "translate(" + x + ", " + y + ") " + "scale(" + scale + ")",
                    "-webkit-transform": "translate(" + x + ", " + y + ") " + "scale(" + scale + ")",
                    "transform": "translate(" + x + ", " + y + ") scale(" + scale + ", " + scale + ")"
                });
            }
        },
        updateData: function(scale, x ,y){
            this.img_object.scale = scale || 1;
            this.img_object.x = x || 0;
            this.img_object.y = y || 0;
        },
        minMax: function(value, min, max) {
            if (value < min) {
                value = min;
            } else if (value > max) {
                value = max;
            }
            return value;
        },
        getLimitOffset: function(type) {
            if(type === "x"){
                return ((this.img_object.width * this.targetScale) - this.settings.width) / 2;
            } else if(type === "y"){
                return ((this.img_object.height * this.targetScale) - this.settings.height) / 2;
            } else {
                return {
                    x: ((this.img_object.width * this.targetScale) - this.settings.width) / 2,
                    y: ((this.img_object.height * this.targetScale) - this.settings.height) / 2
                };
            }
        },
        isWithinRange: function(value, min, max) {
            return value >= min && value <= max;
        },
        preventDefault: function(e) {
            e = e || window.event;

            if (e.preventDefault) {
                e.preventDefault();
            }

            e.returnValue = false;
        },

        eventClick: function(e){
            e.stopPropagation();
            if(this.mousemoveCount <= 5){
                this.settings.onClick && this.settings.onClick.call(this, e);
            }
        },

        eventTouch: function(e){
            e.stopPropagation();
            if(this.touchmoveCount <= 5){
                this.settings.onClick && this.settings.onClick.call(this, e);
            }
        },

        eventMouseDown: function(e){
            var me = this;
            me.preventDefault();

            if (me.touchable === true || e.which !== 1) {
                return false;
            }

            me.initialPointerOffsetX = e.clientX;
            me.initialPointerOffsetY = e.clientY;

            /* Initialize helpers */
            let offset = me.container[0].getBoundingClientRect();
            me.update_container_size();
            me.update_image_size();
            me.initialOffsetX = parseFloat(me.img_object.x);
            me.initialOffsetY = parseFloat(me.img_object.y);
            let initialScale = me.minMax(parseFloat(me.img_object.scale, me.settings.scaleMin, me.settings.scaleMax));

            /* Doubleclick */
            if (me.doubleClickMonitor[0] === null) {
                me.doubleClickMonitor[0] = e.target;
                me.doubleClickMonitor[1] = me.initialPointerOffsetX;
                me.doubleClickMonitor[2] = me.initialPointerOffsetY;

                setTimeout(function() {
                    me.doubleClickMonitor = [null];
                }, me.settings.doubleclickDelay);

            } else if(
                me.doubleClickMonitor[0] === e.target
                && me.mousemoveCount <= 5
                && me.isWithinRange(me.initialPointerOffsetX, me.doubleClickMonitor[1] - 10, me.doubleClickMonitor[1] + 10) === true
                && me.isWithinRange(me.initialPointerOffsetY, me.doubleClickMonitor[2] - 10, me.doubleClickMonitor[2] + 10) === true
            ){
                me.img_object.object.addClass(me.settings.class['transition']);

                if (me.container.hasClass(me.settings.class['active']) === true) {
                    me.targetScale = 1;
                    me.updateData(me.targetScale, 0, 0);
                    me.zoomInactive();
                    me.updateTransition();
                } else {
                    me.pointerOffsetX = e.clientX;
                    me.pointerOffsetY = e.clientY;
                    me.targetScale = me.settings.scaleDefault;
                    let scaleDirection = 1;
                    let scaleDifference = (me.targetScale - 1) * scaleDirection;

                    let limitOffsetX = me.getLimitOffset("x");
                    let limitOffsetY = me.getLimitOffset("y");

                    if (me.targetScale <= 1) {
                        me.img_object.x = 0;
                        me.img_object.y = 0;
                    } else {
                        me.img_object.x = (me.img_object.width * me.targetScale) <= me.settings.width ? 0 : me.minMax(me.initialOffsetX - ((((((me.pointerOffsetX - offset.left) - (me.settings.width / 2)) - me.initialOffsetX) / (me.targetScale - scaleDifference))) * scaleDifference), limitOffsetX * (-1), limitOffsetX);
                        me.img_object.y = (me.img_object.height * me.targetScale) <= me.settings.height ? 0 : me.minMax(me.initialOffsetY - ((((((me.pointerOffsetY - offset.top) - (me.settings.height / 2)) - me.initialOffsetY) / (me.targetScale - scaleDifference))) * scaleDifference), limitOffsetY * (-1), limitOffsetY);
                    }


                    me.zoomActive();
                    me.img_object.scale = me.targetScale;

                    me.updateTransition();
                }

                setTimeout(function() {
                    me.img_object.object.removeClass(me.settings.class['transition']);
                }, me.settings.transitionDuration);

                me.doubleClickMonitor = [null];
                return false;
            }

            me.mousemoveCount = 0;
            me.capture = true;
        },
        eventMouseMove: function(e) {
            var me = this;
            if (me.touchable === true || me.capture === false) {
                return false;
            }

            /* Initialize helpers */
            me.pointerOffsetX = e.clientX;
            me.pointerOffsetY = e.clientY;

            let limitOffsetX = me.getLimitOffset("x");
            let limitOffsetY = me.getLimitOffset("y");
            me.img_object.x = (me.img_object.width * me.targetScale) <= me.settings.width ? 0 : me.minMax(me.pointerOffsetX - (me.initialPointerOffsetX - me.initialOffsetX), limitOffsetX * (-1), limitOffsetX);
            me.img_object.y = (me.img_object.height * me.targetScale) <= me.settings.height ? 0 : me.minMax(me.pointerOffsetY - (me.initialPointerOffsetY - me.initialOffsetY), limitOffsetY * (-1), limitOffsetY);
            me.mousemoveCount++;
            
            if (Math.abs(me.img_object.x) === Math.abs(limitOffsetX)) {
                me.initialOffsetX = me.img_object.x;
                me.initialPointerOffsetX = me.pointerOffsetX;
            }

            if (Math.abs(me.img_object.y) === Math.abs(limitOffsetY)) {
                me.initialOffsetY = me.img_object.y;
                me.initialPointerOffsetY = me.pointerOffsetY;
            }

            if(me.img_object.object.hasClass(me.settings.class['drag']) !== true){
                me.img_object.object.addClass(me.settings.class['drag']);                
            }

            me.img_object.scale = me.targetScale;
            me.updateTransition();
        },
        eventMouseUp: function() {
            if (this.touchable === true || this.capture === false) {
                return false;
            }
            this.img_object.object.removeClass(this.settings.class['drag']);
            this.capture = false;
        },

        eventTouchStart: function(e) {
            var me = this;
            if(e.cancelable) {
                me.preventDefault(e);
            }

            if (e.touches.length > 2) {
                me.swipeX = null;
                me.swipeY = null;
                return false;
            }
                                      
            me.swipeX = e.touches[0].clientX || e.originalEvent.touches[0].clientX;                                      
            me.swipeY = e.touches[0].clientY || e.originalEvent.touches[0].clientY;
            me.swipeDiffX = 0;
            me.swipeDiffY = 0; 

            /* Initialize helpers */
            let offset = me.container[0].getBoundingClientRect();
            me.containerOffsetX = offset.left;
            me.containerOffsetY = offset.top;
            me.update_container_size();
            me.update_image_size();
            me.initialPointerOffsetX = e.touches[0].clientX || e.originalEvent.touches[0].clientX;
            me.initialPointerOffsetY = e.touches[0].clientY || e.originalEvent.touches[0].clientY;
            let initialScale = me.minMax(parseFloat(me.img_object.scale), me.settings.scaleMin, me.settings.scaleMax);
            me.touchCount = e.touches.length;

            if (me.touchCount === 1){ /* Single touch */
                /* Doubletap */
                if (me.doubleTapMonitor[0] === null) {
                    me.doubleTapMonitor[0] = e.target;
                    me.doubleTapMonitor[1] = me.initialPointerOffsetX;
                    me.doubleTapMonitor[2] = me.initialPointerOffsetY;

                    setTimeout(function() {
                        me.doubleTapMonitor = [null];
                    }, me.settings.doubleclickDelay);
                } else if(
                    me.doubleTapMonitor[0] === e.target
                    && me.touchmoveCount <= 1
                    && me.isWithinRange(me.initialPointerOffsetX, me.doubleTapMonitor[1] - 10, me.doubleTapMonitor[1] + 10) === true
                    && me.isWithinRange(me.initialPointerOffsetY, me.doubleTapMonitor[2] - 10, me.doubleTapMonitor[2] + 10) === true
                ){
                    me.img_object.object.addClass(me.settings.class['transition']);

                    if (me.container.hasClass(me.settings.class['active']) === true) {
                        me.targetScale = 1;
                        me.updateData(me.targetScale, 0, 0);
                        me.zoomInactive();
                        me.updateTransition();
                    } else {
                        me.pointerOffsetX = e.touches[0].clientX || e.originalEvent.touches[0].clientX;
                        me.pointerOffsetY = e.touches[0].clientY || e.originalEvent.touches[0].clientY;

                        me.targetScale = me.settings.scaleDefault;
                        let scaleDirection = 1;
                        let scaleDifference = (me.targetScale - 1) * scaleDirection;

                        let limitOffsetX = me.getLimitOffset("x");
                        let limitOffsetY = me.getLimitOffset("y");

                        if (me.targetScale <= 1) {
                            me.img_object.x = 0;
                            me.img_object.y = 0;
                        } else {
                            me.img_object.x = (me.img_object.width * me.targetScale) <= me.settings.width ? 0 : me.minMax(me.initialOffsetX - ((((((me.pointerOffsetX - offset.left) - (me.settings.width / 2)) - me.initialOffsetX) / (me.targetScale - scaleDifference))) * scaleDifference), limitOffsetX * (-1), limitOffsetX);
                            me.img_object.y = (me.img_object.height * me.targetScale) <= me.settings.height ? 0 : me.minMax(me.initialOffsetY - ((((((me.pointerOffsetY - offset.top) - (me.settings.height / 2)) - me.initialOffsetY) / (me.targetScale - scaleDifference))) * scaleDifference), limitOffsetY * (-1), limitOffsetY);
                        }


                        me.zoomActive();
                        me.img_object.scale = me.targetScale;

                        me.updateTransition();
                    }

                    setTimeout(function() {
                        me.img_object.object.removeClass(me.settings.class['transition']);
                    }, me.settings.transitionDuration);

                    me.doubleTapMonitor = [null];
                    return false;
                }

                me.initialOffsetX = parseFloat(me.img_object.x);
                me.initialOffsetY = parseFloat(me.img_object.y);

            } else if (me.touchCount === 2) /* Pinch */ {

                me.initialOffsetX = parseFloat(me.img_object.x);
                me.initialOffsetY = parseFloat(me.img_object.y);
                let initialPointerOffsetX2 = e.touches[1].clientX;
                let initialPointerOffsetY2 = e.touches[1].clientY;
                me.pinchOffsetX = (me.initialPointerOffsetX + initialPointerOffsetX2) / 2;
                me.pinchOffsetY = (me.initialPointerOffsetY + initialPointerOffsetY2) / 2;
                me.initialPinchDistance = Math.sqrt(((me.initialPointerOffsetX - initialPointerOffsetX2) * (me.initialPointerOffsetX - initialPointerOffsetX2)) + ((me.initialPointerOffsetY - initialPointerOffsetY2) * (me.initialPointerOffsetY - initialPointerOffsetY2)));
            }

            me.touchmoveCount = 0;

            me.capture = true;
        },

        eventTouchMove: function(e) {
            var me = this;

            if(e.cancelable) {
                me.preventDefault(e);
            }

            if (me.capture === false) {
                return false;
            }

            me.pointerOffsetX = e.touches[0].clientX || e.originalEvent.touches[0].clientX;
            me.pointerOffsetY = e.touches[0].clientY || e.originalEvent.touches[0].clientY;
            me.touchCount = e.touches.length;
            me.touchmoveCount++;

            let initialScale = me.minMax(parseFloat(me.img_object.scale, me.settings.scaleMin, me.settings.scaleMax));

            if (me.touchCount > 1){ /* Pinch */
                let pointerOffsetX2 = e.touches[1].clientX;
                let pointerOffsetY2 = e.touches[1].clientY;
                let targetPinchDistance = Math.sqrt(((me.pointerOffsetX - pointerOffsetX2) * (me.pointerOffsetX - pointerOffsetX2)) + ((me.pointerOffsetY - pointerOffsetY2) * (me.pointerOffsetY - pointerOffsetY2)));

                if (me.initialPinchDistance === null) {
                    me.initialPinchDistance = targetPinchDistance;
                }

                if (Math.abs(me.initialPinchDistance - targetPinchDistance) >= 1) {
                    /* Initialize helpers */
                    me.targetScale = me.minMax(targetPinchDistance / me.initialPinchDistance * initialScale, me.settings.scaleMin, me.settings.scaleMax);
                    let limitOffsetX = me.getLimitOffset("x");
                    let limitOffsetY = me.getLimitOffset("y");
                    let scaleDifference = me.targetScale - initialScale;

                    me.img_object.x = (me.img_object.width * me.targetScale) <= me.settings.width ? 0 : me.minMax(me.initialOffsetX - ((((((me.pinchOffsetX - me.containerOffsetX) - (me.settings.width / 2)) - me.initialOffsetX) / (me.targetScale - scaleDifference))) * scaleDifference), limitOffsetX * (-1), limitOffsetX);
                    me.img_object.y = (me.img_object.height * me.targetScale) <= me.settings.height ? 0 : me.minMax(me.initialOffsetY - ((((((me.pinchOffsetY - me.containerOffsetY) - (me.settings.height / 2)) - me.initialOffsetY) / (me.targetScale - scaleDifference))) * scaleDifference), limitOffsetY * (-1), limitOffsetY);

                    if (me.targetScale > 1) {
                        me.zoomActive();
                    } else {
                        me.zoomInactive();
                    }

                    me.img_object.scale = me.targetScale;
                    me.updateTransition();

                    /* Initialize helpers */
                    me.initialPinchDistance = targetPinchDistance;
                    me.initialOffsetX = me.img_object.x;
                    me.initialOffsetY = me.img_object.y;
                }
            } else /* Single touch */ {
                

                if(me.targetScale > 1){
                    /* Initialize helpers */
                    me.targetScale = initialScale;
                    let limitOffsetX = me.getLimitOffset("x");
                    let limitOffsetY = me.getLimitOffset("y");
                    me.img_object.x = (me.img_object.width * me.targetScale) <= me.settings.width ? 0 : me.minMax(me.pointerOffsetX - (me.initialPointerOffsetX - me.initialOffsetX), limitOffsetX * (-1), limitOffsetX);
                    me.img_object.y = (me.img_object.height * me.targetScale) <= me.settings.height ? 0 : me.minMax(me.pointerOffsetY - (me.initialPointerOffsetY - me.initialOffsetY), limitOffsetY * (-1), limitOffsetY);

                    if (Math.abs(me.img_object.x) === Math.abs(limitOffsetX)) {
                        me.initialOffsetX = me.img_object.x;
                        me.initialPointerOffsetX = me.pointerOffsetX;
                    }

                    if (Math.abs(me.img_object.y) === Math.abs(limitOffsetY)) {
                        me.initialOffsetY = me.img_object.y;
                        me.initialPointerOffsetY = me.pointerOffsetY;
                    }

                    /* Set attributes */
                    me.img_object.scale = me.targetScale;

                    me.updateTransition();  
                } else {
                    if(!me.swipeX || !me.swipeY) {
                        return;
                    }

                    me.swipeDiffX = me.swipeX - (e.touches[0].clientX || e.originalEvent.touches[0].clientX);
                    me.swipeDiffY = me.swipeY - (e.touches[0].clientY || e.originalEvent.touches[0].clientY);
                          
                }
            }
        },

        eventTouchEnd: function(e) {
            var me = this;
            me.touchCount = e.touches.length;

            if (me.capture === false) {
                return false;
            }

            if (me.touchCount === 0){ /* No touch */

                let typeSwipe = null;
                if (Math.abs(me.swipeDiffX) > Math.abs(me.swipeDiffY)) {
                    if(Math.abs(me.swipeDiffX) > me.settings.swipeThreshold){
                        if (me.swipeDiffX > 0) {
                            typeSwipe = "left";
                        } else {
                            typeSwipe = "right";
                        }                             
                    }
                } else {
                    if(Math.abs(me.swipeDiffY) > me.settings.swipeThreshold){
                        if (me.swipeDiffY > 0) {
                            typeSwipe = "up";
                        } else { 
                            typeSwipe = "down";
                        }
                    }                                                              
                }

                if(typeSwipe !== null){
                    this.settings.onSwipe && this.settings.onSwipe.call(this, typeSwipe);     
                }


                me.swipeX = null;
                me.swipeY = null;


                me.initialPinchDistance = null;
                me.capture = false;
                me.touchable = false;
            } else if (me.touchCount === 1){ /* Single touch */ 
                me.initialPointerOffsetX = e.touches[0].clientX || e.originalEvent.touches[0].clientX;
                me.initialPointerOffsetY = e.touches[0].clientY || e.originalEvent.touches[0].clientY;

            } else if (me.touchCount > 1) /* Pinch */ {
                me.initialPinchDistance = null;
            }

        },
        eventWheel: function(e) {
            var me = this;
            me.pointerOffsetX = e.clientX;
            me.pointerOffsetY = e.clientY;
            me.setZoom((e.deltaY || e.originalEvent.deltaY), true);
        },

        fit: function(){
            this.targetScale = 1;
            this.updateData(this.targetScale, 0, 0);
            this.zoomInactive();
            this.updateTransition();
        },

        setZoom: function(delta, wheel = false){
            var me = this;

            delta = wheel !== false ? (delta < 0 ? 1 : -1) : (delta < 0 ? -1 : 1);

            let offset = me.container[0].getBoundingClientRect();
            me.update_container_size();
            me.update_image_size();

            me.pointerOffsetX = me.pointerOffsetX || $(window).width() / 2;
            me.pointerOffsetY = me.pointerOffsetY || $(window).height() / 2;

            let initialScale = me.minMax(parseFloat(me.img_object.scale, me.settings.scaleMin, me.settings.scaleMax));
            me.initialOffsetX = parseFloat(me.img_object.x);
            me.initialOffsetY = parseFloat(me.img_object.y);
            let scaleDifference = me.settings.scaleDifference * delta;
            me.targetScale = initialScale + scaleDifference;

            if (me.targetScale < me.settings.scaleMin || me.targetScale > me.settings.scaleMax) {
                return false;
            }

            me.img_object.object.addClass(me.settings.class['transition']);

            let limitOffsetX = me.getLimitOffset("x");
            let limitOffsetY = me.getLimitOffset("y");

            if (me.targetScale <= 1) {
                me.img_object.x = 0;
                me.img_object.y = 0;
            } else {
                me.img_object.x = (me.img_object.width * me.targetScale) <= me.settings.width ? 0 : me.minMax(me.initialOffsetX - ((((((me.pointerOffsetX - offset.left) - (me.settings.width / 2)) - me.initialOffsetX) / (me.targetScale - scaleDifference))) * scaleDifference), limitOffsetX * (-1), limitOffsetX);
                me.img_object.y = (me.img_object.height * me.targetScale) <= me.settings.height ? 0 : me.minMax(me.initialOffsetY - ((((((me.pointerOffsetY - offset.top) - (me.settings.height / 2)) - me.initialOffsetY) / (me.targetScale - scaleDifference))) * scaleDifference), limitOffsetY * (-1), limitOffsetY);
            }

            if (me.targetScale > 1) {
                me.zoomActive();
            } else {
                me.zoomInactive();
            }

            me.img_object.scale = me.targetScale;

            me.updateTransition();
            setTimeout(function() {
                me.img_object.object.removeClass(me.settings.class['transition']);
            }, me.settings.transitionDuration);
        },
        zoomActive: function() {
            if (this.container.hasClass(this.settings.class['active']) === false) {
                this.container.addClass(this.settings.class['active']);
            }

        },
        zoomInactive: function(){
            this.pointerOffsetX = null;
            this.pointerOffsetY = null;
            this.initialPinchDistance = null;
            this.container.removeClass(this.settings.class['active']);
        }
    });

})(jQuery);