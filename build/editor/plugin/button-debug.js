/*
Copyright 2014, KISSY v5.0.0
MIT Licensed
build time: Jul 18 13:56
*/
/*
combined modules:
editor/plugin/button
*/
KISSY.add('editor/plugin/button', [
    'util',
    'editor',
    'button'
], function (S, require, exports, module) {
    /**
 * @ignore
 * Encapsulate KISSY toggle button for kissy editor
 * @author yiminghe@gmail.com
 */
    var util = require('util');    // 'editor', '../font/cmd'
    // 'editor', '../font/cmd'
    var Editor = require('editor');
    var Button = require('button');    /**
 * add button to editor
 * @param {String} id control id
 * @param {Object} cfg button config
 * @param {Function} ButtonType button constructor. needs to extend {@link KISSY.Button}, Defaults to {@link KISSY.Button}.
 * @member KISSY.Editor
 */
    /**
 * add button to editor
 * @param {String} id control id
 * @param {Object} cfg button config
 * @param {Function} ButtonType button constructor. needs to extend {@link KISSY.Button}, Defaults to {@link KISSY.Button}.
 * @member KISSY.Editor
 */
    Editor.prototype.addButton = function (id, cfg, ButtonType) {
        if (ButtonType === undefined) {
            ButtonType = Button;
        }
        var self = this, prefixCls = self.get('prefixCls') + 'editor-toolbar-';
        if (cfg.elCls) {
            cfg.elCls = prefixCls + cfg.elCls;
        }
        cfg.elCls = prefixCls + 'button ' + (cfg.elCls || '');
        var b = new ButtonType(util.mix({
                render: self.get('toolBarEl'),
                content: '<span ' + 'class="' + prefixCls + 'item ' + prefixCls + id + '"></span' + '>',
                prefixCls: self.get('prefixCls') + 'editor-',
                editor: self
            }, cfg)).render();
        if (!cfg.content) {
            var contentEl = b.get('el').one('span');
            b.on('afterContentClsChange', function (e) {
                contentEl[0].className = prefixCls + 'item ' + prefixCls + e.newVal;
            });
        }
        if (b.get('mode') === Editor.Mode.WYSIWYG_MODE) {
            self.on('wysiwygMode', function () {
                b.set('disabled', false);
            });
            self.on('sourceMode', function () {
                b.set('disabled', true);
            });
        }
        self.addControl(id + '/button', b);
        return b;
    };
    module.exports = Button;
});


