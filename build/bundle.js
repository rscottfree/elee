
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
(function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.18.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src/App.svelte generated by Svelte v3.18.2 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let t;
    	let div;

    	const block = {
    		c: function create() {
    			t = space();
    			div = element("div");
    			attr_dev(div, "id", /*id*/ ctx[0]);
    			attr_dev(div, "class", "elee-app svelte-6otxfr");
    			set_style(div, "left", /*x*/ ctx[3] + "px");
    			set_style(div, "top", /*y*/ ctx[4] + "px");
    			set_style(div, "width", /*w*/ ctx[1] + "px");
    			set_style(div, "height", /*h*/ ctx[2] + "px");
    			add_location(div, file, 89, 0, 3135);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*id*/ 1) {
    				attr_dev(div, "id", /*id*/ ctx[0]);
    			}

    			if (dirty & /*x*/ 8) {
    				set_style(div, "left", /*x*/ ctx[3] + "px");
    			}

    			if (dirty & /*y*/ 16) {
    				set_style(div, "top", /*y*/ ctx[4] + "px");
    			}

    			if (dirty & /*w*/ 2) {
    				set_style(div, "width", /*w*/ ctx[1] + "px");
    			}

    			if (dirty & /*h*/ 4) {
    				set_style(div, "height", /*h*/ ctx[2] + "px");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { id = "elee-app" } = $$props;
    	let { w = 0 } = $$props;
    	let { h = 0 } = $$props;
    	let { x = 0 } = $$props;
    	let { y = 0 } = $$props;

    	onMount(() => {
    		
    	}); // const component = new C2({
    	// 	target: context.target,
    	// 	props: {
    	// 		name: 'nope',

    	const writable_props = ["id", "w", "h", "x", "y"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("id" in $$props) $$invalidate(0, id = $$props.id);
    		if ("w" in $$props) $$invalidate(1, w = $$props.w);
    		if ("h" in $$props) $$invalidate(2, h = $$props.h);
    		if ("x" in $$props) $$invalidate(3, x = $$props.x);
    		if ("y" in $$props) $$invalidate(4, y = $$props.y);
    	};

    	$$self.$capture_state = () => {
    		return { id, w, h, x, y };
    	};

    	$$self.$inject_state = $$props => {
    		if ("id" in $$props) $$invalidate(0, id = $$props.id);
    		if ("w" in $$props) $$invalidate(1, w = $$props.w);
    		if ("h" in $$props) $$invalidate(2, h = $$props.h);
    		if ("x" in $$props) $$invalidate(3, x = $$props.x);
    		if ("y" in $$props) $$invalidate(4, y = $$props.y);
    	};

    	return [id, w, h, x, y];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { id: 0, w: 1, h: 2, x: 3, y: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get id() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get w() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set w(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get h() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set h(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get x() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Text.svelte generated by Svelte v3.18.2 */

    const file$1 = "src/Text.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*text*/ ctx[0]);
    			attr_dev(div, "id", /*id*/ ctx[1]);
    			attr_dev(div, "class", "elee-text svelte-zk0nl7");
    			set_style(div, "left", /*xpx*/ ctx[3] + "px");
    			set_style(div, "top", /*ypx*/ ctx[4] + "px");
    			set_style(div, "visibility", /*v*/ ctx[2] ? "visible" : "hidden");
    			add_location(div, file$1, 26, 0, 409);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*text*/ 1) set_data_dev(t, /*text*/ ctx[0]);

    			if (dirty & /*id*/ 2) {
    				attr_dev(div, "id", /*id*/ ctx[1]);
    			}

    			if (dirty & /*xpx*/ 8) {
    				set_style(div, "left", /*xpx*/ ctx[3] + "px");
    			}

    			if (dirty & /*ypx*/ 16) {
    				set_style(div, "top", /*ypx*/ ctx[4] + "px");
    			}

    			if (dirty & /*v*/ 4) {
    				set_style(div, "visibility", /*v*/ ctx[2] ? "visible" : "hidden");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { text = "" } = $$props;
    	let { id = undefined } = $$props;
    	let { x = 0 } = $$props;
    	let { y = 0 } = $$props;
    	let { v = true } = $$props;
    	const writable_props = ["text", "id", "x", "y", "v"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Text> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    		if ("id" in $$props) $$invalidate(1, id = $$props.id);
    		if ("x" in $$props) $$invalidate(5, x = $$props.x);
    		if ("y" in $$props) $$invalidate(6, y = $$props.y);
    		if ("v" in $$props) $$invalidate(2, v = $$props.v);
    	};

    	$$self.$capture_state = () => {
    		return { text, id, x, y, v, xpx, ypx };
    	};

    	$$self.$inject_state = $$props => {
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    		if ("id" in $$props) $$invalidate(1, id = $$props.id);
    		if ("x" in $$props) $$invalidate(5, x = $$props.x);
    		if ("y" in $$props) $$invalidate(6, y = $$props.y);
    		if ("v" in $$props) $$invalidate(2, v = $$props.v);
    		if ("xpx" in $$props) $$invalidate(3, xpx = $$props.xpx);
    		if ("ypx" in $$props) $$invalidate(4, ypx = $$props.ypx);
    	};

    	let xpx;
    	let ypx;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*x*/ 32) {
    			 $$invalidate(3, xpx = x * 12);
    		}

    		if ($$self.$$.dirty & /*y*/ 64) {
    			 $$invalidate(4, ypx = y * 34);
    		}
    	};

    	return [text, id, v, xpx, ypx, x, y];
    }

    class Text extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { text: 0, id: 1, x: 5, y: 6, v: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Text",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get text() {
    		return this.$$.ctx[0];
    	}

    	set text(text) {
    		this.$set({ text });
    		flush();
    	}

    	get id() {
    		return this.$$.ctx[1];
    	}

    	set id(id) {
    		this.$set({ id });
    		flush();
    	}

    	get x() {
    		return this.$$.ctx[5];
    	}

    	set x(x) {
    		this.$set({ x });
    		flush();
    	}

    	get y() {
    		return this.$$.ctx[6];
    	}

    	set y(y) {
    		this.$set({ y });
    		flush();
    	}

    	get v() {
    		return this.$$.ctx[2];
    	}

    	set v(v) {
    		this.$set({ v });
    		flush();
    	}
    }

    /* src/Button.svelte generated by Svelte v3.18.2 */

    const file$2 = "src/Button.svelte";

    function create_fragment$2(ctx) {
    	let button;
    	let t;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(/*text*/ ctx[4]);
    			attr_dev(button, "id", /*id*/ ctx[3]);
    			attr_dev(button, "class", "elee-button svelte-i01j9h");
    			set_style(button, "left", /*x*/ ctx[1] + "px");
    			set_style(button, "top", /*y*/ ctx[2] + "px");
    			set_style(button, "width", /*width*/ ctx[6]);
    			set_style(button, "visibility", /*v*/ ctx[5] ? "visible" : "hidden");
    			add_location(button, file$2, 55, 0, 1275);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);
    			/*button_binding*/ ctx[9](button);
    			dispose = listen_dev(button, "click", /*click_handler*/ ctx[8], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*text*/ 16) set_data_dev(t, /*text*/ ctx[4]);

    			if (dirty & /*id*/ 8) {
    				attr_dev(button, "id", /*id*/ ctx[3]);
    			}

    			if (dirty & /*x*/ 2) {
    				set_style(button, "left", /*x*/ ctx[1] + "px");
    			}

    			if (dirty & /*y*/ 4) {
    				set_style(button, "top", /*y*/ ctx[2] + "px");
    			}

    			if (dirty & /*width*/ 64) {
    				set_style(button, "width", /*width*/ ctx[6]);
    			}

    			if (dirty & /*v*/ 32) {
    				set_style(button, "visibility", /*v*/ ctx[5] ? "visible" : "hidden");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			/*button_binding*/ ctx[9](null);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { id = undefined } = $$props;
    	let { element = undefined } = $$props;
    	let { text = "" } = $$props;
    	let { x = 0 } = $$props;
    	let { y = 0 } = $$props;
    	let { w = undefined } = $$props;
    	let { v = true } = $$props;
    	x = x * 12;
    	y = y * 34;
    	let width = "auto";

    	if (w !== undefined) {
    		width = w * 12 + "px";
    	}

    	const writable_props = ["id", "element", "text", "x", "y", "w", "v"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	function button_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(0, element = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("id" in $$props) $$invalidate(3, id = $$props.id);
    		if ("element" in $$props) $$invalidate(0, element = $$props.element);
    		if ("text" in $$props) $$invalidate(4, text = $$props.text);
    		if ("x" in $$props) $$invalidate(1, x = $$props.x);
    		if ("y" in $$props) $$invalidate(2, y = $$props.y);
    		if ("w" in $$props) $$invalidate(7, w = $$props.w);
    		if ("v" in $$props) $$invalidate(5, v = $$props.v);
    	};

    	$$self.$capture_state = () => {
    		return { id, element, text, x, y, w, v, width };
    	};

    	$$self.$inject_state = $$props => {
    		if ("id" in $$props) $$invalidate(3, id = $$props.id);
    		if ("element" in $$props) $$invalidate(0, element = $$props.element);
    		if ("text" in $$props) $$invalidate(4, text = $$props.text);
    		if ("x" in $$props) $$invalidate(1, x = $$props.x);
    		if ("y" in $$props) $$invalidate(2, y = $$props.y);
    		if ("w" in $$props) $$invalidate(7, w = $$props.w);
    		if ("v" in $$props) $$invalidate(5, v = $$props.v);
    		if ("width" in $$props) $$invalidate(6, width = $$props.width);
    	};

    	return [element, x, y, id, text, v, width, w, click_handler, button_binding];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			id: 3,
    			element: 0,
    			text: 4,
    			x: 1,
    			y: 2,
    			w: 7,
    			v: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get id() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get element() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set element(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get text() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get x() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get w() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set w(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get v() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set v(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Link.svelte generated by Svelte v3.18.2 */

    const file$3 = "src/Link.svelte";

    function create_fragment$3(ctx) {
    	let a;
    	let t;
    	let dispose;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(/*text*/ ctx[4]);
    			attr_dev(a, "id", /*id*/ ctx[3]);
    			attr_dev(a, "class", "elee-link svelte-5xd4l8");
    			attr_dev(a, "href", ".");
    			set_style(a, "left", /*x*/ ctx[0] + "px");
    			set_style(a, "top", /*y*/ ctx[1] + "px");
    			set_style(a, "width", /*width*/ ctx[2]);
    			set_style(a, "height", /*h*/ ctx[5] + "px");
    			add_location(a, file$3, 44, 0, 804);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    			dispose = listen_dev(a, "click", /*click_handler*/ ctx[7], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*text*/ 16) set_data_dev(t, /*text*/ ctx[4]);

    			if (dirty & /*id*/ 8) {
    				attr_dev(a, "id", /*id*/ ctx[3]);
    			}

    			if (dirty & /*x*/ 1) {
    				set_style(a, "left", /*x*/ ctx[0] + "px");
    			}

    			if (dirty & /*y*/ 2) {
    				set_style(a, "top", /*y*/ ctx[1] + "px");
    			}

    			if (dirty & /*width*/ 4) {
    				set_style(a, "width", /*width*/ ctx[2]);
    			}

    			if (dirty & /*h*/ 32) {
    				set_style(a, "height", /*h*/ ctx[5] + "px");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { id = undefined } = $$props;
    	let { text = "" } = $$props;
    	let { x = 0 } = $$props;
    	let { y = 0 } = $$props;
    	let { w = undefined } = $$props;
    	let { h = "1.3em" } = $$props;
    	x = x * 12;
    	y = y * 34;
    	let { width = "auto" } = $$props;

    	if (w !== undefined) {
    		width = w + "px";
    	}

    	const writable_props = ["id", "text", "x", "y", "w", "h", "width"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Link> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ("id" in $$props) $$invalidate(3, id = $$props.id);
    		if ("text" in $$props) $$invalidate(4, text = $$props.text);
    		if ("x" in $$props) $$invalidate(0, x = $$props.x);
    		if ("y" in $$props) $$invalidate(1, y = $$props.y);
    		if ("w" in $$props) $$invalidate(6, w = $$props.w);
    		if ("h" in $$props) $$invalidate(5, h = $$props.h);
    		if ("width" in $$props) $$invalidate(2, width = $$props.width);
    	};

    	$$self.$capture_state = () => {
    		return { id, text, x, y, w, h, width };
    	};

    	$$self.$inject_state = $$props => {
    		if ("id" in $$props) $$invalidate(3, id = $$props.id);
    		if ("text" in $$props) $$invalidate(4, text = $$props.text);
    		if ("x" in $$props) $$invalidate(0, x = $$props.x);
    		if ("y" in $$props) $$invalidate(1, y = $$props.y);
    		if ("w" in $$props) $$invalidate(6, w = $$props.w);
    		if ("h" in $$props) $$invalidate(5, h = $$props.h);
    		if ("width" in $$props) $$invalidate(2, width = $$props.width);
    	};

    	return [x, y, width, id, text, h, w, click_handler];
    }

    class Link extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			id: 3,
    			text: 4,
    			x: 0,
    			y: 1,
    			w: 6,
    			h: 5,
    			width: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Link",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get id() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get text() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get x() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get w() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set w(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get h() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set h(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Input.svelte generated by Svelte v3.18.2 */

    const file$4 = "src/Input.svelte";

    function create_fragment$4(ctx) {
    	let div2;
    	let input;
    	let t0;
    	let div0;
    	let t1;
    	let div1;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			input = element("input");
    			t0 = space();
    			div0 = element("div");
    			t1 = space();
    			div1 = element("div");
    			attr_dev(input, "id", /*id*/ ctx[0]);
    			attr_dev(input, "class", "elee-input svelte-1xf5k94");
    			set_style(input, "left", /*xpx*/ ctx[4] + 12 + "px");
    			set_style(input, "top", /*ypx*/ ctx[5] + "px");
    			set_style(input, "width", /*wpx*/ ctx[3] - 12 + "px");
    			attr_dev(input, "maxlength", /*maxLength*/ ctx[1]);
    			add_location(input, file$4, 72, 0, 1574);
    			attr_dev(div0, "class", "elee-input-arrow-container svelte-1xf5k94");
    			set_style(div0, "left", /*xpx*/ ctx[4] + "px");
    			set_style(div0, "top", /*ypx*/ ctx[5] + "px");
    			add_location(div0, file$4, 75, 0, 1720);
    			attr_dev(div1, "class", "elee-input-arrow svelte-1xf5k94");
    			set_style(div1, "left", /*xpx*/ ctx[4] + "px");
    			set_style(div1, "top", /*ypx*/ ctx[5] + "px");
    			add_location(div1, file$4, 76, 0, 1804);
    			attr_dev(div2, "class", "elee-input-container svelte-1xf5k94");
    			add_location(div2, file$4, 71, 0, 1539);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, input);
    			set_input_value(input, /*textin*/ ctx[2]);
    			append_dev(div2, t0);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[10]);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*id*/ 1) {
    				attr_dev(input, "id", /*id*/ ctx[0]);
    			}

    			if (dirty & /*xpx*/ 16) {
    				set_style(input, "left", /*xpx*/ ctx[4] + 12 + "px");
    			}

    			if (dirty & /*ypx*/ 32) {
    				set_style(input, "top", /*ypx*/ ctx[5] + "px");
    			}

    			if (dirty & /*wpx*/ 8) {
    				set_style(input, "width", /*wpx*/ ctx[3] - 12 + "px");
    			}

    			if (dirty & /*maxLength*/ 2) {
    				attr_dev(input, "maxlength", /*maxLength*/ ctx[1]);
    			}

    			if (dirty & /*textin*/ 4 && input.value !== /*textin*/ ctx[2]) {
    				set_input_value(input, /*textin*/ ctx[2]);
    			}

    			if (dirty & /*xpx*/ 16) {
    				set_style(div0, "left", /*xpx*/ ctx[4] + "px");
    			}

    			if (dirty & /*ypx*/ 32) {
    				set_style(div0, "top", /*ypx*/ ctx[5] + "px");
    			}

    			if (dirty & /*xpx*/ 16) {
    				set_style(div1, "left", /*xpx*/ ctx[4] + "px");
    			}

    			if (dirty & /*ypx*/ 32) {
    				set_style(div1, "top", /*ypx*/ ctx[5] + "px");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { text = "" } = $$props;
    	let { id = undefined } = $$props;
    	let { x = 0 } = $$props;
    	let { y = 0 } = $$props;
    	let { w = 0 } = $$props;
    	const writable_props = ["text", "id", "x", "y", "w"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Input> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		textin = this.value;
    		((($$invalidate(2, textin), $$invalidate(6, text)), $$invalidate(1, maxLength)), $$invalidate(9, w));
    	}

    	$$self.$set = $$props => {
    		if ("text" in $$props) $$invalidate(6, text = $$props.text);
    		if ("id" in $$props) $$invalidate(0, id = $$props.id);
    		if ("x" in $$props) $$invalidate(7, x = $$props.x);
    		if ("y" in $$props) $$invalidate(8, y = $$props.y);
    		if ("w" in $$props) $$invalidate(9, w = $$props.w);
    	};

    	$$self.$capture_state = () => {
    		return {
    			text,
    			id,
    			x,
    			y,
    			w,
    			maxLength,
    			textin,
    			wpx,
    			xpx,
    			ypx
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("text" in $$props) $$invalidate(6, text = $$props.text);
    		if ("id" in $$props) $$invalidate(0, id = $$props.id);
    		if ("x" in $$props) $$invalidate(7, x = $$props.x);
    		if ("y" in $$props) $$invalidate(8, y = $$props.y);
    		if ("w" in $$props) $$invalidate(9, w = $$props.w);
    		if ("maxLength" in $$props) $$invalidate(1, maxLength = $$props.maxLength);
    		if ("textin" in $$props) $$invalidate(2, textin = $$props.textin);
    		if ("wpx" in $$props) $$invalidate(3, wpx = $$props.wpx);
    		if ("xpx" in $$props) $$invalidate(4, xpx = $$props.xpx);
    		if ("ypx" in $$props) $$invalidate(5, ypx = $$props.ypx);
    	};

    	let maxLength;
    	let textin;
    	let wpx;
    	let xpx;
    	let ypx;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*w*/ 512) {
    			 $$invalidate(1, maxLength = w - 3);
    		}

    		if ($$self.$$.dirty & /*text, maxLength*/ 66) {
    			 $$invalidate(2, textin = (text || "").length > maxLength
    			? $$invalidate(6, text = (text || "").slice(0, maxLength))
    			: text || "");
    		}

    		if ($$self.$$.dirty & /*w*/ 512) {
    			 $$invalidate(3, wpx = w * 12);
    		}

    		if ($$self.$$.dirty & /*x*/ 128) {
    			 $$invalidate(4, xpx = x * 12);
    		}

    		if ($$self.$$.dirty & /*y*/ 256) {
    			 $$invalidate(5, ypx = y * 34);
    		}
    	};

    	return [id, maxLength, textin, wpx, xpx, ypx, text, x, y, w, input_input_handler];
    }

    class Input extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { text: 6, id: 0, x: 7, y: 8, w: 9 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Input",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get text() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get x() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get w() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set w(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Section.svelte generated by Svelte v3.18.2 */

    const file$5 = "src/Section.svelte";

    function create_fragment$5(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "id", /*id*/ ctx[0]);
    			attr_dev(div, "class", "elee-section svelte-nlb0ou");
    			set_style(div, "left", /*xpx*/ ctx[1] + "px");
    			set_style(div, "top", /*ypx*/ ctx[2] + "px");
    			set_style(div, "width", /*wpx*/ ctx[3] + "px");
    			set_style(div, "height", /*hpx*/ ctx[4] + "px");
    			add_location(div, file$5, 32, 0, 578);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*id*/ 1) {
    				attr_dev(div, "id", /*id*/ ctx[0]);
    			}

    			if (dirty & /*xpx*/ 2) {
    				set_style(div, "left", /*xpx*/ ctx[1] + "px");
    			}

    			if (dirty & /*ypx*/ 4) {
    				set_style(div, "top", /*ypx*/ ctx[2] + "px");
    			}

    			if (dirty & /*wpx*/ 8) {
    				set_style(div, "width", /*wpx*/ ctx[3] + "px");
    			}

    			if (dirty & /*hpx*/ 16) {
    				set_style(div, "height", /*hpx*/ ctx[4] + "px");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { id = undefined } = $$props;
    	let { x = 0 } = $$props;
    	let { y = 0 } = $$props;
    	let { w = 0 } = $$props;
    	let { h = 0 } = $$props;
    	const writable_props = ["id", "x", "y", "w", "h"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Section> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("id" in $$props) $$invalidate(0, id = $$props.id);
    		if ("x" in $$props) $$invalidate(5, x = $$props.x);
    		if ("y" in $$props) $$invalidate(6, y = $$props.y);
    		if ("w" in $$props) $$invalidate(7, w = $$props.w);
    		if ("h" in $$props) $$invalidate(8, h = $$props.h);
    	};

    	$$self.$capture_state = () => {
    		return { id, x, y, w, h, xpx, ypx, wpx, hpx };
    	};

    	$$self.$inject_state = $$props => {
    		if ("id" in $$props) $$invalidate(0, id = $$props.id);
    		if ("x" in $$props) $$invalidate(5, x = $$props.x);
    		if ("y" in $$props) $$invalidate(6, y = $$props.y);
    		if ("w" in $$props) $$invalidate(7, w = $$props.w);
    		if ("h" in $$props) $$invalidate(8, h = $$props.h);
    		if ("xpx" in $$props) $$invalidate(1, xpx = $$props.xpx);
    		if ("ypx" in $$props) $$invalidate(2, ypx = $$props.ypx);
    		if ("wpx" in $$props) $$invalidate(3, wpx = $$props.wpx);
    		if ("hpx" in $$props) $$invalidate(4, hpx = $$props.hpx);
    	};

    	let xpx;
    	let ypx;
    	let wpx;
    	let hpx;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*x*/ 32) {
    			 $$invalidate(1, xpx = x * 12);
    		}

    		if ($$self.$$.dirty & /*y*/ 64) {
    			 $$invalidate(2, ypx = y * 34);
    		}

    		if ($$self.$$.dirty & /*w*/ 128) {
    			 $$invalidate(3, wpx = w * 12 - 10);
    		}

    		if ($$self.$$.dirty & /*h*/ 256) {
    			 $$invalidate(4, hpx = h * 34 - 32);
    		}
    	};

    	return [id, xpx, ypx, wpx, hpx, x, y, w, h];
    }

    class Section extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { id: 0, x: 5, y: 6, w: 7, h: 8 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Section",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get id() {
    		return this.$$.ctx[0];
    	}

    	set id(id) {
    		this.$set({ id });
    		flush();
    	}

    	get x() {
    		return this.$$.ctx[5];
    	}

    	set x(x) {
    		this.$set({ x });
    		flush();
    	}

    	get y() {
    		return this.$$.ctx[6];
    	}

    	set y(y) {
    		this.$set({ y });
    		flush();
    	}

    	get w() {
    		return this.$$.ctx[7];
    	}

    	set w(w) {
    		this.$set({ w });
    		flush();
    	}

    	get h() {
    		return this.$$.ctx[8];
    	}

    	set h(h) {
    		this.$set({ h });
    		flush();
    	}
    }

    /* src/Modal.svelte generated by Svelte v3.18.2 */

    const file$6 = "src/Modal.svelte";

    function create_fragment$6(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "id", /*id*/ ctx[0]);
    			attr_dev(div, "class", "elee-section svelte-6em1ey");
    			set_style(div, "left", /*xpx*/ ctx[2] + "px");
    			set_style(div, "top", /*ypx*/ ctx[3] + "px");
    			set_style(div, "width", /*wpx*/ ctx[4] + "px");
    			set_style(div, "height", /*hpx*/ ctx[5] + "px");
    			set_style(div, "visibility", /*v*/ ctx[1] ? "visible" : "hidden");
    			add_location(div, file$6, 33, 0, 602);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*id*/ 1) {
    				attr_dev(div, "id", /*id*/ ctx[0]);
    			}

    			if (dirty & /*xpx*/ 4) {
    				set_style(div, "left", /*xpx*/ ctx[2] + "px");
    			}

    			if (dirty & /*ypx*/ 8) {
    				set_style(div, "top", /*ypx*/ ctx[3] + "px");
    			}

    			if (dirty & /*wpx*/ 16) {
    				set_style(div, "width", /*wpx*/ ctx[4] + "px");
    			}

    			if (dirty & /*hpx*/ 32) {
    				set_style(div, "height", /*hpx*/ ctx[5] + "px");
    			}

    			if (dirty & /*v*/ 2) {
    				set_style(div, "visibility", /*v*/ ctx[1] ? "visible" : "hidden");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { id = undefined } = $$props;
    	let { x = 0 } = $$props;
    	let { y = 0 } = $$props;
    	let { w = 0 } = $$props;
    	let { h = 0 } = $$props;
    	let { v = true } = $$props;
    	const writable_props = ["id", "x", "y", "w", "h", "v"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Modal> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("id" in $$props) $$invalidate(0, id = $$props.id);
    		if ("x" in $$props) $$invalidate(6, x = $$props.x);
    		if ("y" in $$props) $$invalidate(7, y = $$props.y);
    		if ("w" in $$props) $$invalidate(8, w = $$props.w);
    		if ("h" in $$props) $$invalidate(9, h = $$props.h);
    		if ("v" in $$props) $$invalidate(1, v = $$props.v);
    	};

    	$$self.$capture_state = () => {
    		return { id, x, y, w, h, v, xpx, ypx, wpx, hpx };
    	};

    	$$self.$inject_state = $$props => {
    		if ("id" in $$props) $$invalidate(0, id = $$props.id);
    		if ("x" in $$props) $$invalidate(6, x = $$props.x);
    		if ("y" in $$props) $$invalidate(7, y = $$props.y);
    		if ("w" in $$props) $$invalidate(8, w = $$props.w);
    		if ("h" in $$props) $$invalidate(9, h = $$props.h);
    		if ("v" in $$props) $$invalidate(1, v = $$props.v);
    		if ("xpx" in $$props) $$invalidate(2, xpx = $$props.xpx);
    		if ("ypx" in $$props) $$invalidate(3, ypx = $$props.ypx);
    		if ("wpx" in $$props) $$invalidate(4, wpx = $$props.wpx);
    		if ("hpx" in $$props) $$invalidate(5, hpx = $$props.hpx);
    	};

    	let xpx;
    	let ypx;
    	let wpx;
    	let hpx;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*x*/ 64) {
    			 $$invalidate(2, xpx = x * 12);
    		}

    		if ($$self.$$.dirty & /*y*/ 128) {
    			 $$invalidate(3, ypx = y * 34);
    		}

    		if ($$self.$$.dirty & /*w*/ 256) {
    			 $$invalidate(4, wpx = w * 12 - 10);
    		}

    		if ($$self.$$.dirty & /*h*/ 512) {
    			 $$invalidate(5, hpx = h * 34 - 32);
    		}
    	};

    	return [id, v, xpx, ypx, wpx, hpx, x, y, w, h];
    }

    class Modal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { id: 0, x: 6, y: 7, w: 8, h: 9, v: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Modal",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get id() {
    		return this.$$.ctx[0];
    	}

    	set id(id) {
    		this.$set({ id });
    		flush();
    	}

    	get x() {
    		return this.$$.ctx[6];
    	}

    	set x(x) {
    		this.$set({ x });
    		flush();
    	}

    	get y() {
    		return this.$$.ctx[7];
    	}

    	set y(y) {
    		this.$set({ y });
    		flush();
    	}

    	get w() {
    		return this.$$.ctx[8];
    	}

    	set w(w) {
    		this.$set({ w });
    		flush();
    	}

    	get h() {
    		return this.$$.ctx[9];
    	}

    	set h(h) {
    		this.$set({ h });
    		flush();
    	}

    	get v() {
    		return this.$$.ctx[1];
    	}

    	set v(v) {
    		this.$set({ v });
    		flush();
    	}
    }

    /* src/TextBlock.svelte generated by Svelte v3.18.2 */

    const file$7 = "src/TextBlock.svelte";

    function create_fragment$7(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*text*/ ctx[1]);
    			attr_dev(div, "id", /*id*/ ctx[0]);
    			attr_dev(div, "class", "elee-text-block svelte-wbrmow");
    			set_style(div, "left", /*xpx*/ ctx[3] + "px");
    			set_style(div, "top", /*ypx*/ ctx[4] + "px");
    			set_style(div, "width", /*wpx*/ ctx[5] + 0.04 + "px");
    			set_style(div, "height", /*hpx*/ ctx[6] + "px");
    			set_style(div, "visibility", /*v*/ ctx[2] ? "visible" : "hidden");
    			add_location(div, file$7, 31, 0, 498);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*text*/ 2) set_data_dev(t, /*text*/ ctx[1]);

    			if (dirty & /*id*/ 1) {
    				attr_dev(div, "id", /*id*/ ctx[0]);
    			}

    			if (dirty & /*xpx*/ 8) {
    				set_style(div, "left", /*xpx*/ ctx[3] + "px");
    			}

    			if (dirty & /*ypx*/ 16) {
    				set_style(div, "top", /*ypx*/ ctx[4] + "px");
    			}

    			if (dirty & /*wpx*/ 32) {
    				set_style(div, "width", /*wpx*/ ctx[5] + 0.04 + "px");
    			}

    			if (dirty & /*hpx*/ 64) {
    				set_style(div, "height", /*hpx*/ ctx[6] + "px");
    			}

    			if (dirty & /*v*/ 4) {
    				set_style(div, "visibility", /*v*/ ctx[2] ? "visible" : "hidden");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { id = undefined } = $$props;
    	let { x = 0 } = $$props;
    	let { y = 0 } = $$props;
    	let { w = 0 } = $$props;
    	let { h = 0 } = $$props;
    	let { text = "" } = $$props;
    	let { v = true } = $$props;
    	const writable_props = ["id", "x", "y", "w", "h", "text", "v"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TextBlock> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("id" in $$props) $$invalidate(0, id = $$props.id);
    		if ("x" in $$props) $$invalidate(7, x = $$props.x);
    		if ("y" in $$props) $$invalidate(8, y = $$props.y);
    		if ("w" in $$props) $$invalidate(9, w = $$props.w);
    		if ("h" in $$props) $$invalidate(10, h = $$props.h);
    		if ("text" in $$props) $$invalidate(1, text = $$props.text);
    		if ("v" in $$props) $$invalidate(2, v = $$props.v);
    	};

    	$$self.$capture_state = () => {
    		return {
    			id,
    			x,
    			y,
    			w,
    			h,
    			text,
    			v,
    			xpx,
    			ypx,
    			wpx,
    			hpx
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("id" in $$props) $$invalidate(0, id = $$props.id);
    		if ("x" in $$props) $$invalidate(7, x = $$props.x);
    		if ("y" in $$props) $$invalidate(8, y = $$props.y);
    		if ("w" in $$props) $$invalidate(9, w = $$props.w);
    		if ("h" in $$props) $$invalidate(10, h = $$props.h);
    		if ("text" in $$props) $$invalidate(1, text = $$props.text);
    		if ("v" in $$props) $$invalidate(2, v = $$props.v);
    		if ("xpx" in $$props) $$invalidate(3, xpx = $$props.xpx);
    		if ("ypx" in $$props) $$invalidate(4, ypx = $$props.ypx);
    		if ("wpx" in $$props) $$invalidate(5, wpx = $$props.wpx);
    		if ("hpx" in $$props) $$invalidate(6, hpx = $$props.hpx);
    	};

    	let xpx;
    	let ypx;
    	let wpx;
    	let hpx;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*x*/ 128) {
    			 $$invalidate(3, xpx = x * 12);
    		}

    		if ($$self.$$.dirty & /*y*/ 256) {
    			 $$invalidate(4, ypx = y * 34);
    		}

    		if ($$self.$$.dirty & /*w*/ 512) {
    			 $$invalidate(5, wpx = w * 12);
    		}

    		if ($$self.$$.dirty & /*h*/ 1024) {
    			 $$invalidate(6, hpx = h * 34);
    		}
    	};

    	return [id, text, v, xpx, ypx, wpx, hpx, x, y, w, h];
    }

    class TextBlock extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
    			id: 0,
    			x: 7,
    			y: 8,
    			w: 9,
    			h: 10,
    			text: 1,
    			v: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TextBlock",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get id() {
    		return this.$$.ctx[0];
    	}

    	set id(id) {
    		this.$set({ id });
    		flush();
    	}

    	get x() {
    		return this.$$.ctx[7];
    	}

    	set x(x) {
    		this.$set({ x });
    		flush();
    	}

    	get y() {
    		return this.$$.ctx[8];
    	}

    	set y(y) {
    		this.$set({ y });
    		flush();
    	}

    	get w() {
    		return this.$$.ctx[9];
    	}

    	set w(w) {
    		this.$set({ w });
    		flush();
    	}

    	get h() {
    		return this.$$.ctx[10];
    	}

    	set h(h) {
    		this.$set({ h });
    		flush();
    	}

    	get text() {
    		return this.$$.ctx[1];
    	}

    	set text(text) {
    		this.$set({ text });
    		flush();
    	}

    	get v() {
    		return this.$$.ctx[2];
    	}

    	set v(v) {
    		this.$set({ v });
    		flush();
    	}
    }

    // Characters are fixed 12x34 (font-size: 20px)

    class Elee {
        constructor() {
            this.target = document.body;
            this.x = 0;
            this.y = 0;
        }

        make(Component, properties) {
            const c = new Component({
                target: this.target || document.body,
                props: {
                    ...properties,
                    x: this.x,
                    y: this.y,
                }
            });

            return c;
        }

        makeApp({id, w, h}) {
            return this.make(App, {
                id, w, h,
            });
        }

        makeContainer({id, w, h}) {
            return this.make(Container, {
                id, w, h,
            });
        }

        makeText({ id, text }) {
            return this.make(Text, {
                id, text,
            });
        }

        makeButton({ id, text, w }) {
            return this.make(Button, {
                id, text, w
            });
        }

        makeLink({ id, text }) {
            return this.make(Link, {
                id, text,
            });
        }

        makeInput({ id, text, w }) {
            return this.make(Input, {
                id, text, w,
            });
        }

        makeSection({ id, w, h }) {
            return this.make(Section, {
                id, w, h,
            });
        }

        makeModal({ id, w, h }) {
            return this.make(Modal, {
                id, w, h,
            });
        }

        makeTextBlock({ id, w, h, text }) {
            return this.make(TextBlock, {
                id, w, h, text,
            });
        }

        newContainer() {
            return new Container();
        }

        // start() {
        //     const app = new App({
        //         target: document.body
        //     });
        // }
    }

    class Container {
        constructor() {
            this.items = [];
        }

        add(component) {
            this.items.push(component);
        }

        remove(component) {
            this.items = this.items.filter(item => item !== component);
        }

        $on(eventName, callback) {
            this.items.forEach(item => {
                item.$on(eventName, callback);
            });
        }

        $set(update) {
            this.items.forEach(item => {
                item.$set(update);
            });
        }
    }

    const elee = new Elee();
    // export { context };
    // export let context;

    elee.target = document.body;
    const app = elee.makeApp({
    	id: 'app',
    	w: 800,
    	h: 380,
    });

    elee.target = document.querySelector('#app');

    // e.x = 0;
    // e.y = 0;
    // e.makeContainer({
    // 	id: 'app-container',
    // 	w: 800,
    // 	h: 380,
    // });

    // e.target = document.querySelector('#app-container');

    elee.x = 1;
    elee.y = 0;
    const t1 = elee.makeText({
    	text: 'Some text here'
    });

    elee.y = 1;
    const t2 = elee.makeText({
    	text: 'With Events'
    });

    elee.y = 2;
    const t3 = elee.makeText({
    	text: 'Element position is'
    });

    elee.x = 16;
    elee.y = 0;
    const b1 = elee.makeButton({
    	text: 'BUTTONS',
    });

    b1.$on('click', event => {
    	t1.$set({text: 'updated!'});
    	// t1.text = 'updated!';
    	// t1.$destroy();

    });

    elee.x = 19;
    elee.y = 1;
    elee.makeLink({
    	text: 'A Link',
    });

    elee.x = 21;
    elee.y = 2;
    elee.makeLink({
    	text: 'absolute',
    });


    elee.x = 1;
    elee.y = 3;

    elee.makeText({
    	text: 'HI',
    });
    elee.x = 4;
    const text1 = elee.makeInput({
    	text: 'Inputs',
    	w: 19,
    });

    elee.x = 24;
    elee.y = 3;
    const clickMe = elee.makeButton({
    	text: 'Click Me',
    	w: 12,
    });

    elee.x = 40;
    elee.y = 0;
    const s1 = elee.makeSection({
    	id: 'section1',
    	w: 24,
    	h: 9,
    });

    // e.target = document.querySelector('#section1');
    elee.x = 41;
    elee.y = 0;
    const sectionText = elee.makeText({
    	text: 'Section!',
    });

    // setTimeout(() => {
    // 	console.log(s1);
    // 	s1.$set({x:  s1.x + 3});
    // 	sectionText.$set({x: sectionText.x + 3});
    // }, 1300);

    // e.target = document.querySelector('#section2');
    elee.x = 43;
    elee.y = 3;
    elee.makeText({
    	text: 'Text within',
    });

    const c1 = elee.newContainer();

    elee.x = 8;
    elee.y = 1;
    const modal = elee.makeModal({
    	w: 23,
    	h: 8,
    });
    c1.add(modal);

    elee.x = 10;
    elee.y = 2;
    c1.add(elee.makeTextBlock({
    	w: 19, h: 4,
    	text: 'A dialog box with text in it. Dialogs obey the view hierarchy.',
    }));

    const c2 = elee.newContainer();
    elee.x = 10;
    elee.y = 7;
    const saveButton = elee.makeButton({
    	text: 'SAVE',
    	w: 9,
    });
    c1.add(saveButton);
    c2.add(saveButton);

    elee.x = 20;
    elee.y = 7;
    const cancelButton = elee.makeButton({
    	text: 'CANCEL',
    	w: 9,
    });
    c1.add(cancelButton);
    c2.add(cancelButton);

    c2.$on('click', () => {
    	c1.$set({ v: false });
    });

    clickMe.$on('click', () => {
    	c1.$set({ v: true });
    });

    // b1.element.addEventListener('click', event => {
    // 	console.log('click!', event);
    // 	t1.text = 'updated!';
    // 	t1.x += 1;
    // });

    // console.log('c12', c12);
    // e.target = document.querySelector('#idhere');
    // e.x = 200;
    // e.y = 0;
    // e.makeComponent2({
    // 	name: 'comp2-2',
    // });

    // Maybe when we listen for input we always wait a tick until processing
    // in order to wait until all elements are rendered?

}());
//# sourceMappingURL=bundle.js.map
