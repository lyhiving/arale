 //Switchable autoplay Plugin
define(function(require, exports, module) {
    var utils = require('../extra/utils');
    var _ = require('underscore');

    var SCROLL = 'scroll';

    var win = window, //这个是不是需要优化？
        checkElemInViewport = function(elem) {
            // 只计算上下位置是否在可视区域, 不计算左右
            var w = $(win);
            elem = $(elem);
            var scrollTop = w.scrollTop(),
                vh = w.height(),
                elemOffset = elem.offset();
                elemHeight = elem.height();
            return elemOffset.top > scrollTop &&
                elemOffset.top + elemHeight < scrollTop + vh;
        };

    var Autoplay = module.exports = {
        attrs: {
            // 当 Switchable 对象不在可视区域中时停止动画切换
            pauseOnScroll: true,
            autoplay: false,
            interval: 2000, // 自动播放间隔时间
            pauseOnHover: true  // triggerType 为 mouse 时，鼠标悬停在 slide 上是否暂停自动播放
        },
        install: function() {
            //check
            if (!this.get('autoplay')) {
                return;
            }

            var that = this;
            var element = this.element;
            var timer;

            var interval = this.get('interval');

            if (this.get('pauseOnScroll')) {
                this.__scrollDetect = utils.buffer(function() {
                    // 依次检查页面上所有 switchable 对象是否在可视区域内
                    that[checkElemInViewport(element) ? 'start' : 'stop']();
                }, 200);
                $(win).on(SCROLL + '.' + this.cid, this.__scrollDetect);
            }

            function startAutoplay() {
                // 设置自动播放
                timer = utils.later(function() {
                    if (that.paused) {
                        return;
                    }
                    // 自动播放默认 forward（不提供配置），这样可以保证 circular 在临界点正确切换
                    // 用户 mouseenter 不提供 forward ，全景滚动
                    that.next();
                }, interval, true);
            }
            // go
            startAutoplay();

            // 添加 stop 方法，使得外部可以停止自动播放
            this.stop = function() {
                if (timer) {
                    timer.cancel();
                    timer = undefined;
                }
                // paused 可以让外部知道 autoplay 的当前状态
                that.paused = true;
            };

            this.start = function() {
                if (timer) {
                    timer.cancel();
                    timer = undefined;
                }
                that.paused = false;
                startAutoplay();
            };

            // 鼠标悬停，停止自动播放
            if (this.get('pauseOnHover')) {
                var events = {};
                events['mouseenter'] = 'stop';
                events['mouseleave'] = 'start';
                this.delegateEvents(events);
            }
        },
        destroy: function() {
            //slide中扩展的自动滚动模块中的事件。
            this.stop();
            if (this.__scrollDetect) {
                $(win).off(SCROLL + '.' + this.cid);
            }
        }
    };
});
