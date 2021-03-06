/**
 * @ignore
 * insert swf into document in an easy way
 * @author yiminghe@gmail.com, oicuicu@gmail.com
 */

var Dom = require('dom');
var Json = require('json');
var Attribute = require('attribute');
var FlashUA = require('swf/ua');
var util = require('util');
var swfUrl = './swf/assets/expressInstall.swf';
if (typeof KISSY !== 'undefined' && KISSY.DEV_MODE) {
    swfUrl = '../assets/expressInstall.swf';
}
var OLD_IE = !!window.ActiveXObject,
    TYPE = 'application/x-shockwave-flash',
    CID = 'clsid:d27cdb6e-ae6d-11cf-96b8-444553540000',
    FLASHVARS = 'flashvars',
    EMPTY = '',
    LT = '<',
    GT = '>',
    doc = document,
    fpv = FlashUA.fpv,
    fpvGEQ = FlashUA.fpvGEQ,
    fpvGTE = FlashUA.fpvGTE,
    OBJECT_TAG = 'object',
    encode = encodeURIComponent,

// flash player 的参数范围
    PARAMS = {
        // swf 传入的第三方数据。支持复杂的 Object / XML 数据 / Json 字符串
        // flashvars: EMPTY,
        wmode: EMPTY,
        allowscriptaccess: EMPTY,
        allownetworking: EMPTY,
        allowfullscreen: EMPTY,

        // 显示 控制 删除
        play: 'false',
        loop: EMPTY,
        menu: EMPTY,
        quality: EMPTY,
        scale: EMPTY,
        salign: EMPTY,
        bgcolor: EMPTY,
        devicefont: EMPTY,
        hasPriority: EMPTY,

        //	其他控制参数
        base: EMPTY,
        swliveconnect: EMPTY,
        seamlesstabbing: EMPTY
    };
var SWF;
/**
 * insert a new swf into container
 * @class KISSY.SWF
 * @extends KISSY.Base
 */
SWF = Attribute.extend({
    constructor: function (config) {
        var self = this;
        self.callSuper(config);
        var expressInstall = self.get('expressInstall'),
            swf,
            html,
            id,
            htmlMode = self.get('htmlMode'),
            flashVars,
            params = self.get('params'),
            attrs = self.get('attrs'),
            doc = self.get('document'),
            placeHolder = Dom.create('<span>', undefined, doc),
            elBefore = self.get('elBefore'),
            installedSrc = self.get('src'),
            version = self.get('version');

        // https://github.com/kissyteam/kissy/issues/663
        // must has a id
        // or else can not callSWF function in ie6-10
        id = attrs.id = attrs.id || util.guid('ks-swf-' + (util.now()) + '-');

        // 2. flash 插件没有安装
        if (!fpv()) {
            self.set('status', SWF.Status.NOT_INSTALLED);
            return;
        }

        // 3. 已安装，但当前客户端版本低于指定版本时
        if (version && !fpvGTE(version)) {
            self.set('status', SWF.Status.TOO_LOW);

            // 有 expressInstall 时，将 src 替换为快速安装
            if (expressInstall) {
                installedSrc = expressInstall;

                // from swfobject
                if (!('width' in attrs) ||
                    (!/%$/.test(attrs.width) && parseInt(attrs.width, 10) < 310)) {
                    attrs.width = '310';
                }

                if (!('height' in attrs) ||
                    (!/%$/.test(attrs.height) && parseInt(attrs.height, 10) < 137)) {
                    attrs.height = '137';
                }

                flashVars = params.flashVars = params.flashVars || {};
                // location.toString() crash ie6
                util.mix(flashVars, {
                    MMredirectURL: location.href,
                    MMplayerType: OLD_IE ? 'ActiveX' : 'PlugIn',
                    MMdoctitle: doc.title.slice(0, 47) + ' - Flash Player Installation'
                });
            }
        }

        if (htmlMode === 'full') {
            html = _stringSWFFull(installedSrc, attrs, params);
        } else {
            html = _stringSWFDefault(installedSrc, attrs, params);
        }

        // ie 再取 target.innerHTML 属性大写，很多多与属性，等
        self.set('html', html);

        if (elBefore) {
            Dom.insertBefore(placeHolder, elBefore);
        } else {
            Dom.append(placeHolder, self.get('render'));
        }

        if ('outerHTML' in placeHolder) {
            placeHolder.outerHTML = html;
        } else {
            placeHolder.parentNode.replaceChild(Dom.create(html), placeHolder);
        }

        swf = Dom.get('#' + id, doc);

        if (htmlMode === 'full') {
            if (OLD_IE) {
                self.set('swfObject', swf);
            } else {
                self.set('swfObject', swf.parentNode);
            }
        } else {
            self.set('swfObject', swf);
        }

        // bug fix: 重新获取对象,否则还是老对象.
        // 如 入口为 div 如果不重新获取则仍然是 div longzang | 2010/8/9
        self.set('el', swf);

        if (!self.get('status')) {
            self.set('status', SWF.Status.SUCCESS);
        }
    },
    /**
     * Calls a specific function exposed by the SWF 's ExternalInterface.
     * @param func {String} the name of the function to call
     * @param args {Array} the set of arguments to pass to the function.
     */
    callSWF: function (func, args) {
        var swf = this.get('el'),
            ret, params;
        args = args || [];
        try {
            if (swf[func]) {
                ret = swf[func].apply(swf, args);
            }
        } catch (e) {
            // some version flash function is odd in ie: property or method not supported by object
            params = '';
            if (args.length !== 0) {
                params = '"' + args.join('", "') + '"';
            }
            //avoid eval for compression
            /*jshint evil:true*/
            ret = (new Function('swf', 'return swf.' + func + '(' + params + ');'))(swf);
        }
        return ret;
    },
    /**
     * remove its container and swf element from dom
     */
    destroy: function () {
        var self = this;
        var swfObject = self.get('swfObject');
        /* Cross-browser SWF removal
         - Especially needed to safely and completely remove a SWF in Internet Explorer
         */
        if (OLD_IE) {
            swfObject.style.display = 'none';
            // from swfobject
            (function remove() {
                if (swfObject.readyState === 4) {
                    removeObjectInIE(swfObject);
                } else {
                    setTimeout(remove, 10);
                }
            })();
        } else {
            swfObject.parentNode.removeChild(swfObject);
        }
    }
}, {
    ATTRS: {

        /**
         * express install swf url.
         * Defaults to: swfobject 's express install
         * @cfg {String} expressInstall
         */
        /**
         * @ignore
         */
        expressInstall: {
            value: require.toUrl(swfUrl)
        },

        /**
         * new swf 's url
         * @cfg {String} src
         */
        /**
         * @ignore
         */
        src: {

        },

        /**
         * minimum flash version required. eg: '10.1.250'
         * Defaults to '9'.
         * @cfg {String} version
         */
        /**
         * @ignore
         */
        version: {
            value: '9'
        },

        /**
         * params for swf element
         *  - params.flashVars
         * @cfg {Object} params
         */
        /**
         * @ignore
         */
        params: {
            value: {}
        },

        /**
         * attrs for swf element
         * @cfg {Object} attrs
         */
        /**
         * @ignore
         */
        attrs: {
            value: {}
        },
        /**
         * container where flash will be appended.
         * Defaults to: body
         * @cfg {HTMLElement} render
         */
        /**
         * @ignore
         */
        render: {
            setter: function (v) {
                if (typeof v === 'string') {
                    v = Dom.get(v, this.get('document'));
                }
                return v;
            },
            valueFn: function () {
                return document.body;
            }
        },
        /**
         * element where flash will be inserted before.
         * @cfg {HTMLElement} elBefore
         */
        /**
         * @ignore
         */
        elBefore: {
            setter: function (v) {
                if (typeof v === 'string') {
                    v = Dom.get(v, this.get('document'));
                }
                return v;
            }
        },

        /**
         * html document current swf belongs.
         * Defaults to: current document
         * @cfg {HTMLElement} document
         */
        /**
         * @ignore
         */
        document: {
            value: doc
        },

        /**
         * status of current swf
         * @property status
         * @type {KISSY.SWF.Status}
         * @readonly
         */
        /**
         * @ignore
         */
        status: {

        },

        /**
         * swf element
         * @readonly
         * @type {HTMLElement}
         * @property el
         */
        /**
         * @ignore
         */
        el: {

        },

        /**
         * @ignore
         * @private
         */
        swfObject: {

        },

        /**
         * swf element 's outerHTML
         * @property html
         * @type {String}
         * @readonly
         */
        /**
         * @ignore
         */
        html: {
        },

        /**
         *  full or default(depends on browser object)
         *  @cfg {KISSY.SWF.HtmlMode} htmlMode
         */
        /**
         * @ignore
         */
        htmlMode: {
            value: 'default'
        }
    },
    /**
     * get src from existing oo/oe/o/e swf element
     * @param {HTMLElement} swf
     * @returns {String}
     * @static
     */
    getSrc: function (swf) {
        swf = Dom.get(swf);
        var srcElement = getSrcElements(swf)[0],
            nodeName = srcElement && Dom.nodeName(srcElement);
        if (nodeName === 'embed') {
            return Dom.attr(srcElement, 'src');
        } else if (nodeName === 'object') {
            return Dom.attr(srcElement, 'data');
        } else if (nodeName === 'param') {
            return Dom.attr(srcElement, 'value');
        }
        return null;
    },

    /**
     * swf status
     * @enum {String} KISSY.SWF.Status
     */
    Status: {
        /**
         * flash version is too low
         */
        TOO_LOW: 'flash version is too low',
        /**
         * flash is not installed
         */
        NOT_INSTALLED: 'flash is not installed',
        /**
         * success
         */
        SUCCESS: 'success'
    },

    /**
     * swf htmlMode
     * @enum {String} KISSY.SWF.HtmlMode
     */
    HtmlMode: {
        /**
         * generate object structure depending on browser
         */
        DEFAULT: 'default',
        /**
         * generate object/object structure
         */
        FULL: 'full'
    },

    fpv: fpv,

    fpvGEQ: fpvGEQ,

    fpvGTE: fpvGTE
});

function removeObjectInIE(obj) {
    for (var i in obj) {
        if (typeof obj[i] === 'function') {
            obj[i] = null;
        }
    }
    obj.parentNode.removeChild(obj);
}

function getSrcElements(swf) {
    var url = '',
        params, i, param,
        elements = [],
        nodeName = Dom.nodeName(swf);
    if (nodeName === 'object') {
        url = Dom.attr(swf, 'data');
        if (url) {
            elements.push(swf);
        }
        params = swf.childNodes;
        for (i = 0; i < params.length; i++) {
            param = params[i];
            if (param.nodeType === 1) {
                if ((Dom.attr(param, 'name') || '').toLowerCase() === 'movie') {
                    elements.push(param);
                } else if (Dom.nodeName(param) === 'embed') {
                    elements.push(param);
                } else if (Dom.nodeName(params[i]) === 'object') {
                    elements.push(param);
                }
            }
        }
    } else if (nodeName === 'embed') {
        elements.push(swf);
    }
    return elements;
}

// setSrc ie 不重新渲染
function collectionParams(params) {
    var par = EMPTY;
    util.each(params, function (v, k) {
        k = k.toLowerCase();
        if (k in PARAMS) {
            par += stringParam(k, v);
        } else if (k === FLASHVARS) {
            // 特殊参数
            par += stringParam(k, toFlashVars(v));
        }
    });
    return par;
}

function _stringSWFDefault(src, attrs, params) {
    return _stringSWF(src, attrs, params, OLD_IE) + LT + '/' + OBJECT_TAG + GT;
}

function _stringSWF(src, attrs, params, ie) {
    var res,
        attr = EMPTY,
        par = EMPTY;

    // 普通属性
    util.each(attrs, function (v, k) {
        attr += stringAttr(k, v);
    });

    if (ie) {
        attr += stringAttr('classid', CID);
        par += stringParam('movie', src);
    } else {
        // 源
        attr += stringAttr('data', src);
        // 特殊属性
        attr += stringAttr('type', TYPE);
    }

    par += collectionParams(params);

    res = LT + OBJECT_TAG + attr + GT + par;

    return res;
}

// full oo 结构
function _stringSWFFull(src, attrs, params) {
    var outside, inside;
    if (OLD_IE) {
        outside = _stringSWF(src, attrs, params, 1);
        delete attrs.id;
        delete attrs.style;
        inside = _stringSWF(src, attrs, params, 0);
    } else {
        inside = _stringSWF(src, attrs, params, 0);
        delete attrs.id;
        delete attrs.style;
        outside = _stringSWF(src, attrs, params, 1);
    }
    return outside + inside + LT + '/' + OBJECT_TAG + GT + LT + '/' + OBJECT_TAG + GT;
}

/*
 将普通对象转换为 flashvars
 eg: {a: 1, b: { x: 2, z: 's=1&c=2' }} => a=1&b=encode({'x':2,'z':'s%3D1%26c%3D2'})
 */
function toFlashVars(obj) {
    var arr = [],
        ret;
    util.each(obj, function (data, prop) {
        if (typeof data !== 'string') {
            data = Json.stringify(data);
        }
        if (data) {
            arr.push(prop + '=' + encode(data));
        }
    });
    ret = arr.join('&');
    return ret;
}

function stringParam(key, value) {
    return '<param name="' + key + '" value="' + value + '"></param>';
}

function stringAttr(key, value) {
    return ' ' + key + '=' + '"' + value + '"';
}

module.exports = SWF;