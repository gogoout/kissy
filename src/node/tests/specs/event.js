/**
 * event attached for node
 * @author gonghao, yiminghe@gmail.com
 */

    var $ = require('node');
    /*jshint quotmark:false*/
// simulate mouse event on any element
    var simulate = function (target, type, relatedTarget) {
        if (typeof target === 'string') {
            target = $(target)[0];
        }
        jasmine.simulate(target, type, { relatedTarget: relatedTarget });
    };

    describe("node-event", function () {

        it('should set this properly', function () {
            var ret;

            // Node
            runs(function () {
                $('#link-test-this').on('click', function () {
                    ret = this;
                });
                simulate('#link-test-this', 'click');
            });
            waits(0);

            runs(function () {
                expect(ret.nodeType).not.toBe(undefined);
            });


            // NodeList
            runs(function () {
                $('#link-test-this-all span').on('click', function () {
                    ret = $(this);
                });
                simulate('#link-test-this-all-span', 'click');
            });
            waits(0);
            runs(function () {
                expect(ret.text()).toBe('link for test this');
            });

            // Dom Element
            runs(function () {
                $('#link-test-this-dom').on('click', function () {
                    ret = $(this);
                });
                simulate('#link-test-this-dom', 'click');
            });
            waits(0);
            runs(function () {
                expect(ret.prop('nodeType')).toBe(1);
            });
        });

        it('should detach properly', function () {
            var ret;

            // Node
            runs(function () {
                var node = $('#link-detach');

                function t() {
                    ret = 1;
                }

                node.on('click', t);

                node.detach('click', t);

                simulate('#link-detach', 'click');
            });
            waits(10);
            runs(function () {
                expect(ret).toBeUndefined();
            });
        });

        it('can get fire return value', function () {
            var n = $("<div/>");

            n.on('xx', function () {
                return 1;
            });

            n.on('xx', function () {
            });

            expect(n.fire('xx')).toBe(1);

            n.detach();

            n.on('xx', function () {
                return false;
            });

            n.on('xx', function () {
                return 1;
            });

            n.on('xx', function () {
            });

            expect(n.fire('xx')).toBe(false);

            n.detach();

            n.on('xx', function () {
                return 1;
            });

            n.on('xx', function () {
                return null;
            });

            expect(n.fire('xx')).toBe(null);
        });

        it('can get fireHandler return value', function () {
            var n = $("<div/>");

            n.on('xx', function () {
                return 1;
            });

            n.on('xx', function () {
            });

            expect(n.fireHandler('xx')).toBe(1);

            n.detach();

            n.on('xx', function () {
                return false;
            });

            n.on('xx', function () {
                return 1;
            });

            n.on('xx', function () {
            });

            expect(n.fireHandler('xx')).toBe(false);

            n.detach();

            n.on('xx', function () {
                return 1;
            });

            n.on('xx', function () {
                return null;
            });

            expect(n.fireHandler('xx')).toBe(null);
        });
    });