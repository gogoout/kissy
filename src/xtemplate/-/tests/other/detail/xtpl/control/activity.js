/** Compiled By kissy-xtemplate */
/*jshint quotmark:false, loopfunc:true, indent:false, asi:true, unused:false, boss:true, sub:true*/
var activityHtml = function (scope, buffer, undefined) {
    var tpl = this, nativeCommands = tpl.root.nativeCommands, utils = tpl.root.utils;
    var callFnUtil = utils['callFn'], callCommandUtil = utils['callCommand'], eachCommand = nativeCommands['each'], withCommand = nativeCommands['with'], ifCommand = nativeCommands['if'], setCommand = nativeCommands['set'], includeCommand = nativeCommands['include'], parseCommand = nativeCommands['parse'], extendCommand = nativeCommands['extend'], blockCommand = nativeCommands['block'], macroCommand = nativeCommands['macro'], debuggerCommand = nativeCommands['debugger'];
    buffer.write('<!--\u5927\u4FC3\u6D3B\u52A8-->\r\n<script>\r\n    KISSY.use("detail/mod", function(S,Mod) {\r\n        Mod.data("g_activity", JSON.parse(S.unEscapeHTML(\'', 0);
    var option0 = { escape: 1 };
    var params1 = [];
    var id2 = scope.resolve([
            'activity',
            'data'
        ], 0);
    params1.push(id2);
    option0.params = params1;
    var callRet3;
    callRet3 = callFnUtil(tpl, scope, option0, buffer, ['objToStr'], 0, 4);
    if (callRet3 && callRet3.isBuffer) {
        buffer = callRet3;
        callRet3 = undefined;
    }
    buffer.write(callRet3, true);
    buffer.write('\')));\r\n    });\r\n</script>', 0);
    return buffer;
};
activityHtml.TPL_NAME = module.name;
activityHtml.version = '5.0.0';
module.exports = activityHtml;