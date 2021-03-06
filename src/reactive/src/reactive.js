/**
 * Functional Reactive Programming
 * @author yiminghe@gmail.com
 */

var reactive = module.exports = {
    END: {}
};

function NOP() {
}

function mix(source, dest) {
    for (var d in dest) {
        source[d] = dest[d];
    }
    return source;
}

function bind(fn, context) {
    return function () {
        fn.apply(context, arguments);
    };
}

function EventStream(subscribeFn) {
    var self = this;
    this._listeners = [];
    this._subscribeFn = subscribeFn;
    this._children = [];
    this._pushEvent = bind(pushEvent, self);
    this._unSubscribeFn = null;
    this._event = null;
}

function fire(stream, event) {
    if (stream.handler) {
        event = stream.handler(event);
    }
    stream._event = event;
    if (!event) {
        return;
    }
    var listeners = stream._listeners;
    for (var i = 0, l = listeners.length; i < l; i++) {
        listeners[i].fn.call(listeners[i].context, event);
    }
}

function pushEvent(v) {
    if (v === reactive.END) {
        unSubscribe(this);
    } else {
        v = {
            value: v,
            target: this
        };
        fire(this, v);
    }
}

function propagate(v) {
    fire(this, v);
}

function subscribe(stream) {
    if (stream._listeners.length) {
        return;
    }
    if (stream._subscribeFn) {
        stream._unSubscribeFn = stream._subscribeFn(stream._pushEvent);
    } else {
        stream._unSubscribeFn = NOP;
    }
    var children = stream._children;
    for (var i = 0, l = children.length; i < l; i++) {
        children[i].on(propagate, stream);
    }
}

function unSubscribe(stream) {
    if (stream._listeners.length) {
        return;
    }
    var children = stream._children;
    for (var i = 0, l = children.length; i < l; i++) {
        children[i].detach(propagate, stream);
    }
    stream._unSubscribeFn();
    stream._unSubscribeFn = null;
}

function addChild(stream, child) {
    stream._children.push(child);
    // already start subscribe
    if (stream._unSubscribeFn) {
        child.on(propagate, stream);
    }
}

function indexOfListener(stream, fn, context) {
    var listeners = stream._listeners;
    for (var i = 0, l = listeners.length; i < l; i++) {
        if (listeners[i].fn === fn && listeners[i].context === context) {
            return i;
        }
    }
    return -1;
}

function combineHandler(event) {
    var property = this;
    var _events = property._events;
    var child = event.target;
    var children = property._children;
    var l = children.length;
    var i;
    for (i = 0; i < l; i++) {
        if (children[i] === child) {
            _events[i] = event;
            break;
        }
    }
    if (l !== _events.length) {
        return;
    }
    var composedValue = [];
    for (i = 0; i < l; i++) {
        if (_events[i]) {
            composedValue[i] = _events[i].value;
        } else {
            return;
        }
    }
    return {
        target: this,
        value: composedValue
    };
}

mix(EventStream.prototype, {
    map: function (fn) {
        var fin = new this.constructor();
        fin.handler = function (e) {
            return {
                target: e.target,
                value: fn(e.value)
            };
        };
        addChild(fin, this);
        return fin;
    },

    flatMap: function (fn) {
        // TODO
        // fn return EventStream or Property
        var fin = new this.constructor();
        fin.handler = function (e) {
            fn(e);
        };
        addChild(fin, this);
        return fin;
    },

    filter: function (fn) {
        var fin = new this.constructor();
        fin.handler = function (e) {
            var v = fn(e.value);
            if (v) {
                return {
                    target: e.target,
                    value: e.value
                };
            }
        };
        addChild(fin, this);
        return fin;
    },

    startsWith: function (value) {
        if (!this._event) {
            this._event = {
                value: value,
                target: this
            };
        }
        return this;
    },

    onValue: function (fn, context) {
        var self = this;
        context = context || this;
        var wrapFn = function (e) {
            fn.call(context, e.value);
        };
        this.on(wrapFn, context);
        return function () {
            self.detach(wrapFn, context);
        };
    },

    on: function (fn, context) {
        subscribe(this);
        context = context || this;
        if (indexOfListener(this, fn, context) === -1) {
            this._listeners.push({
                fn: fn,
                context: context
            });
        }
        return this;
    },

    detach: function (fn, context) {
        context = context || this;
        var listeners = this._listeners;
        var index = indexOfListener(this, fn, context);
        if (index !== -1) {
            listeners.splice(index, 1);
        }
        unSubscribe(this);
        return this;
    },

    combine: function () {
        // composable
        var args = arguments;
        var fin = new Property();
        fin._events = [];
        fin.handler = combineHandler;
        addChild(fin, this);
        for (var i = 0, l = args.length; i < l; i++) {
            addChild(fin, args[i]);
        }
        return fin;
    }
});

function Property() {
    EventStream.apply(this, arguments);
}

NOP.prototype = EventStream.prototype;

Property.prototype = new NOP();

mix(Property.prototype, {
    constructor: Property,

    on: function (fn, context) {
        EventStream.prototype.on.apply(this, arguments);
        if (this._event) {
            fn.call(context, this._event);
        }
    }
});

reactive.createEventStream = function (subscribeFn) {
    return new EventStream(subscribeFn);
};

reactive.createProperty = function (subscribeFn) {
    return new Property(subscribeFn);
};

/**
 * refer:
 * - http://sean.voisen.org/blog/2013/09/intro-to-functional-reactive-programming/
 * - http://stackoverflow.com/questions/1028250/what-is-functional-reactive-programming
 * - http://en.wikipedia.org/wiki/Functional_reactive_programming
 */
