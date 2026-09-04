import { $i as unwrapSafeValue, $r as findLocaleData, Al as ɵɵinject, Ar as _sanitizeUrl, Bc as PendingTasks, Bl as operate, Bn as LOCALE_ID, Br as bypassSanitizationTrustUrl, Bt as computed, Cl as stringify, Cr as TracingService, Dc as Injector, Dl as ɵɵdefineInjector, Dn as Host, Dr as ViewEncapsulation, Ec as InjectionToken, Ei as performanceMarkFeature, El as ɵɵdefineInjectable, En as ElementRef, Er as ViewContainerRef, F as createPlatformFactory, Fc as NgZone, Fn as Injectable, Gc as TransferState, Gl as __asyncGenerator, Hl as observable, In as Input, Ir as bypassSanitizationTrustHtml, Jl as __awaiter, Jr as createNgModule, Ki as setDocument, Kl as __asyncValues, Lc as PLATFORM_ID, Ll as map, Lo as ɵɵinjectAttribute, Lr as bypassSanitizationTrustResourceUrl, Lt as ResourceImpl, Nr as allLeavingAnimations, O as booleanAttribute, Oo as ɵɵgetInheritedFactory, Pn as Inject, Pr as allowSanitizationBypassAndThrow, Pt as CACHE_ACTIVE, Qn as Optional, Rc as PLATFORM_INITIALIZER, Rl as Subject, Rr as bypassSanitizationTrustScript, Sc as IMAGE_CONFIG_DEFAULTS, Tc as INTERNAL_APPLICATION_ERROR_HANDLER, Tr as USE_PENDING_TASKS, Uc as RuntimeError, Ul as reportUnhandledError, Vl as Observable, Vn as LocaleDataIndex, Vt as encapsulateResourceError, Wc as SecurityContext, Wi as setClassMetadata, Wl as isFunction, Wt as linkedSignal, Xc as _global, Xl as __values, Xr as describeDomNode, Yl as __generator, Yt as APP_BOOTSTRAP_LISTENER, Z as internalCreateApplication, Zc as assertInInjectionContext, Zn as NgModuleRef$1, ao as ɵɵdefineService, ar as RendererFactory2, bi as isSubscribable, br as TestabilityRegistry, bt as withI18nSupport$1, dr as Service, er as Pipe, fc as CSP_NONCE, fi as getLocalePluralCase$1, fn as Console, gc as ENVIRONMENT_INITIALIZER, hc as DestroyRef, hr as TESTABILITY_GETTER, io as ɵɵdefinePipe, ir as Renderer2, jn as IS_ENABLED_BLOCKING_INITIAL_NAVIGATION, kr as _sanitizeHtml, la as ɵɵNgOnChangesFeature, m as KeyValueDiffers, mc as DOCUMENT, ml as makeStateKey, mn as DEFAULT_CURRENCY_CODE, mr as TESTABILITY, nl as formatRuntimeError, nn as Attribute, no as ɵɵdefineDirective, oo as ɵɵdirectiveInject, or as RendererStyleFlags2, ot as platformCore, p as IterableDiffers, pl as makeEnvironmentProviders, qc as Version, ql as __await, qn as NgModule, qt as untracked, r as ChangeDetectorRef, rl as forwardRef, ro as ɵɵdefineNgModule, rt as numberAttribute, sl as inject, sr as SHARED_STYLES_HOST, t as ApplicationModule, tn as ApplicationRef, uc as APP_ID, ul as isSignal, ut as provideStabilityDebugging, vc as EnvironmentInjector, vr as TemplateRef, vt as withDomHydration, wc as INJECTOR_SCOPE, wl as truncateMiddle, wn as Directive, xc as IMAGE_CONFIG, xl as signal, xt as withIncrementalHydration$1, yc as ErrorHandler, yi as isPromise$1, yl as runInInjectionContext, yr as Testability, yt as withEventReplay$1, zl as createOperatorSubscriber, zr as bypassSanitizationTrustStyle, zs as ɵɵstyleProp } from "./core-C-3UcH5M.js";
import { t as _defineProperty } from "./defineProperty-wQpB4Zl9.js";
//#region node_modules/rxjs/dist/esm5/internal/util/isScheduler.js
function isScheduler(value) {
	return value && isFunction(value.schedule);
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/util/args.js
function last(arr) {
	return arr[arr.length - 1];
}
function popScheduler(args) {
	return isScheduler(last(args)) ? args.pop() : void 0;
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/util/isArrayLike.js
var isArrayLike = (function(x) {
	return x && typeof x.length === "number" && typeof x !== "function";
});
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/util/isPromise.js
function isPromise(value) {
	return isFunction(value === null || value === void 0 ? void 0 : value.then);
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/util/isInteropObservable.js
function isInteropObservable(input) {
	return isFunction(input[observable]);
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/util/isAsyncIterable.js
function isAsyncIterable(obj) {
	return Symbol.asyncIterator && isFunction(obj === null || obj === void 0 ? void 0 : obj[Symbol.asyncIterator]);
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/util/throwUnobservableError.js
function createInvalidObservableTypeError(input) {
	return /* @__PURE__ */ new TypeError("You provided " + (input !== null && typeof input === "object" ? "an invalid object" : "'" + input + "'") + " where a stream was expected. You can provide an Observable, Promise, ReadableStream, Array, AsyncIterable, or Iterable.");
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/symbol/iterator.js
function getSymbolIterator() {
	if (typeof Symbol !== "function" || !Symbol.iterator) return "@@iterator";
	return Symbol.iterator;
}
var iterator = getSymbolIterator();
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/util/isIterable.js
function isIterable(input) {
	return isFunction(input === null || input === void 0 ? void 0 : input[iterator]);
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/util/isReadableStreamLike.js
function readableStreamLikeToAsyncGenerator(readableStream) {
	return __asyncGenerator(this, arguments, function readableStreamLikeToAsyncGenerator_1() {
		var reader, _a, value, done;
		return __generator(this, function(_b) {
			switch (_b.label) {
				case 0:
					reader = readableStream.getReader();
					_b.label = 1;
				case 1:
					_b.trys.push([
						1,
						,
						9,
						10
					]);
					_b.label = 2;
				case 2: return [4, __await(reader.read())];
				case 3:
					_a = _b.sent(), value = _a.value, done = _a.done;
					if (!done) return [3, 5];
					return [4, __await(void 0)];
				case 4: return [2, _b.sent()];
				case 5: return [4, __await(value)];
				case 6: return [4, _b.sent()];
				case 7:
					_b.sent();
					return [3, 2];
				case 8: return [3, 10];
				case 9:
					reader.releaseLock();
					return [7];
				case 10: return [2];
			}
		});
	});
}
function isReadableStreamLike(obj) {
	return isFunction(obj === null || obj === void 0 ? void 0 : obj.getReader);
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/observable/innerFrom.js
function innerFrom(input) {
	if (input instanceof Observable) return input;
	if (input != null) {
		if (isInteropObservable(input)) return fromInteropObservable(input);
		if (isArrayLike(input)) return fromArrayLike(input);
		if (isPromise(input)) return fromPromise(input);
		if (isAsyncIterable(input)) return fromAsyncIterable(input);
		if (isIterable(input)) return fromIterable(input);
		if (isReadableStreamLike(input)) return fromReadableStreamLike(input);
	}
	throw createInvalidObservableTypeError(input);
}
function fromInteropObservable(obj) {
	return new Observable(function(subscriber) {
		var obs = obj[observable]();
		if (isFunction(obs.subscribe)) return obs.subscribe(subscriber);
		throw new TypeError("Provided object does not correctly implement Symbol.observable");
	});
}
function fromArrayLike(array) {
	return new Observable(function(subscriber) {
		for (var i = 0; i < array.length && !subscriber.closed; i++) subscriber.next(array[i]);
		subscriber.complete();
	});
}
function fromPromise(promise) {
	return new Observable(function(subscriber) {
		promise.then(function(value) {
			if (!subscriber.closed) {
				subscriber.next(value);
				subscriber.complete();
			}
		}, function(err) {
			return subscriber.error(err);
		}).then(null, reportUnhandledError);
	});
}
function fromIterable(iterable) {
	return new Observable(function(subscriber) {
		var e_1, _a;
		try {
			for (var iterable_1 = __values(iterable), iterable_1_1 = iterable_1.next(); !iterable_1_1.done; iterable_1_1 = iterable_1.next()) {
				var value = iterable_1_1.value;
				subscriber.next(value);
				if (subscriber.closed) return;
			}
		} catch (e_1_1) {
			e_1 = { error: e_1_1 };
		} finally {
			try {
				if (iterable_1_1 && !iterable_1_1.done && (_a = iterable_1.return)) _a.call(iterable_1);
			} finally {
				if (e_1) throw e_1.error;
			}
		}
		subscriber.complete();
	});
}
function fromAsyncIterable(asyncIterable) {
	return new Observable(function(subscriber) {
		process(asyncIterable, subscriber).catch(function(err) {
			return subscriber.error(err);
		});
	});
}
function fromReadableStreamLike(readableStream) {
	return fromAsyncIterable(readableStreamLikeToAsyncGenerator(readableStream));
}
function process(asyncIterable, subscriber) {
	var asyncIterable_1, asyncIterable_1_1;
	var e_2, _a;
	return __awaiter(this, void 0, void 0, function() {
		var value, e_2_1;
		return __generator(this, function(_b) {
			switch (_b.label) {
				case 0:
					_b.trys.push([
						0,
						5,
						6,
						11
					]);
					asyncIterable_1 = __asyncValues(asyncIterable);
					_b.label = 1;
				case 1: return [4, asyncIterable_1.next()];
				case 2:
					if (!(asyncIterable_1_1 = _b.sent(), !asyncIterable_1_1.done)) return [3, 4];
					value = asyncIterable_1_1.value;
					subscriber.next(value);
					if (subscriber.closed) return [2];
					_b.label = 3;
				case 3: return [3, 1];
				case 4: return [3, 11];
				case 5:
					e_2_1 = _b.sent();
					e_2 = { error: e_2_1 };
					return [3, 11];
				case 6:
					_b.trys.push([
						6,
						,
						9,
						10
					]);
					if (!(asyncIterable_1_1 && !asyncIterable_1_1.done && (_a = asyncIterable_1.return))) return [3, 8];
					return [4, _a.call(asyncIterable_1)];
				case 7:
					_b.sent();
					_b.label = 8;
				case 8: return [3, 10];
				case 9:
					if (e_2) throw e_2.error;
					return [7];
				case 10: return [7];
				case 11:
					subscriber.complete();
					return [2];
			}
		});
	});
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/util/executeSchedule.js
function executeSchedule(parentSubscription, scheduler, work, delay, repeat) {
	if (delay === void 0) delay = 0;
	if (repeat === void 0) repeat = false;
	var scheduleSubscription = scheduler.schedule(function() {
		work();
		if (repeat) parentSubscription.add(this.schedule(null, delay));
		else this.unsubscribe();
	}, delay);
	parentSubscription.add(scheduleSubscription);
	if (!repeat) return scheduleSubscription;
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/operators/observeOn.js
function observeOn(scheduler, delay) {
	if (delay === void 0) delay = 0;
	return operate(function(source, subscriber) {
		source.subscribe(createOperatorSubscriber(subscriber, function(value) {
			return executeSchedule(subscriber, scheduler, function() {
				return subscriber.next(value);
			}, delay);
		}, function() {
			return executeSchedule(subscriber, scheduler, function() {
				return subscriber.complete();
			}, delay);
		}, function(err) {
			return executeSchedule(subscriber, scheduler, function() {
				return subscriber.error(err);
			}, delay);
		}));
	});
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/operators/subscribeOn.js
function subscribeOn(scheduler, delay) {
	if (delay === void 0) delay = 0;
	return operate(function(source, subscriber) {
		subscriber.add(scheduler.schedule(function() {
			return source.subscribe(subscriber);
		}, delay));
	});
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/scheduled/scheduleObservable.js
function scheduleObservable(input, scheduler) {
	return innerFrom(input).pipe(subscribeOn(scheduler), observeOn(scheduler));
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/scheduled/schedulePromise.js
function schedulePromise(input, scheduler) {
	return innerFrom(input).pipe(subscribeOn(scheduler), observeOn(scheduler));
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/scheduled/scheduleArray.js
function scheduleArray(input, scheduler) {
	return new Observable(function(subscriber) {
		var i = 0;
		return scheduler.schedule(function() {
			if (i === input.length) subscriber.complete();
			else {
				subscriber.next(input[i++]);
				if (!subscriber.closed) this.schedule();
			}
		});
	});
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/scheduled/scheduleIterable.js
function scheduleIterable(input, scheduler) {
	return new Observable(function(subscriber) {
		var iterator$1;
		executeSchedule(subscriber, scheduler, function() {
			iterator$1 = input[iterator]();
			executeSchedule(subscriber, scheduler, function() {
				var _a;
				var value;
				var done;
				try {
					_a = iterator$1.next(), value = _a.value, done = _a.done;
				} catch (err) {
					subscriber.error(err);
					return;
				}
				if (done) subscriber.complete();
				else subscriber.next(value);
			}, 0, true);
		});
		return function() {
			return isFunction(iterator$1 === null || iterator$1 === void 0 ? void 0 : iterator$1.return) && iterator$1.return();
		};
	});
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/scheduled/scheduleAsyncIterable.js
function scheduleAsyncIterable(input, scheduler) {
	if (!input) throw new Error("Iterable cannot be null");
	return new Observable(function(subscriber) {
		executeSchedule(subscriber, scheduler, function() {
			var iterator = input[Symbol.asyncIterator]();
			executeSchedule(subscriber, scheduler, function() {
				iterator.next().then(function(result) {
					if (result.done) subscriber.complete();
					else subscriber.next(result.value);
				});
			}, 0, true);
		});
	});
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/scheduled/scheduleReadableStreamLike.js
function scheduleReadableStreamLike(input, scheduler) {
	return scheduleAsyncIterable(readableStreamLikeToAsyncGenerator(input), scheduler);
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/scheduled/scheduled.js
function scheduled(input, scheduler) {
	if (input != null) {
		if (isInteropObservable(input)) return scheduleObservable(input, scheduler);
		if (isArrayLike(input)) return scheduleArray(input, scheduler);
		if (isPromise(input)) return schedulePromise(input, scheduler);
		if (isAsyncIterable(input)) return scheduleAsyncIterable(input, scheduler);
		if (isIterable(input)) return scheduleIterable(input, scheduler);
		if (isReadableStreamLike(input)) return scheduleReadableStreamLike(input, scheduler);
	}
	throw createInvalidObservableTypeError(input);
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/observable/from.js
function from(input, scheduler) {
	return scheduler ? scheduled(input, scheduler) : innerFrom(input);
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/observable/of.js
function of() {
	var args = [];
	for (var _i = 0; _i < arguments.length; _i++) args[_i] = arguments[_i];
	return from(args, popScheduler(args));
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/operators/mergeInternals.js
function mergeInternals(source, subscriber, project, concurrent, onBeforeNext, expand, innerSubScheduler, additionalFinalizer) {
	var buffer = [];
	var active = 0;
	var index = 0;
	var isComplete = false;
	var checkComplete = function() {
		if (isComplete && !buffer.length && !active) subscriber.complete();
	};
	var outerNext = function(value) {
		return active < concurrent ? doInnerSub(value) : buffer.push(value);
	};
	var doInnerSub = function(value) {
		expand && subscriber.next(value);
		active++;
		var innerComplete = false;
		innerFrom(project(value, index++)).subscribe(createOperatorSubscriber(subscriber, function(innerValue) {
			onBeforeNext === null || onBeforeNext === void 0 || onBeforeNext(innerValue);
			if (expand) outerNext(innerValue);
			else subscriber.next(innerValue);
		}, function() {
			innerComplete = true;
		}, void 0, function() {
			if (innerComplete) try {
				active--;
				var _loop_1 = function() {
					var bufferedValue = buffer.shift();
					if (innerSubScheduler) executeSchedule(subscriber, innerSubScheduler, function() {
						return doInnerSub(bufferedValue);
					});
					else doInnerSub(bufferedValue);
				};
				while (buffer.length && active < concurrent) _loop_1();
				checkComplete();
			} catch (err) {
				subscriber.error(err);
			}
		}));
	};
	source.subscribe(createOperatorSubscriber(subscriber, outerNext, function() {
		isComplete = true;
		checkComplete();
	}));
	return function() {
		additionalFinalizer === null || additionalFinalizer === void 0 || additionalFinalizer();
	};
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/operators/mergeMap.js
function mergeMap(project, resultSelector, concurrent) {
	if (concurrent === void 0) concurrent = Infinity;
	if (isFunction(resultSelector)) return mergeMap(function(a, i) {
		return map(function(b, ii) {
			return resultSelector(a, b, i, ii);
		})(innerFrom(project(a, i)));
	}, concurrent);
	else if (typeof resultSelector === "number") concurrent = resultSelector;
	return operate(function(source, subscriber) {
		return mergeInternals(source, subscriber, project, concurrent);
	});
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/operators/filter.js
function filter(predicate, thisArg) {
	return operate(function(source, subscriber) {
		var index = 0;
		source.subscribe(createOperatorSubscriber(subscriber, function(value) {
			return predicate.call(thisArg, value, index++) && subscriber.next(value);
		}));
	});
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/operators/concatMap.js
function concatMap(project, resultSelector) {
	return isFunction(resultSelector) ? mergeMap(project, resultSelector, 1) : mergeMap(project, 1);
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/operators/finalize.js
function finalize(callback) {
	return operate(function(source, subscriber) {
		try {
			source.subscribe(subscriber);
		} finally {
			subscriber.add(callback);
		}
	});
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/operators/switchMap.js
function switchMap(project, resultSelector) {
	return operate(function(source, subscriber) {
		var innerSubscriber = null;
		var index = 0;
		var isComplete = false;
		var checkComplete = function() {
			return isComplete && !innerSubscriber && subscriber.complete();
		};
		source.subscribe(createOperatorSubscriber(subscriber, function(value) {
			innerSubscriber === null || innerSubscriber === void 0 || innerSubscriber.unsubscribe();
			var innerIndex = 0;
			var outerIndex = index++;
			innerFrom(project(value, outerIndex)).subscribe(innerSubscriber = createOperatorSubscriber(subscriber, function(innerValue) {
				return subscriber.next(resultSelector ? resultSelector(value, innerValue, outerIndex, innerIndex++) : innerValue);
			}, function() {
				innerSubscriber = null;
				checkComplete();
			}));
		}, function() {
			isComplete = true;
			checkComplete();
		}));
	});
}
//#endregion
//#region node_modules/@angular/common/fesm2022/_platform_location-chunk.mjs
/**
* @license Angular v22.1.5
* (c) 2010-2026 Google LLC. https://angular.dev/
* License: MIT
*/
var _PlatformLocation;
var _BrowserPlatformLocation;
var _DOM = null;
function getDOM() {
	return _DOM;
}
function setRootDomAdapter(adapter) {
	_DOM ??= adapter;
}
var DomAdapter = class {};
var PlatformLocation = class {
	historyGo(relativePosition) {
		throw new Error(ngDevMode ? "Not implemented" : "");
	}
};
_PlatformLocation = PlatformLocation;
_defineProperty(PlatformLocation, "ɵfac", function PlatformLocation_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _PlatformLocation)();
});
_defineProperty(PlatformLocation, "ɵprov", /* @__PURE__ */ ɵɵdefineInjectable({
	token: _PlatformLocation,
	factory: () => (() => inject(BrowserPlatformLocation))(),
	providedIn: "platform"
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(PlatformLocation, [{
		type: Injectable,
		args: [{
			providedIn: "platform",
			useFactory: () => inject(BrowserPlatformLocation)
		}]
	}], null, null);
})();
new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "Location Initialized" : "");
var BrowserPlatformLocation = class extends PlatformLocation {
	constructor() {
		super();
		_defineProperty(this, "_location", void 0);
		_defineProperty(this, "_history", void 0);
		_defineProperty(this, "_doc", inject(DOCUMENT));
		this._location = window.location;
		this._history = window.history;
	}
	getBaseHrefFromDOM() {
		return getDOM().getBaseHref(this._doc);
	}
	onPopState(fn) {
		const window = getDOM().getGlobalEventTarget(this._doc, "window");
		window.addEventListener("popstate", fn, false);
		return () => window.removeEventListener("popstate", fn);
	}
	onHashChange(fn) {
		const window = getDOM().getGlobalEventTarget(this._doc, "window");
		window.addEventListener("hashchange", fn, false);
		return () => window.removeEventListener("hashchange", fn);
	}
	get href() {
		return this._location.href;
	}
	get protocol() {
		return this._location.protocol;
	}
	get hostname() {
		return this._location.hostname;
	}
	get port() {
		return this._location.port;
	}
	get pathname() {
		return this._location.pathname;
	}
	get search() {
		return this._location.search;
	}
	get hash() {
		return this._location.hash;
	}
	set pathname(newPath) {
		this._location.pathname = newPath;
	}
	pushState(state, title, url) {
		this._history.pushState(state, title, url);
	}
	replaceState(state, title, url) {
		this._history.replaceState(state, title, url);
	}
	forward() {
		this._history.forward();
	}
	back() {
		this._history.back();
	}
	historyGo(relativePosition = 0) {
		this._history.go(relativePosition);
	}
	getState() {
		return this._history.state;
	}
};
_BrowserPlatformLocation = BrowserPlatformLocation;
_defineProperty(BrowserPlatformLocation, "ɵfac", function BrowserPlatformLocation_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _BrowserPlatformLocation)();
});
_defineProperty(BrowserPlatformLocation, "ɵprov", /* @__PURE__ */ ɵɵdefineInjectable({
	token: _BrowserPlatformLocation,
	factory: () => (() => new _BrowserPlatformLocation())(),
	providedIn: "platform"
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrowserPlatformLocation, [{
		type: Injectable,
		args: [{
			providedIn: "platform",
			useFactory: () => new BrowserPlatformLocation()
		}]
	}], () => [], null);
})();
//#endregion
//#region node_modules/@angular/common/fesm2022/_location-chunk.mjs
/**
* @license Angular v22.1.5
* (c) 2010-2026 Google LLC. https://angular.dev/
* License: MIT
*/
var _LocationStrategy;
var _PathLocationStrategy;
var _NoTrailingSlashPathLocationStrategy;
var _TrailingSlashPathLocationStrategy;
var _Location;
function joinWithSlash(start, end) {
	if (!start) return end;
	if (!end) return start;
	if (start.endsWith("/")) return end.startsWith("/") ? start + end.slice(1) : start + end;
	return end.startsWith("/") ? start + end : `${start}/${end}`;
}
function stripTrailingSlash(url) {
	const pathEndIdx = url.search(/#|\?|$/);
	return url[pathEndIdx - 1] === "/" ? url.slice(0, pathEndIdx - 1) + url.slice(pathEndIdx) : url;
}
function normalizeQueryParams(params) {
	return params && params[0] !== "?" ? `?${params}` : params;
}
var LocationStrategy = class {
	historyGo(relativePosition) {
		throw new Error(ngDevMode ? "Not implemented" : "");
	}
};
_LocationStrategy = LocationStrategy;
_defineProperty(LocationStrategy, "ɵfac", function LocationStrategy_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _LocationStrategy)();
});
_defineProperty(LocationStrategy, "ɵprov", /* @__PURE__ */ ɵɵdefineInjectable({
	token: _LocationStrategy,
	factory: () => (() => inject(PathLocationStrategy))(),
	providedIn: "root"
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(LocationStrategy, [{
		type: Injectable,
		args: [{
			providedIn: "root",
			useFactory: () => inject(PathLocationStrategy)
		}]
	}], null, null);
})();
var APP_BASE_HREF = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "appBaseHref" : "");
var PathLocationStrategy = class extends LocationStrategy {
	constructor(_platformLocation, href) {
		super();
		_defineProperty(this, "_platformLocation", void 0);
		_defineProperty(this, "_baseHref", void 0);
		_defineProperty(this, "_removeListenerFns", []);
		this._platformLocation = _platformLocation;
		this._baseHref = href ?? this._platformLocation.getBaseHrefFromDOM() ?? inject(DOCUMENT).location?.origin ?? "";
	}
	ngOnDestroy() {
		while (this._removeListenerFns.length) this._removeListenerFns.pop()();
	}
	onPopState(fn) {
		this._removeListenerFns.push(this._platformLocation.onPopState(fn), this._platformLocation.onHashChange(fn));
	}
	getBaseHref() {
		return this._baseHref;
	}
	prepareExternalUrl(internal) {
		return joinWithSlash(this._baseHref, internal);
	}
	path(includeHash = false) {
		const pathname = this._platformLocation.pathname + normalizeQueryParams(this._platformLocation.search);
		const hash = this._platformLocation.hash;
		return hash && includeHash ? `${pathname}${hash}` : pathname;
	}
	pushState(state, title, url, queryParams) {
		const externalUrl = this.prepareExternalUrl(url + normalizeQueryParams(queryParams));
		this._platformLocation.pushState(state, title, externalUrl);
	}
	replaceState(state, title, url, queryParams) {
		const externalUrl = this.prepareExternalUrl(url + normalizeQueryParams(queryParams));
		this._platformLocation.replaceState(state, title, externalUrl);
	}
	forward() {
		this._platformLocation.forward();
	}
	back() {
		this._platformLocation.back();
	}
	getState() {
		return this._platformLocation.getState();
	}
	historyGo(relativePosition = 0) {
		this._platformLocation.historyGo?.(relativePosition);
	}
};
_PathLocationStrategy = PathLocationStrategy;
_defineProperty(PathLocationStrategy, "ɵfac", function PathLocationStrategy_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _PathLocationStrategy)(ɵɵinject(PlatformLocation), ɵɵinject(APP_BASE_HREF, 8));
});
_defineProperty(PathLocationStrategy, "ɵprov", /* @__PURE__ */ ɵɵdefineInjectable({
	token: _PathLocationStrategy,
	factory: _PathLocationStrategy.ɵfac,
	providedIn: "root"
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(PathLocationStrategy, [{
		type: Injectable,
		args: [{ providedIn: "root" }]
	}], () => [{ type: PlatformLocation }, {
		type: void 0,
		decorators: [{ type: Optional }, {
			type: Inject,
			args: [APP_BASE_HREF]
		}]
	}], null);
})();
var NoTrailingSlashPathLocationStrategy = class extends PathLocationStrategy {
	prepareExternalUrl(internal) {
		const path = extractUrlPath(internal);
		if (path.endsWith("/") && path.length > 1) internal = path.slice(0, -1) + internal.slice(path.length);
		return super.prepareExternalUrl(internal);
	}
};
_NoTrailingSlashPathLocationStrategy = NoTrailingSlashPathLocationStrategy;
_defineProperty(NoTrailingSlashPathLocationStrategy, "ɵfac", /* @__PURE__ */ (() => {
	let ɵNoTrailingSlashPathLocationStrategy_BaseFactory;
	return function NoTrailingSlashPathLocationStrategy_Factory(__ngFactoryType__) {
		return (ɵNoTrailingSlashPathLocationStrategy_BaseFactory || (ɵNoTrailingSlashPathLocationStrategy_BaseFactory = ɵɵgetInheritedFactory(_NoTrailingSlashPathLocationStrategy)))(__ngFactoryType__ || _NoTrailingSlashPathLocationStrategy);
	};
})());
_defineProperty(NoTrailingSlashPathLocationStrategy, "ɵprov", /* @__PURE__ */ ɵɵdefineInjectable({
	token: _NoTrailingSlashPathLocationStrategy,
	factory: _NoTrailingSlashPathLocationStrategy.ɵfac,
	providedIn: "root"
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NoTrailingSlashPathLocationStrategy, [{
		type: Injectable,
		args: [{ providedIn: "root" }]
	}], null, null);
})();
var TrailingSlashPathLocationStrategy = class extends PathLocationStrategy {
	prepareExternalUrl(internal) {
		const path = extractUrlPath(internal);
		if (!path.endsWith("/")) internal = path + "/" + internal.slice(path.length);
		return super.prepareExternalUrl(internal);
	}
};
_TrailingSlashPathLocationStrategy = TrailingSlashPathLocationStrategy;
_defineProperty(TrailingSlashPathLocationStrategy, "ɵfac", /* @__PURE__ */ (() => {
	let ɵTrailingSlashPathLocationStrategy_BaseFactory;
	return function TrailingSlashPathLocationStrategy_Factory(__ngFactoryType__) {
		return (ɵTrailingSlashPathLocationStrategy_BaseFactory || (ɵTrailingSlashPathLocationStrategy_BaseFactory = ɵɵgetInheritedFactory(_TrailingSlashPathLocationStrategy)))(__ngFactoryType__ || _TrailingSlashPathLocationStrategy);
	};
})());
_defineProperty(TrailingSlashPathLocationStrategy, "ɵprov", /* @__PURE__ */ ɵɵdefineInjectable({
	token: _TrailingSlashPathLocationStrategy,
	factory: _TrailingSlashPathLocationStrategy.ɵfac,
	providedIn: "root"
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(TrailingSlashPathLocationStrategy, [{
		type: Injectable,
		args: [{ providedIn: "root" }]
	}], null, null);
})();
function extractUrlPath(url) {
	const questionMarkOrHashIndex = url.search(/[?#]/);
	const pathEnd = questionMarkOrHashIndex > -1 ? questionMarkOrHashIndex : url.length;
	return url.slice(0, pathEnd);
}
var Location = class Location {
	constructor(locationStrategy) {
		_defineProperty(this, "_subject", new Subject());
		_defineProperty(this, "_basePath", void 0);
		_defineProperty(this, "_locationStrategy", void 0);
		_defineProperty(this, "_urlChangeListeners", []);
		_defineProperty(this, "_urlChangeSubscription", null);
		this._locationStrategy = locationStrategy;
		const baseHref = this._locationStrategy.getBaseHref();
		this._basePath = _stripOrigin(stripTrailingSlash(_stripIndexHtml(baseHref)));
		this._locationStrategy.onPopState((ev) => {
			const popStateEvent = {
				"url": this.path(true),
				"pop": true,
				"state": ev.state,
				"type": ev.type
			};
			if (ev.hasUAVisualTransition) popStateEvent.hasUAVisualTransition = true;
			this._subject.next(popStateEvent);
		});
	}
	ngOnDestroy() {
		this._urlChangeSubscription?.unsubscribe();
		this._urlChangeListeners = [];
	}
	path(includeHash = false) {
		return this.normalize(this._locationStrategy.path(includeHash));
	}
	getState() {
		return this._locationStrategy.getState();
	}
	isCurrentPathEqualTo(path, query = "") {
		return this.path() == this.normalize(path + normalizeQueryParams(query));
	}
	normalize(url) {
		return Location.stripTrailingSlash(_stripBasePath(this._basePath, _stripIndexHtml(url)));
	}
	prepareExternalUrl(url) {
		if (url && url[0] !== "/") url = "/" + url;
		return this._locationStrategy.prepareExternalUrl(url);
	}
	go(path, query = "", state = null) {
		this._locationStrategy.pushState(state, "", path, query);
		this._notifyUrlChangeListeners(this.prepareExternalUrl(path + normalizeQueryParams(query)), state);
	}
	replaceState(path, query = "", state = null) {
		this._locationStrategy.replaceState(state, "", path, query);
		this._notifyUrlChangeListeners(this.prepareExternalUrl(path + normalizeQueryParams(query)), state);
	}
	forward() {
		this._locationStrategy.forward();
	}
	back() {
		this._locationStrategy.back();
	}
	historyGo(relativePosition = 0) {
		this._locationStrategy.historyGo?.(relativePosition);
	}
	onUrlChange(fn) {
		this._urlChangeListeners.push(fn);
		this._urlChangeSubscription ??= this.subscribe((v) => {
			this._notifyUrlChangeListeners(v.url, v.state);
		});
		return () => {
			const fnIndex = this._urlChangeListeners.indexOf(fn);
			this._urlChangeListeners.splice(fnIndex, 1);
			if (this._urlChangeListeners.length === 0) {
				this._urlChangeSubscription?.unsubscribe();
				this._urlChangeSubscription = null;
			}
		};
	}
	_notifyUrlChangeListeners(url = "", state) {
		this._urlChangeListeners.forEach((fn) => fn(url, state));
	}
	subscribe(onNext, onThrow, onReturn) {
		return this._subject.subscribe({
			next: onNext,
			error: onThrow ?? void 0,
			complete: onReturn ?? void 0
		});
	}
};
_Location = Location;
_defineProperty(Location, "normalizeQueryParams", normalizeQueryParams);
_defineProperty(Location, "joinWithSlash", joinWithSlash);
_defineProperty(Location, "stripTrailingSlash", stripTrailingSlash);
_defineProperty(Location, "ɵfac", function Location_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _Location)(ɵɵinject(LocationStrategy));
});
_defineProperty(Location, "ɵprov", /* @__PURE__ */ ɵɵdefineInjectable({
	token: _Location,
	factory: () => createLocation(),
	providedIn: "root"
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Location, [{
		type: Injectable,
		args: [{
			providedIn: "root",
			useFactory: createLocation
		}]
	}], () => [{ type: LocationStrategy }], null);
})();
function createLocation() {
	return new Location(ɵɵinject(LocationStrategy));
}
function _stripBasePath(basePath, url) {
	if (!basePath || !url.startsWith(basePath)) return url;
	const strippedUrl = url.substring(basePath.length);
	if (strippedUrl === "" || [
		"/",
		";",
		"?",
		"#"
	].includes(strippedUrl[0])) return strippedUrl;
	return url;
}
function _stripIndexHtml(url) {
	return url.replace(/\/index\.html$/, "");
}
function _stripOrigin(baseHref) {
	if ((/* @__PURE__ */ new RegExp("^(https?:)?//")).test(baseHref)) {
		const [, pathname] = baseHref.split(/\/\/[^\/]+/);
		return pathname;
	}
	return baseHref;
}
//#endregion
//#region node_modules/@angular/common/fesm2022/_common_module-chunk.mjs
/**
* @license Angular v22.1.5
* (c) 2010-2026 Google LLC. https://angular.dev/
* License: MIT
*/
var _HashLocationStrategy;
var _NgLocalization;
var _NgLocaleLocalization;
var _NgClass;
var _NgComponentOutlet;
var _NgForOf;
var _NgIf;
var _NgSwitch;
var _NgSwitchCase;
var _NgSwitchDefault;
var _NgPlural;
var _NgPluralCase;
var _NgStyle;
var _NgTemplateOutlet;
var _AsyncPipe;
var _LowerCasePipe;
var _TitleCasePipe;
var _UpperCasePipe;
var _DatePipe;
var _I18nPluralPipe;
var _I18nSelectPipe;
var _JsonPipe;
var _KeyValuePipe;
var _DecimalPipe;
var _PercentPipe;
var _CurrencyPipe;
var _SlicePipe;
var _CommonModule;
var HashLocationStrategy = class extends LocationStrategy {
	constructor(_platformLocation, _baseHref) {
		super();
		_defineProperty(this, "_platformLocation", void 0);
		_defineProperty(this, "_baseHref", "");
		_defineProperty(this, "_removeListenerFns", []);
		this._platformLocation = _platformLocation;
		if (_baseHref != null) this._baseHref = _baseHref;
	}
	ngOnDestroy() {
		while (this._removeListenerFns.length) this._removeListenerFns.pop()();
	}
	onPopState(fn) {
		this._removeListenerFns.push(this._platformLocation.onPopState(fn), this._platformLocation.onHashChange(fn));
	}
	getBaseHref() {
		return this._baseHref;
	}
	path(includeHash = false) {
		const path = this._platformLocation.hash ?? "#";
		return path.length > 0 ? path.substring(1) : path;
	}
	prepareExternalUrl(internal) {
		const url = joinWithSlash(this._baseHref, internal);
		return url.length > 0 ? "#" + url : url;
	}
	pushState(state, title, path, queryParams) {
		const url = this.prepareExternalUrl(path + normalizeQueryParams(queryParams)) || this._platformLocation.pathname;
		this._platformLocation.pushState(state, title, url);
	}
	replaceState(state, title, path, queryParams) {
		const url = this.prepareExternalUrl(path + normalizeQueryParams(queryParams)) || this._platformLocation.pathname;
		this._platformLocation.replaceState(state, title, url);
	}
	forward() {
		this._platformLocation.forward();
	}
	back() {
		this._platformLocation.back();
	}
	getState() {
		return this._platformLocation.getState();
	}
	historyGo(relativePosition = 0) {
		this._platformLocation.historyGo?.(relativePosition);
	}
};
_HashLocationStrategy = HashLocationStrategy;
_defineProperty(HashLocationStrategy, "ɵfac", function HashLocationStrategy_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _HashLocationStrategy)(ɵɵinject(PlatformLocation), ɵɵinject(APP_BASE_HREF, 8));
});
_defineProperty(HashLocationStrategy, "ɵprov", /* @__PURE__ */ ɵɵdefineInjectable({
	token: _HashLocationStrategy,
	factory: _HashLocationStrategy.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HashLocationStrategy, [{ type: Injectable }], () => [{ type: PlatformLocation }, {
		type: void 0,
		decorators: [{ type: Optional }, {
			type: Inject,
			args: [APP_BASE_HREF]
		}]
	}], null);
})();
var CURRENCIES_EN = {
	"ADP": [
		void 0,
		void 0,
		0
	],
	"AFN": [
		void 0,
		"؋",
		0
	],
	"ALL": [
		void 0,
		void 0,
		0
	],
	"AMD": [
		void 0,
		"֏",
		2
	],
	"AOA": [void 0, "Kz"],
	"ARS": [void 0, "$"],
	"AUD": ["A$", "$"],
	"AZN": [void 0, "₼"],
	"BAM": [void 0, "KM"],
	"BBD": [void 0, "$"],
	"BDT": [void 0, "৳"],
	"BHD": [
		void 0,
		void 0,
		3
	],
	"BIF": [
		void 0,
		void 0,
		0
	],
	"BMD": [void 0, "$"],
	"BND": [void 0, "$"],
	"BOB": [void 0, "Bs"],
	"BRL": ["R$"],
	"BSD": [void 0, "$"],
	"BWP": [void 0, "P"],
	"BYN": [
		void 0,
		void 0,
		2
	],
	"BYR": [
		void 0,
		void 0,
		0
	],
	"BZD": [void 0, "$"],
	"CAD": [
		"CA$",
		"$",
		2
	],
	"CHF": [
		void 0,
		void 0,
		2
	],
	"CLF": [
		void 0,
		void 0,
		4
	],
	"CLP": [
		void 0,
		"$",
		0
	],
	"CNY": ["CN¥", "¥"],
	"COP": [
		void 0,
		"$",
		2
	],
	"CRC": [
		void 0,
		"₡",
		2
	],
	"CUC": [void 0, "$"],
	"CUP": [void 0, "$"],
	"CZK": [
		void 0,
		"Kč",
		2
	],
	"DJF": [
		void 0,
		void 0,
		0
	],
	"DKK": [
		void 0,
		"kr",
		2
	],
	"DOP": [void 0, "$"],
	"EGP": [void 0, "E£"],
	"ESP": [
		void 0,
		"₧",
		0
	],
	"EUR": ["€"],
	"FJD": [void 0, "$"],
	"FKP": [void 0, "£"],
	"GBP": ["£"],
	"GEL": [void 0, "₾"],
	"GHS": [void 0, "GH₵"],
	"GIP": [void 0, "£"],
	"GNF": [
		void 0,
		"FG",
		0
	],
	"GTQ": [void 0, "Q"],
	"GYD": [
		void 0,
		"$",
		2
	],
	"HKD": ["HK$", "$"],
	"HNL": [void 0, "L"],
	"HRK": [void 0, "kn"],
	"HUF": [
		void 0,
		"Ft",
		2
	],
	"IDR": [
		void 0,
		"Rp",
		2
	],
	"ILS": ["₪"],
	"INR": ["₹"],
	"IQD": [
		void 0,
		void 0,
		0
	],
	"IRR": [
		void 0,
		void 0,
		0
	],
	"ISK": [
		void 0,
		"kr",
		0
	],
	"ITL": [
		void 0,
		void 0,
		0
	],
	"JMD": [void 0, "$"],
	"JOD": [
		void 0,
		void 0,
		3
	],
	"JPY": [
		"¥",
		void 0,
		0
	],
	"KGS": [void 0, "⃀"],
	"KHR": [void 0, "៛"],
	"KMF": [
		void 0,
		"CF",
		0
	],
	"KPW": [
		void 0,
		"₩",
		0
	],
	"KRW": [
		"₩",
		void 0,
		0
	],
	"KWD": [
		void 0,
		void 0,
		3
	],
	"KYD": [void 0, "$"],
	"KZT": [void 0, "₸"],
	"LAK": [
		void 0,
		"₭",
		0
	],
	"LBP": [
		void 0,
		"L£",
		0
	],
	"LKR": [void 0, "Rs"],
	"LRD": [void 0, "$"],
	"LTL": [void 0, "Lt"],
	"LUF": [
		void 0,
		void 0,
		0
	],
	"LVL": [void 0, "Ls"],
	"LYD": [
		void 0,
		void 0,
		3
	],
	"MGA": [
		void 0,
		"Ar",
		0
	],
	"MGF": [
		void 0,
		void 0,
		0
	],
	"MMK": [
		void 0,
		"K",
		0
	],
	"MNT": [
		void 0,
		"₮",
		2
	],
	"MRO": [
		void 0,
		void 0,
		0
	],
	"MUR": [
		void 0,
		"Rs",
		2
	],
	"MXN": ["MX$", "$"],
	"MYR": [void 0, "RM"],
	"NAD": [void 0, "$"],
	"NGN": [void 0, "₦"],
	"NIO": [void 0, "C$"],
	"NOK": [
		void 0,
		"kr",
		2
	],
	"NPR": [void 0, "Rs"],
	"NZD": ["NZ$", "$"],
	"OMR": [
		void 0,
		void 0,
		3
	],
	"PHP": ["₱"],
	"PKR": [
		void 0,
		"Rs",
		2
	],
	"PLN": [void 0, "zł"],
	"PYG": [
		void 0,
		"₲",
		0
	],
	"RON": [void 0, "lei"],
	"RSD": [
		void 0,
		void 0,
		0
	],
	"RUB": [void 0, "₽"],
	"RWF": [
		void 0,
		"RF",
		0
	],
	"SBD": [void 0, "$"],
	"SEK": [
		void 0,
		"kr",
		2
	],
	"SGD": [void 0, "$"],
	"SHP": [void 0, "£"],
	"SLE": [
		void 0,
		void 0,
		2
	],
	"SLL": [
		void 0,
		void 0,
		0
	],
	"SOS": [
		void 0,
		void 0,
		0
	],
	"SRD": [void 0, "$"],
	"SSP": [void 0, "£"],
	"STD": [
		void 0,
		void 0,
		0
	],
	"STN": [void 0, "Db"],
	"SYP": [
		void 0,
		"£",
		0
	],
	"THB": [void 0, "฿"],
	"TMM": [
		void 0,
		void 0,
		0
	],
	"TND": [
		void 0,
		void 0,
		3
	],
	"TOP": [void 0, "T$"],
	"TRL": [
		void 0,
		void 0,
		0
	],
	"TRY": [void 0, "₺"],
	"TTD": [void 0, "$"],
	"TWD": [
		"NT$",
		"$",
		2
	],
	"TZS": [
		void 0,
		void 0,
		2
	],
	"UAH": [void 0, "₴"],
	"UGX": [
		void 0,
		void 0,
		0
	],
	"USD": ["$"],
	"UYI": [
		void 0,
		void 0,
		0
	],
	"UYU": [void 0, "$"],
	"UYW": [
		void 0,
		void 0,
		4
	],
	"UZS": [
		void 0,
		void 0,
		2
	],
	"VEF": [
		void 0,
		"Bs",
		2
	],
	"VND": [
		"₫",
		void 0,
		0
	],
	"VUV": [
		void 0,
		void 0,
		0
	],
	"XAF": [
		"FCFA",
		void 0,
		0
	],
	"XCD": ["EC$", "$"],
	"XCG": ["Cg."],
	"XOF": [
		"F CFA",
		void 0,
		0
	],
	"XPF": [
		"CFPF",
		void 0,
		0
	],
	"XXX": ["¤"],
	"YER": [
		void 0,
		void 0,
		0
	],
	"ZAR": [void 0, "R"],
	"ZMK": [
		void 0,
		void 0,
		0
	],
	"ZMW": [void 0, "ZK"],
	"ZWD": [
		void 0,
		void 0,
		0
	]
};
var NumberFormatStyle;
(function(NumberFormatStyle) {
	NumberFormatStyle[NumberFormatStyle["Decimal"] = 0] = "Decimal";
	NumberFormatStyle[NumberFormatStyle["Percent"] = 1] = "Percent";
	NumberFormatStyle[NumberFormatStyle["Currency"] = 2] = "Currency";
	NumberFormatStyle[NumberFormatStyle["Scientific"] = 3] = "Scientific";
})(NumberFormatStyle || (NumberFormatStyle = {}));
var Plural;
(function(Plural) {
	Plural[Plural["Zero"] = 0] = "Zero";
	Plural[Plural["One"] = 1] = "One";
	Plural[Plural["Two"] = 2] = "Two";
	Plural[Plural["Few"] = 3] = "Few";
	Plural[Plural["Many"] = 4] = "Many";
	Plural[Plural["Other"] = 5] = "Other";
})(Plural || (Plural = {}));
var FormStyle;
(function(FormStyle) {
	FormStyle[FormStyle["Format"] = 0] = "Format";
	FormStyle[FormStyle["Standalone"] = 1] = "Standalone";
})(FormStyle || (FormStyle = {}));
var TranslationWidth;
(function(TranslationWidth) {
	TranslationWidth[TranslationWidth["Narrow"] = 0] = "Narrow";
	TranslationWidth[TranslationWidth["Abbreviated"] = 1] = "Abbreviated";
	TranslationWidth[TranslationWidth["Wide"] = 2] = "Wide";
	TranslationWidth[TranslationWidth["Short"] = 3] = "Short";
})(TranslationWidth || (TranslationWidth = {}));
var FormatWidth;
(function(FormatWidth) {
	FormatWidth[FormatWidth["Short"] = 0] = "Short";
	FormatWidth[FormatWidth["Medium"] = 1] = "Medium";
	FormatWidth[FormatWidth["Long"] = 2] = "Long";
	FormatWidth[FormatWidth["Full"] = 3] = "Full";
})(FormatWidth || (FormatWidth = {}));
var NumberSymbol = {
	Decimal: 0,
	Group: 1,
	List: 2,
	PercentSign: 3,
	PlusSign: 4,
	MinusSign: 5,
	Exponential: 6,
	SuperscriptingExponent: 7,
	PerMille: 8,
	Infinity: 9,
	NaN: 10,
	TimeSeparator: 11,
	CurrencyDecimal: 12,
	CurrencyGroup: 13
};
var WeekDay;
(function(WeekDay) {
	WeekDay[WeekDay["Sunday"] = 0] = "Sunday";
	WeekDay[WeekDay["Monday"] = 1] = "Monday";
	WeekDay[WeekDay["Tuesday"] = 2] = "Tuesday";
	WeekDay[WeekDay["Wednesday"] = 3] = "Wednesday";
	WeekDay[WeekDay["Thursday"] = 4] = "Thursday";
	WeekDay[WeekDay["Friday"] = 5] = "Friday";
	WeekDay[WeekDay["Saturday"] = 6] = "Saturday";
})(WeekDay || (WeekDay = {}));
function getLocaleId(locale) {
	return findLocaleData(locale)[LocaleDataIndex.LocaleId];
}
function getLocaleDayPeriods(locale, formStyle, width) {
	const data = findLocaleData(locale);
	return getLastDefinedValue(getLastDefinedValue([data[LocaleDataIndex.DayPeriodsFormat], data[LocaleDataIndex.DayPeriodsStandalone]], formStyle), width);
}
function getLocaleDayNames(locale, formStyle, width) {
	const data = findLocaleData(locale);
	return getLastDefinedValue(getLastDefinedValue([data[LocaleDataIndex.DaysFormat], data[LocaleDataIndex.DaysStandalone]], formStyle), width);
}
function getLocaleMonthNames(locale, formStyle, width) {
	const data = findLocaleData(locale);
	return getLastDefinedValue(getLastDefinedValue([data[LocaleDataIndex.MonthsFormat], data[LocaleDataIndex.MonthsStandalone]], formStyle), width);
}
function getLocaleEraNames(locale, width) {
	const erasData = findLocaleData(locale)[LocaleDataIndex.Eras];
	return getLastDefinedValue(erasData, width);
}
function getLocaleDateFormat(locale, width) {
	return getLastDefinedValue(findLocaleData(locale)[LocaleDataIndex.DateFormat], width);
}
function getLocaleTimeFormat(locale, width) {
	return getLastDefinedValue(findLocaleData(locale)[LocaleDataIndex.TimeFormat], width);
}
function getLocaleDateTimeFormat(locale, width) {
	const dateTimeFormatData = findLocaleData(locale)[LocaleDataIndex.DateTimeFormat];
	return getLastDefinedValue(dateTimeFormatData, width);
}
function getLocaleNumberSymbol(locale, symbol) {
	const data = findLocaleData(locale);
	const res = data[LocaleDataIndex.NumberSymbols][symbol];
	if (typeof res === "undefined") {
		if (symbol === NumberSymbol.CurrencyDecimal) return data[LocaleDataIndex.NumberSymbols][NumberSymbol.Decimal];
		else if (symbol === NumberSymbol.CurrencyGroup) return data[LocaleDataIndex.NumberSymbols][NumberSymbol.Group];
	}
	return res;
}
function getLocaleNumberFormat(locale, type) {
	return findLocaleData(locale)[LocaleDataIndex.NumberFormats][type];
}
function getLocaleCurrencies(locale) {
	return findLocaleData(locale)[LocaleDataIndex.Currencies];
}
var getLocalePluralCase = getLocalePluralCase$1;
function checkFullData(data) {
	if (!data[LocaleDataIndex.ExtraData]) throw new RuntimeError(2303, ngDevMode && `Missing extra locale data for the locale "${data[LocaleDataIndex.LocaleId]}". Use "registerLocaleData" to load new data. See the "I18n guide" on angular.io to know more.`);
}
function getLocaleExtraDayPeriodRules(locale) {
	const data = findLocaleData(locale);
	checkFullData(data);
	return (data[LocaleDataIndex.ExtraData][2] || []).map((rule) => {
		if (typeof rule === "string") return extractTime(rule);
		return [extractTime(rule[0]), extractTime(rule[1])];
	});
}
function getLocaleExtraDayPeriods(locale, formStyle, width) {
	const data = findLocaleData(locale);
	checkFullData(data);
	return getLastDefinedValue(getLastDefinedValue([data[LocaleDataIndex.ExtraData][0], data[LocaleDataIndex.ExtraData][1]], formStyle) || [], width) || [];
}
function getLastDefinedValue(data, index) {
	for (let i = index; i > -1; i--) if (typeof data[i] !== "undefined") return data[i];
	throw new RuntimeError(2304, ngDevMode && "Locale data API: locale data undefined");
}
function extractTime(time) {
	const [h, m] = time.split(":");
	return {
		hours: +h,
		minutes: +m
	};
}
function getCurrencySymbol(code, format, locale = "en") {
	const currency = getLocaleCurrencies(locale)[code] || CURRENCIES_EN[code] || [];
	const symbolNarrow = currency[1];
	if (format === "narrow" && typeof symbolNarrow === "string") return symbolNarrow;
	return currency[0] || code;
}
var DEFAULT_NB_OF_CURRENCY_DIGITS = 2;
function getNumberOfCurrencyDigits(code) {
	let digits;
	const currency = CURRENCIES_EN[code];
	if (currency) digits = currency[2];
	return typeof digits === "number" ? digits : DEFAULT_NB_OF_CURRENCY_DIGITS;
}
var ISO8601_DATE_REGEX = /^(\d{4,})-?(\d\d)-?(\d\d)(?:T(\d\d)(?::?(\d\d)(?::?(\d\d)(?:\.(\d+))?)?)?(Z|([+-])(\d\d):?(\d\d))?)?$/;
var NAMED_FORMATS = Object.create(null);
var DATE_FORMATS_SPLIT = /((?:[^BEGHLMOSWYZabcdhmswyz']+)|(?:'(?:[^']|'')*')|(?:G{1,5}|y{1,4}|Y{1,4}|M{1,5}|L{1,5}|w{1,2}|W{1}|d{1,2}|E{1,6}|c{1,6}|a{1,5}|b{1,5}|B{1,5}|h{1,2}|H{1,2}|m{1,2}|s{1,2}|S{1,3}|z{1,4}|Z{1,5}|O{1,4}))([\s\S]*)/;
var MAX_DATE_FORMAT_LENGTH = 256;
function formatDate(value, format, locale, timezone) {
	let date = toDate(value);
	assertValidDateFormatLength(format);
	format = getNamedFormat(locale, format) || format;
	let parts = [];
	let match;
	while (format) {
		match = DATE_FORMATS_SPLIT.exec(format);
		if (match) {
			parts = parts.concat(match.slice(1));
			const part = parts.pop();
			if (!part) break;
			format = part;
		} else {
			parts.push(format);
			break;
		}
	}
	if (typeof ngDevMode === "undefined" || ngDevMode) assertValidDateFormat(parts);
	let dateTimezoneOffset = date.getTimezoneOffset();
	if (timezone) {
		dateTimezoneOffset = timezoneToOffset(timezone, dateTimezoneOffset);
		date = convertTimezoneToLocal(date, timezone);
	}
	let text = "";
	parts.forEach((value) => {
		const dateFormatter = getDateFormatter(value);
		text += dateFormatter ? dateFormatter(date, locale, dateTimezoneOffset) : value === "''" ? "'" : value.replace(/(^'|'$)/g, "").replace(/''/g, "'");
	});
	return text;
}
function assertValidDateFormatLength(format) {
	if (format.length > MAX_DATE_FORMAT_LENGTH) throw new RuntimeError(2300, ngDevMode && `Date format is too long. Exceeded maximum length of ${MAX_DATE_FORMAT_LENGTH} characters.`);
}
function assertValidDateFormat(parts) {
	if (parts.some((part) => /^Y+$/.test(part)) && !parts.some((part) => /^w+$/.test(part))) {
		const message = `Suspicious use of week-based year "Y" in date pattern "${parts.join("")}". Did you mean to use calendar year "y" instead?`;
		if (parts.length === 1) console.error(formatRuntimeError(2300, message));
		else throw new RuntimeError(2300, message);
	}
}
function createDate(year, month, date) {
	const newDate = /* @__PURE__ */ new Date(0);
	newDate.setFullYear(year, month, date);
	newDate.setHours(0, 0, 0);
	return newDate;
}
function getNamedFormat(locale, format) {
	const localeId = getLocaleId(locale);
	NAMED_FORMATS[localeId] ??= Object.create(null);
	if (NAMED_FORMATS[localeId][format]) return NAMED_FORMATS[localeId][format];
	let formatValue = "";
	switch (format) {
		case "shortDate":
			formatValue = getLocaleDateFormat(locale, FormatWidth.Short);
			break;
		case "mediumDate":
			formatValue = getLocaleDateFormat(locale, FormatWidth.Medium);
			break;
		case "longDate":
			formatValue = getLocaleDateFormat(locale, FormatWidth.Long);
			break;
		case "fullDate":
			formatValue = getLocaleDateFormat(locale, FormatWidth.Full);
			break;
		case "shortTime":
			formatValue = getLocaleTimeFormat(locale, FormatWidth.Short);
			break;
		case "mediumTime":
			formatValue = getLocaleTimeFormat(locale, FormatWidth.Medium);
			break;
		case "longTime":
			formatValue = getLocaleTimeFormat(locale, FormatWidth.Long);
			break;
		case "fullTime":
			formatValue = getLocaleTimeFormat(locale, FormatWidth.Full);
			break;
		case "short":
			const shortTime = getNamedFormat(locale, "shortTime");
			const shortDate = getNamedFormat(locale, "shortDate");
			formatValue = formatDateTime(getLocaleDateTimeFormat(locale, FormatWidth.Short), [shortTime, shortDate]);
			break;
		case "medium":
			const mediumTime = getNamedFormat(locale, "mediumTime");
			const mediumDate = getNamedFormat(locale, "mediumDate");
			formatValue = formatDateTime(getLocaleDateTimeFormat(locale, FormatWidth.Medium), [mediumTime, mediumDate]);
			break;
		case "long":
			const longTime = getNamedFormat(locale, "longTime");
			const longDate = getNamedFormat(locale, "longDate");
			formatValue = formatDateTime(getLocaleDateTimeFormat(locale, FormatWidth.Long), [longTime, longDate]);
			break;
		case "full":
			const fullTime = getNamedFormat(locale, "fullTime");
			const fullDate = getNamedFormat(locale, "fullDate");
			formatValue = formatDateTime(getLocaleDateTimeFormat(locale, FormatWidth.Full), [fullTime, fullDate]);
			break;
	}
	if (formatValue) NAMED_FORMATS[localeId][format] = formatValue;
	return formatValue;
}
function formatDateTime(str, opt_values) {
	if (opt_values) str = str.replace(/\{([^}]+)}/g, function(match, key) {
		return Object.hasOwn(opt_values, key) ? opt_values[key] : match;
	});
	return str;
}
function padNumber(num, digits, minusSign = "-", trim, negWrap) {
	let neg = "";
	if (num < 0 || negWrap && num <= 0) if (negWrap) num = -num + 1;
	else {
		num = -num;
		neg = minusSign;
	}
	let strNum = String(num);
	while (strNum.length < digits) strNum = "0" + strNum;
	if (trim) strNum = strNum.slice(strNum.length - digits);
	return neg + strNum;
}
function formatFractionalSeconds(milliseconds, digits) {
	return padNumber(milliseconds, 3).substring(0, digits);
}
function dateGetter(name, size, offset = 0, trim = false, negWrap = false) {
	return function(date, locale) {
		let part = getDatePart(name, date);
		if (offset > 0 || part > -offset) part += offset;
		if (name === 3) {
			if (part === 0 && offset === -12) part = 12;
		} else if (name === 6) return formatFractionalSeconds(part, size);
		const localeMinus = getLocaleNumberSymbol(locale, NumberSymbol.MinusSign);
		return padNumber(part, size, localeMinus, trim, negWrap);
	};
}
function getDatePart(part, date) {
	switch (part) {
		case 0: return date.getFullYear();
		case 1: return date.getMonth();
		case 2: return date.getDate();
		case 3: return date.getHours();
		case 4: return date.getMinutes();
		case 5: return date.getSeconds();
		case 6: return date.getMilliseconds();
		case 7: return date.getDay();
		default: throw new RuntimeError(2301, ngDevMode && `Unknown DateType value "${part}".`);
	}
}
function dateStrGetter(name, width, form = FormStyle.Format, extended = false) {
	return function(date, locale) {
		return getDateTranslation(date, locale, name, width, form, extended);
	};
}
function getDateTranslation(date, locale, name, width, form, extended) {
	switch (name) {
		case 2: return getLocaleMonthNames(locale, form, width)[date.getMonth()];
		case 1: return getLocaleDayNames(locale, form, width)[date.getDay()];
		case 0:
			const currentHours = date.getHours();
			const currentMinutes = date.getMinutes();
			if (extended) {
				const rules = getLocaleExtraDayPeriodRules(locale);
				const dayPeriods = getLocaleExtraDayPeriods(locale, form, width);
				const index = rules.findIndex((rule) => {
					if (Array.isArray(rule)) {
						const [from, to] = rule;
						const afterFrom = currentHours >= from.hours && currentMinutes >= from.minutes;
						const beforeTo = currentHours < to.hours || currentHours === to.hours && currentMinutes < to.minutes;
						if (from.hours < to.hours) {
							if (afterFrom && beforeTo) return true;
						} else if (afterFrom || beforeTo) return true;
					} else if (rule.hours === currentHours && rule.minutes === currentMinutes) return true;
					return false;
				});
				if (index !== -1) return dayPeriods[index];
			}
			return getLocaleDayPeriods(locale, form, width)[currentHours < 12 ? 0 : 1];
		case 3: return getLocaleEraNames(locale, width)[date.getFullYear() <= 0 ? 0 : 1];
		default:
			const unexpected = name;
			throw new RuntimeError(2302, ngDevMode && `unexpected translation type ${unexpected}`);
	}
}
function timeZoneGetter(width) {
	return function(date, locale, offset) {
		const zone = -1 * offset;
		const minusSign = getLocaleNumberSymbol(locale, NumberSymbol.MinusSign);
		const hours = zone > 0 ? Math.floor(zone / 60) : Math.ceil(zone / 60);
		switch (width) {
			case 0: return (zone >= 0 ? "+" : "") + padNumber(hours, 2, minusSign) + padNumber(Math.abs(zone % 60), 2, minusSign);
			case 1: return "GMT" + (zone >= 0 ? "+" : "") + padNumber(hours, 1, minusSign);
			case 2: return "GMT" + (zone >= 0 ? "+" : "") + padNumber(hours, 2, minusSign) + ":" + padNumber(Math.abs(zone % 60), 2, minusSign);
			case 3: if (offset === 0) return "Z";
			else return (zone >= 0 ? "+" : "") + padNumber(hours, 2, minusSign) + ":" + padNumber(Math.abs(zone % 60), 2, minusSign);
			default: throw new RuntimeError(2310, ngDevMode && `Unknown zone width "${width}"`);
		}
	};
}
var JANUARY = 0;
var THURSDAY = 4;
function getFirstThursdayOfYear(year) {
	const firstDayOfYear = createDate(year, JANUARY, 1).getDay();
	return createDate(year, 0, 1 + (firstDayOfYear <= THURSDAY ? THURSDAY : 11) - firstDayOfYear);
}
function getThursdayThisIsoWeek(datetime) {
	const currentDay = datetime.getDay();
	const deltaToThursday = currentDay === 0 ? -3 : THURSDAY - currentDay;
	return createDate(datetime.getFullYear(), datetime.getMonth(), datetime.getDate() + deltaToThursday);
}
function weekGetter(size, monthBased = false) {
	return function(date, locale) {
		let result;
		if (monthBased) {
			const nbDaysBefore1stDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).getDay() - 1;
			const today = date.getDate();
			result = 1 + Math.floor((today + nbDaysBefore1stDayOfMonth) / 7);
		} else {
			const thisThurs = getThursdayThisIsoWeek(date);
			const firstThurs = getFirstThursdayOfYear(thisThurs.getFullYear());
			const diff = thisThurs.getTime() - firstThurs.getTime();
			result = 1 + Math.round(diff / 6048e5);
		}
		return padNumber(result, size, getLocaleNumberSymbol(locale, NumberSymbol.MinusSign));
	};
}
function weekNumberingYearGetter(size, trim = false) {
	return function(date, locale) {
		return padNumber(getThursdayThisIsoWeek(date).getFullYear(), size, getLocaleNumberSymbol(locale, NumberSymbol.MinusSign), trim);
	};
}
var DATE_FORMATS = Object.create(null);
function getDateFormatter(format) {
	if (DATE_FORMATS[format]) return DATE_FORMATS[format];
	let formatter;
	switch (format) {
		case "G":
		case "GG":
		case "GGG":
			formatter = dateStrGetter(3, TranslationWidth.Abbreviated);
			break;
		case "GGGG":
			formatter = dateStrGetter(3, TranslationWidth.Wide);
			break;
		case "GGGGG":
			formatter = dateStrGetter(3, TranslationWidth.Narrow);
			break;
		case "y":
			formatter = dateGetter(0, 1, 0, false, true);
			break;
		case "yy":
			formatter = dateGetter(0, 2, 0, true, true);
			break;
		case "yyy":
			formatter = dateGetter(0, 3, 0, false, true);
			break;
		case "yyyy":
			formatter = dateGetter(0, 4, 0, false, true);
			break;
		case "Y":
			formatter = weekNumberingYearGetter(1);
			break;
		case "YY":
			formatter = weekNumberingYearGetter(2, true);
			break;
		case "YYY":
			formatter = weekNumberingYearGetter(3);
			break;
		case "YYYY":
			formatter = weekNumberingYearGetter(4);
			break;
		case "M":
		case "L":
			formatter = dateGetter(1, 1, 1);
			break;
		case "MM":
		case "LL":
			formatter = dateGetter(1, 2, 1);
			break;
		case "MMM":
			formatter = dateStrGetter(2, TranslationWidth.Abbreviated);
			break;
		case "MMMM":
			formatter = dateStrGetter(2, TranslationWidth.Wide);
			break;
		case "MMMMM":
			formatter = dateStrGetter(2, TranslationWidth.Narrow);
			break;
		case "LLL":
			formatter = dateStrGetter(2, TranslationWidth.Abbreviated, FormStyle.Standalone);
			break;
		case "LLLL":
			formatter = dateStrGetter(2, TranslationWidth.Wide, FormStyle.Standalone);
			break;
		case "LLLLL":
			formatter = dateStrGetter(2, TranslationWidth.Narrow, FormStyle.Standalone);
			break;
		case "w":
			formatter = weekGetter(1);
			break;
		case "ww":
			formatter = weekGetter(2);
			break;
		case "W":
			formatter = weekGetter(1, true);
			break;
		case "d":
			formatter = dateGetter(2, 1);
			break;
		case "dd":
			formatter = dateGetter(2, 2);
			break;
		case "c":
		case "cc":
			formatter = dateGetter(7, 1);
			break;
		case "ccc":
			formatter = dateStrGetter(1, TranslationWidth.Abbreviated, FormStyle.Standalone);
			break;
		case "cccc":
			formatter = dateStrGetter(1, TranslationWidth.Wide, FormStyle.Standalone);
			break;
		case "ccccc":
			formatter = dateStrGetter(1, TranslationWidth.Narrow, FormStyle.Standalone);
			break;
		case "cccccc":
			formatter = dateStrGetter(1, TranslationWidth.Short, FormStyle.Standalone);
			break;
		case "E":
		case "EE":
		case "EEE":
			formatter = dateStrGetter(1, TranslationWidth.Abbreviated);
			break;
		case "EEEE":
			formatter = dateStrGetter(1, TranslationWidth.Wide);
			break;
		case "EEEEE":
			formatter = dateStrGetter(1, TranslationWidth.Narrow);
			break;
		case "EEEEEE":
			formatter = dateStrGetter(1, TranslationWidth.Short);
			break;
		case "a":
		case "aa":
		case "aaa":
			formatter = dateStrGetter(0, TranslationWidth.Abbreviated);
			break;
		case "aaaa":
			formatter = dateStrGetter(0, TranslationWidth.Wide);
			break;
		case "aaaaa":
			formatter = dateStrGetter(0, TranslationWidth.Narrow);
			break;
		case "b":
		case "bb":
		case "bbb":
			formatter = dateStrGetter(0, TranslationWidth.Abbreviated, FormStyle.Standalone, true);
			break;
		case "bbbb":
			formatter = dateStrGetter(0, TranslationWidth.Wide, FormStyle.Standalone, true);
			break;
		case "bbbbb":
			formatter = dateStrGetter(0, TranslationWidth.Narrow, FormStyle.Standalone, true);
			break;
		case "B":
		case "BB":
		case "BBB":
			formatter = dateStrGetter(0, TranslationWidth.Abbreviated, FormStyle.Format, true);
			break;
		case "BBBB":
			formatter = dateStrGetter(0, TranslationWidth.Wide, FormStyle.Format, true);
			break;
		case "BBBBB":
			formatter = dateStrGetter(0, TranslationWidth.Narrow, FormStyle.Format, true);
			break;
		case "h":
			formatter = dateGetter(3, 1, -12);
			break;
		case "hh":
			formatter = dateGetter(3, 2, -12);
			break;
		case "H":
			formatter = dateGetter(3, 1);
			break;
		case "HH":
			formatter = dateGetter(3, 2);
			break;
		case "m":
			formatter = dateGetter(4, 1);
			break;
		case "mm":
			formatter = dateGetter(4, 2);
			break;
		case "s":
			formatter = dateGetter(5, 1);
			break;
		case "ss":
			formatter = dateGetter(5, 2);
			break;
		case "S":
			formatter = dateGetter(6, 1);
			break;
		case "SS":
			formatter = dateGetter(6, 2);
			break;
		case "SSS":
			formatter = dateGetter(6, 3);
			break;
		case "Z":
		case "ZZ":
		case "ZZZ":
			formatter = timeZoneGetter(0);
			break;
		case "ZZZZZ":
			formatter = timeZoneGetter(3);
			break;
		case "O":
		case "OO":
		case "OOO":
		case "z":
		case "zz":
		case "zzz":
			formatter = timeZoneGetter(1);
			break;
		case "OOOO":
		case "ZZZZ":
		case "zzzz":
			formatter = timeZoneGetter(2);
			break;
		default: return null;
	}
	DATE_FORMATS[format] = formatter;
	return formatter;
}
function timezoneToOffset(timezone, fallback) {
	timezone = timezone.replace(/:/g, "");
	const requestedTimezoneOffset = Date.parse("Jan 01, 1970 00:00:00 " + timezone) / 6e4;
	return isNaN(requestedTimezoneOffset) ? fallback : requestedTimezoneOffset;
}
function addDateMinutes(date, minutes) {
	date = new Date(date.getTime());
	date.setMinutes(date.getMinutes() + minutes);
	return date;
}
function convertTimezoneToLocal(date, timezone, reverse) {
	const reverseValue = -1;
	const dateTimezoneOffset = date.getTimezoneOffset();
	return addDateMinutes(date, reverseValue * (timezoneToOffset(timezone, dateTimezoneOffset) - dateTimezoneOffset));
}
function toDate(value) {
	if (isDate(value)) return value;
	if (typeof value === "number" && !isNaN(value)) return new Date(value);
	if (typeof value === "string") {
		value = value.trim();
		if (/^(\d{4}(-\d{1,2}(-\d{1,2})?)?)$/.test(value)) {
			const [y, m = 1, d = 1] = value.split("-").map((val) => +val);
			return createDate(y, m - 1, d);
		}
		const parsedNb = parseFloat(value);
		if (!isNaN(value - parsedNb)) return new Date(parsedNb);
		let match;
		if (match = value.match(ISO8601_DATE_REGEX)) return isoStringToDate(match);
	}
	const date = new Date(value);
	if (!isDate(date)) throw new RuntimeError(2311, ngDevMode && `Unable to convert "${value}" into a date`);
	return date;
}
function isoStringToDate(match) {
	const date = /* @__PURE__ */ new Date(0);
	let tzHour = 0;
	let tzMin = 0;
	const dateSetter = match[8] ? date.setUTCFullYear : date.setFullYear;
	const timeSetter = match[8] ? date.setUTCHours : date.setHours;
	if (match[9]) {
		tzHour = Number(match[9] + match[10]);
		tzMin = Number(match[9] + match[11]);
	}
	dateSetter.call(date, Number(match[1]), Number(match[2]) - 1, Number(match[3]));
	const h = Number(match[4] || 0) - tzHour;
	const m = Number(match[5] || 0) - tzMin;
	const s = Number(match[6] || 0);
	const ms = Math.floor(parseFloat("0." + (match[7] || 0)) * 1e3);
	timeSetter.call(date, h, m, s, ms);
	return date;
}
function isDate(value) {
	return value instanceof Date && !isNaN(value.valueOf());
}
var NUMBER_FORMAT_REGEXP = /^(\d+)?\.((\d+)(-(\d+))?)?$/;
var MAX_DIGITS = 22;
var DECIMAL_SEP = ".";
var ZERO_CHAR = "0";
var PATTERN_SEP = ";";
var GROUP_SEP = ",";
var DIGIT_CHAR = "#";
var CURRENCY_CHAR = "¤";
var PERCENT_CHAR = "%";
function formatNumberToLocaleString(value, pattern, locale, groupSymbol, decimalSymbol, digitsInfo, isPercent = false) {
	let formattedText = "";
	let isZero = false;
	if (!isFinite(value)) formattedText = getLocaleNumberSymbol(locale, Number.isNaN(value) ? NumberSymbol.NaN : NumberSymbol.Infinity);
	else {
		let parsedNumber = parseNumber(value);
		if (isPercent) parsedNumber = toPercent(parsedNumber);
		let minInt = pattern.minInt;
		let minFraction = pattern.minFrac;
		let maxFraction = pattern.maxFrac;
		if (digitsInfo) {
			const parts = digitsInfo.match(NUMBER_FORMAT_REGEXP);
			if (parts === null) throw new RuntimeError(2306, ngDevMode && `${digitsInfo} is not a valid digit info`);
			const minIntPart = parts[1];
			const minFractionPart = parts[3];
			const maxFractionPart = parts[5];
			if (minIntPart != null) minInt = parseIntAutoRadix(minIntPart);
			if (minFractionPart != null) minFraction = parseIntAutoRadix(minFractionPart);
			if (maxFractionPart != null) maxFraction = parseIntAutoRadix(maxFractionPart);
			else if (minFractionPart != null && minFraction > maxFraction) maxFraction = minFraction;
			const MAX_ALLOWED_DIGITS = 100;
			if (minInt > MAX_ALLOWED_DIGITS || minFraction > MAX_ALLOWED_DIGITS || maxFraction > MAX_ALLOWED_DIGITS) throw new RuntimeError(2306, ngDevMode && `${digitsInfo} is not a valid digit info. Exceeded maximum limits of ${MAX_ALLOWED_DIGITS} digits.`);
		}
		roundNumber(parsedNumber, minFraction, maxFraction);
		let digits = parsedNumber.digits;
		let integerLen = parsedNumber.integerLen;
		const exponent = parsedNumber.exponent;
		let decimals = [];
		isZero = digits.every((d) => !d);
		for (; integerLen < minInt; integerLen++) digits.unshift(0);
		for (; integerLen < 0; integerLen++) digits.unshift(0);
		if (integerLen > 0) decimals = digits.splice(integerLen, digits.length);
		else {
			decimals = digits;
			digits = [0];
		}
		const groups = [];
		if (digits.length >= pattern.lgSize) groups.unshift(digits.splice(-pattern.lgSize, digits.length).join(""));
		while (digits.length > pattern.gSize) groups.unshift(digits.splice(-pattern.gSize, digits.length).join(""));
		if (digits.length) groups.unshift(digits.join(""));
		formattedText = groups.join(getLocaleNumberSymbol(locale, groupSymbol));
		if (decimals.length) formattedText += getLocaleNumberSymbol(locale, decimalSymbol) + decimals.join("");
		if (exponent) formattedText += getLocaleNumberSymbol(locale, NumberSymbol.Exponential) + "+" + exponent;
	}
	if (value < 0 && !isZero) formattedText = pattern.negPre + formattedText + pattern.negSuf;
	else formattedText = pattern.posPre + formattedText + pattern.posSuf;
	return formattedText;
}
function formatCurrency(value, locale, currency, currencyCode, digitsInfo) {
	const pattern = parseNumberFormat(getLocaleNumberFormat(locale, NumberFormatStyle.Currency), getLocaleNumberSymbol(locale, NumberSymbol.MinusSign));
	pattern.minFrac = getNumberOfCurrencyDigits(currencyCode);
	pattern.maxFrac = pattern.minFrac;
	return formatNumberToLocaleString(value, pattern, locale, NumberSymbol.CurrencyGroup, NumberSymbol.CurrencyDecimal, digitsInfo).replace(CURRENCY_CHAR, currency).replace(CURRENCY_CHAR, "").trim();
}
function formatPercent(value, locale, digitsInfo) {
	return formatNumberToLocaleString(value, parseNumberFormat(getLocaleNumberFormat(locale, NumberFormatStyle.Percent), getLocaleNumberSymbol(locale, NumberSymbol.MinusSign)), locale, NumberSymbol.Group, NumberSymbol.Decimal, digitsInfo, true).replace(new RegExp(PERCENT_CHAR, "g"), getLocaleNumberSymbol(locale, NumberSymbol.PercentSign));
}
function formatNumber(value, locale, digitsInfo) {
	return formatNumberToLocaleString(value, parseNumberFormat(getLocaleNumberFormat(locale, NumberFormatStyle.Decimal), getLocaleNumberSymbol(locale, NumberSymbol.MinusSign)), locale, NumberSymbol.Group, NumberSymbol.Decimal, digitsInfo);
}
function parseNumberFormat(format, minusSign = "-") {
	const p = {
		minInt: 1,
		minFrac: 0,
		maxFrac: 0,
		posPre: "",
		posSuf: "",
		negPre: "",
		negSuf: "",
		gSize: 0,
		lgSize: 0
	};
	const patternParts = format.split(PATTERN_SEP);
	const positive = patternParts[0];
	const negative = patternParts[1];
	const positiveParts = positive.indexOf(DECIMAL_SEP) !== -1 ? positive.split(DECIMAL_SEP) : [positive.substring(0, positive.lastIndexOf(ZERO_CHAR) + 1), positive.substring(positive.lastIndexOf(ZERO_CHAR) + 1)], integer = positiveParts[0], fraction = positiveParts[1] || "";
	p.posPre = integer.substring(0, integer.indexOf(DIGIT_CHAR));
	for (let i = 0; i < fraction.length; i++) {
		const ch = fraction.charAt(i);
		if (ch === ZERO_CHAR) p.minFrac = p.maxFrac = i + 1;
		else if (ch === DIGIT_CHAR) p.maxFrac = i + 1;
		else p.posSuf += ch;
	}
	const groups = integer.split(GROUP_SEP);
	p.gSize = groups[1] ? groups[1].length : 0;
	p.lgSize = groups[2] || groups[1] ? (groups[2] || groups[1]).length : 0;
	if (negative) {
		const trunkLen = positive.length - p.posPre.length - p.posSuf.length, pos = negative.indexOf(DIGIT_CHAR);
		p.negPre = negative.substring(0, pos).replace(/'/g, "");
		p.negSuf = negative.slice(pos + trunkLen).replace(/'/g, "");
	} else {
		p.negPre = minusSign + p.posPre;
		p.negSuf = p.posSuf;
	}
	return p;
}
function toPercent(parsedNumber) {
	if (parsedNumber.digits[0] === 0) return parsedNumber;
	const fractionLen = parsedNumber.digits.length - parsedNumber.integerLen;
	if (parsedNumber.exponent) parsedNumber.exponent += 2;
	else {
		if (fractionLen === 0) parsedNumber.digits.push(0, 0);
		else if (fractionLen === 1) parsedNumber.digits.push(0);
		parsedNumber.integerLen += 2;
	}
	return parsedNumber;
}
function parseNumber(num) {
	let numStr = Math.abs(num) + "";
	let exponent = 0, digits, integerLen;
	let i, j, zeros;
	if ((integerLen = numStr.indexOf(DECIMAL_SEP)) > -1) numStr = numStr.replace(DECIMAL_SEP, "");
	if ((i = numStr.search(/e/i)) > 0) {
		if (integerLen < 0) integerLen = i;
		integerLen += +numStr.slice(i + 1);
		numStr = numStr.substring(0, i);
	} else if (integerLen < 0) integerLen = numStr.length;
	for (i = 0; numStr.charAt(i) === ZERO_CHAR; i++);
	if (i === (zeros = numStr.length)) {
		digits = [0];
		integerLen = 1;
	} else {
		zeros--;
		while (numStr.charAt(zeros) === ZERO_CHAR) zeros--;
		integerLen -= i;
		digits = [];
		for (j = 0; i <= zeros; i++, j++) digits[j] = Number(numStr.charAt(i));
	}
	if (integerLen > MAX_DIGITS) {
		digits = digits.splice(0, MAX_DIGITS - 1);
		exponent = integerLen - 1;
		integerLen = 1;
	}
	return {
		digits,
		exponent,
		integerLen
	};
}
function roundNumber(parsedNumber, minFrac, maxFrac) {
	if (minFrac > maxFrac) throw new RuntimeError(2307, ngDevMode && `The minimum number of digits after fraction (${minFrac}) is higher than the maximum (${maxFrac}).`);
	let digits = parsedNumber.digits;
	let fractionLen = digits.length - parsedNumber.integerLen;
	const fractionSize = Math.min(Math.max(minFrac, fractionLen), maxFrac);
	let roundAt = fractionSize + parsedNumber.integerLen;
	let digit = digits[roundAt];
	if (roundAt > 0) {
		digits.splice(Math.max(parsedNumber.integerLen, roundAt));
		for (let j = roundAt; j < digits.length; j++) digits[j] = 0;
	} else {
		fractionLen = Math.max(0, fractionLen);
		parsedNumber.integerLen = 1;
		digits.length = Math.max(1, roundAt = fractionSize + 1);
		digits[0] = 0;
		for (let i = 1; i < roundAt; i++) digits[i] = 0;
	}
	if (digit >= 5) if (roundAt - 1 < 0) {
		for (let k = 0; k > roundAt; k--) {
			digits.unshift(0);
			parsedNumber.integerLen++;
		}
		digits.unshift(1);
		parsedNumber.integerLen++;
	} else digits[roundAt - 1]++;
	for (; fractionLen < Math.max(0, fractionSize); fractionLen++) digits.push(0);
	let dropTrailingZeros = fractionSize !== 0;
	const minLen = minFrac + parsedNumber.integerLen;
	const carry = digits.reduceRight(function(carry, d, i, digits) {
		d = d + carry;
		digits[i] = d < 10 ? d : d - 10;
		if (dropTrailingZeros) if (digits[i] === 0 && i >= minLen) digits.pop();
		else dropTrailingZeros = false;
		return d >= 10 ? 1 : 0;
	}, 0);
	if (carry) {
		digits.unshift(carry);
		parsedNumber.integerLen++;
	}
}
function parseIntAutoRadix(text) {
	const result = parseInt(text);
	if (isNaN(result)) throw new RuntimeError(2305, ngDevMode && "Invalid integer literal when parsing " + text);
	return result;
}
var NgLocalization = class {};
_NgLocalization = NgLocalization;
_defineProperty(NgLocalization, "ɵfac", function NgLocalization_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _NgLocalization)();
});
_defineProperty(NgLocalization, "ɵprov", /* @__PURE__ */ ɵɵdefineService({
	token: _NgLocalization,
	factory: () => (() => new NgLocaleLocalization(inject(LOCALE_ID)))()
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgLocalization, [{
		type: Service,
		args: [{ factory: () => new NgLocaleLocalization(inject(LOCALE_ID)) }]
	}], null, null);
})();
function getPluralCategory(value, cases, ngLocalization, locale) {
	let key = `=${value}`;
	if (cases.indexOf(key) > -1) return key;
	key = ngLocalization.getPluralCategory(value, locale);
	if (cases.indexOf(key) > -1) return key;
	if (cases.indexOf("other") > -1) return "other";
	throw new RuntimeError(2308, ngDevMode && `No plural message found for value "${value}"`);
}
var NgLocaleLocalization = class extends NgLocalization {
	constructor(locale) {
		super();
		_defineProperty(this, "locale", void 0);
		this.locale = locale;
	}
	getPluralCategory(value, locale) {
		switch (getLocalePluralCase(locale || this.locale)(value)) {
			case Plural.Zero: return "zero";
			case Plural.One: return "one";
			case Plural.Two: return "two";
			case Plural.Few: return "few";
			case Plural.Many: return "many";
			default: return "other";
		}
	}
};
_NgLocaleLocalization = NgLocaleLocalization;
_defineProperty(NgLocaleLocalization, "ɵfac", function NgLocaleLocalization_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _NgLocaleLocalization)(ɵɵinject(LOCALE_ID));
});
_defineProperty(NgLocaleLocalization, "ɵprov", /* @__PURE__ */ ɵɵdefineInjectable({
	token: _NgLocaleLocalization,
	factory: _NgLocaleLocalization.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgLocaleLocalization, [{ type: Injectable }], () => [{
		type: void 0,
		decorators: [{
			type: Inject,
			args: [LOCALE_ID]
		}]
	}], null);
})();
var WS_REGEXP = /\s+/;
var EMPTY_ARRAY = [];
var NgClass = class {
	constructor(_ngEl, _renderer) {
		_defineProperty(this, "_ngEl", void 0);
		_defineProperty(this, "_renderer", void 0);
		_defineProperty(this, "initialClasses", EMPTY_ARRAY);
		_defineProperty(this, "rawClass", void 0);
		_defineProperty(this, "stateMap", /* @__PURE__ */ new Map());
		this._ngEl = _ngEl;
		this._renderer = _renderer;
	}
	set klass(value) {
		this.initialClasses = value != null ? value.trim().split(WS_REGEXP) : EMPTY_ARRAY;
	}
	set ngClass(value) {
		this.rawClass = typeof value === "string" ? value.trim().split(WS_REGEXP) : value;
	}
	ngDoCheck() {
		for (const klass of this.initialClasses) this._updateState(klass, true);
		const rawClass = this.rawClass;
		if (Array.isArray(rawClass) || rawClass instanceof Set) for (const klass of rawClass) this._updateState(klass, true);
		else if (rawClass != null) for (const klass of Object.keys(rawClass)) this._updateState(klass, Boolean(rawClass[klass]));
		this._applyStateDiff();
	}
	_updateState(klass, nextEnabled) {
		const state = this.stateMap.get(klass);
		if (state !== void 0) {
			if (state.enabled !== nextEnabled) {
				state.changed = true;
				state.enabled = nextEnabled;
			}
			state.touched = true;
		} else this.stateMap.set(klass, {
			enabled: nextEnabled,
			changed: true,
			touched: true
		});
	}
	_applyStateDiff() {
		for (const stateEntry of this.stateMap) {
			const klass = stateEntry[0];
			const state = stateEntry[1];
			if (state.changed) {
				this._toggleClass(klass, state.enabled);
				state.changed = false;
			} else if (!state.touched) {
				if (state.enabled) this._toggleClass(klass, false);
				this.stateMap.delete(klass);
			}
			state.touched = false;
		}
	}
	_toggleClass(klass, enabled) {
		if (ngDevMode) {
			if (typeof klass !== "string") throw new Error(`NgClass can only toggle CSS classes expressed as strings, got ${stringify(klass)}`);
		}
		klass = klass.trim();
		if (klass.length > 0) klass.split(WS_REGEXP).forEach((klass) => {
			if (enabled) this._renderer.addClass(this._ngEl.nativeElement, klass);
			else this._renderer.removeClass(this._ngEl.nativeElement, klass);
		});
	}
};
_NgClass = NgClass;
_defineProperty(NgClass, "ɵfac", function NgClass_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _NgClass)(ɵɵdirectiveInject(ElementRef), ɵɵdirectiveInject(Renderer2));
});
_defineProperty(NgClass, "ɵdir", /* @__PURE__ */ ɵɵdefineDirective({
	type: _NgClass,
	selectors: [[
		"",
		"ngClass",
		""
	]],
	inputs: {
		klass: [
			0,
			"class",
			"klass"
		],
		ngClass: "ngClass"
	}
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgClass, [{
		type: Directive,
		args: [{ selector: "[ngClass]" }]
	}], () => [{ type: ElementRef }, { type: Renderer2 }], {
		klass: [{
			type: Input,
			args: ["class"]
		}],
		ngClass: [{
			type: Input,
			args: ["ngClass"]
		}]
	});
})();
var NgComponentOutlet = class {
	get componentInstance() {
		return this._componentRef?.instance ?? null;
	}
	constructor(_viewContainerRef) {
		_defineProperty(this, "_viewContainerRef", void 0);
		_defineProperty(this, "ngComponentOutlet", null);
		_defineProperty(this, "ngComponentOutletInputs", void 0);
		_defineProperty(this, "ngComponentOutletInjector", void 0);
		_defineProperty(this, "ngComponentOutletEnvironmentInjector", void 0);
		_defineProperty(this, "ngComponentOutletContent", void 0);
		_defineProperty(this, "ngComponentOutletNgModule", void 0);
		_defineProperty(this, "_componentRef", void 0);
		_defineProperty(this, "_moduleRef", void 0);
		_defineProperty(this, "_inputsUsed", /* @__PURE__ */ new Map());
		this._viewContainerRef = _viewContainerRef;
	}
	_needToReCreateNgModuleInstance(changes) {
		return changes["ngComponentOutletNgModule"] !== void 0;
	}
	_needToReCreateComponentInstance(changes) {
		return changes["ngComponentOutlet"] !== void 0 || changes["ngComponentOutletContent"] !== void 0 || changes["ngComponentOutletInjector"] !== void 0 || changes["ngComponentOutletEnvironmentInjector"] !== void 0 || this._needToReCreateNgModuleInstance(changes);
	}
	ngOnChanges(changes) {
		if (this._needToReCreateComponentInstance(changes)) {
			this._viewContainerRef.clear();
			this._inputsUsed.clear();
			this._componentRef = void 0;
			if (this.ngComponentOutlet) {
				const injector = this.ngComponentOutletInjector || this._viewContainerRef.parentInjector;
				if (this._needToReCreateNgModuleInstance(changes)) {
					this._moduleRef?.destroy();
					if (this.ngComponentOutletNgModule) this._moduleRef = createNgModule(this.ngComponentOutletNgModule, getParentInjector(injector));
					else this._moduleRef = void 0;
				}
				this._componentRef = this._viewContainerRef.createComponent(this.ngComponentOutlet, {
					injector,
					ngModuleRef: this._moduleRef,
					projectableNodes: this.ngComponentOutletContent,
					environmentInjector: this.ngComponentOutletEnvironmentInjector
				});
			}
		}
	}
	ngDoCheck() {
		if (this._componentRef) {
			if (this.ngComponentOutletInputs) for (const inputName of Object.keys(this.ngComponentOutletInputs)) this._inputsUsed.set(inputName, true);
			this._applyInputStateDiff(this._componentRef);
		}
	}
	ngOnDestroy() {
		this._moduleRef?.destroy();
	}
	_applyInputStateDiff(componentRef) {
		for (const [inputName, touched] of this._inputsUsed) if (!touched) {
			componentRef.setInput(inputName, void 0);
			this._inputsUsed.delete(inputName);
		} else {
			componentRef.setInput(inputName, this.ngComponentOutletInputs[inputName]);
			this._inputsUsed.set(inputName, false);
		}
	}
};
_NgComponentOutlet = NgComponentOutlet;
_defineProperty(NgComponentOutlet, "ɵfac", function NgComponentOutlet_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _NgComponentOutlet)(ɵɵdirectiveInject(ViewContainerRef));
});
_defineProperty(NgComponentOutlet, "ɵdir", /* @__PURE__ */ ɵɵdefineDirective({
	type: _NgComponentOutlet,
	selectors: [[
		"",
		"ngComponentOutlet",
		""
	]],
	inputs: {
		ngComponentOutlet: "ngComponentOutlet",
		ngComponentOutletInputs: "ngComponentOutletInputs",
		ngComponentOutletInjector: "ngComponentOutletInjector",
		ngComponentOutletEnvironmentInjector: "ngComponentOutletEnvironmentInjector",
		ngComponentOutletContent: "ngComponentOutletContent",
		ngComponentOutletNgModule: "ngComponentOutletNgModule"
	},
	exportAs: ["ngComponentOutlet"],
	features: [ɵɵNgOnChangesFeature]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgComponentOutlet, [{
		type: Directive,
		args: [{
			selector: "[ngComponentOutlet]",
			exportAs: "ngComponentOutlet"
		}]
	}], () => [{ type: ViewContainerRef }], {
		ngComponentOutlet: [{ type: Input }],
		ngComponentOutletInputs: [{ type: Input }],
		ngComponentOutletInjector: [{ type: Input }],
		ngComponentOutletEnvironmentInjector: [{ type: Input }],
		ngComponentOutletContent: [{ type: Input }],
		ngComponentOutletNgModule: [{ type: Input }]
	});
})();
function getParentInjector(injector) {
	return injector.get(NgModuleRef$1).injector;
}
var NgForOfContext = class {
	constructor($implicit, ngForOf, index, count) {
		_defineProperty(this, "$implicit", void 0);
		_defineProperty(this, "ngForOf", void 0);
		_defineProperty(this, "index", void 0);
		_defineProperty(this, "count", void 0);
		this.$implicit = $implicit;
		this.ngForOf = ngForOf;
		this.index = index;
		this.count = count;
	}
	get first() {
		return this.index === 0;
	}
	get last() {
		return this.index === this.count - 1;
	}
	get even() {
		return this.index % 2 === 0;
	}
	get odd() {
		return !this.even;
	}
};
var NgForOf = class {
	set ngForOf(ngForOf) {
		this._ngForOf = ngForOf;
		this._ngForOfDirty = true;
	}
	set ngForTrackBy(fn) {
		if ((typeof ngDevMode === "undefined" || ngDevMode) && fn != null && typeof fn !== "function") console.warn(`trackBy must be a function, but received ${JSON.stringify(fn)}. See https://angular.dev/api/common/NgForOf#change-propagation for more information.`);
		this._trackByFn = fn;
	}
	get ngForTrackBy() {
		return this._trackByFn;
	}
	constructor(_viewContainer, _template, _differs) {
		_defineProperty(this, "_viewContainer", void 0);
		_defineProperty(this, "_template", void 0);
		_defineProperty(this, "_differs", void 0);
		_defineProperty(this, "_ngForOf", null);
		_defineProperty(this, "_ngForOfDirty", true);
		_defineProperty(this, "_differ", null);
		_defineProperty(this, "_trackByFn", void 0);
		this._viewContainer = _viewContainer;
		this._template = _template;
		this._differs = _differs;
	}
	set ngForTemplate(value) {
		if (value) this._template = value;
	}
	ngDoCheck() {
		if (this._ngForOfDirty) {
			this._ngForOfDirty = false;
			const value = this._ngForOf;
			if (!this._differ && value) if (typeof ngDevMode === "undefined" || ngDevMode) try {
				this._differ = this._differs.find(value).create(this.ngForTrackBy);
			} catch {
				let errorMessage = `Cannot find a differ supporting object '${value}' of type '${getTypeName(value)}'. NgFor only supports binding to Iterables, such as Arrays.`;
				if (typeof value === "object") errorMessage += " Did you mean to use the keyvalue pipe?";
				throw new RuntimeError(-2200, errorMessage);
			}
			else this._differ = this._differs.find(value).create(this.ngForTrackBy);
		}
		if (this._differ) {
			const changes = this._differ.diff(this._ngForOf);
			if (changes) this._applyChanges(changes);
		}
	}
	_applyChanges(changes) {
		const viewContainer = this._viewContainer;
		changes.forEachOperation((item, adjustedPreviousIndex, currentIndex) => {
			if (item.previousIndex == null) viewContainer.createEmbeddedView(this._template, new NgForOfContext(item.item, this._ngForOf, -1, -1), currentIndex === null ? void 0 : currentIndex);
			else if (currentIndex == null) viewContainer.remove(adjustedPreviousIndex === null ? void 0 : adjustedPreviousIndex);
			else if (adjustedPreviousIndex !== null) {
				const view = viewContainer.get(adjustedPreviousIndex);
				viewContainer.move(view, currentIndex);
				applyViewChange(view, item);
			}
		});
		for (let i = 0, ilen = viewContainer.length; i < ilen; i++) {
			const context = viewContainer.get(i).context;
			context.index = i;
			context.count = ilen;
			context.ngForOf = this._ngForOf;
		}
		changes.forEachIdentityChange((record) => {
			applyViewChange(viewContainer.get(record.currentIndex), record);
		});
	}
	static ngTemplateContextGuard(dir, ctx) {
		return true;
	}
};
_NgForOf = NgForOf;
_defineProperty(NgForOf, "ɵfac", function NgForOf_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _NgForOf)(ɵɵdirectiveInject(ViewContainerRef), ɵɵdirectiveInject(TemplateRef), ɵɵdirectiveInject(IterableDiffers));
});
_defineProperty(NgForOf, "ɵdir", /* @__PURE__ */ ɵɵdefineDirective({
	type: _NgForOf,
	selectors: [[
		"",
		"ngFor",
		"",
		"ngForOf",
		""
	]],
	inputs: {
		ngForOf: "ngForOf",
		ngForTrackBy: "ngForTrackBy",
		ngForTemplate: "ngForTemplate"
	}
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgForOf, [{
		type: Directive,
		args: [{ selector: "[ngFor][ngForOf]" }]
	}], () => [
		{ type: ViewContainerRef },
		{ type: TemplateRef },
		{ type: IterableDiffers }
	], {
		ngForOf: [{ type: Input }],
		ngForTrackBy: [{ type: Input }],
		ngForTemplate: [{ type: Input }]
	});
})();
function applyViewChange(view, record) {
	view.context.$implicit = record.item;
}
function getTypeName(type) {
	return type["name"] || typeof type;
}
var NgIf = class {
	constructor(_viewContainer, templateRef) {
		_defineProperty(this, "_viewContainer", void 0);
		_defineProperty(this, "_context", new NgIfContext());
		_defineProperty(this, "_thenTemplateRef", null);
		_defineProperty(this, "_elseTemplateRef", null);
		_defineProperty(this, "_thenViewRef", null);
		_defineProperty(this, "_elseViewRef", null);
		this._viewContainer = _viewContainer;
		this._thenTemplateRef = templateRef;
	}
	set ngIf(condition) {
		this._context.$implicit = this._context.ngIf = condition;
		this._updateView();
	}
	set ngIfThen(templateRef) {
		assertTemplate(templateRef, (typeof ngDevMode === "undefined" || ngDevMode) && "ngIfThen");
		this._thenTemplateRef = templateRef;
		this._thenViewRef = null;
		this._updateView();
	}
	set ngIfElse(templateRef) {
		assertTemplate(templateRef, (typeof ngDevMode === "undefined" || ngDevMode) && "ngIfElse");
		this._elseTemplateRef = templateRef;
		this._elseViewRef = null;
		this._updateView();
	}
	_updateView() {
		if (this._context.$implicit) {
			if (!this._thenViewRef) {
				this._viewContainer.clear();
				this._elseViewRef = null;
				if (this._thenTemplateRef) this._thenViewRef = this._viewContainer.createEmbeddedView(this._thenTemplateRef, this._context);
			}
		} else if (!this._elseViewRef) {
			this._viewContainer.clear();
			this._thenViewRef = null;
			if (this._elseTemplateRef) this._elseViewRef = this._viewContainer.createEmbeddedView(this._elseTemplateRef, this._context);
		}
	}
	static ngTemplateContextGuard(dir, ctx) {
		return true;
	}
};
_NgIf = NgIf;
_defineProperty(NgIf, "ngIfUseIfTypeGuard", void 0);
_defineProperty(NgIf, "ngTemplateGuard_ngIf", void 0);
_defineProperty(NgIf, "ɵfac", function NgIf_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _NgIf)(ɵɵdirectiveInject(ViewContainerRef), ɵɵdirectiveInject(TemplateRef));
});
_defineProperty(NgIf, "ɵdir", /* @__PURE__ */ ɵɵdefineDirective({
	type: _NgIf,
	selectors: [[
		"",
		"ngIf",
		""
	]],
	inputs: {
		ngIf: "ngIf",
		ngIfThen: "ngIfThen",
		ngIfElse: "ngIfElse"
	}
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgIf, [{
		type: Directive,
		args: [{ selector: "[ngIf]" }]
	}], () => [{ type: ViewContainerRef }, { type: TemplateRef }], {
		ngIf: [{ type: Input }],
		ngIfThen: [{ type: Input }],
		ngIfElse: [{ type: Input }]
	});
})();
var NgIfContext = class {
	constructor() {
		_defineProperty(this, "$implicit", null);
		_defineProperty(this, "ngIf", null);
	}
};
function assertTemplate(templateRef, property) {
	if (templateRef && !templateRef.createEmbeddedView) throw new RuntimeError(2020, (typeof ngDevMode === "undefined" || ngDevMode) && `${property} must be a TemplateRef, but received '${stringify(templateRef)}'.`);
}
var SwitchView = class {
	constructor(_viewContainerRef, _templateRef) {
		_defineProperty(this, "_viewContainerRef", void 0);
		_defineProperty(this, "_templateRef", void 0);
		_defineProperty(this, "_created", false);
		this._viewContainerRef = _viewContainerRef;
		this._templateRef = _templateRef;
	}
	create() {
		this._created = true;
		this._viewContainerRef.createEmbeddedView(this._templateRef);
	}
	destroy() {
		this._created = false;
		this._viewContainerRef.clear();
	}
	enforceState(created) {
		if (created && !this._created) this.create();
		else if (!created && this._created) this.destroy();
	}
};
var NgSwitch = class {
	constructor() {
		_defineProperty(this, "_defaultViews", []);
		_defineProperty(this, "_defaultUsed", false);
		_defineProperty(this, "_caseCount", 0);
		_defineProperty(this, "_lastCaseCheckIndex", 0);
		_defineProperty(this, "_lastCasesMatched", false);
		_defineProperty(this, "_ngSwitch", void 0);
	}
	set ngSwitch(newValue) {
		this._ngSwitch = newValue;
		if (this._caseCount === 0) this._updateDefaultCases(true);
	}
	_addCase() {
		return this._caseCount++;
	}
	_addDefault(view) {
		this._defaultViews.push(view);
	}
	_matchCase(value) {
		const matched = value === this._ngSwitch;
		this._lastCasesMatched ||= matched;
		this._lastCaseCheckIndex++;
		if (this._lastCaseCheckIndex === this._caseCount) {
			this._updateDefaultCases(!this._lastCasesMatched);
			this._lastCaseCheckIndex = 0;
			this._lastCasesMatched = false;
		}
		return matched;
	}
	_updateDefaultCases(useDefault) {
		if (this._defaultViews.length > 0 && useDefault !== this._defaultUsed) {
			this._defaultUsed = useDefault;
			for (const defaultView of this._defaultViews) defaultView.enforceState(useDefault);
		}
	}
};
_NgSwitch = NgSwitch;
_defineProperty(NgSwitch, "ɵfac", function NgSwitch_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _NgSwitch)();
});
_defineProperty(NgSwitch, "ɵdir", /* @__PURE__ */ ɵɵdefineDirective({
	type: _NgSwitch,
	selectors: [[
		"",
		"ngSwitch",
		""
	]],
	inputs: { ngSwitch: "ngSwitch" }
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgSwitch, [{
		type: Directive,
		args: [{ selector: "[ngSwitch]" }]
	}], null, { ngSwitch: [{ type: Input }] });
})();
var NgSwitchCase = class {
	constructor(viewContainer, templateRef, ngSwitch) {
		_defineProperty(this, "ngSwitch", void 0);
		_defineProperty(this, "_view", void 0);
		_defineProperty(this, "ngSwitchCase", void 0);
		this.ngSwitch = ngSwitch;
		if ((typeof ngDevMode === "undefined" || ngDevMode) && !ngSwitch) throwNgSwitchProviderNotFoundError("ngSwitchCase", "NgSwitchCase");
		ngSwitch._addCase();
		this._view = new SwitchView(viewContainer, templateRef);
	}
	ngDoCheck() {
		this._view.enforceState(this.ngSwitch._matchCase(this.ngSwitchCase));
	}
};
_NgSwitchCase = NgSwitchCase;
_defineProperty(NgSwitchCase, "ɵfac", function NgSwitchCase_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _NgSwitchCase)(ɵɵdirectiveInject(ViewContainerRef), ɵɵdirectiveInject(TemplateRef), ɵɵdirectiveInject(NgSwitch, 9));
});
_defineProperty(NgSwitchCase, "ɵdir", /* @__PURE__ */ ɵɵdefineDirective({
	type: _NgSwitchCase,
	selectors: [[
		"",
		"ngSwitchCase",
		""
	]],
	inputs: { ngSwitchCase: "ngSwitchCase" }
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgSwitchCase, [{
		type: Directive,
		args: [{ selector: "[ngSwitchCase]" }]
	}], () => [
		{ type: ViewContainerRef },
		{ type: TemplateRef },
		{
			type: NgSwitch,
			decorators: [{ type: Optional }, { type: Host }]
		}
	], { ngSwitchCase: [{ type: Input }] });
})();
var NgSwitchDefault = class {
	constructor(viewContainer, templateRef, ngSwitch) {
		if ((typeof ngDevMode === "undefined" || ngDevMode) && !ngSwitch) throwNgSwitchProviderNotFoundError("ngSwitchDefault", "NgSwitchDefault");
		ngSwitch._addDefault(new SwitchView(viewContainer, templateRef));
	}
};
_NgSwitchDefault = NgSwitchDefault;
_defineProperty(NgSwitchDefault, "ɵfac", function NgSwitchDefault_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _NgSwitchDefault)(ɵɵdirectiveInject(ViewContainerRef), ɵɵdirectiveInject(TemplateRef), ɵɵdirectiveInject(NgSwitch, 9));
});
_defineProperty(NgSwitchDefault, "ɵdir", /* @__PURE__ */ ɵɵdefineDirective({
	type: _NgSwitchDefault,
	selectors: [[
		"",
		"ngSwitchDefault",
		""
	]]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgSwitchDefault, [{
		type: Directive,
		args: [{ selector: "[ngSwitchDefault]" }]
	}], () => [
		{ type: ViewContainerRef },
		{ type: TemplateRef },
		{
			type: NgSwitch,
			decorators: [{ type: Optional }, { type: Host }]
		}
	], null);
})();
function throwNgSwitchProviderNotFoundError(attrName, directiveName) {
	throw new RuntimeError(2e3, `An element with the "${attrName}" attribute (matching the "${directiveName}" directive) must be located inside an element with the "ngSwitch" attribute (matching "NgSwitch" directive)`);
}
var NgPlural = class {
	constructor(_localization) {
		_defineProperty(this, "_localization", void 0);
		_defineProperty(this, "_activeView", void 0);
		_defineProperty(this, "_caseViews", {});
		this._localization = _localization;
	}
	set ngPlural(value) {
		this._updateView(value);
	}
	addCase(value, switchView) {
		this._caseViews[value] = switchView;
	}
	_updateView(switchValue) {
		this._clearViews();
		const key = getPluralCategory(switchValue, Object.keys(this._caseViews), this._localization);
		this._activateView(this._caseViews[key]);
	}
	_clearViews() {
		if (this._activeView) this._activeView.destroy();
	}
	_activateView(view) {
		if (view) {
			this._activeView = view;
			this._activeView.create();
		}
	}
};
_NgPlural = NgPlural;
_defineProperty(NgPlural, "ɵfac", function NgPlural_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _NgPlural)(ɵɵdirectiveInject(NgLocalization));
});
_defineProperty(NgPlural, "ɵdir", /* @__PURE__ */ ɵɵdefineDirective({
	type: _NgPlural,
	selectors: [[
		"",
		"ngPlural",
		""
	]],
	inputs: { ngPlural: "ngPlural" }
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgPlural, [{
		type: Directive,
		args: [{ selector: "[ngPlural]" }]
	}], () => [{ type: NgLocalization }], { ngPlural: [{ type: Input }] });
})();
var NgPluralCase = class {
	constructor(value, template, viewContainer, ngPlural) {
		_defineProperty(this, "value", void 0);
		this.value = value;
		const isANumber = !isNaN(Number(value));
		ngPlural.addCase(isANumber ? `=${value}` : value, new SwitchView(viewContainer, template));
	}
};
_NgPluralCase = NgPluralCase;
_defineProperty(NgPluralCase, "ɵfac", function NgPluralCase_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _NgPluralCase)(ɵɵinjectAttribute("ngPluralCase"), ɵɵdirectiveInject(TemplateRef), ɵɵdirectiveInject(ViewContainerRef), ɵɵdirectiveInject(NgPlural, 1));
});
_defineProperty(NgPluralCase, "ɵdir", /* @__PURE__ */ ɵɵdefineDirective({
	type: _NgPluralCase,
	selectors: [[
		"",
		"ngPluralCase",
		""
	]]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgPluralCase, [{
		type: Directive,
		args: [{ selector: "[ngPluralCase]" }]
	}], () => [
		{
			type: void 0,
			decorators: [{
				type: Attribute,
				args: ["ngPluralCase"]
			}]
		},
		{ type: TemplateRef },
		{ type: ViewContainerRef },
		{
			type: NgPlural,
			decorators: [{ type: Host }]
		}
	], null);
})();
var NgStyle = class {
	constructor(_ngEl, _differs, _renderer) {
		_defineProperty(this, "_ngEl", void 0);
		_defineProperty(this, "_differs", void 0);
		_defineProperty(this, "_renderer", void 0);
		_defineProperty(this, "_ngStyle", null);
		_defineProperty(this, "_differ", null);
		this._ngEl = _ngEl;
		this._differs = _differs;
		this._renderer = _renderer;
	}
	set ngStyle(values) {
		this._ngStyle = values;
		if (!this._differ && values) this._differ = this._differs.find(values).create();
	}
	ngDoCheck() {
		if (this._differ) {
			const changes = this._differ.diff(this._ngStyle);
			if (changes) this._applyChanges(changes);
		}
	}
	_setStyle(nameAndUnit, value) {
		const [name, unit] = nameAndUnit.split(".");
		const flags = name.indexOf("-") === -1 ? void 0 : RendererStyleFlags2.DashCase;
		if (value != null) this._renderer.setStyle(this._ngEl.nativeElement, name, unit ? `${value}${unit}` : value, flags);
		else this._renderer.removeStyle(this._ngEl.nativeElement, name, flags);
	}
	_applyChanges(changes) {
		changes.forEachRemovedItem((record) => this._setStyle(record.key, null));
		changes.forEachAddedItem((record) => this._setStyle(record.key, record.currentValue));
		changes.forEachChangedItem((record) => this._setStyle(record.key, record.currentValue));
	}
};
_NgStyle = NgStyle;
_defineProperty(NgStyle, "ɵfac", function NgStyle_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _NgStyle)(ɵɵdirectiveInject(ElementRef), ɵɵdirectiveInject(KeyValueDiffers), ɵɵdirectiveInject(Renderer2));
});
_defineProperty(NgStyle, "ɵdir", /* @__PURE__ */ ɵɵdefineDirective({
	type: _NgStyle,
	selectors: [[
		"",
		"ngStyle",
		""
	]],
	inputs: { ngStyle: "ngStyle" }
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgStyle, [{
		type: Directive,
		args: [{ selector: "[ngStyle]" }]
	}], () => [
		{ type: ElementRef },
		{ type: KeyValueDiffers },
		{ type: Renderer2 }
	], { ngStyle: [{
		type: Input,
		args: ["ngStyle"]
	}] });
})();
var NgTemplateOutlet = class {
	constructor(_viewContainerRef) {
		_defineProperty(this, "_viewContainerRef", void 0);
		_defineProperty(this, "_viewRef", null);
		_defineProperty(this, "ngTemplateOutletContext", null);
		_defineProperty(this, "ngTemplateOutlet", null);
		_defineProperty(this, "ngTemplateOutletInjector", null);
		_defineProperty(this, "injector", inject(Injector));
		this._viewContainerRef = _viewContainerRef;
	}
	ngOnChanges(changes) {
		if (this._shouldRecreateView(changes)) {
			const viewContainerRef = this._viewContainerRef;
			if (this._viewRef) viewContainerRef.remove(viewContainerRef.indexOf(this._viewRef));
			if (!this.ngTemplateOutlet) {
				this._viewRef = null;
				return;
			}
			const viewContext = this._createContextForwardProxy();
			this._viewRef = viewContainerRef.createEmbeddedView(this.ngTemplateOutlet, viewContext, { injector: this._getInjector() });
		}
	}
	_getInjector() {
		if (this.ngTemplateOutletInjector === "outlet") return this.injector;
		return this.ngTemplateOutletInjector ?? void 0;
	}
	_shouldRecreateView(changes) {
		return !!changes["ngTemplateOutlet"] || !!changes["ngTemplateOutletInjector"];
	}
	_createContextForwardProxy() {
		return new Proxy({}, {
			set: (_target, prop, newValue) => {
				if (!this.ngTemplateOutletContext) return false;
				return Reflect.set(this.ngTemplateOutletContext, prop, newValue);
			},
			get: (_target, prop, receiver) => {
				if (!this.ngTemplateOutletContext) return;
				return Reflect.get(this.ngTemplateOutletContext, prop, receiver);
			}
		});
	}
};
_NgTemplateOutlet = NgTemplateOutlet;
_defineProperty(NgTemplateOutlet, "ɵfac", function NgTemplateOutlet_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _NgTemplateOutlet)(ɵɵdirectiveInject(ViewContainerRef));
});
_defineProperty(NgTemplateOutlet, "ɵdir", /* @__PURE__ */ ɵɵdefineDirective({
	type: _NgTemplateOutlet,
	selectors: [[
		"",
		"ngTemplateOutlet",
		""
	]],
	inputs: {
		ngTemplateOutletContext: "ngTemplateOutletContext",
		ngTemplateOutlet: "ngTemplateOutlet",
		ngTemplateOutletInjector: "ngTemplateOutletInjector"
	},
	features: [ɵɵNgOnChangesFeature]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgTemplateOutlet, [{
		type: Directive,
		args: [{ selector: "[ngTemplateOutlet]" }]
	}], () => [{ type: ViewContainerRef }], {
		ngTemplateOutletContext: [{ type: Input }],
		ngTemplateOutlet: [{ type: Input }],
		ngTemplateOutletInjector: [{ type: Input }]
	});
})();
var COMMON_DIRECTIVES = [
	NgClass,
	NgComponentOutlet,
	NgForOf,
	NgIf,
	NgTemplateOutlet,
	NgStyle,
	NgSwitch,
	NgSwitchCase,
	NgSwitchDefault,
	NgPlural,
	NgPluralCase
];
function invalidPipeArgumentError(type, value) {
	return new RuntimeError(2100, ngDevMode && `InvalidPipeArgument: '${value}' for pipe '${stringify(type)}'`);
}
function warnIfSignal(pipeName, value) {
	if (isSignal(value)) console.warn(`The ${pipeName} does not unwrap signals. Received a signal with value:`, value());
}
var SubscribableStrategy = class {
	createSubscription(async, updateLatestValue, onError) {
		return untracked(() => async.subscribe({
			next: updateLatestValue,
			error: onError
		}));
	}
	dispose(subscription) {
		untracked(() => subscription.unsubscribe());
	}
};
var PromiseStrategy = class {
	createSubscription(async, updateLatestValue, onError) {
		async.then((v) => updateLatestValue?.(v), (e) => onError?.(e));
		return { unsubscribe: () => {
			updateLatestValue = null;
			onError = null;
		} };
	}
	dispose(subscription) {
		subscription.unsubscribe();
	}
};
var _promiseStrategy = new PromiseStrategy();
var _subscribableStrategy = new SubscribableStrategy();
var AsyncPipe = class AsyncPipe {
	constructor(ref) {
		_defineProperty(this, "_ref", void 0);
		_defineProperty(this, "_latestValue", null);
		_defineProperty(this, "markForCheckOnValueUpdate", true);
		_defineProperty(this, "_subscription", null);
		_defineProperty(this, "_obj", null);
		_defineProperty(this, "_strategy", null);
		_defineProperty(this, "applicationErrorHandler", inject(INTERNAL_APPLICATION_ERROR_HANDLER));
		this._ref = ref;
	}
	ngOnDestroy() {
		if (this._subscription) this._dispose();
		this._ref = null;
	}
	transform(obj) {
		if (!this._obj) {
			if (obj) try {
				this.markForCheckOnValueUpdate = false;
				this._subscribe(obj);
			} finally {
				this.markForCheckOnValueUpdate = true;
			}
			return this._latestValue;
		}
		if (obj !== this._obj) {
			this._dispose();
			return this.transform(obj);
		}
		return this._latestValue;
	}
	_subscribe(obj) {
		this._obj = obj;
		this._strategy = this._selectStrategy(obj);
		this._subscription = this._strategy.createSubscription(obj, (value) => this._updateLatestValue(obj, value), (e) => this.applicationErrorHandler(e));
	}
	_selectStrategy(obj) {
		if (isPromise$1(obj)) return _promiseStrategy;
		if (isSubscribable(obj)) return _subscribableStrategy;
		throw invalidPipeArgumentError(AsyncPipe, obj);
	}
	_dispose() {
		this._strategy.dispose(this._subscription);
		this._latestValue = null;
		this._subscription = null;
		this._obj = null;
	}
	_updateLatestValue(async, value) {
		if (async === this._obj) {
			this._latestValue = value;
			if (this.markForCheckOnValueUpdate) this._ref?.markForCheck();
		}
	}
};
_AsyncPipe = AsyncPipe;
_defineProperty(AsyncPipe, "ɵfac", function AsyncPipe_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _AsyncPipe)(ɵɵdirectiveInject(ChangeDetectorRef, 16));
});
_defineProperty(AsyncPipe, "ɵpipe", /* @__PURE__ */ ɵɵdefinePipe({
	name: "async",
	type: _AsyncPipe,
	pure: false
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(AsyncPipe, [{
		type: Pipe,
		args: [{
			name: "async",
			pure: false
		}]
	}], () => [{ type: ChangeDetectorRef }], null);
})();
var LowerCasePipe = class LowerCasePipe {
	transform(value) {
		if (value == null) return null;
		assertPipeArgument(LowerCasePipe, value);
		return value.toLowerCase();
	}
};
_LowerCasePipe = LowerCasePipe;
_defineProperty(LowerCasePipe, "ɵfac", function LowerCasePipe_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _LowerCasePipe)();
});
_defineProperty(LowerCasePipe, "ɵpipe", /* @__PURE__ */ ɵɵdefinePipe({
	name: "lowercase",
	type: _LowerCasePipe,
	pure: true
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(LowerCasePipe, [{
		type: Pipe,
		args: [{ name: "lowercase" }]
	}], null, null);
})();
var unicodeWordMatch = /(?:[0-9A-Za-z\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0560-\u0588\u05D0-\u05EA\u05EF-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u0860-\u086A\u0870-\u0887\u0889-\u088E\u08A0-\u08C9\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u09FC\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C5D\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D04-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E86-\u0E8A\u0E8C-\u0EA3\u0EA5\u0EA7-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16F1-\u16F8\u1700-\u1711\u171F-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1878\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4C\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1C90-\u1CBA\u1CBD-\u1CBF\u1CE9-\u1CEC\u1CEE-\u1CF3\u1CF5\u1CF6\u1CFA\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2183\u2184\u2C00-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005\u3006\u3031-\u3035\u303B\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312F\u3131-\u318E\u31A0-\u31BF\u31F0-\u31FF\u3400-\u4DBF\u4E00-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6E5\uA717-\uA71F\uA722-\uA788\uA78B-\uA7CA\uA7D0\uA7D1\uA7D3\uA7D5-\uA7D9\uA7F2-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA8FE\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB69\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF2D-\uDF40\uDF42-\uDF49\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF]|\uD801[\uDC00-\uDC9D\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDD70-\uDD7A\uDD7C-\uDD8A\uDD8C-\uDD92\uDD94\uDD95\uDD97-\uDDA1\uDDA3-\uDDB1\uDDB3-\uDDB9\uDDBB\uDDBC\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67\uDF80-\uDF85\uDF87-\uDFB0\uDFB2-\uDFBA]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE35\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2\uDD00-\uDD23\uDE80-\uDEA9\uDEB0\uDEB1\uDF00-\uDF1C\uDF27\uDF30-\uDF45\uDF70-\uDF81\uDFB0-\uDFC4\uDFE0-\uDFF6]|\uD804[\uDC03-\uDC37\uDC71\uDC72\uDC75\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD44\uDD47\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC00-\uDC34\uDC47-\uDC4A\uDC5F-\uDC61\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDEB8\uDF00-\uDF1A\uDF40-\uDF46]|\uD806[\uDC00-\uDC2B\uDCA0-\uDCDF\uDCFF-\uDD06\uDD09\uDD0C-\uDD13\uDD15\uDD16\uDD18-\uDD2F\uDD3F\uDD41\uDDA0-\uDDA7\uDDAA-\uDDD0\uDDE1\uDDE3\uDE00\uDE0B-\uDE32\uDE3A\uDE50\uDE5C-\uDE89\uDE9D\uDEB0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC2E\uDC40\uDC72-\uDC8F\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD30\uDD46\uDD60-\uDD65\uDD67\uDD68\uDD6A-\uDD89\uDD98\uDEE0-\uDEF2\uDFB0]|\uD808[\uDC00-\uDF99]|\uD809[\uDC80-\uDD43]|\uD80B[\uDF90-\uDFF0]|[\uD80C\uD81C-\uD820\uD822\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879\uD880-\uD883][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE70-\uDEBE\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDE40-\uDE7F\uDF00-\uDF4A\uDF50\uDF93-\uDF9F\uDFE0\uDFE1\uDFE3]|\uD821[\uDC00-\uDFF7]|\uD823[\uDC00-\uDCD5\uDD00-\uDD08]|\uD82B[\uDFF0-\uDFF3\uDFF5-\uDFFB\uDFFD\uDFFE]|\uD82C[\uDC00-\uDD22\uDD50-\uDD52\uDD64-\uDD67\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD837[\uDF00-\uDF1E]|\uD838[\uDD00-\uDD2C\uDD37-\uDD3D\uDD4E\uDE90-\uDEAD\uDEC0-\uDEEB]|\uD839[\uDFE0-\uDFE6\uDFE8-\uDFEB\uDFED\uDFEE\uDFF0-\uDFFE]|\uD83A[\uDC00-\uDCC4\uDD00-\uDD43\uDD4B]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDEDF\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF38\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]|\uD884[\uDC00-\uDF4A])\S*/g;
var TitleCasePipe = class TitleCasePipe {
	transform(value) {
		if (value == null) return null;
		assertPipeArgument(TitleCasePipe, value);
		return value.replace(unicodeWordMatch, (txt) => txt[0].toUpperCase() + txt.slice(1).toLowerCase());
	}
};
_TitleCasePipe = TitleCasePipe;
_defineProperty(TitleCasePipe, "ɵfac", function TitleCasePipe_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _TitleCasePipe)();
});
_defineProperty(TitleCasePipe, "ɵpipe", /* @__PURE__ */ ɵɵdefinePipe({
	name: "titlecase",
	type: _TitleCasePipe,
	pure: true
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(TitleCasePipe, [{
		type: Pipe,
		args: [{ name: "titlecase" }]
	}], null, null);
})();
var UpperCasePipe = class UpperCasePipe {
	transform(value) {
		if (value == null) return null;
		assertPipeArgument(UpperCasePipe, value);
		return value.toUpperCase();
	}
};
_UpperCasePipe = UpperCasePipe;
_defineProperty(UpperCasePipe, "ɵfac", function UpperCasePipe_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _UpperCasePipe)();
});
_defineProperty(UpperCasePipe, "ɵpipe", /* @__PURE__ */ ɵɵdefinePipe({
	name: "uppercase",
	type: _UpperCasePipe,
	pure: true
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(UpperCasePipe, [{
		type: Pipe,
		args: [{ name: "uppercase" }]
	}], null, null);
})();
function assertPipeArgument(pipe, value) {
	if (typeof value !== "string") throw invalidPipeArgumentError(pipe, value);
}
var DEFAULT_DATE_FORMAT = "mediumDate";
var DATE_PIPE_DEFAULT_TIMEZONE = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "DATE_PIPE_DEFAULT_TIMEZONE" : "");
var DATE_PIPE_DEFAULT_OPTIONS = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "DATE_PIPE_DEFAULT_OPTIONS" : "");
var DatePipe = class DatePipe {
	constructor(locale, defaultTimezone, defaultOptions) {
		_defineProperty(this, "locale", void 0);
		_defineProperty(this, "defaultTimezone", void 0);
		_defineProperty(this, "defaultOptions", void 0);
		this.locale = locale;
		this.defaultTimezone = defaultTimezone;
		this.defaultOptions = defaultOptions;
	}
	transform(value, format, timezone, locale) {
		if (value == null || value === "" || value !== value) return null;
		try {
			const _format = format ?? this.defaultOptions?.dateFormat ?? DEFAULT_DATE_FORMAT;
			const _timezone = timezone ?? this.defaultOptions?.timezone ?? this.defaultTimezone ?? void 0;
			return formatDate(value, _format, locale || this.locale, _timezone);
		} catch (error) {
			throw invalidPipeArgumentError(DatePipe, error.message);
		}
	}
};
_DatePipe = DatePipe;
_defineProperty(DatePipe, "ɵfac", function DatePipe_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _DatePipe)(ɵɵdirectiveInject(LOCALE_ID, 16), ɵɵdirectiveInject(DATE_PIPE_DEFAULT_TIMEZONE, 24), ɵɵdirectiveInject(DATE_PIPE_DEFAULT_OPTIONS, 24));
});
_defineProperty(DatePipe, "ɵpipe", /* @__PURE__ */ ɵɵdefinePipe({
	name: "date",
	type: _DatePipe,
	pure: true
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DatePipe, [{
		type: Pipe,
		args: [{ name: "date" }]
	}], () => [
		{
			type: void 0,
			decorators: [{
				type: Inject,
				args: [LOCALE_ID]
			}]
		},
		{
			type: void 0,
			decorators: [{
				type: Inject,
				args: [DATE_PIPE_DEFAULT_TIMEZONE]
			}, { type: Optional }]
		},
		{
			type: void 0,
			decorators: [{
				type: Inject,
				args: [DATE_PIPE_DEFAULT_OPTIONS]
			}, { type: Optional }]
		}
	], null);
})();
var _INTERPOLATION_REGEXP = /#/g;
var I18nPluralPipe = class I18nPluralPipe {
	constructor(_localization) {
		_defineProperty(this, "_localization", void 0);
		this._localization = _localization;
	}
	transform(value, pluralMap, locale) {
		if (value == null) return "";
		if (typeof pluralMap !== "object" || pluralMap === null) throw invalidPipeArgumentError(I18nPluralPipe, pluralMap);
		return pluralMap[getPluralCategory(value, Object.keys(pluralMap), this._localization, locale)].replace(_INTERPOLATION_REGEXP, value.toString());
	}
};
_I18nPluralPipe = I18nPluralPipe;
_defineProperty(I18nPluralPipe, "ɵfac", function I18nPluralPipe_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _I18nPluralPipe)(ɵɵdirectiveInject(NgLocalization, 16));
});
_defineProperty(I18nPluralPipe, "ɵpipe", /* @__PURE__ */ ɵɵdefinePipe({
	name: "i18nPlural",
	type: _I18nPluralPipe,
	pure: true
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(I18nPluralPipe, [{
		type: Pipe,
		args: [{ name: "i18nPlural" }]
	}], () => [{ type: NgLocalization }], null);
})();
var I18nSelectPipe = class I18nSelectPipe {
	transform(value, mapping) {
		if (value == null) return "";
		if (typeof mapping !== "object" || typeof value !== "string") throw invalidPipeArgumentError(I18nSelectPipe, mapping);
		if (Object.hasOwn(mapping, value)) return mapping[value];
		if (Object.hasOwn(mapping, "other")) return mapping["other"];
		return "";
	}
};
_I18nSelectPipe = I18nSelectPipe;
_defineProperty(I18nSelectPipe, "ɵfac", function I18nSelectPipe_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _I18nSelectPipe)();
});
_defineProperty(I18nSelectPipe, "ɵpipe", /* @__PURE__ */ ɵɵdefinePipe({
	name: "i18nSelect",
	type: _I18nSelectPipe,
	pure: true
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(I18nSelectPipe, [{
		type: Pipe,
		args: [{ name: "i18nSelect" }]
	}], null, null);
})();
var JsonPipe = class {
	transform(value) {
		ngDevMode && warnIfSignal("JsonPipe", value);
		return JSON.stringify(value, null, 2);
	}
};
_JsonPipe = JsonPipe;
_defineProperty(JsonPipe, "ɵfac", function JsonPipe_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _JsonPipe)();
});
_defineProperty(JsonPipe, "ɵpipe", /* @__PURE__ */ ɵɵdefinePipe({
	name: "json",
	type: _JsonPipe,
	pure: false
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(JsonPipe, [{
		type: Pipe,
		args: [{
			name: "json",
			pure: false
		}]
	}], null, null);
})();
function makeKeyValuePair(key, value) {
	return {
		key,
		value
	};
}
var KeyValuePipe = class {
	constructor(differs) {
		_defineProperty(this, "differs", void 0);
		_defineProperty(this, "differ", void 0);
		_defineProperty(this, "keyValues", []);
		_defineProperty(this, "compareFn", defaultComparator);
		this.differs = differs;
	}
	transform(input, compareFn = defaultComparator) {
		ngDevMode && warnIfSignal("KeyValuePipe", input);
		if (!input || !(input instanceof Map) && typeof input !== "object") return null;
		this.differ ??= this.differs.find(input).create();
		const differChanges = this.differ.diff(input);
		const compareFnChanged = compareFn !== this.compareFn;
		if (differChanges) {
			this.keyValues = [];
			differChanges.forEachItem((r) => {
				this.keyValues.push(makeKeyValuePair(r.key, r.currentValue));
			});
		}
		if (differChanges || compareFnChanged) {
			if (compareFn) this.keyValues.sort(compareFn);
			this.compareFn = compareFn;
		}
		return this.keyValues;
	}
};
_KeyValuePipe = KeyValuePipe;
_defineProperty(KeyValuePipe, "ɵfac", function KeyValuePipe_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _KeyValuePipe)(ɵɵdirectiveInject(KeyValueDiffers, 16));
});
_defineProperty(KeyValuePipe, "ɵpipe", /* @__PURE__ */ ɵɵdefinePipe({
	name: "keyvalue",
	type: _KeyValuePipe,
	pure: false
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(KeyValuePipe, [{
		type: Pipe,
		args: [{
			name: "keyvalue",
			pure: false
		}]
	}], () => [{ type: KeyValueDiffers }], null);
})();
function defaultComparator(keyValueA, keyValueB) {
	const a = keyValueA.key;
	const b = keyValueB.key;
	if (a === b) return 0;
	if (a == null) return 1;
	if (b == null) return -1;
	if (typeof a == "string" && typeof b == "string") return a < b ? -1 : 1;
	if (typeof a == "number" && typeof b == "number") return a - b;
	if (typeof a == "boolean" && typeof b == "boolean") return a < b ? -1 : 1;
	const aString = String(a);
	const bString = String(b);
	return aString == bString ? 0 : aString < bString ? -1 : 1;
}
var DecimalPipe = class DecimalPipe {
	constructor(_locale) {
		_defineProperty(this, "_locale", void 0);
		this._locale = _locale;
	}
	transform(value, digitsInfo, locale) {
		if (!isValue(value)) return null;
		locale ||= this._locale;
		try {
			return formatNumber(strToNumber(value), locale, digitsInfo);
		} catch (error) {
			throw invalidPipeArgumentError(DecimalPipe, error.message);
		}
	}
};
_DecimalPipe = DecimalPipe;
_defineProperty(DecimalPipe, "ɵfac", function DecimalPipe_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _DecimalPipe)(ɵɵdirectiveInject(LOCALE_ID, 16));
});
_defineProperty(DecimalPipe, "ɵpipe", /* @__PURE__ */ ɵɵdefinePipe({
	name: "number",
	type: _DecimalPipe,
	pure: true
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DecimalPipe, [{
		type: Pipe,
		args: [{ name: "number" }]
	}], () => [{
		type: void 0,
		decorators: [{
			type: Inject,
			args: [LOCALE_ID]
		}]
	}], null);
})();
var PercentPipe = class PercentPipe {
	constructor(_locale) {
		_defineProperty(this, "_locale", void 0);
		this._locale = _locale;
	}
	transform(value, digitsInfo, locale) {
		if (!isValue(value)) return null;
		locale ||= this._locale;
		try {
			return formatPercent(strToNumber(value), locale, digitsInfo);
		} catch (error) {
			throw invalidPipeArgumentError(PercentPipe, error.message);
		}
	}
};
_PercentPipe = PercentPipe;
_defineProperty(PercentPipe, "ɵfac", function PercentPipe_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _PercentPipe)(ɵɵdirectiveInject(LOCALE_ID, 16));
});
_defineProperty(PercentPipe, "ɵpipe", /* @__PURE__ */ ɵɵdefinePipe({
	name: "percent",
	type: _PercentPipe,
	pure: true
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(PercentPipe, [{
		type: Pipe,
		args: [{ name: "percent" }]
	}], () => [{
		type: void 0,
		decorators: [{
			type: Inject,
			args: [LOCALE_ID]
		}]
	}], null);
})();
var CurrencyPipe = class CurrencyPipe {
	constructor(_locale, _defaultCurrencyCode = "USD") {
		_defineProperty(this, "_locale", void 0);
		_defineProperty(this, "_defaultCurrencyCode", void 0);
		this._locale = _locale;
		this._defaultCurrencyCode = _defaultCurrencyCode;
	}
	transform(value, currencyCode = this._defaultCurrencyCode, display = "symbol", digitsInfo, locale) {
		if (!isValue(value)) return null;
		locale ||= this._locale;
		if (typeof display === "boolean") {
			if (typeof ngDevMode === "undefined" || ngDevMode) console.warn(`Warning: the currency pipe has been changed in Angular v5. The symbolDisplay option (third parameter) is now a string instead of a boolean. The accepted values are "code", "symbol" or "symbol-narrow".`);
			display = display ? "symbol" : "code";
		}
		let currency = currencyCode || this._defaultCurrencyCode;
		if (display !== "code") if (display === "symbol" || display === "symbol-narrow") currency = getCurrencySymbol(currency, display === "symbol" ? "wide" : "narrow", locale);
		else currency = display;
		try {
			return formatCurrency(strToNumber(value), locale, currency, currencyCode, digitsInfo);
		} catch (error) {
			throw invalidPipeArgumentError(CurrencyPipe, error.message);
		}
	}
};
_CurrencyPipe = CurrencyPipe;
_defineProperty(CurrencyPipe, "ɵfac", function CurrencyPipe_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _CurrencyPipe)(ɵɵdirectiveInject(LOCALE_ID, 16), ɵɵdirectiveInject(DEFAULT_CURRENCY_CODE, 16));
});
_defineProperty(CurrencyPipe, "ɵpipe", /* @__PURE__ */ ɵɵdefinePipe({
	name: "currency",
	type: _CurrencyPipe,
	pure: true
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(CurrencyPipe, [{
		type: Pipe,
		args: [{ name: "currency" }]
	}], () => [{
		type: void 0,
		decorators: [{
			type: Inject,
			args: [LOCALE_ID]
		}]
	}, {
		type: void 0,
		decorators: [{
			type: Inject,
			args: [DEFAULT_CURRENCY_CODE]
		}]
	}], null);
})();
function isValue(value) {
	return !(value == null || value === "" || value !== value);
}
function strToNumber(value) {
	if (typeof value === "string" && !isNaN(Number(value) - parseFloat(value))) return Number(value);
	if (typeof value !== "number") throw new RuntimeError(2309, ngDevMode && `${value} is not a number`);
	return value;
}
var SlicePipe = class SlicePipe {
	transform(value, start, end) {
		if (value == null) return null;
		if (!(typeof value === "string" || Array.isArray(value))) throw invalidPipeArgumentError(SlicePipe, value);
		return value.slice(start, end);
	}
};
_SlicePipe = SlicePipe;
_defineProperty(SlicePipe, "ɵfac", function SlicePipe_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _SlicePipe)();
});
_defineProperty(SlicePipe, "ɵpipe", /* @__PURE__ */ ɵɵdefinePipe({
	name: "slice",
	type: _SlicePipe,
	pure: false
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(SlicePipe, [{
		type: Pipe,
		args: [{
			name: "slice",
			pure: false
		}]
	}], null, null);
})();
var COMMON_PIPES = [
	AsyncPipe,
	UpperCasePipe,
	LowerCasePipe,
	JsonPipe,
	SlicePipe,
	DecimalPipe,
	PercentPipe,
	TitleCasePipe,
	CurrencyPipe,
	DatePipe,
	I18nPluralPipe,
	I18nSelectPipe,
	KeyValuePipe
];
var CommonModule = class {};
_CommonModule = CommonModule;
_defineProperty(CommonModule, "ɵfac", function CommonModule_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _CommonModule)();
});
_defineProperty(CommonModule, "ɵmod", /* @__PURE__ */ ɵɵdefineNgModule({
	type: _CommonModule,
	imports: [
		NgClass,
		NgComponentOutlet,
		NgForOf,
		NgIf,
		NgTemplateOutlet,
		NgStyle,
		NgSwitch,
		NgSwitchCase,
		NgSwitchDefault,
		NgPlural,
		NgPluralCase,
		AsyncPipe,
		UpperCasePipe,
		LowerCasePipe,
		JsonPipe,
		SlicePipe,
		DecimalPipe,
		PercentPipe,
		TitleCasePipe,
		CurrencyPipe,
		DatePipe,
		I18nPluralPipe,
		I18nSelectPipe,
		KeyValuePipe
	],
	exports: [
		NgClass,
		NgComponentOutlet,
		NgForOf,
		NgIf,
		NgTemplateOutlet,
		NgStyle,
		NgSwitch,
		NgSwitchCase,
		NgSwitchDefault,
		NgPlural,
		NgPluralCase,
		AsyncPipe,
		UpperCasePipe,
		LowerCasePipe,
		JsonPipe,
		SlicePipe,
		DecimalPipe,
		PercentPipe,
		TitleCasePipe,
		CurrencyPipe,
		DatePipe,
		I18nPluralPipe,
		I18nSelectPipe,
		KeyValuePipe
	]
}));
_defineProperty(CommonModule, "ɵinj", /* @__PURE__ */ ɵɵdefineInjector({}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(CommonModule, [{
		type: NgModule,
		args: [{
			imports: [COMMON_DIRECTIVES, COMMON_PIPES],
			exports: [COMMON_DIRECTIVES, COMMON_PIPES]
		}]
	}], null, null);
})();
//#endregion
//#region node_modules/@angular/common/fesm2022/_platform_navigation-chunk.mjs
/**
* @license Angular v22.1.5
* (c) 2010-2026 Google LLC. https://angular.dev/
* License: MIT
*/
var _PlatformNavigation;
new InjectionToken("", { factory: () => {
	return typeof window !== "undefined" && typeof window.NavigationPrecommitController !== "undefined";
} });
var PlatformNavigation = class {};
_PlatformNavigation = PlatformNavigation;
_defineProperty(PlatformNavigation, "ɵfac", function PlatformNavigation_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _PlatformNavigation)();
});
_defineProperty(PlatformNavigation, "ɵprov", /* @__PURE__ */ ɵɵdefineInjectable({
	token: _PlatformNavigation,
	factory: () => (() => window.navigation)(),
	providedIn: "platform"
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(PlatformNavigation, [{
		type: Injectable,
		args: [{
			providedIn: "platform",
			useFactory: () => window.navigation
		}]
	}], null, null);
})();
//#endregion
//#region node_modules/@angular/common/fesm2022/_xhr-chunk.mjs
/**
* @license Angular v22.1.5
* (c) 2010-2026 Google LLC. https://angular.dev/
* License: MIT
*/
var _BrowserXhr;
var _XhrFactory;
function parseCookieValue(cookieStr, name) {
	name = encodeURIComponent(name);
	for (const cookie of cookieStr.split(";")) {
		const eqIndex = cookie.indexOf("=");
		const [cookieName, cookieValue] = eqIndex == -1 ? [cookie, ""] : [cookie.slice(0, eqIndex), cookie.slice(eqIndex + 1)];
		if (cookieName.trim() !== name) continue;
		let value = cookieValue;
		try {
			value = decodeURIComponent(cookieValue);
		} catch {}
		if (value.length > 1 && value[0] === "\"" && value[value.length - 1] === "\"") value = value.slice(1, -1);
		return value;
	}
	return null;
}
var BrowserXhr = class {
	build() {
		return new XMLHttpRequest();
	}
};
_BrowserXhr = BrowserXhr;
_defineProperty(BrowserXhr, "ɵfac", function BrowserXhr_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _BrowserXhr)();
});
_defineProperty(BrowserXhr, "ɵprov", /* @__PURE__ */ ɵɵdefineService({
	token: _BrowserXhr,
	factory: _BrowserXhr.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrowserXhr, [{ type: Service }], null, null);
})();
var XhrFactory = class {};
_XhrFactory = XhrFactory;
_defineProperty(XhrFactory, "ɵfac", function XhrFactory_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _XhrFactory)();
});
_defineProperty(XhrFactory, "ɵprov", /* @__PURE__ */ ɵɵdefineInjectable({
	token: _XhrFactory,
	factory: function XhrFactory_Factory(__ngFactoryType__) {
		let __ngConditionalFactory__ = null;
		if (__ngFactoryType__) __ngConditionalFactory__ = new (__ngFactoryType__ || _XhrFactory)();
		else __ngConditionalFactory__ = ɵɵinject(BrowserXhr);
		return __ngConditionalFactory__;
	},
	providedIn: "root"
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(XhrFactory, [{
		type: Injectable,
		args: [{
			providedIn: "root",
			useExisting: BrowserXhr
		}]
	}], null, null);
})();
//#endregion
//#region node_modules/@angular/common/fesm2022/common.mjs
/**
* @license Angular v22.1.5
* (c) 2010-2026 Google LLC. https://angular.dev/
* License: MIT
*/
var _NavigationAdapterForLocation;
var _ViewportScroller;
var _LCPImageObserver;
var _PreconnectLinkChecker;
var _PreloadLinkCreator;
var _NgOptimizedImage;
var NavigationAdapterForLocation = class extends Location {
	constructor() {
		super(inject(LocationStrategy));
		_defineProperty(this, "navigation", inject(PlatformNavigation));
		_defineProperty(this, "destroyRef", inject(DestroyRef));
		this.registerNavigationListeners();
	}
	registerNavigationListeners() {
		const currentEntryChangeListener = () => {
			this._notifyUrlChangeListeners(this.path(true), this.getState());
		};
		this.navigation.addEventListener("currententrychange", currentEntryChangeListener);
		this.destroyRef.onDestroy(() => {
			this.navigation.removeEventListener("currententrychange", currentEntryChangeListener);
		});
	}
	getState() {
		return this.navigation.currentEntry?.getState();
	}
	replaceState(path, query = "", state = null) {
		const url = this.prepareExternalUrl(path + normalizeQueryParams(query));
		this.navigation.navigate(url, {
			state,
			history: "replace"
		});
	}
	go(path, query = "", state = null) {
		const url = this.prepareExternalUrl(path + normalizeQueryParams(query));
		this.navigation.navigate(url, {
			state,
			history: "push"
		});
	}
	back() {
		this.navigation.back();
	}
	forward() {
		this.navigation.forward();
	}
	onUrlChange(fn) {
		this._urlChangeListeners.push(fn);
		return () => {
			const fnIndex = this._urlChangeListeners.indexOf(fn);
			this._urlChangeListeners.splice(fnIndex, 1);
		};
	}
};
_NavigationAdapterForLocation = NavigationAdapterForLocation;
_defineProperty(NavigationAdapterForLocation, "ɵfac", function NavigationAdapterForLocation_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _NavigationAdapterForLocation)();
});
_defineProperty(NavigationAdapterForLocation, "ɵprov", /* @__PURE__ */ ɵɵdefineInjectable({
	token: _NavigationAdapterForLocation,
	factory: _NavigationAdapterForLocation.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NavigationAdapterForLocation, [{ type: Injectable }], () => [], null);
})();
var PLATFORM_BROWSER_ID = "browser";
var ViewportScroller = class {};
_ViewportScroller = ViewportScroller;
_defineProperty(ViewportScroller, "ɵprov", /* @__PURE__ */ ɵɵdefineInjectable({
	token: _ViewportScroller,
	providedIn: "root",
	factory: () => new BrowserViewportScroller(inject(DOCUMENT), window)
}));
var BrowserViewportScroller = class {
	constructor(document, window) {
		_defineProperty(this, "document", void 0);
		_defineProperty(this, "window", void 0);
		_defineProperty(this, "offset", () => [0, 0]);
		this.document = document;
		this.window = window;
	}
	setOffset(offset) {
		if (Array.isArray(offset)) this.offset = () => offset;
		else this.offset = offset;
	}
	getScrollPosition() {
		return [this.window.scrollX, this.window.scrollY];
	}
	scrollToPosition(position, options) {
		this.window.scrollTo({
			...options,
			left: position[0],
			top: position[1]
		});
	}
	scrollToAnchor(target, options) {
		const elSelected = findAnchorFromDocument(this.document, target);
		if (elSelected) {
			this.scrollToElement(elSelected, options);
			elSelected.focus({ preventScroll: true });
		}
	}
	setHistoryScrollRestoration(scrollRestoration) {
		try {
			this.window.history.scrollRestoration = scrollRestoration;
		} catch {
			console.warn(formatRuntimeError(2400, ngDevMode && "Failed to set `window.history.scrollRestoration`. This may occur when:\n• The script is running inside a sandboxed iframe\n• The window is partially navigated or inactive\n• The script is executed in an untrusted or special context (e.g., test runners, browser extensions, or content previews)\nScroll position may not be preserved across navigation."));
		}
	}
	scrollToElement(el, options) {
		const rect = el.getBoundingClientRect();
		const left = rect.left + this.window.pageXOffset;
		const top = rect.top + this.window.pageYOffset;
		const offset = this.offset();
		this.window.scrollTo({
			...options,
			left: left - offset[0],
			top: top - offset[1]
		});
	}
};
function findAnchorFromDocument(document, target) {
	const documentResult = document.getElementById(target) || document.getElementsByName(target)[0];
	if (documentResult) return documentResult;
	if (typeof document.createTreeWalker === "function" && document.body && typeof document.body.attachShadow === "function") {
		const treeWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
		let currentNode = treeWalker.currentNode;
		while (currentNode) {
			const shadowRoot = currentNode.shadowRoot;
			if (shadowRoot) {
				const result = shadowRoot.getElementById(target) || shadowRoot.querySelector(`[name="${CSS.escape(target)}"]`);
				if (result) return result;
			}
			currentNode = treeWalker.nextNode();
		}
	}
	return null;
}
function getUrl(src, win) {
	return isAbsoluteUrl(src) ? new URL(src) : new URL(src, win.location.href);
}
function isAbsoluteUrl(src) {
	return /^https?:\/\//.test(src);
}
function extractHostname(url) {
	return isAbsoluteUrl(url) ? new URL(url).hostname : url;
}
function escapeCssUrl(input) {
	return input.replace(/\\/g, "\\\\").replace(/[\n\r\f\0]/g, "").replace(/"/g, "\\\"");
}
var noopImageLoader = (config) => config.src;
var IMAGE_LOADER = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "ImageLoader" : "", { factory: () => noopImageLoader });
ngDevMode;
var cloudinaryLoaderInfo = {
	name: "Cloudinary",
	testUrl: isCloudinaryUrl
};
var CLOUDINARY_LOADER_REGEX = /https?\:\/\/[^\/]+\.cloudinary\.com\/.+/;
function isCloudinaryUrl(url) {
	return CLOUDINARY_LOADER_REGEX.test(url);
}
ngDevMode;
var imageKitLoaderInfo = {
	name: "ImageKit",
	testUrl: isImageKitUrl
};
var IMAGE_KIT_LOADER_REGEX = /https?\:\/\/[^\/]+\.imagekit\.io\/.+/;
function isImageKitUrl(url) {
	return IMAGE_KIT_LOADER_REGEX.test(url);
}
ngDevMode;
var imgixLoaderInfo = {
	name: "Imgix",
	testUrl: isImgixUrl
};
var IMGIX_LOADER_REGEX = /https?\:\/\/[^\/]+\.imgix\.net\/.+/;
function isImgixUrl(url) {
	return IMGIX_LOADER_REGEX.test(url);
}
ngDevMode;
var netlifyLoaderInfo = {
	name: "Netlify",
	testUrl: isNetlifyUrl
};
var NETLIFY_LOADER_REGEX = /https?\:\/\/[^\/]+\.netlify\.app\/.+/;
function isNetlifyUrl(url) {
	return NETLIFY_LOADER_REGEX.test(url);
}
function imgDirectiveDetails(ngSrc, includeNgSrc = true) {
	return `The NgOptimizedImage directive ${includeNgSrc ? `(activated on an <img> element with the \`ngSrc="${ngSrc}"\`) ` : ""}has detected that`;
}
function assertDevMode(checkName) {
	if (!ngDevMode) throw new RuntimeError(2958, `Unexpected invocation of the ${checkName} in the prod mode. Please make sure that the prod mode is enabled for production builds.`);
}
var LCPImageObserver = class {
	constructor() {
		_defineProperty(this, "images", /* @__PURE__ */ new Map());
		_defineProperty(this, "window", inject(DOCUMENT).defaultView);
		_defineProperty(this, "observer", null);
		assertDevMode("LCP checker");
		if (typeof PerformanceObserver !== "undefined") this.observer = this.initPerformanceObserver();
	}
	initPerformanceObserver() {
		const observer = new PerformanceObserver((entryList) => {
			const entries = entryList.getEntries();
			if (entries.length === 0) return;
			const imgSrc = entries[entries.length - 1].element?.src ?? "";
			if (imgSrc.startsWith("data:") || imgSrc.startsWith("blob:")) return;
			const img = this.images.get(imgSrc);
			if (!img) return;
			if (!img.priority && !img.alreadyWarnedPriority) {
				img.alreadyWarnedPriority = true;
				logMissingPriorityError(imgSrc);
			}
			if (img.modified && !img.alreadyWarnedModified) {
				img.alreadyWarnedModified = true;
				logModifiedWarning(imgSrc);
			}
		});
		observer.observe({
			type: "largest-contentful-paint",
			buffered: true
		});
		return observer;
	}
	registerImage(rewrittenSrc, isPriority) {
		if (!this.observer) return;
		const url = getUrl(rewrittenSrc, this.window).href;
		const existingState = this.images.get(url);
		if (existingState) {
			existingState.priority = existingState.priority || isPriority;
			existingState.count++;
		} else {
			const newObservedImageState = {
				priority: isPriority,
				modified: false,
				alreadyWarnedModified: false,
				alreadyWarnedPriority: false,
				count: 1
			};
			this.images.set(url, newObservedImageState);
		}
	}
	unregisterImage(rewrittenSrc) {
		if (!this.observer) return;
		const url = getUrl(rewrittenSrc, this.window).href;
		const existingState = this.images.get(url);
		if (existingState) {
			existingState.count--;
			if (existingState.count <= 0) this.images.delete(url);
		}
	}
	updateImage(originalSrc, newSrc) {
		if (!this.observer) return;
		const originalUrl = getUrl(originalSrc, this.window).href;
		const newUrl = getUrl(newSrc, this.window).href;
		if (originalUrl === newUrl) return;
		const originalState = this.images.get(originalUrl);
		if (!originalState) return;
		originalState.count--;
		if (originalState.count <= 0) this.images.delete(originalUrl);
		const newState = this.images.get(newUrl);
		if (newState) {
			newState.priority = newState.priority || originalState.priority;
			newState.modified = true;
			newState.alreadyWarnedPriority = newState.alreadyWarnedPriority || originalState.alreadyWarnedPriority;
			newState.alreadyWarnedModified = newState.alreadyWarnedModified || originalState.alreadyWarnedModified;
			newState.count++;
		} else this.images.set(newUrl, {
			priority: originalState.priority,
			modified: true,
			alreadyWarnedModified: originalState.alreadyWarnedModified,
			alreadyWarnedPriority: originalState.alreadyWarnedPriority,
			count: 1
		});
	}
	ngOnDestroy() {
		if (!this.observer) return;
		this.observer.disconnect();
		this.images.clear();
	}
};
_LCPImageObserver = LCPImageObserver;
_defineProperty(LCPImageObserver, "ɵfac", function LCPImageObserver_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _LCPImageObserver)();
});
_defineProperty(LCPImageObserver, "ɵprov", /* @__PURE__ */ ɵɵdefineService({
	token: _LCPImageObserver,
	factory: _LCPImageObserver.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(LCPImageObserver, [{ type: Service }], () => [], null);
})();
function logMissingPriorityError(ngSrc) {
	const directiveDetails = imgDirectiveDetails(ngSrc);
	console.error(formatRuntimeError(2955, `${directiveDetails} this image is the Largest Contentful Paint (LCP) element but was not marked "priority". This image should be marked "priority" in order to prioritize its loading. To fix this, add the "priority" attribute.`));
}
function logModifiedWarning(ngSrc) {
	const directiveDetails = imgDirectiveDetails(ngSrc);
	console.warn(formatRuntimeError(2964, `${directiveDetails} this image is the Largest Contentful Paint (LCP) element and has had its "ngSrc" attribute modified. This can cause slower loading performance. It is recommended not to modify the "ngSrc" property on any image which could be the LCP element.`));
}
var INTERNAL_PRECONNECT_CHECK_BLOCKLIST = /* @__PURE__ */ new Set([
	"localhost",
	"127.0.0.1",
	"0.0.0.0",
	"[::1]"
]);
var PRECONNECT_CHECK_BLOCKLIST = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "PRECONNECT_CHECK_BLOCKLIST" : "");
var PreconnectLinkChecker = class {
	constructor() {
		_defineProperty(this, "document", inject(DOCUMENT));
		_defineProperty(this, "preconnectLinks", null);
		_defineProperty(this, "alreadySeen", /* @__PURE__ */ new Set());
		_defineProperty(this, "window", this.document.defaultView);
		_defineProperty(this, "blocklist", new Set(INTERNAL_PRECONNECT_CHECK_BLOCKLIST));
		assertDevMode("preconnect link checker");
		const blocklist = inject(PRECONNECT_CHECK_BLOCKLIST, { optional: true });
		if (blocklist) this.populateBlocklist(blocklist);
	}
	populateBlocklist(origins) {
		if (Array.isArray(origins)) deepForEach(origins, (origin) => {
			this.blocklist.add(extractHostname(origin));
		});
		else this.blocklist.add(extractHostname(origins));
	}
	assertPreconnect(rewrittenSrc, originalNgSrc) {
		const imgUrl = getUrl(rewrittenSrc, this.window);
		if (this.blocklist.has(imgUrl.hostname) || this.alreadySeen.has(imgUrl.origin)) return;
		this.alreadySeen.add(imgUrl.origin);
		this.preconnectLinks ??= this.queryPreconnectLinks();
		if (!this.preconnectLinks.has(imgUrl.origin)) console.warn(formatRuntimeError(2956, `${imgDirectiveDetails(originalNgSrc)} there is no preconnect tag present for this image. Preconnecting to the origin(s) that serve priority images ensures that these images are delivered as soon as possible. To fix this, please add the following element into the <head> of the document:\n  <link rel="preconnect" href="${imgUrl.origin}">`));
	}
	queryPreconnectLinks() {
		const preconnectUrls = /* @__PURE__ */ new Set();
		const links = this.document.querySelectorAll("link[rel=preconnect]");
		for (const link of links) {
			const url = getUrl(link.href, this.window);
			preconnectUrls.add(url.origin);
		}
		return preconnectUrls;
	}
	ngOnDestroy() {
		this.preconnectLinks?.clear();
		this.alreadySeen.clear();
	}
};
_PreconnectLinkChecker = PreconnectLinkChecker;
_defineProperty(PreconnectLinkChecker, "ɵfac", function PreconnectLinkChecker_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _PreconnectLinkChecker)();
});
_defineProperty(PreconnectLinkChecker, "ɵprov", /* @__PURE__ */ ɵɵdefineService({
	token: _PreconnectLinkChecker,
	factory: _PreconnectLinkChecker.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(PreconnectLinkChecker, [{ type: Service }], () => [], null);
})();
function deepForEach(input, fn) {
	for (let value of input) Array.isArray(value) ? deepForEach(value, fn) : fn(value);
}
var DEFAULT_PRELOADED_IMAGES_LIMIT = 5;
var PRELOADED_IMAGES = new InjectionToken(typeof ngDevMode === "undefined" || ngDevMode ? "NG_OPTIMIZED_PRELOADED_IMAGES" : "", { factory: () => /* @__PURE__ */ new Set() });
var PreloadLinkCreator = class {
	constructor() {
		_defineProperty(this, "preloadedImages", inject(PRELOADED_IMAGES));
		_defineProperty(this, "document", inject(DOCUMENT));
		_defineProperty(this, "errorShown", false);
	}
	createPreloadLinkTag(renderer, src, srcset, sizes, crossOrigin) {
		const preloadKey = `${src}:${getCrossOriginMode(crossOrigin)}`;
		if (ngDevMode && !this.errorShown && this.preloadedImages.size >= DEFAULT_PRELOADED_IMAGES_LIMIT) {
			this.errorShown = true;
			console.warn(formatRuntimeError(2961, `The \`NgOptimizedImage\` directive has detected that more than ${DEFAULT_PRELOADED_IMAGES_LIMIT} images were marked as priority. This might negatively affect an overall performance of the page. To fix this, remove the "priority" attribute from images with less priority.`));
		}
		if (this.preloadedImages.has(preloadKey)) return;
		this.preloadedImages.add(preloadKey);
		const preload = renderer.createElement("link");
		renderer.setAttribute(preload, "as", "image");
		renderer.setAttribute(preload, "href", src);
		renderer.setAttribute(preload, "rel", "preload");
		renderer.setAttribute(preload, "fetchpriority", "high");
		if (crossOrigin != null) renderer.setAttribute(preload, "crossorigin", crossOrigin);
		if (sizes) renderer.setAttribute(preload, "imageSizes", sizes);
		if (srcset) renderer.setAttribute(preload, "imageSrcset", srcset);
		renderer.appendChild(this.document.head, preload);
	}
};
_PreloadLinkCreator = PreloadLinkCreator;
_defineProperty(PreloadLinkCreator, "ɵfac", function PreloadLinkCreator_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _PreloadLinkCreator)();
});
_defineProperty(PreloadLinkCreator, "ɵprov", /* @__PURE__ */ ɵɵdefineService({
	token: _PreloadLinkCreator,
	factory: _PreloadLinkCreator.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(PreloadLinkCreator, [{ type: Service }], null, null);
})();
function getCrossOriginMode(crossOrigin) {
	if (crossOrigin == null) return null;
	return crossOrigin.toLowerCase() === "use-credentials" ? "use-credentials" : "anonymous";
}
var BASE64_IMG_MAX_LENGTH_IN_ERROR = 50;
var VALID_WIDTH_DESCRIPTOR_SRCSET = /^((\s*\d+w\s*(,|$)){1,})$/;
var VALID_DENSITY_DESCRIPTOR_SRCSET = /^((\s*\d+(\.\d+)?x\s*(,|$)){1,})$/;
var ABSOLUTE_SRCSET_DENSITY_CAP = 3;
var RECOMMENDED_SRCSET_DENSITY_CAP = 2;
var DENSITY_SRCSET_MULTIPLIERS = [1, 2];
var VIEWPORT_BREAKPOINT_CUTOFF = 640;
var ASPECT_RATIO_TOLERANCE = .1;
var OVERSIZED_IMAGE_TOLERANCE = 1e3;
var FIXED_SRCSET_WIDTH_LIMIT = 1920;
var FIXED_SRCSET_HEIGHT_LIMIT = 1080;
var PLACEHOLDER_DIMENSION_LIMIT = 1e3;
var DATA_URL_WARN_LIMIT = 4e3;
var DATA_URL_ERROR_LIMIT = 1e4;
var BUILT_IN_LOADERS = [
	imgixLoaderInfo,
	imageKitLoaderInfo,
	cloudinaryLoaderInfo,
	netlifyLoaderInfo
];
var PRIORITY_COUNT_THRESHOLD = 10;
var IMGS_WITH_PRIORITY_ATTR_COUNT = 0;
var NgOptimizedImage = class {
	constructor() {
		_defineProperty(this, "imageLoader", inject(IMAGE_LOADER));
		_defineProperty(this, "config", processConfig(inject(IMAGE_CONFIG)));
		_defineProperty(this, "renderer", inject(Renderer2));
		_defineProperty(this, "imgElement", inject(ElementRef).nativeElement);
		_defineProperty(this, "injector", inject(Injector));
		_defineProperty(this, "destroyRef", inject(DestroyRef));
		_defineProperty(this, "lcpObserver", void 0);
		_defineProperty(this, "_renderedSrc", null);
		_defineProperty(this, "ngSrc", void 0);
		_defineProperty(this, "ngSrcset", void 0);
		_defineProperty(this, "sizes", void 0);
		_defineProperty(this, "width", void 0);
		_defineProperty(this, "height", void 0);
		_defineProperty(this, "decoding", void 0);
		_defineProperty(this, "loading", void 0);
		_defineProperty(this, "priority", false);
		_defineProperty(this, "loaderParams", void 0);
		_defineProperty(this, "disableOptimizedSrcset", false);
		_defineProperty(this, "fill", false);
		_defineProperty(this, "placeholder", void 0);
		_defineProperty(this, "placeholderConfig", void 0);
		_defineProperty(this, "src", void 0);
		_defineProperty(this, "srcset", void 0);
		if (ngDevMode) {
			this.lcpObserver = this.injector.get(LCPImageObserver);
			this.destroyRef.onDestroy(() => {
				if (!this.priority && this._renderedSrc !== null) this.lcpObserver.unregisterImage(this._renderedSrc);
			});
		}
		this.destroyRef.onDestroy(() => {
			this.renderer.removeAttribute(this.imgElement, "loading");
		});
	}
	ngOnInit() {
		performanceMarkFeature("NgOptimizedImage");
		if (ngDevMode) {
			const ngZone = this.injector.get(NgZone);
			assertNonEmptyInput(this, "ngSrc", this.ngSrc);
			assertValidNgSrcset(this, this.ngSrcset);
			assertNoConflictingSrc(this);
			if (this.ngSrcset) assertNoConflictingSrcset(this);
			assertNotBase64Image(this);
			assertNotBlobUrl(this);
			if (this.fill) {
				assertEmptyWidthAndHeight(this);
				ngZone.runOutsideAngular(() => assertNonZeroRenderedHeight(this, this.imgElement, this.renderer, this.destroyRef));
			} else {
				assertNonEmptyWidthAndHeight(this);
				if (this.height !== void 0) assertGreaterThanZero(this, this.height, "height");
				if (this.width !== void 0) assertGreaterThanZero(this, this.width, "width");
				ngZone.runOutsideAngular(() => assertNoImageDistortion(this, this.imgElement, this.renderer, this.destroyRef));
			}
			assertValidLoadingInput(this);
			assertValidDecodingInput(this);
			if (!this.ngSrcset) assertNoComplexSizes(this);
			assertValidPlaceholder(this, this.imageLoader);
			assertNotMissingBuiltInLoader(this.ngSrc, this.imageLoader);
			assertNoNgSrcsetWithoutLoader(this, this.imageLoader);
			assertNoLoaderParamsWithoutLoader(this, this.imageLoader);
			ngZone.runOutsideAngular(() => {
				this.lcpObserver.registerImage(this.getRewrittenSrc(), this.priority);
			});
			if (this.priority) {
				this.injector.get(PreconnectLinkChecker).assertPreconnect(this.getRewrittenSrc(), this.ngSrc);
				assetPriorityCountBelowThreshold(this.injector.get(ApplicationRef));
			}
		}
		if (this.placeholder) this.removePlaceholderOnLoad(this.imgElement);
		this.setHostAttributes();
	}
	setHostAttributes() {
		if (this.fill) this.sizes ||= "100vw";
		else {
			this.setHostAttribute("width", this.width.toString());
			this.setHostAttribute("height", this.height.toString());
		}
		this.setHostAttribute("loading", this.getLoadingBehavior());
		this.setHostAttribute("fetchpriority", this.getFetchPriority());
		this.setHostAttribute("decoding", this.getDecoding());
		this.setHostAttribute("ng-img", "true");
		this.updateSrcAndSrcset();
		if (this.sizes) if (this.getLoadingBehavior() === "lazy") this.setHostAttribute("sizes", "auto, " + this.sizes);
		else this.setHostAttribute("sizes", this.sizes);
		else if (this.ngSrcset && VALID_WIDTH_DESCRIPTOR_SRCSET.test(this.ngSrcset) && this.getLoadingBehavior() === "lazy") this.setHostAttribute("sizes", "auto, 100vw");
	}
	ngOnChanges(changes) {
		if (ngDevMode) assertNoPostInitInputChange(this, changes, [
			"ngSrcset",
			"width",
			"height",
			"priority",
			"fill",
			"loading",
			"sizes",
			"loaderParams",
			"disableOptimizedSrcset"
		]);
		if (changes["ngSrc"] && !changes["ngSrc"].isFirstChange()) {
			const oldSrc = this._renderedSrc;
			this.updateSrcAndSrcset(true);
			if (ngDevMode) {
				const newSrc = this._renderedSrc;
				if (oldSrc && newSrc && oldSrc !== newSrc) this.injector.get(NgZone).runOutsideAngular(() => {
					this.lcpObserver.updateImage(oldSrc, newSrc);
				});
			}
		}
		if (ngDevMode && changes["placeholder"]?.currentValue && true) assertPlaceholderDimensions(this, this.imgElement);
	}
	getAspectRatio() {
		if (this.width && this.height && this.height !== 0) return this.width / this.height;
		return null;
	}
	callImageLoader(configWithoutCustomParams) {
		let augmentedConfig = configWithoutCustomParams;
		if (this.loaderParams) augmentedConfig.loaderParams = this.loaderParams;
		const ratio = this.getAspectRatio();
		if (ratio !== null && augmentedConfig.width) augmentedConfig.height = Math.round(augmentedConfig.width / ratio);
		return this.imageLoader(augmentedConfig);
	}
	getLoadingBehavior() {
		if (!this.priority && this.loading !== void 0) return this.loading;
		return this.priority ? "eager" : "lazy";
	}
	getFetchPriority() {
		return this.priority ? "high" : "auto";
	}
	getDecoding() {
		if (this.priority) return "sync";
		return this.decoding ?? "auto";
	}
	getRewrittenSrc() {
		if (!this._renderedSrc) {
			const imgConfig = { src: this.ngSrc };
			this._renderedSrc = this.callImageLoader(imgConfig);
		}
		return this._renderedSrc;
	}
	getRewrittenSrcset() {
		const widthSrcSet = VALID_WIDTH_DESCRIPTOR_SRCSET.test(this.ngSrcset);
		return this.ngSrcset.split(",").filter((src) => src !== "").map((srcStr) => {
			srcStr = srcStr.trim();
			const width = widthSrcSet ? parseFloat(srcStr) : parseFloat(srcStr) * this.width;
			return `${this.callImageLoader({
				src: this.ngSrc,
				width
			})} ${srcStr}`;
		}).join(", ");
	}
	getAutomaticSrcset() {
		if (this.sizes) return this.getResponsiveSrcset();
		else return this.getFixedSrcset();
	}
	getResponsiveSrcset() {
		const { breakpoints } = this.config;
		let filteredBreakpoints = breakpoints;
		if (this.sizes?.trim() === "100vw") filteredBreakpoints = breakpoints.filter((bp) => bp >= VIEWPORT_BREAKPOINT_CUTOFF);
		return filteredBreakpoints.map((bp) => `${this.callImageLoader({
			src: this.ngSrc,
			width: bp
		})} ${bp}w`).join(", ");
	}
	updateSrcAndSrcset(forceSrcRecalc = false) {
		if (forceSrcRecalc) this._renderedSrc = null;
		const rewrittenSrc = this.getRewrittenSrc();
		this.setHostAttribute("src", rewrittenSrc);
		let rewrittenSrcset = void 0;
		if (this.ngSrcset) rewrittenSrcset = this.getRewrittenSrcset();
		else if (this.shouldGenerateAutomaticSrcset()) rewrittenSrcset = this.getAutomaticSrcset();
		if (rewrittenSrcset) this.setHostAttribute("srcset", rewrittenSrcset);
		return rewrittenSrcset;
	}
	getFixedSrcset() {
		return DENSITY_SRCSET_MULTIPLIERS.map((multiplier) => `${this.callImageLoader({
			src: this.ngSrc,
			width: this.width * multiplier
		})} ${multiplier}x`).join(", ");
	}
	shouldGenerateAutomaticSrcset() {
		let oversizedImage = false;
		if (!this.sizes) oversizedImage = this.width > FIXED_SRCSET_WIDTH_LIMIT || this.height > FIXED_SRCSET_HEIGHT_LIMIT;
		return !this.disableOptimizedSrcset && !this.srcset && this.imageLoader !== noopImageLoader && !oversizedImage;
	}
	generatePlaceholder(placeholderInput) {
		const { placeholderResolution } = this.config;
		if (placeholderInput === true) return `url("${escapeCssUrl(this.callImageLoader({
			src: this.ngSrc,
			width: placeholderResolution,
			isPlaceholder: true
		}))}")`;
		else if (typeof placeholderInput === "string") return `url("${escapeCssUrl(placeholderInput)}")`;
		return null;
	}
	shouldBlurPlaceholder(placeholderConfig) {
		if (!placeholderConfig || !Object.hasOwn(placeholderConfig, "blur")) return true;
		return Boolean(placeholderConfig.blur);
	}
	removePlaceholderOnLoad(img) {
		const callback = () => {
			const changeDetectorRef = this.injector.get(ChangeDetectorRef);
			removeLoadListenerFn();
			removeErrorListenerFn();
			this.placeholder = false;
			changeDetectorRef.markForCheck();
		};
		const removeLoadListenerFn = this.renderer.listen(img, "load", callback);
		const removeErrorListenerFn = this.renderer.listen(img, "error", callback);
		this.destroyRef.onDestroy(() => {
			removeLoadListenerFn();
			removeErrorListenerFn();
		});
		callOnLoadIfImageIsLoaded(img, callback);
	}
	setHostAttribute(name, value) {
		this.renderer.setAttribute(this.imgElement, name, value);
	}
};
_NgOptimizedImage = NgOptimizedImage;
_defineProperty(NgOptimizedImage, "ɵfac", function NgOptimizedImage_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _NgOptimizedImage)();
});
_defineProperty(NgOptimizedImage, "ɵdir", /* @__PURE__ */ ɵɵdefineDirective({
	type: _NgOptimizedImage,
	selectors: [[
		"img",
		"ngSrc",
		""
	]],
	hostVars: 18,
	hostBindings: function NgOptimizedImage_HostBindings(rf, ctx) {
		if (rf & 2) ɵɵstyleProp("position", ctx.fill ? "absolute" : null)("width", ctx.fill ? "100%" : null)("height", ctx.fill ? "100%" : null)("inset", ctx.fill ? "0" : null)("background-size", ctx.placeholder ? "cover" : null)("background-position", ctx.placeholder ? "50% 50%" : null)("background-repeat", ctx.placeholder ? "no-repeat" : null)("background-image", ctx.placeholder ? ctx.generatePlaceholder(ctx.placeholder) : null)("filter", ctx.placeholder && ctx.shouldBlurPlaceholder(ctx.placeholderConfig) ? "blur(15px)" : null);
	},
	inputs: {
		ngSrc: [
			2,
			"ngSrc",
			"ngSrc",
			unwrapSafeUrl
		],
		ngSrcset: "ngSrcset",
		sizes: "sizes",
		width: [
			2,
			"width",
			"width",
			numberAttribute
		],
		height: [
			2,
			"height",
			"height",
			numberAttribute
		],
		decoding: "decoding",
		loading: "loading",
		priority: [
			2,
			"priority",
			"priority",
			booleanAttribute
		],
		loaderParams: "loaderParams",
		disableOptimizedSrcset: [
			2,
			"disableOptimizedSrcset",
			"disableOptimizedSrcset",
			booleanAttribute
		],
		fill: [
			2,
			"fill",
			"fill",
			booleanAttribute
		],
		placeholder: [
			2,
			"placeholder",
			"placeholder",
			booleanOrUrlAttribute
		],
		placeholderConfig: "placeholderConfig",
		src: "src",
		srcset: "srcset"
	},
	features: [ɵɵNgOnChangesFeature]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgOptimizedImage, [{
		type: Directive,
		args: [{
			selector: "img[ngSrc]",
			host: {
				"[style.position]": "fill ? \"absolute\" : null",
				"[style.width]": "fill ? \"100%\" : null",
				"[style.height]": "fill ? \"100%\" : null",
				"[style.inset]": "fill ? \"0\" : null",
				"[style.background-size]": "placeholder ? \"cover\" : null",
				"[style.background-position]": "placeholder ? \"50% 50%\" : null",
				"[style.background-repeat]": "placeholder ? \"no-repeat\" : null",
				"[style.background-image]": "placeholder ? generatePlaceholder(placeholder) : null",
				"[style.filter]": "placeholder && shouldBlurPlaceholder(placeholderConfig) ? \"blur(15px)\" : null"
			}
		}]
	}], () => [], {
		ngSrc: [{
			type: Input,
			args: [{
				required: true,
				transform: unwrapSafeUrl
			}]
		}],
		ngSrcset: [{ type: Input }],
		sizes: [{ type: Input }],
		width: [{
			type: Input,
			args: [{ transform: numberAttribute }]
		}],
		height: [{
			type: Input,
			args: [{ transform: numberAttribute }]
		}],
		decoding: [{ type: Input }],
		loading: [{ type: Input }],
		priority: [{
			type: Input,
			args: [{ transform: booleanAttribute }]
		}],
		loaderParams: [{ type: Input }],
		disableOptimizedSrcset: [{
			type: Input,
			args: [{ transform: booleanAttribute }]
		}],
		fill: [{
			type: Input,
			args: [{ transform: booleanAttribute }]
		}],
		placeholder: [{
			type: Input,
			args: [{ transform: booleanOrUrlAttribute }]
		}],
		placeholderConfig: [{ type: Input }],
		src: [{ type: Input }],
		srcset: [{ type: Input }]
	});
})();
function processConfig(config) {
	let sortedBreakpoints = {};
	if (config.breakpoints) sortedBreakpoints.breakpoints = config.breakpoints.sort((a, b) => a - b);
	return Object.assign({}, IMAGE_CONFIG_DEFAULTS, config, sortedBreakpoints);
}
function assertNoConflictingSrc(dir) {
	if (dir.src) throw new RuntimeError(2950, `${imgDirectiveDetails(dir.ngSrc)} both \`src\` and \`ngSrc\` have been set. Supplying both of these attributes breaks lazy loading. The NgOptimizedImage directive sets \`src\` itself based on the value of \`ngSrc\`. To fix this, please remove the \`src\` attribute.`);
}
function assertNoConflictingSrcset(dir) {
	if (dir.srcset) throw new RuntimeError(2951, `${imgDirectiveDetails(dir.ngSrc)} both \`srcset\` and \`ngSrcset\` have been set. Supplying both of these attributes breaks lazy loading. The NgOptimizedImage directive sets \`srcset\` itself based on the value of \`ngSrcset\`. To fix this, please remove the \`srcset\` attribute.`);
}
function assertNotBase64Image(dir) {
	let ngSrc = dir.ngSrc.trim();
	if (ngSrc.startsWith("data:")) {
		if (ngSrc.length > BASE64_IMG_MAX_LENGTH_IN_ERROR) ngSrc = ngSrc.substring(0, BASE64_IMG_MAX_LENGTH_IN_ERROR) + "...";
		throw new RuntimeError(2952, `${imgDirectiveDetails(dir.ngSrc, false)} \`ngSrc\` is a Base64-encoded string (${ngSrc}). NgOptimizedImage does not support Base64-encoded strings. To fix this, disable the NgOptimizedImage directive for this element by removing \`ngSrc\` and using a standard \`src\` attribute instead.`);
	}
}
function assertNoComplexSizes(dir) {
	if (dir.sizes?.match(/((\)|,)\s|^)\d+px/)) throw new RuntimeError(2952, `${imgDirectiveDetails(dir.ngSrc, false)} \`sizes\` was set to a string including pixel values. For automatic \`srcset\` generation, \`sizes\` must only include responsive values, such as \`sizes="50vw"\` or \`sizes="(min-width: 768px) 50vw, 100vw"\`. To fix this, modify the \`sizes\` attribute, or provide your own \`ngSrcset\` value directly.`);
}
function assertValidPlaceholder(dir, imageLoader) {
	assertNoPlaceholderConfigWithoutPlaceholder(dir);
	assertNoRelativePlaceholderWithoutLoader(dir, imageLoader);
	assertNoOversizedDataUrl(dir);
}
function assertNoPlaceholderConfigWithoutPlaceholder(dir) {
	if (dir.placeholderConfig && !dir.placeholder) throw new RuntimeError(2952, `${imgDirectiveDetails(dir.ngSrc, false)} \`placeholderConfig\` options were provided for an image that does not use the \`placeholder\` attribute, and will have no effect.`);
}
function assertNoRelativePlaceholderWithoutLoader(dir, imageLoader) {
	if (dir.placeholder === true && imageLoader === noopImageLoader) throw new RuntimeError(2963, `${imgDirectiveDetails(dir.ngSrc)} the \`placeholder\` attribute is set to true but no image loader is configured (i.e. the default one is being used), which would result in the same image being used for the primary image and its placeholder. To fix this, provide a loader or remove the \`placeholder\` attribute from the image.`);
}
function assertNoOversizedDataUrl(dir) {
	if (dir.placeholder && typeof dir.placeholder === "string" && dir.placeholder.startsWith("data:")) {
		if (dir.placeholder.length > DATA_URL_ERROR_LIMIT) throw new RuntimeError(2965, `${imgDirectiveDetails(dir.ngSrc)} the \`placeholder\` attribute is set to a data URL which is longer than ${DATA_URL_ERROR_LIMIT} characters. This is strongly discouraged, as large inline placeholders directly increase the bundle size of Angular and hurt page load performance. To fix this, generate a smaller data URL placeholder.`);
		if (dir.placeholder.length > DATA_URL_WARN_LIMIT) console.warn(formatRuntimeError(2965, `${imgDirectiveDetails(dir.ngSrc)} the \`placeholder\` attribute is set to a data URL which is longer than ${DATA_URL_WARN_LIMIT} characters. This is discouraged, as large inline placeholders directly increase the bundle size of Angular and hurt page load performance. For better loading performance, generate a smaller data URL placeholder.`));
	}
}
function assertNotBlobUrl(dir) {
	const ngSrc = dir.ngSrc.trim();
	if (ngSrc.startsWith("blob:")) throw new RuntimeError(2952, `${imgDirectiveDetails(dir.ngSrc)} \`ngSrc\` was set to a blob URL (${ngSrc}). Blob URLs are not supported by the NgOptimizedImage directive. To fix this, disable the NgOptimizedImage directive for this element by removing \`ngSrc\` and using a regular \`src\` attribute instead.`);
}
function assertNonEmptyInput(dir, name, value) {
	const isString = typeof value === "string";
	const isEmptyString = isString && value.trim() === "";
	if (!isString || isEmptyString) throw new RuntimeError(2952, `${imgDirectiveDetails(dir.ngSrc)} \`${name}\` has an invalid value (\`${value}\`). To fix this, change the value to a non-empty string.`);
}
function assertValidNgSrcset(dir, value) {
	if (value == null) return;
	assertNonEmptyInput(dir, "ngSrcset", value);
	const stringVal = value;
	const isValidWidthDescriptor = VALID_WIDTH_DESCRIPTOR_SRCSET.test(stringVal);
	const isValidDensityDescriptor = VALID_DENSITY_DESCRIPTOR_SRCSET.test(stringVal);
	if (isValidDensityDescriptor) assertUnderDensityCap(dir, stringVal);
	if (!(isValidWidthDescriptor || isValidDensityDescriptor)) throw new RuntimeError(2952, `${imgDirectiveDetails(dir.ngSrc)} \`ngSrcset\` has an invalid value (\`${value}\`). To fix this, supply \`ngSrcset\` using a comma-separated list of one or more width descriptors (e.g. "100w, 200w") or density descriptors (e.g. "1x, 2x").`);
}
function assertUnderDensityCap(dir, value) {
	if (!value.split(",").every((num) => num === "" || parseFloat(num) <= ABSOLUTE_SRCSET_DENSITY_CAP)) throw new RuntimeError(2952, `${imgDirectiveDetails(dir.ngSrc)} the \`ngSrcset\` contains an unsupported image density:\`${value}\`. NgOptimizedImage generally recommends a max image density of ${RECOMMENDED_SRCSET_DENSITY_CAP}x but supports image densities up to ${ABSOLUTE_SRCSET_DENSITY_CAP}x. The human eye cannot distinguish between image densities greater than ${RECOMMENDED_SRCSET_DENSITY_CAP}x - which makes them unnecessary for most use cases. Images that will be pinch-zoomed are typically the primary use case for ${ABSOLUTE_SRCSET_DENSITY_CAP}x images. Please remove the high density descriptor and try again.`);
}
function postInitInputChangeError(dir, inputName) {
	let reason;
	if (inputName === "width" || inputName === "height") reason = `Changing \`${inputName}\` may result in different attribute value applied to the underlying image element and cause layout shifts on a page.`;
	else reason = `Changing the \`${inputName}\` would have no effect on the underlying image element, because the resource loading has already occurred.`;
	return new RuntimeError(2953, `${imgDirectiveDetails(dir.ngSrc)} \`${inputName}\` was updated after initialization. The NgOptimizedImage directive will not react to this input change. ${reason} To fix this, either switch \`${inputName}\` to a static value or wrap the image element in an @if that is gated on the necessary value.`);
}
function assertNoPostInitInputChange(dir, changes, inputs) {
	inputs.forEach((input) => {
		if (Object.hasOwn(changes, input) && !changes[input].isFirstChange()) {
			if (input === "ngSrc") dir = { ngSrc: changes[input].previousValue };
			throw postInitInputChangeError(dir, input);
		}
	});
}
function assertGreaterThanZero(dir, inputValue, inputName) {
	const validNumber = typeof inputValue === "number" && inputValue > 0;
	const validString = typeof inputValue === "string" && /^\d+$/.test(inputValue.trim()) && parseInt(inputValue) > 0;
	if (!validNumber && !validString) throw new RuntimeError(2952, `${imgDirectiveDetails(dir.ngSrc)} \`${inputName}\` has an invalid value. To fix this, provide \`${inputName}\` as a number greater than 0.`);
}
function assertNoImageDistortion(dir, img, renderer, destroyRef) {
	const callback = () => {
		removeLoadListenerFn();
		removeErrorListenerFn();
		const computedStyle = window.getComputedStyle(img);
		let renderedWidth = parseFloat(computedStyle.getPropertyValue("width"));
		let renderedHeight = parseFloat(computedStyle.getPropertyValue("height"));
		if (computedStyle.getPropertyValue("box-sizing") === "border-box") {
			const paddingTop = computedStyle.getPropertyValue("padding-top");
			const paddingRight = computedStyle.getPropertyValue("padding-right");
			const paddingBottom = computedStyle.getPropertyValue("padding-bottom");
			const paddingLeft = computedStyle.getPropertyValue("padding-left");
			renderedWidth -= parseFloat(paddingRight) + parseFloat(paddingLeft);
			renderedHeight -= parseFloat(paddingTop) + parseFloat(paddingBottom);
		}
		const renderedAspectRatio = renderedWidth / renderedHeight;
		const nonZeroRenderedDimensions = renderedWidth !== 0 && renderedHeight !== 0;
		const intrinsicWidth = img.naturalWidth;
		const intrinsicHeight = img.naturalHeight;
		const intrinsicAspectRatio = intrinsicWidth / intrinsicHeight;
		const suppliedWidth = dir.width;
		const suppliedHeight = dir.height;
		const suppliedAspectRatio = suppliedWidth / suppliedHeight;
		const inaccurateDimensions = Math.abs(suppliedAspectRatio - intrinsicAspectRatio) > ASPECT_RATIO_TOLERANCE;
		const stylingDistortion = nonZeroRenderedDimensions && Math.abs(intrinsicAspectRatio - renderedAspectRatio) > ASPECT_RATIO_TOLERANCE;
		if (inaccurateDimensions) console.warn(formatRuntimeError(2952, `${imgDirectiveDetails(dir.ngSrc)} the aspect ratio of the image does not match the aspect ratio indicated by the width and height attributes. \nIntrinsic image size: ${intrinsicWidth}w x ${intrinsicHeight}h (aspect-ratio: ${round(intrinsicAspectRatio)}). \nSupplied width and height attributes: ${suppliedWidth}w x ${suppliedHeight}h (aspect-ratio: ${round(suppliedAspectRatio)}). \nTo fix this, update the width and height attributes.`));
		else if (stylingDistortion) console.warn(formatRuntimeError(2952, `${imgDirectiveDetails(dir.ngSrc)} the aspect ratio of the rendered image does not match the image's intrinsic aspect ratio. \nIntrinsic image size: ${intrinsicWidth}w x ${intrinsicHeight}h (aspect-ratio: ${round(intrinsicAspectRatio)}). \nRendered image size: ${renderedWidth}w x ${renderedHeight}h (aspect-ratio: ${round(renderedAspectRatio)}). \nThis issue can occur if "width" and "height" attributes are added to an image without updating the corresponding image styling. To fix this, adjust image styling. In most cases, adding "height: auto" or "width: auto" to the image styling will fix this issue.`));
		else if (!dir.ngSrcset && nonZeroRenderedDimensions) {
			const recommendedWidth = RECOMMENDED_SRCSET_DENSITY_CAP * renderedWidth;
			const recommendedHeight = RECOMMENDED_SRCSET_DENSITY_CAP * renderedHeight;
			const oversizedWidth = intrinsicWidth - recommendedWidth >= OVERSIZED_IMAGE_TOLERANCE;
			const oversizedHeight = intrinsicHeight - recommendedHeight >= OVERSIZED_IMAGE_TOLERANCE;
			if (oversizedWidth || oversizedHeight) console.warn(formatRuntimeError(2960, `${imgDirectiveDetails(dir.ngSrc)} the intrinsic image is significantly larger than necessary. \nRendered image size: ${renderedWidth}w x ${renderedHeight}h. \nIntrinsic image size: ${intrinsicWidth}w x ${intrinsicHeight}h. \nRecommended intrinsic image size: ${recommendedWidth}w x ${recommendedHeight}h. \nNote: Recommended intrinsic image size is calculated assuming a maximum DPR of ${RECOMMENDED_SRCSET_DENSITY_CAP}. To improve loading time, resize the image or consider using the "ngSrcset" and "sizes" attributes.`));
		}
	};
	const removeLoadListenerFn = renderer.listen(img, "load", callback);
	const removeErrorListenerFn = renderer.listen(img, "error", () => {
		removeLoadListenerFn();
		removeErrorListenerFn();
	});
	destroyRef.onDestroy(() => {
		removeLoadListenerFn();
		removeErrorListenerFn();
	});
	callOnLoadIfImageIsLoaded(img, callback);
}
function assertNonEmptyWidthAndHeight(dir) {
	let missingAttributes = [];
	if (dir.width === void 0) missingAttributes.push("width");
	if (dir.height === void 0) missingAttributes.push("height");
	if (missingAttributes.length > 0) throw new RuntimeError(2954, `${imgDirectiveDetails(dir.ngSrc)} these required attributes are missing: ${missingAttributes.map((attr) => `"${attr}"`).join(", ")}. Including "width" and "height" attributes will prevent image-related layout shifts. To fix this, include "width" and "height" attributes on the image tag or turn on "fill" mode with the \`fill\` attribute.`);
}
function assertEmptyWidthAndHeight(dir) {
	if (dir.width || dir.height) throw new RuntimeError(2952, `${imgDirectiveDetails(dir.ngSrc)} the attributes \`height\` and/or \`width\` are present along with the \`fill\` attribute. Because \`fill\` mode causes an image to fill its containing element, the size attributes have no effect and should be removed.`);
}
function assertNonZeroRenderedHeight(dir, img, renderer, destroyRef) {
	const callback = () => {
		removeLoadListenerFn();
		removeErrorListenerFn();
		const renderedHeight = img.clientHeight;
		if (dir.fill && renderedHeight === 0) console.warn(formatRuntimeError(2952, `${imgDirectiveDetails(dir.ngSrc)} the height of the fill-mode image is zero. This is likely because the containing element does not have the CSS 'position' property set to one of the following: "relative", "fixed", or "absolute". To fix this problem, make sure the container element has the CSS 'position' property defined and the height of the element is not zero.`));
	};
	const removeLoadListenerFn = renderer.listen(img, "load", callback);
	const removeErrorListenerFn = renderer.listen(img, "error", () => {
		removeLoadListenerFn();
		removeErrorListenerFn();
	});
	destroyRef.onDestroy(() => {
		removeLoadListenerFn();
		removeErrorListenerFn();
	});
	callOnLoadIfImageIsLoaded(img, callback);
}
function assertValidLoadingInput(dir) {
	if (dir.loading && dir.priority) throw new RuntimeError(2952, `${imgDirectiveDetails(dir.ngSrc)} the \`loading\` attribute was used on an image that was marked "priority". Setting \`loading\` on priority images is not allowed because these images will always be eagerly loaded. To fix this, remove the “loading” attribute from the priority image.`);
	if (typeof dir.loading === "string" && ![
		"auto",
		"eager",
		"lazy"
	].includes(dir.loading)) throw new RuntimeError(2952, `${imgDirectiveDetails(dir.ngSrc)} the \`loading\` attribute has an invalid value (\`${dir.loading}\`). To fix this, provide a valid value ("lazy", "eager", or "auto").`);
}
function assertValidDecodingInput(dir) {
	if (typeof dir.decoding === "string" && ![
		"sync",
		"async",
		"auto"
	].includes(dir.decoding)) throw new RuntimeError(2952, `${imgDirectiveDetails(dir.ngSrc)} the \`decoding\` attribute has an invalid value (\`${dir.decoding}\`). To fix this, provide a valid value ("sync", "async", or "auto").`);
}
function assertNotMissingBuiltInLoader(ngSrc, imageLoader) {
	if (imageLoader === noopImageLoader) {
		let builtInLoaderName = "";
		for (const loader of BUILT_IN_LOADERS) if (loader.testUrl(ngSrc)) {
			builtInLoaderName = loader.name;
			break;
		}
		if (builtInLoaderName) console.warn(formatRuntimeError(2962, `NgOptimizedImage: It looks like your images may be hosted on the ${builtInLoaderName} CDN, but your app is not using Angular's built-in loader for that CDN. We recommend switching to use the built-in by calling \`provide${builtInLoaderName}Loader()\` in your \`providers\` and passing it your instance's base URL. If you don't want to use the built-in loader, define a custom loader function using IMAGE_LOADER to silence this warning.`));
	}
}
function assertNoNgSrcsetWithoutLoader(dir, imageLoader) {
	if (dir.ngSrcset && imageLoader === noopImageLoader) console.warn(formatRuntimeError(2963, `${imgDirectiveDetails(dir.ngSrc)} the \`ngSrcset\` attribute is present but no image loader is configured (i.e. the default one is being used), which would result in the same image being used for all configured sizes. To fix this, provide a loader or remove the \`ngSrcset\` attribute from the image.`));
}
function assertNoLoaderParamsWithoutLoader(dir, imageLoader) {
	if (dir.loaderParams && imageLoader === noopImageLoader) console.warn(formatRuntimeError(2963, `${imgDirectiveDetails(dir.ngSrc)} the \`loaderParams\` attribute is present but no image loader is configured (i.e. the default one is being used), which means that the loaderParams data will not be consumed and will not affect the URL. To fix this, provide a custom loader or remove the \`loaderParams\` attribute from the image.`));
}
async function assetPriorityCountBelowThreshold(appRef) {
	if (IMGS_WITH_PRIORITY_ATTR_COUNT === 0) {
		IMGS_WITH_PRIORITY_ATTR_COUNT++;
		await appRef.whenStable();
		if (IMGS_WITH_PRIORITY_ATTR_COUNT > PRIORITY_COUNT_THRESHOLD) console.warn(formatRuntimeError(2966, `NgOptimizedImage: The "priority" attribute is set to true more than ${PRIORITY_COUNT_THRESHOLD} times (${IMGS_WITH_PRIORITY_ATTR_COUNT} times). Marking too many images as "high" priority can hurt your application's LCP (https://web.dev/lcp). "Priority" should only be set on the image expected to be the page's LCP element.`));
	} else IMGS_WITH_PRIORITY_ATTR_COUNT++;
}
function assertPlaceholderDimensions(dir, imgElement) {
	const computedStyle = window.getComputedStyle(imgElement);
	let renderedWidth = parseFloat(computedStyle.getPropertyValue("width"));
	let renderedHeight = parseFloat(computedStyle.getPropertyValue("height"));
	if (renderedWidth > PLACEHOLDER_DIMENSION_LIMIT || renderedHeight > PLACEHOLDER_DIMENSION_LIMIT) console.warn(formatRuntimeError(2967, `${imgDirectiveDetails(dir.ngSrc)} it uses a placeholder image, but at least one of the dimensions attribute (height or width) exceeds the limit of ${PLACEHOLDER_DIMENSION_LIMIT}px. To fix this, use a smaller image as a placeholder.`));
}
function callOnLoadIfImageIsLoaded(img, callback) {
	if (img.complete && img.naturalWidth) callback();
}
function round(input) {
	return Number.isInteger(input) ? input : input.toFixed(2);
}
function unwrapSafeUrl(value) {
	if (typeof value === "string") return value;
	return unwrapSafeValue(value);
}
function booleanOrUrlAttribute(value) {
	if (typeof value === "string" && value !== "true" && value !== "false" && value !== "") return value;
	return booleanAttribute(value);
}
//#endregion
//#region node_modules/@angular/platform-browser/fesm2022/_dom_renderer-chunk.mjs
/**
* @license Angular v22.1.5
* (c) 2010-2026 Google LLC. https://angular.dev/
* License: MIT
*/
var _DomEventsPlugin;
var _EventManager;
var _SharedStylesHost;
var _DomRendererFactory;
var EventManagerPlugin = class {
	constructor(_doc) {
		_defineProperty(this, "_doc", void 0);
		_defineProperty(this, "manager", void 0);
		this._doc = _doc;
	}
};
var DomEventsPlugin = class extends EventManagerPlugin {
	constructor(doc) {
		super(doc);
	}
	supports(eventName) {
		return true;
	}
	addEventListener(element, eventName, handler, options) {
		element.addEventListener(eventName, handler, options);
		return () => this.removeEventListener(element, eventName, handler, options);
	}
	removeEventListener(target, eventName, callback, options) {
		return target.removeEventListener(eventName, callback, options);
	}
};
_DomEventsPlugin = DomEventsPlugin;
_defineProperty(DomEventsPlugin, "ɵfac", function DomEventsPlugin_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _DomEventsPlugin)(ɵɵinject(DOCUMENT));
});
_defineProperty(DomEventsPlugin, "ɵprov", /* @__PURE__ */ ɵɵdefineInjectable({
	token: _DomEventsPlugin,
	factory: _DomEventsPlugin.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DomEventsPlugin, [{ type: Injectable }], () => [{
		type: void 0,
		decorators: [{
			type: Inject,
			args: [DOCUMENT]
		}]
	}], null);
})();
var EVENT_MANAGER_PLUGINS = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "EventManagerPlugins" : "");
var EventManager = class {
	constructor(plugins, _zone) {
		_defineProperty(this, "_zone", void 0);
		_defineProperty(this, "_plugins", void 0);
		_defineProperty(this, "_eventNameToPlugin", /* @__PURE__ */ new Map());
		this._zone = _zone;
		plugins.forEach((plugin) => {
			plugin.manager = this;
		});
		const otherPlugins = plugins.filter((p) => !(p instanceof DomEventsPlugin));
		this._plugins = otherPlugins.slice().reverse();
		const domEventPlugin = plugins.find((p) => p instanceof DomEventsPlugin);
		if (domEventPlugin) this._plugins.push(domEventPlugin);
	}
	addEventListener(element, eventName, handler, options) {
		return this._findPluginFor(eventName).addEventListener(element, eventName, handler, options);
	}
	getZone() {
		return this._zone;
	}
	_findPluginFor(eventName) {
		let plugin = this._eventNameToPlugin.get(eventName);
		if (plugin) return plugin;
		plugin = this._plugins.find((plugin) => plugin.supports(eventName));
		if (!plugin) throw new RuntimeError(-5101, (typeof ngDevMode === "undefined" || ngDevMode) && `No event manager plugin found for event ${eventName}`);
		this._eventNameToPlugin.set(eventName, plugin);
		return plugin;
	}
};
_EventManager = EventManager;
_defineProperty(EventManager, "ɵfac", function EventManager_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _EventManager)(ɵɵinject(EVENT_MANAGER_PLUGINS), ɵɵinject(NgZone));
});
_defineProperty(EventManager, "ɵprov", /* @__PURE__ */ ɵɵdefineInjectable({
	token: _EventManager,
	factory: _EventManager.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(EventManager, [{ type: Injectable }], () => [{
		type: void 0,
		decorators: [{
			type: Inject,
			args: [EVENT_MANAGER_PLUGINS]
		}]
	}, { type: NgZone }], null);
})();
var APP_ID_ATTRIBUTE_NAME = "ng-app-id";
function removeElements(elements) {
	for (const element of elements) element.remove();
}
function createStyleElement(style, doc) {
	const styleElement = doc.createElement("style");
	styleElement.textContent = style;
	return styleElement;
}
function addServerStyles(doc, appId, inline, external) {
	const elements = doc.head?.querySelectorAll(`style[${APP_ID_ATTRIBUTE_NAME}="${appId}"],link[${APP_ID_ATTRIBUTE_NAME}="${appId}"]`);
	if (!elements || elements.length === 0) return false;
	for (const styleElement of elements) {
		styleElement.removeAttribute(APP_ID_ATTRIBUTE_NAME);
		if (styleElement instanceof HTMLLinkElement) external.set(styleElement.href.slice(styleElement.href.lastIndexOf("/") + 1), {
			usage: 0,
			elements: [styleElement]
		});
		else if (styleElement.textContent) inline.set(styleElement.textContent, {
			usage: 0,
			elements: [styleElement]
		});
	}
	return true;
}
function createLinkElement(url, doc) {
	const linkElement = doc.createElement("link");
	linkElement.setAttribute("rel", "stylesheet");
	linkElement.setAttribute("href", url);
	return linkElement;
}
var SharedStylesHost = class {
	constructor(doc, appId, nonce, platformId = {}) {
		_defineProperty(this, "doc", void 0);
		_defineProperty(this, "appId", void 0);
		_defineProperty(this, "nonce", void 0);
		_defineProperty(this, "inline", /* @__PURE__ */ new Map());
		_defineProperty(this, "external", /* @__PURE__ */ new Map());
		_defineProperty(this, "hosts", /* @__PURE__ */ new Set());
		this.doc = doc;
		this.appId = appId;
		this.nonce = nonce;
		if (addServerStyles(doc, appId, this.inline, this.external)) this.hosts.add(doc.head);
	}
	addStyles(styles, urls) {
		for (const value of styles) this.addUsage(value, this.inline, createStyleElement);
		urls?.forEach((value) => this.addUsage(value, this.external, createLinkElement));
	}
	removeStyles(styles, urls) {
		for (const value of styles) this.removeUsage(value, this.inline);
		urls?.forEach((value) => this.removeUsage(value, this.external));
	}
	addUsage(value, usages, creator) {
		const record = usages.get(value);
		if (record) {
			if ((typeof ngDevMode === "undefined" || ngDevMode) && record.usage === 0) record.elements.forEach((element) => element.setAttribute("ng-style-reused", ""));
			record.usage++;
		} else usages.set(value, {
			usage: 1,
			elements: [...this.hosts].map((host) => this.addElement(host, creator(value, this.doc)))
		});
	}
	removeUsage(value, usages) {
		const record = usages.get(value);
		if (record) {
			record.usage--;
			if (record.usage <= 0) {
				removeElements(record.elements);
				usages.delete(value);
			}
		}
	}
	ngOnDestroy() {
		for (const [, { elements }] of [...this.inline, ...this.external]) removeElements(elements);
		this.hosts.clear();
	}
	addHost(hostNode) {
		if (this.hosts.has(hostNode)) return;
		this.hosts.add(hostNode);
		for (const [style, { elements }] of this.inline) elements.push(this.addElement(hostNode, createStyleElement(style, this.doc)));
		for (const [url, { elements }] of this.external) elements.push(this.addElement(hostNode, createLinkElement(url, this.doc)));
	}
	removeHost(hostNode) {
		this.hosts.delete(hostNode);
		for (const record of [...this.inline.values(), ...this.external.values()]) {
			const remaining = [];
			for (const element of record.elements) if (element.parentNode === hostNode) element.remove();
			else remaining.push(element);
			record.elements = remaining;
		}
	}
	addElement(host, element) {
		if (this.nonce) element.setAttribute("nonce", this.nonce);
		return host.appendChild(element);
	}
};
_SharedStylesHost = SharedStylesHost;
_defineProperty(SharedStylesHost, "ɵfac", function SharedStylesHost_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _SharedStylesHost)(ɵɵinject(DOCUMENT), ɵɵinject(APP_ID), ɵɵinject(CSP_NONCE, 8), ɵɵinject(PLATFORM_ID));
});
_defineProperty(SharedStylesHost, "ɵprov", /* @__PURE__ */ ɵɵdefineInjectable({
	token: _SharedStylesHost,
	factory: _SharedStylesHost.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(SharedStylesHost, [{ type: Injectable }], () => [
		{
			type: Document,
			decorators: [{
				type: Inject,
				args: [DOCUMENT]
			}]
		},
		{
			type: void 0,
			decorators: [{
				type: Inject,
				args: [APP_ID]
			}]
		},
		{
			type: void 0,
			decorators: [{
				type: Inject,
				args: [CSP_NONCE]
			}, { type: Optional }]
		},
		{
			type: void 0,
			decorators: [{
				type: Inject,
				args: [PLATFORM_ID]
			}]
		}
	], null);
})();
var NAMESPACE_URIS = {
	"svg": "http://www.w3.org/2000/svg",
	"xhtml": "http://www.w3.org/1999/xhtml",
	"xlink": "http://www.w3.org/1999/xlink",
	"xml": "http://www.w3.org/XML/1998/namespace",
	"xmlns": "http://www.w3.org/2000/xmlns/",
	"math": "http://www.w3.org/1998/Math/MathML"
};
var COMPONENT_REGEX = /%COMP%/g;
var SOURCEMAP_URL_REGEXP = /\/\*#\s*sourceMappingURL=([^\s*]+)\s*\*\//;
var PROTOCOL_REGEXP = /^https?:/;
var COMPONENT_VARIABLE = "%COMP%";
var HOST_ATTR = `_nghost-${COMPONENT_VARIABLE}`;
var CONTENT_ATTR = `_ngcontent-${COMPONENT_VARIABLE}`;
var REMOVE_STYLES_ON_COMPONENT_DESTROY_DEFAULT = true;
var REMOVE_STYLES_ON_COMPONENT_DESTROY = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "RemoveStylesOnCompDestroy" : "", { factory: () => REMOVE_STYLES_ON_COMPONENT_DESTROY_DEFAULT });
var CSS_VAR_NAMESPACE = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "CSS_VAR_NAMESPACE" : "");
function provideCssVarNamespacing(namespace) {
	return makeEnvironmentProviders([{
		provide: CSS_VAR_NAMESPACE,
		useFactory: (appId) => `${namespace ?? appId}_`,
		deps: [APP_ID]
	}]);
}
function shimContentAttribute(componentShortId) {
	return CONTENT_ATTR.replace(COMPONENT_REGEX, componentShortId);
}
function shimHostAttribute(componentShortId) {
	return HOST_ATTR.replace(COMPONENT_REGEX, componentShortId);
}
function shimStylesContent(compId, styles) {
	return styles.map((s) => s.replace(COMPONENT_REGEX, compId));
}
function addBaseHrefToCssSourceMap(baseHref, styles) {
	if (!baseHref) return styles;
	const absoluteBaseHrefUrl = new URL(baseHref, "http://localhost");
	return styles.map((cssContent) => {
		if (!cssContent.includes("sourceMappingURL=")) return cssContent;
		return cssContent.replace(SOURCEMAP_URL_REGEXP, (_, sourceMapUrl) => {
			if (sourceMapUrl[0] === "/" || sourceMapUrl.startsWith("data:") || PROTOCOL_REGEXP.test(sourceMapUrl)) return `/*# sourceMappingURL=${sourceMapUrl} */`;
			const { pathname: resolvedSourceMapUrl } = new URL(sourceMapUrl, absoluteBaseHrefUrl);
			return `/*# sourceMappingURL=${resolvedSourceMapUrl} */`;
		});
	});
}
var DomRendererFactory2 = class {
	constructor(eventManager, sharedStylesHost, appId, removeStylesOnCompDestroy, doc, ngZone, nonce = null, tracingService = null, cssVarNamespace = null) {
		_defineProperty(this, "eventManager", void 0);
		_defineProperty(this, "sharedStylesHost", void 0);
		_defineProperty(this, "appId", void 0);
		_defineProperty(this, "removeStylesOnCompDestroy", void 0);
		_defineProperty(this, "doc", void 0);
		_defineProperty(this, "ngZone", void 0);
		_defineProperty(this, "nonce", void 0);
		_defineProperty(this, "tracingService", void 0);
		_defineProperty(this, "rendererByCompId", /* @__PURE__ */ new Map());
		_defineProperty(this, "defaultRenderer", void 0);
		_defineProperty(this, "cssVarNamespace", void 0);
		this.eventManager = eventManager;
		this.sharedStylesHost = sharedStylesHost;
		this.appId = appId;
		this.removeStylesOnCompDestroy = removeStylesOnCompDestroy;
		this.doc = doc;
		this.ngZone = ngZone;
		this.nonce = nonce;
		this.tracingService = tracingService;
		this.cssVarNamespace = cssVarNamespace ?? "";
		this.defaultRenderer = new DefaultDomRenderer2(eventManager, doc, ngZone, this.tracingService, this.cssVarNamespace);
	}
	createRenderer(element, type) {
		if (!element || !type) return this.defaultRenderer;
		const renderer = this.getOrCreateRenderer(element, type);
		if (renderer instanceof EmulatedEncapsulationDomRenderer2) renderer.applyToHost(element);
		else if (renderer instanceof NoneEncapsulationDomRenderer) renderer.applyStyles();
		return renderer;
	}
	getOrCreateRenderer(element, type) {
		const rendererByCompId = this.rendererByCompId;
		let renderer = rendererByCompId.get(type.id);
		if (!renderer) {
			const doc = this.doc;
			const ngZone = this.ngZone;
			const eventManager = this.eventManager;
			const sharedStylesHost = this.sharedStylesHost;
			const removeStylesOnCompDestroy = this.removeStylesOnCompDestroy;
			const tracingService = this.tracingService;
			switch (type.encapsulation) {
				case ViewEncapsulation.Emulated:
					renderer = new EmulatedEncapsulationDomRenderer2(eventManager, sharedStylesHost, type, this.appId, removeStylesOnCompDestroy, doc, ngZone, tracingService, this.cssVarNamespace);
					break;
				case ViewEncapsulation.ShadowDom: return new ShadowDomRenderer(eventManager, element, type, doc, ngZone, this.nonce, tracingService, this.cssVarNamespace, sharedStylesHost);
				case ViewEncapsulation.ExperimentalIsolatedShadowDom: return new ShadowDomRenderer(eventManager, element, type, doc, ngZone, this.nonce, tracingService, this.cssVarNamespace);
				default:
					renderer = new NoneEncapsulationDomRenderer(eventManager, sharedStylesHost, type, removeStylesOnCompDestroy, doc, ngZone, tracingService, this.cssVarNamespace);
					break;
			}
			rendererByCompId.set(type.id, renderer);
		}
		return renderer;
	}
	ngOnDestroy() {
		this.rendererByCompId.clear();
	}
	componentReplaced(componentId) {
		this.rendererByCompId.delete(componentId);
	}
};
_DomRendererFactory = DomRendererFactory2;
_defineProperty(DomRendererFactory2, "ɵfac", function DomRendererFactory2_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _DomRendererFactory)(ɵɵinject(EventManager), ɵɵinject(SHARED_STYLES_HOST), ɵɵinject(APP_ID), ɵɵinject(REMOVE_STYLES_ON_COMPONENT_DESTROY), ɵɵinject(DOCUMENT), ɵɵinject(NgZone), ɵɵinject(CSP_NONCE), ɵɵinject(TracingService, 8), ɵɵinject(CSS_VAR_NAMESPACE, 8));
});
_defineProperty(DomRendererFactory2, "ɵprov", /* @__PURE__ */ ɵɵdefineInjectable({
	token: _DomRendererFactory,
	factory: _DomRendererFactory.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DomRendererFactory2, [{ type: Injectable }], () => [
		{ type: EventManager },
		{
			type: SharedStylesHost,
			decorators: [{
				type: Inject,
				args: [SHARED_STYLES_HOST]
			}]
		},
		{
			type: void 0,
			decorators: [{
				type: Inject,
				args: [APP_ID]
			}]
		},
		{
			type: void 0,
			decorators: [{
				type: Inject,
				args: [REMOVE_STYLES_ON_COMPONENT_DESTROY]
			}]
		},
		{
			type: Document,
			decorators: [{
				type: Inject,
				args: [DOCUMENT]
			}]
		},
		{ type: NgZone },
		{
			type: void 0,
			decorators: [{
				type: Inject,
				args: [CSP_NONCE]
			}]
		},
		{
			type: TracingService,
			decorators: [{
				type: Inject,
				args: [TracingService]
			}, { type: Optional }]
		},
		{
			type: void 0,
			decorators: [{
				type: Inject,
				args: [CSS_VAR_NAMESPACE]
			}, { type: Optional }]
		}
	], null);
})();
var DefaultDomRenderer2 = class {
	constructor(eventManager, doc, ngZone, tracingService, cssVarNamespace = "") {
		_defineProperty(this, "eventManager", void 0);
		_defineProperty(this, "doc", void 0);
		_defineProperty(this, "ngZone", void 0);
		_defineProperty(this, "tracingService", void 0);
		_defineProperty(this, "cssVarNamespace", void 0);
		_defineProperty(this, "data", Object.create(null));
		_defineProperty(this, "throwOnSyntheticProps", true);
		_defineProperty(this, "destroyNode", null);
		this.eventManager = eventManager;
		this.doc = doc;
		this.ngZone = ngZone;
		this.tracingService = tracingService;
		this.cssVarNamespace = cssVarNamespace;
	}
	destroy() {}
	createElement(name, namespace) {
		if (namespace) return this.doc.createElementNS(NAMESPACE_URIS[namespace] || namespace, name);
		return this.doc.createElement(name);
	}
	createComment(value) {
		return this.doc.createComment(value);
	}
	createText(value) {
		return this.doc.createTextNode(value);
	}
	appendChild(parent, newChild) {
		(isTemplateNode(parent) ? parent.content : parent).appendChild(newChild);
	}
	insertBefore(parent, newChild, refChild) {
		if (parent) {
			const targetParent = isTemplateNode(parent) ? parent.content : parent;
			if (refChild != null && refChild.parentNode !== targetParent) throw new RuntimeError(-5106, ngDevMode && `Angular could not insert a node before ${describeDomNode(refChild)} because it is no longer a child of ${describeDomNode(targetParent)}. This can happen when code outside of Angular's control (for example, a browser extension or a script that directly manipulates the DOM) has moved or removed a node that Angular is still managing.`);
			targetParent.insertBefore(newChild, refChild);
		}
	}
	removeChild(_parent, oldChild) {
		oldChild.remove();
	}
	selectRootElement(selectorOrNode, preserveContent) {
		let el = typeof selectorOrNode === "string" ? this.doc.querySelector(selectorOrNode) : selectorOrNode;
		if (!el) throw new RuntimeError(-5104, (typeof ngDevMode === "undefined" || ngDevMode) && `The selector "${selectorOrNode}" did not match any elements`);
		if (!preserveContent) el.textContent = "";
		return el;
	}
	parentNode(node) {
		return node.parentNode;
	}
	nextSibling(node) {
		return node.nextSibling;
	}
	setAttribute(el, name, value, namespace) {
		if (namespace) {
			name = namespace + ":" + name;
			const namespaceUri = NAMESPACE_URIS[namespace];
			if (namespaceUri) el.setAttributeNS(namespaceUri, name, value);
			else el.setAttribute(name, value);
		} else el.setAttribute(name, value);
	}
	removeAttribute(el, name, namespace) {
		if (namespace) {
			const namespaceUri = NAMESPACE_URIS[namespace];
			if (namespaceUri) el.removeAttributeNS(namespaceUri, name);
			else el.removeAttribute(`${namespace}:${name}`);
		} else el.removeAttribute(name);
	}
	addClass(el, name) {
		el.classList.add(name);
	}
	removeClass(el, name) {
		el.classList.remove(name);
	}
	setStyle(el, style, value, flags) {
		const isVariable = style.startsWith("--");
		if (isVariable) style = style.replace("%NS%", this.cssVarNamespace);
		if (isVariable || flags & (RendererStyleFlags2.DashCase | RendererStyleFlags2.Important)) el.style.setProperty(style, value, flags & RendererStyleFlags2.Important ? "important" : "");
		else el.style[style] = value;
	}
	removeStyle(el, style, flags) {
		const isVariable = style.startsWith("--");
		if (isVariable) style = style.replace("%NS%", this.cssVarNamespace);
		if (isVariable || flags & RendererStyleFlags2.DashCase) el.style.removeProperty(style);
		else el.style[style] = "";
	}
	setProperty(el, name, value) {
		if (el == null) return;
		(typeof ngDevMode === "undefined" || ngDevMode) && this.throwOnSyntheticProps && checkNoSyntheticProp(name, "property");
		el[name] = value;
	}
	setValue(node, value) {
		node.nodeValue = value;
	}
	listen(target, event, callback, options) {
		(typeof ngDevMode === "undefined" || ngDevMode) && this.throwOnSyntheticProps && checkNoSyntheticProp(event, "listener");
		if (typeof target === "string") {
			target = getDOM().getGlobalEventTarget(this.doc, target);
			if (!target) throw new RuntimeError(-5102, (typeof ngDevMode === "undefined" || ngDevMode) && `Unsupported event target ${target} for event ${event}`);
		}
		let wrappedCallback = this.decoratePreventDefault(callback);
		if (this.tracingService?.wrapEventListener) wrappedCallback = this.tracingService.wrapEventListener(target, event, wrappedCallback);
		return this.eventManager.addEventListener(target, event, wrappedCallback, options);
	}
	decoratePreventDefault(eventHandler) {
		return (event) => {
			if (event === "__ngUnwrap__") return eventHandler;
			if (eventHandler(event) === false) event.preventDefault();
		};
	}
};
var AT_CHARCODE = (() => "@".charCodeAt(0))();
function checkNoSyntheticProp(name, nameKind) {
	if (name.charCodeAt(0) === AT_CHARCODE) throw new RuntimeError(5105, `Unexpected synthetic ${nameKind} ${name} found. Please make sure that:
  - Make sure \`provideAnimationsAsync()\`, \`provideAnimations()\` or \`provideNoopAnimations()\` call was added to a list of providers used to bootstrap an application.
  - There is a corresponding animation configuration named \`${name}\` defined in the \`animations\` field of the \`@Component\` decorator (see https://angular.dev/api/core/Component#animations).`);
}
function isTemplateNode(node) {
	return node.tagName === "TEMPLATE" && node.content !== void 0;
}
var ShadowDomRenderer = class extends DefaultDomRenderer2 {
	constructor(eventManager, hostEl, component, doc, ngZone, nonce, tracingService, cssVarNamespace, sharedStylesHost) {
		super(eventManager, doc, ngZone, tracingService, cssVarNamespace);
		_defineProperty(this, "hostEl", void 0);
		_defineProperty(this, "sharedStylesHost", void 0);
		_defineProperty(this, "shadowRoot", void 0);
		this.hostEl = hostEl;
		this.sharedStylesHost = sharedStylesHost;
		this.shadowRoot = hostEl.attachShadow({ mode: "open" });
		if (this.sharedStylesHost) this.sharedStylesHost.addHost(this.shadowRoot);
		let styles = component.styles;
		if (ngDevMode) styles = addBaseHrefToCssSourceMap(getDOM().getBaseHref(doc) ?? "", styles);
		styles = shimStylesContent(component.id, styles).map((s) => s.replace(/%NS%/g, cssVarNamespace));
		for (const style of styles) {
			const styleEl = document.createElement("style");
			if (nonce) styleEl.setAttribute("nonce", nonce);
			styleEl.textContent = style;
			this.shadowRoot.appendChild(styleEl);
		}
		const styleUrls = component.getExternalStyles?.();
		if (styleUrls) for (const styleUrl of styleUrls) {
			const linkEl = createLinkElement(styleUrl, doc);
			if (nonce) linkEl.setAttribute("nonce", nonce);
			this.shadowRoot.appendChild(linkEl);
		}
	}
	nodeOrShadowRoot(node) {
		return node === this.hostEl ? this.shadowRoot : node;
	}
	appendChild(parent, newChild) {
		return super.appendChild(this.nodeOrShadowRoot(parent), newChild);
	}
	insertBefore(parent, newChild, refChild) {
		return super.insertBefore(this.nodeOrShadowRoot(parent), newChild, refChild);
	}
	removeChild(_parent, oldChild) {
		return super.removeChild(null, oldChild);
	}
	parentNode(node) {
		return this.nodeOrShadowRoot(super.parentNode(this.nodeOrShadowRoot(node)));
	}
	destroy() {
		if (this.sharedStylesHost) this.sharedStylesHost.removeHost(this.shadowRoot);
	}
};
var NoneEncapsulationDomRenderer = class extends DefaultDomRenderer2 {
	constructor(eventManager, sharedStylesHost, component, removeStylesOnCompDestroy, doc, ngZone, tracingService, cssVarNamespace, compId) {
		super(eventManager, doc, ngZone, tracingService, cssVarNamespace);
		_defineProperty(this, "sharedStylesHost", void 0);
		_defineProperty(this, "removeStylesOnCompDestroy", void 0);
		_defineProperty(this, "styles", void 0);
		_defineProperty(this, "styleUrls", void 0);
		this.sharedStylesHost = sharedStylesHost;
		this.removeStylesOnCompDestroy = removeStylesOnCompDestroy;
		let styles = component.styles;
		if (ngDevMode) styles = addBaseHrefToCssSourceMap(getDOM().getBaseHref(doc) ?? "", styles);
		const shimmed = compId ? shimStylesContent(compId, styles) : styles;
		this.styles = shimmed.map((s) => s.replace(/%NS%/g, cssVarNamespace));
		this.styleUrls = component.getExternalStyles?.(compId);
	}
	applyStyles() {
		this.sharedStylesHost.addStyles(this.styles, this.styleUrls);
	}
	destroy() {
		if (!this.removeStylesOnCompDestroy) return;
		if (allLeavingAnimations.size === 0) this.sharedStylesHost.removeStyles(this.styles, this.styleUrls);
	}
};
var EmulatedEncapsulationDomRenderer2 = class extends NoneEncapsulationDomRenderer {
	constructor(eventManager, sharedStylesHost, component, appId, removeStylesOnCompDestroy, doc, ngZone, tracingService, cssVarNamespace) {
		const compId = appId + "-" + component.id;
		super(eventManager, sharedStylesHost, component, removeStylesOnCompDestroy, doc, ngZone, tracingService, cssVarNamespace, compId);
		_defineProperty(this, "contentAttr", void 0);
		_defineProperty(this, "hostAttr", void 0);
		this.contentAttr = shimContentAttribute(compId);
		this.hostAttr = shimHostAttribute(compId);
	}
	applyToHost(element) {
		this.applyStyles();
		this.setAttribute(element, this.hostAttr, "");
	}
	createElement(parent, name) {
		const el = super.createElement(parent, name);
		super.setAttribute(el, this.contentAttr, "");
		return el;
	}
};
//#endregion
//#region node_modules/@angular/platform-browser/fesm2022/_browser-chunk.mjs
/**
* @license Angular v22.1.5
* (c) 2010-2026 Google LLC. https://angular.dev/
* License: MIT
*/
var _KeyEventsPlugin;
var _BrowserModule;
var BrowserDomAdapter = class BrowserDomAdapter extends DomAdapter {
	constructor(..._args) {
		super(..._args);
		_defineProperty(this, "supportsDOMEvents", true);
	}
	static makeCurrent() {
		setRootDomAdapter(new BrowserDomAdapter());
	}
	onAndCancel(el, evt, listener, options) {
		el.addEventListener(evt, listener, options);
		return () => {
			el.removeEventListener(evt, listener, options);
		};
	}
	dispatchEvent(el, evt) {
		el.dispatchEvent(evt);
	}
	remove(node) {
		node.remove();
	}
	createElement(tagName, doc) {
		doc = doc || this.getDefaultDocument();
		return doc.createElement(tagName);
	}
	createHtmlDocument() {
		return document.implementation.createHTMLDocument("fakeTitle");
	}
	getDefaultDocument() {
		return document;
	}
	isElementNode(node) {
		return node.nodeType === Node.ELEMENT_NODE;
	}
	isShadowRoot(node) {
		return node instanceof DocumentFragment;
	}
	getGlobalEventTarget(doc, target) {
		if (target === "window") return window;
		if (target === "document") return doc;
		if (target === "body") return doc.body;
		return null;
	}
	getBaseHref(doc) {
		const href = getBaseElementHref();
		return href == null ? null : relativePath(href);
	}
	resetBaseElement() {
		baseElement = null;
	}
	getUserAgent() {
		return window.navigator.userAgent;
	}
	getCookie(name) {
		return parseCookieValue(document.cookie, name);
	}
};
var baseElement = null;
function getBaseElementHref() {
	baseElement = baseElement || document.head.querySelector("base");
	return baseElement ? baseElement.getAttribute("href") : null;
}
function relativePath(url) {
	return new URL(url, document.baseURI).pathname;
}
var BrowserGetTestability = class {
	addToWindow(registry) {
		_global["getAngularTestability"] = (elem, findInAncestors = true) => {
			const testability = registry.findTestabilityInTree(elem, findInAncestors);
			if (testability == null) throw new RuntimeError(5103, (typeof ngDevMode === "undefined" || ngDevMode) && "Could not find testability for element.");
			return testability;
		};
		_global["getAllAngularTestabilities"] = () => registry.getAllTestabilities();
		_global["getAllAngularRootElements"] = () => registry.getAllRootElements();
		const whenAllStable = (callback) => {
			const testabilities = _global["getAllAngularTestabilities"]();
			let count = testabilities.length;
			const decrement = function() {
				count--;
				if (count == 0) callback();
			};
			testabilities.forEach((testability) => {
				testability.whenStable(decrement);
			});
		};
		if (!_global["frameworkStabilizers"]) _global["frameworkStabilizers"] = [];
		_global["frameworkStabilizers"].push(whenAllStable);
	}
	findTestabilityInTree(registry, elem, findInAncestors) {
		if (elem == null) return null;
		const t = registry.getTestability(elem);
		if (t != null) return t;
		else if (!findInAncestors) return null;
		if (getDOM().isShadowRoot(elem)) return this.findTestabilityInTree(registry, elem.host, true);
		return this.findTestabilityInTree(registry, elem.parentElement, true);
	}
};
var MODIFIER_KEYS = [
	"alt",
	"control",
	"meta",
	"shift"
];
var _keyMap = {
	"\b": "Backspace",
	"	": "Tab",
	"": "Delete",
	"\x1B": "Escape",
	"Del": "Delete",
	"Esc": "Escape",
	"Left": "ArrowLeft",
	"Right": "ArrowRight",
	"Up": "ArrowUp",
	"Down": "ArrowDown",
	"Menu": "ContextMenu",
	"Scroll": "ScrollLock",
	"Win": "OS"
};
var MODIFIER_KEY_GETTERS = {
	"alt": (event) => event.altKey,
	"control": (event) => event.ctrlKey,
	"meta": (event) => event.metaKey,
	"shift": (event) => event.shiftKey
};
var KeyEventsPlugin = class KeyEventsPlugin extends EventManagerPlugin {
	constructor(doc) {
		super(doc);
	}
	supports(eventName) {
		return KeyEventsPlugin.parseEventName(eventName) != null;
	}
	addEventListener(element, eventName, handler, options) {
		const parsedEvent = KeyEventsPlugin.parseEventName(eventName);
		const outsideHandler = KeyEventsPlugin.eventCallback(parsedEvent["fullKey"], handler, this.manager.getZone());
		return this.manager.getZone().runOutsideAngular(() => {
			return getDOM().onAndCancel(element, parsedEvent["domEventName"], outsideHandler, options);
		});
	}
	static parseEventName(eventName) {
		const parts = eventName.toLowerCase().split(".");
		const domEventName = parts.shift();
		if (parts.length === 0 || !(domEventName === "keydown" || domEventName === "keyup")) return null;
		const key = KeyEventsPlugin._normalizeKey(parts.pop());
		let fullKey = "";
		let codeIX = parts.indexOf("code");
		if (codeIX > -1) {
			parts.splice(codeIX, 1);
			fullKey = "code.";
		}
		MODIFIER_KEYS.forEach((modifierName) => {
			const index = parts.indexOf(modifierName);
			if (index > -1) {
				parts.splice(index, 1);
				fullKey += modifierName + ".";
			}
		});
		fullKey += key;
		if (parts.length != 0 || key.length === 0) return null;
		const result = {};
		result["domEventName"] = domEventName;
		result["fullKey"] = fullKey;
		return result;
	}
	static matchEventFullKeyCode(event, fullKeyCode) {
		let keycode = _keyMap[event.key] || event.key;
		let key = "";
		if (fullKeyCode.indexOf("code.") > -1) {
			keycode = event.code;
			key = "code.";
		}
		if (keycode == null || !keycode) return false;
		keycode = keycode.toLowerCase();
		if (keycode === " ") keycode = "space";
		else if (keycode === ".") keycode = "dot";
		MODIFIER_KEYS.forEach((modifierName) => {
			if (modifierName !== keycode) {
				const modifierGetter = MODIFIER_KEY_GETTERS[modifierName];
				if (modifierGetter(event)) key += modifierName + ".";
			}
		});
		key += keycode;
		return key === fullKeyCode;
	}
	static eventCallback(fullKey, handler, zone) {
		return (event) => {
			if (KeyEventsPlugin.matchEventFullKeyCode(event, fullKey)) zone.runGuarded(() => handler(event));
		};
	}
	static _normalizeKey(keyName) {
		return keyName === "esc" ? "escape" : keyName;
	}
};
_KeyEventsPlugin = KeyEventsPlugin;
_defineProperty(KeyEventsPlugin, "ɵfac", function KeyEventsPlugin_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _KeyEventsPlugin)(ɵɵinject(DOCUMENT));
});
_defineProperty(KeyEventsPlugin, "ɵprov", /* @__PURE__ */ ɵɵdefineInjectable({
	token: _KeyEventsPlugin,
	factory: _KeyEventsPlugin.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(KeyEventsPlugin, [{ type: Injectable }], () => [{
		type: void 0,
		decorators: [{
			type: Inject,
			args: [DOCUMENT]
		}]
	}], null);
})();
async function bootstrapApplication(rootComponent, options, context) {
	return internalCreateApplication({
		rootComponent,
		...createProvidersConfig(options, context)
	});
}
async function createApplication(options, context) {
	return internalCreateApplication(createProvidersConfig(options, context));
}
function createProvidersConfig(options, context) {
	return {
		platformRef: context?.platformRef,
		appProviders: [...BROWSER_MODULE_PROVIDERS, ...options?.providers ?? []],
		platformProviders: INTERNAL_BROWSER_PLATFORM_PROVIDERS
	};
}
function provideProtractorTestingSupport(options = {}) {
	return [...TESTABILITY_PROVIDERS, options?.usePendingTasksForStability !== void 0 ? {
		provide: USE_PENDING_TASKS,
		useValue: options.usePendingTasksForStability ?? false
	} : []];
}
function initDomAdapter() {
	BrowserDomAdapter.makeCurrent();
}
function errorHandler() {
	return new ErrorHandler();
}
function _document() {
	setDocument(document);
	return document;
}
var INTERNAL_BROWSER_PLATFORM_PROVIDERS = [
	{
		provide: PLATFORM_ID,
		useValue: PLATFORM_BROWSER_ID
	},
	{
		provide: PLATFORM_INITIALIZER,
		useValue: initDomAdapter,
		multi: true
	},
	{
		provide: DOCUMENT,
		useFactory: _document
	}
];
var platformBrowser = createPlatformFactory(platformCore, "browser", INTERNAL_BROWSER_PLATFORM_PROVIDERS);
var BROWSER_MODULE_PROVIDERS_MARKER = new InjectionToken(typeof ngDevMode === "undefined" || ngDevMode ? "BrowserModule Providers Marker" : "");
var TESTABILITY_PROVIDERS = [
	{
		provide: TESTABILITY_GETTER,
		useClass: BrowserGetTestability
	},
	{
		provide: TESTABILITY,
		useClass: Testability,
		deps: [
			NgZone,
			TestabilityRegistry,
			TESTABILITY_GETTER
		]
	},
	{
		provide: Testability,
		useClass: Testability,
		deps: [
			NgZone,
			TestabilityRegistry,
			TESTABILITY_GETTER
		]
	}
];
var BROWSER_MODULE_PROVIDERS = [
	{
		provide: INJECTOR_SCOPE,
		useValue: "root"
	},
	{
		provide: ErrorHandler,
		useFactory: errorHandler
	},
	{
		provide: EVENT_MANAGER_PLUGINS,
		useClass: DomEventsPlugin,
		multi: true
	},
	{
		provide: EVENT_MANAGER_PLUGINS,
		useClass: KeyEventsPlugin,
		multi: true
	},
	DomRendererFactory2,
	{
		provide: SHARED_STYLES_HOST,
		useClass: SharedStylesHost
	},
	{
		provide: SharedStylesHost,
		useExisting: SHARED_STYLES_HOST
	},
	EventManager,
	{
		provide: RendererFactory2,
		useExisting: DomRendererFactory2
	},
	typeof ngDevMode === "undefined" || ngDevMode ? {
		provide: BROWSER_MODULE_PROVIDERS_MARKER,
		useValue: true
	} : []
];
var BrowserModule = class {
	constructor() {
		if (typeof ngDevMode === "undefined" || ngDevMode) {
			if (inject(BROWSER_MODULE_PROVIDERS_MARKER, {
				optional: true,
				skipSelf: true
			})) throw new RuntimeError(5100, "Providers from the `BrowserModule` have already been loaded. If you need access to common directives such as NgIf and NgFor, import the `CommonModule` instead.");
		}
	}
};
_BrowserModule = BrowserModule;
_defineProperty(BrowserModule, "ɵfac", function BrowserModule_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _BrowserModule)();
});
_defineProperty(BrowserModule, "ɵmod", /* @__PURE__ */ ɵɵdefineNgModule({
	type: _BrowserModule,
	exports: [CommonModule, ApplicationModule]
}));
_defineProperty(BrowserModule, "ɵinj", /* @__PURE__ */ ɵɵdefineInjector({
	providers: [...BROWSER_MODULE_PROVIDERS, ...TESTABILITY_PROVIDERS],
	imports: [CommonModule, ApplicationModule]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrowserModule, [{
		type: NgModule,
		args: [{
			providers: [...BROWSER_MODULE_PROVIDERS, ...TESTABILITY_PROVIDERS],
			exports: [CommonModule, ApplicationModule]
		}]
	}], () => [], null);
})();
//#endregion
//#region node_modules/@angular/common/fesm2022/_module-chunk.mjs
/**
* @license Angular v22.1.5
* (c) 2010-2026 Google LLC. https://angular.dev/
* License: MIT
*/
var _FetchBackend;
var _HttpXsrfCookieExtractor;
var _HttpXsrfTokenExtractor;
var _HttpXsrfInterceptor;
var _HttpBackend;
var _HttpInterceptorHandler;
var _HttpHandler;
var _HttpClient;
var _JsonpClientBackend;
var _JsonpInterceptor;
var _HttpXhrBackend;
var _HttpClientXsrfModule;
var _HttpClientModule;
var _HttpClientJsonpModule;
var HttpHeaders = class HttpHeaders {
	constructor(headers) {
		_defineProperty(this, "headers", void 0);
		_defineProperty(this, "normalizedNames", /* @__PURE__ */ new Map());
		_defineProperty(this, "lazyInit", void 0);
		_defineProperty(this, "lazyUpdate", null);
		if (!headers) this.headers = /* @__PURE__ */ new Map();
		else if (typeof headers === "string") this.lazyInit = () => {
			this.headers = /* @__PURE__ */ new Map();
			headers.split("\n").forEach((line) => {
				const index = line.indexOf(":");
				if (index > 0) {
					const name = line.slice(0, index);
					const value = line.slice(index + 1).trim();
					this.addHeaderEntry(name, value);
				}
			});
		};
		else if (typeof Headers !== "undefined" && headers instanceof Headers) {
			this.headers = /* @__PURE__ */ new Map();
			headers.forEach((value, name) => {
				this.addHeaderEntry(name, value);
			});
		} else this.lazyInit = () => {
			if (typeof ngDevMode === "undefined" || ngDevMode) assertValidHeaders(headers);
			this.headers = /* @__PURE__ */ new Map();
			Object.entries(headers).forEach(([name, values]) => {
				this.setHeaderEntries(name, values);
			});
		};
	}
	has(name) {
		this.init();
		return this.headers.has(name.toLowerCase());
	}
	get(name) {
		this.init();
		const values = this.headers.get(name.toLowerCase());
		return values && values.length > 0 ? values[0] : null;
	}
	keys() {
		this.init();
		return Array.from(this.normalizedNames.values());
	}
	getAll(name) {
		this.init();
		return this.headers.get(name.toLowerCase()) || null;
	}
	append(name, value) {
		return this.clone({
			name,
			value,
			op: "a"
		});
	}
	set(name, value) {
		return this.clone({
			name,
			value,
			op: "s"
		});
	}
	delete(name, value) {
		return this.clone({
			name,
			value,
			op: "d"
		});
	}
	maybeSetNormalizedName(name, lcName) {
		if (!this.normalizedNames.has(lcName)) this.normalizedNames.set(lcName, name);
	}
	init() {
		if (!!this.lazyInit) {
			if (this.lazyInit instanceof HttpHeaders) this.copyFrom(this.lazyInit);
			else this.lazyInit();
			this.lazyInit = null;
			if (!!this.lazyUpdate) {
				this.lazyUpdate.forEach((update) => this.applyUpdate(update));
				this.lazyUpdate = null;
			}
		}
	}
	copyFrom(other) {
		other.init();
		for (const [key, values] of other.headers.entries()) {
			this.headers.set(key, values);
			this.normalizedNames.set(key, other.normalizedNames.get(key));
		}
	}
	clone(update) {
		const clone = new HttpHeaders();
		clone.lazyInit = !!this.lazyInit && this.lazyInit instanceof HttpHeaders ? this.lazyInit : this;
		clone.lazyUpdate = (this.lazyUpdate || []).concat([update]);
		return clone;
	}
	applyUpdate(update) {
		const key = update.name.toLowerCase();
		switch (update.op) {
			case "a":
			case "s":
				let value = update.value;
				if (typeof value === "string") value = [value];
				if (value.length === 0) return;
				this.maybeSetNormalizedName(update.name, key);
				const base = update.op === "a" ? (this.headers.get(key) || []).slice() : [];
				base.push(...value);
				this.headers.set(key, base);
				break;
			case "d":
				const toDelete = update.value;
				if (toDelete === void 0) {
					this.headers.delete(key);
					this.normalizedNames.delete(key);
				} else {
					const valuesToDelete = Array.isArray(toDelete) ? toDelete : [toDelete];
					let existing = this.headers.get(key);
					if (!existing) return;
					existing = existing.filter((value) => valuesToDelete.indexOf(value) === -1);
					if (existing.length === 0) {
						this.headers.delete(key);
						this.normalizedNames.delete(key);
					} else this.headers.set(key, existing);
				}
				break;
		}
	}
	addHeaderEntry(name, value) {
		const key = name.toLowerCase();
		this.maybeSetNormalizedName(name, key);
		if (this.headers.has(key)) this.headers.get(key).push(value);
		else this.headers.set(key, [value]);
	}
	setHeaderEntries(name, values) {
		const headerValues = (Array.isArray(values) ? values : [values]).map((value) => value.toString());
		const key = name.toLowerCase();
		this.headers.set(key, headerValues);
		this.maybeSetNormalizedName(name, key);
	}
	forEach(fn) {
		this.init();
		Array.from(this.normalizedNames.keys()).forEach((key) => fn(this.normalizedNames.get(key), this.headers.get(key)));
	}
};
function assertValidHeaders(headers) {
	for (const [key, value] of Object.entries(headers)) if (!(typeof value === "string" || typeof value === "number") && !Array.isArray(value)) throw new Error(`Unexpected value of the \`${key}\` header provided. Expecting either a string, a number or an array, but got: \`${value}\`.`);
}
var HttpContext = class {
	constructor() {
		_defineProperty(this, "map", /* @__PURE__ */ new Map());
	}
	set(token, value) {
		this.map.set(token, value);
		return this;
	}
	get(token) {
		if (!this.map.has(token)) this.map.set(token, token.defaultValue());
		return this.map.get(token);
	}
	delete(token) {
		this.map.delete(token);
		return this;
	}
	has(token) {
		return this.map.has(token);
	}
	keys() {
		return this.map.keys();
	}
};
var HttpUrlEncodingCodec = class {
	encodeKey(key) {
		return standardEncoding(key);
	}
	encodeValue(value) {
		return standardEncoding(value);
	}
	decodeKey(key) {
		return decodeURIComponent(key);
	}
	decodeValue(value) {
		return decodeURIComponent(value);
	}
};
function paramParser(rawParams, codec) {
	const map = /* @__PURE__ */ new Map();
	if (rawParams.length > 0) rawParams.replace(/^\?/, "").split("&").forEach((param) => {
		const eqIdx = param.indexOf("=");
		const [key, val] = eqIdx == -1 ? [codec.decodeKey(param), ""] : [codec.decodeKey(param.slice(0, eqIdx)), codec.decodeValue(param.slice(eqIdx + 1))];
		const list = map.get(key) || [];
		list.push(val);
		map.set(key, list);
	});
	return map;
}
var STANDARD_ENCODING_REGEX = /%(\d[a-f0-9])/gi;
var STANDARD_ENCODING_REPLACEMENTS = {
	"40": "@",
	"3A": ":",
	"24": "$",
	"2C": ",",
	"3B": ";",
	"3D": "=",
	"3F": "?",
	"2F": "/"
};
function standardEncoding(v) {
	return encodeURIComponent(v).replace(STANDARD_ENCODING_REGEX, (s, t) => STANDARD_ENCODING_REPLACEMENTS[t] ?? s);
}
function valueToString(value) {
	return `${value}`;
}
var HttpParams = class HttpParams {
	constructor(options = {}) {
		_defineProperty(this, "map", void 0);
		_defineProperty(this, "encoder", void 0);
		_defineProperty(this, "updates", null);
		_defineProperty(this, "cloneFrom", null);
		this.encoder = options.encoder || new HttpUrlEncodingCodec();
		if (options.fromString) {
			if (options.fromObject) throw new RuntimeError(2805, ngDevMode && "Cannot specify both fromString and fromObject.");
			this.map = paramParser(options.fromString, this.encoder);
		} else if (!!options.fromObject) {
			this.map = /* @__PURE__ */ new Map();
			Object.keys(options.fromObject).forEach((key) => {
				const value = options.fromObject[key];
				const values = Array.isArray(value) ? value.map(valueToString) : [valueToString(value)];
				this.map.set(key, values);
			});
		} else this.map = null;
	}
	has(param) {
		this.init();
		return this.map.has(param);
	}
	get(param) {
		this.init();
		const res = this.map.get(param);
		return !!res ? res[0] : null;
	}
	getAll(param) {
		this.init();
		return this.map.get(param) || null;
	}
	keys() {
		this.init();
		return Array.from(this.map.keys());
	}
	append(param, value) {
		return this.clone({
			param,
			value,
			op: "a"
		});
	}
	appendAll(params) {
		const updates = [];
		Object.keys(params).forEach((param) => {
			const value = params[param];
			if (Array.isArray(value)) value.forEach((_value) => {
				updates.push({
					param,
					value: _value,
					op: "a"
				});
			});
			else updates.push({
				param,
				value,
				op: "a"
			});
		});
		return this.clone(updates);
	}
	set(param, value) {
		return this.clone({
			param,
			value,
			op: "s"
		});
	}
	delete(param, value) {
		return this.clone({
			param,
			value,
			op: "d"
		});
	}
	toString() {
		this.init();
		return this.keys().map((key) => {
			const eKey = this.encoder.encodeKey(key);
			return this.map.get(key).map((value) => eKey + "=" + this.encoder.encodeValue(value)).join("&");
		}).filter((param) => param !== "").join("&");
	}
	clone(update) {
		const clone = new HttpParams({ encoder: this.encoder });
		clone.cloneFrom = this.cloneFrom || this;
		clone.updates = (this.updates || []).concat(update);
		return clone;
	}
	init() {
		if (this.map === null) this.map = /* @__PURE__ */ new Map();
		if (this.cloneFrom !== null) {
			this.cloneFrom.init();
			for (const [key, values] of this.cloneFrom.map.entries()) this.map.set(key, values);
			this.updates.forEach((update) => {
				switch (update.op) {
					case "a":
					case "s":
						const base = update.op === "a" ? (this.map.get(update.param) || []).slice() : [];
						base.push(valueToString(update.value));
						this.map.set(update.param, base);
						break;
					case "d": if (update.value !== void 0) {
						const base = (this.map.get(update.param) || []).slice();
						const idx = base.indexOf(valueToString(update.value));
						if (idx !== -1) base.splice(idx, 1);
						if (base.length > 0) this.map.set(update.param, base);
						else this.map.delete(update.param);
					} else {
						this.map.delete(update.param);
						break;
					}
				}
			});
			this.cloneFrom = this.updates = null;
		}
	}
};
function mightHaveBody(method) {
	switch (method) {
		case "DELETE":
		case "GET":
		case "HEAD":
		case "OPTIONS":
		case "JSONP": return false;
		default: return true;
	}
}
function isArrayBuffer(value) {
	return typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer;
}
function isBlob(value) {
	return typeof Blob !== "undefined" && value instanceof Blob;
}
function isFormData(value) {
	return typeof FormData !== "undefined" && value instanceof FormData;
}
function isUrlSearchParams(value) {
	return typeof URLSearchParams !== "undefined" && value instanceof URLSearchParams;
}
var CONTENT_TYPE_HEADER = "Content-Type";
var ACCEPT_HEADER = "Accept";
var TEXT_CONTENT_TYPE = "text/plain";
var JSON_CONTENT_TYPE = "application/json";
var ACCEPT_HEADER_VALUE = `${JSON_CONTENT_TYPE}, ${TEXT_CONTENT_TYPE}, */*`;
var HttpRequest = class HttpRequest {
	constructor(method, url, third, fourth) {
		_defineProperty(this, "url", void 0);
		_defineProperty(this, "body", null);
		_defineProperty(this, "headers", void 0);
		_defineProperty(this, "context", void 0);
		_defineProperty(this, "reportProgress", false);
		_defineProperty(this, "reportUploadProgress", false);
		_defineProperty(this, "reportDownloadProgress", false);
		_defineProperty(this, "withCredentials", false);
		_defineProperty(this, "credentials", void 0);
		_defineProperty(this, "keepalive", false);
		_defineProperty(this, "cache", void 0);
		_defineProperty(this, "priority", void 0);
		_defineProperty(this, "mode", void 0);
		_defineProperty(this, "redirect", void 0);
		_defineProperty(this, "referrer", void 0);
		_defineProperty(this, "integrity", void 0);
		_defineProperty(this, "referrerPolicy", void 0);
		_defineProperty(this, "responseType", "json");
		_defineProperty(this, "method", void 0);
		_defineProperty(this, "params", void 0);
		_defineProperty(this, "urlWithParams", void 0);
		_defineProperty(this, "transferCache", void 0);
		_defineProperty(this, "timeout", void 0);
		this.url = url;
		this.method = method.toUpperCase();
		let options;
		if (mightHaveBody(this.method) || !!fourth) {
			this.body = third !== void 0 ? third : null;
			options = fourth;
		} else options = third;
		if (options) {
			this.reportProgress = !!options.reportProgress;
			this.reportUploadProgress = !!options.reportUploadProgress;
			this.reportDownloadProgress = !!options.reportDownloadProgress;
			this.withCredentials = !!options.withCredentials;
			this.keepalive = !!options.keepalive;
			if (!!options.responseType) this.responseType = options.responseType;
			if (options.headers) this.headers = options.headers;
			if (options.context) this.context = options.context;
			if (options.params) this.params = options.params;
			if (options.priority) this.priority = options.priority;
			if (options.cache) this.cache = options.cache;
			if (options.credentials) this.credentials = options.credentials;
			if (typeof options.timeout === "number") {
				if (options.timeout < 1 || !Number.isInteger(options.timeout)) throw new RuntimeError(2822, ngDevMode ? "`timeout` must be a positive integer value" : "");
				this.timeout = options.timeout;
			}
			if (options.mode) this.mode = options.mode;
			if (options.redirect) this.redirect = options.redirect;
			if (options.integrity) this.integrity = options.integrity;
			if (options.referrer !== void 0) this.referrer = options.referrer;
			if (options.referrerPolicy) this.referrerPolicy = options.referrerPolicy;
			this.transferCache = options.transferCache;
		}
		this.headers ??= new HttpHeaders();
		this.context ??= new HttpContext();
		if (!this.params) {
			this.params = new HttpParams();
			this.urlWithParams = url;
		} else {
			const params = this.params.toString();
			if (params.length === 0) this.urlWithParams = url;
			else {
				let urlWithoutFragment = url;
				let fragment = "";
				const hashIdx = url.indexOf("#");
				if (hashIdx !== -1) {
					fragment = url.substring(hashIdx);
					urlWithoutFragment = url.substring(0, hashIdx);
				}
				const qIdx = urlWithoutFragment.indexOf("?");
				const sep = qIdx === -1 ? "?" : qIdx < urlWithoutFragment.length - 1 ? "&" : "";
				this.urlWithParams = urlWithoutFragment + sep + params + fragment;
			}
		}
	}
	serializeBody() {
		if (this.body === null) return null;
		if (typeof this.body === "string" || isArrayBuffer(this.body) || isBlob(this.body) || isFormData(this.body) || isUrlSearchParams(this.body)) return this.body;
		if (this.body instanceof HttpParams) return this.body.toString();
		if (typeof this.body === "object" || typeof this.body === "boolean" || Array.isArray(this.body)) return JSON.stringify(this.body);
		return this.body.toString();
	}
	detectContentTypeHeader() {
		if (this.body === null) return null;
		if (isFormData(this.body)) return null;
		if (isBlob(this.body)) return this.body.type || null;
		if (isArrayBuffer(this.body)) return null;
		if (typeof this.body === "string") return TEXT_CONTENT_TYPE;
		if (this.body instanceof HttpParams) return "application/x-www-form-urlencoded;charset=UTF-8";
		if (typeof this.body === "object" || typeof this.body === "number" || typeof this.body === "boolean") return JSON_CONTENT_TYPE;
		return null;
	}
	clone(update = {}) {
		const method = update.method || this.method;
		const url = update.url || this.url;
		const responseType = update.responseType || this.responseType;
		const keepalive = update.keepalive ?? this.keepalive;
		const priority = update.priority || this.priority;
		const cache = update.cache || this.cache;
		const mode = update.mode || this.mode;
		const redirect = update.redirect || this.redirect;
		const credentials = update.credentials || this.credentials;
		const referrer = update.referrer ?? this.referrer;
		const integrity = update.integrity || this.integrity;
		const referrerPolicy = update.referrerPolicy || this.referrerPolicy;
		const transferCache = update.transferCache ?? this.transferCache;
		const timeout = update.timeout ?? this.timeout;
		const body = update.body !== void 0 ? update.body : this.body;
		const withCredentials = update.withCredentials ?? this.withCredentials;
		const reportProgress = update.reportProgress ?? this.reportProgress;
		const reportUploadProgress = update.reportUploadProgress ?? this.reportUploadProgress;
		const reportDownloadProgress = update.reportDownloadProgress ?? this.reportDownloadProgress;
		let headers = update.headers || this.headers;
		let params = update.params || this.params;
		const context = update.context ?? this.context;
		if (update.setHeaders !== void 0) headers = Object.keys(update.setHeaders).reduce((headers, name) => headers.set(name, update.setHeaders[name]), headers);
		if (update.setParams) params = Object.keys(update.setParams).reduce((params, param) => params.set(param, update.setParams[param]), params);
		return new HttpRequest(method, url, body, {
			params,
			headers,
			context,
			reportProgress,
			reportUploadProgress,
			reportDownloadProgress,
			responseType,
			withCredentials,
			transferCache,
			keepalive,
			cache,
			priority,
			timeout,
			mode,
			redirect,
			credentials,
			referrer,
			integrity,
			referrerPolicy
		});
	}
};
var HttpEventType;
(function(HttpEventType) {
	HttpEventType[HttpEventType["Sent"] = 0] = "Sent";
	HttpEventType[HttpEventType["UploadProgress"] = 1] = "UploadProgress";
	HttpEventType[HttpEventType["ResponseHeader"] = 2] = "ResponseHeader";
	HttpEventType[HttpEventType["DownloadProgress"] = 3] = "DownloadProgress";
	HttpEventType[HttpEventType["Response"] = 4] = "Response";
	HttpEventType[HttpEventType["User"] = 5] = "User";
})(HttpEventType || (HttpEventType = {}));
var HttpResponseBase = class {
	constructor(init, defaultStatus = 200, defaultStatusText = "OK") {
		_defineProperty(this, "headers", void 0);
		_defineProperty(this, "status", void 0);
		_defineProperty(this, "statusText", void 0);
		_defineProperty(this, "url", void 0);
		_defineProperty(this, "ok", void 0);
		_defineProperty(this, "type", void 0);
		_defineProperty(this, "redirected", void 0);
		_defineProperty(this, "responseType", void 0);
		this.headers = init.headers || new HttpHeaders();
		this.status = init.status !== void 0 ? init.status : defaultStatus;
		this.statusText = init.statusText || defaultStatusText;
		this.url = init.url || null;
		this.redirected = init.redirected;
		this.responseType = init.responseType;
		this.ok = this.status >= 200 && this.status < 300;
	}
};
var HttpHeaderResponse = class HttpHeaderResponse extends HttpResponseBase {
	constructor(init = {}) {
		super(init);
		_defineProperty(this, "type", HttpEventType.ResponseHeader);
	}
	clone(update = {}) {
		return new HttpHeaderResponse({
			headers: update.headers || this.headers,
			status: update.status !== void 0 ? update.status : this.status,
			statusText: update.statusText || this.statusText,
			url: update.url || this.url || void 0
		});
	}
};
var HttpResponse = class HttpResponse extends HttpResponseBase {
	constructor(init = {}) {
		super(init);
		_defineProperty(this, "body", void 0);
		_defineProperty(this, "type", HttpEventType.Response);
		this.body = init.body !== void 0 ? init.body : null;
	}
	clone(update = {}) {
		return new HttpResponse({
			body: update.body !== void 0 ? update.body : this.body,
			headers: update.headers || this.headers,
			status: update.status !== void 0 ? update.status : this.status,
			statusText: update.statusText || this.statusText,
			url: update.url || this.url || void 0,
			redirected: update.redirected ?? this.redirected,
			responseType: update.responseType ?? this.responseType
		});
	}
};
var HttpErrorResponse = class extends HttpResponseBase {
	constructor(init) {
		super(init, 0, "Unknown Error");
		_defineProperty(this, "name", "HttpErrorResponse");
		_defineProperty(this, "message", void 0);
		_defineProperty(this, "error", void 0);
		_defineProperty(this, "ok", false);
		if (this.status >= 200 && this.status < 300) this.message = `Http failure during parsing for ${init.url || "(unknown url)"}`;
		else this.message = `Http failure response for ${init.url || "(unknown url)"}: ${init.status} ${init.statusText}`;
		this.error = init.error || null;
	}
};
var HTTP_STATUS_CODE_OK = 200;
var HTTP_STATUS_CODE_NO_CONTENT = 204;
var HttpStatusCode;
(function(HttpStatusCode) {
	HttpStatusCode[HttpStatusCode["Continue"] = 100] = "Continue";
	HttpStatusCode[HttpStatusCode["SwitchingProtocols"] = 101] = "SwitchingProtocols";
	HttpStatusCode[HttpStatusCode["Processing"] = 102] = "Processing";
	HttpStatusCode[HttpStatusCode["EarlyHints"] = 103] = "EarlyHints";
	HttpStatusCode[HttpStatusCode["Ok"] = 200] = "Ok";
	HttpStatusCode[HttpStatusCode["Created"] = 201] = "Created";
	HttpStatusCode[HttpStatusCode["Accepted"] = 202] = "Accepted";
	HttpStatusCode[HttpStatusCode["NonAuthoritativeInformation"] = 203] = "NonAuthoritativeInformation";
	HttpStatusCode[HttpStatusCode["NoContent"] = 204] = "NoContent";
	HttpStatusCode[HttpStatusCode["ResetContent"] = 205] = "ResetContent";
	HttpStatusCode[HttpStatusCode["PartialContent"] = 206] = "PartialContent";
	HttpStatusCode[HttpStatusCode["MultiStatus"] = 207] = "MultiStatus";
	HttpStatusCode[HttpStatusCode["AlreadyReported"] = 208] = "AlreadyReported";
	HttpStatusCode[HttpStatusCode["ImUsed"] = 226] = "ImUsed";
	HttpStatusCode[HttpStatusCode["MultipleChoices"] = 300] = "MultipleChoices";
	HttpStatusCode[HttpStatusCode["MovedPermanently"] = 301] = "MovedPermanently";
	HttpStatusCode[HttpStatusCode["Found"] = 302] = "Found";
	HttpStatusCode[HttpStatusCode["SeeOther"] = 303] = "SeeOther";
	HttpStatusCode[HttpStatusCode["NotModified"] = 304] = "NotModified";
	HttpStatusCode[HttpStatusCode["UseProxy"] = 305] = "UseProxy";
	HttpStatusCode[HttpStatusCode["Unused"] = 306] = "Unused";
	HttpStatusCode[HttpStatusCode["TemporaryRedirect"] = 307] = "TemporaryRedirect";
	HttpStatusCode[HttpStatusCode["PermanentRedirect"] = 308] = "PermanentRedirect";
	HttpStatusCode[HttpStatusCode["BadRequest"] = 400] = "BadRequest";
	HttpStatusCode[HttpStatusCode["Unauthorized"] = 401] = "Unauthorized";
	HttpStatusCode[HttpStatusCode["PaymentRequired"] = 402] = "PaymentRequired";
	HttpStatusCode[HttpStatusCode["Forbidden"] = 403] = "Forbidden";
	HttpStatusCode[HttpStatusCode["NotFound"] = 404] = "NotFound";
	HttpStatusCode[HttpStatusCode["MethodNotAllowed"] = 405] = "MethodNotAllowed";
	HttpStatusCode[HttpStatusCode["NotAcceptable"] = 406] = "NotAcceptable";
	HttpStatusCode[HttpStatusCode["ProxyAuthenticationRequired"] = 407] = "ProxyAuthenticationRequired";
	HttpStatusCode[HttpStatusCode["RequestTimeout"] = 408] = "RequestTimeout";
	HttpStatusCode[HttpStatusCode["Conflict"] = 409] = "Conflict";
	HttpStatusCode[HttpStatusCode["Gone"] = 410] = "Gone";
	HttpStatusCode[HttpStatusCode["LengthRequired"] = 411] = "LengthRequired";
	HttpStatusCode[HttpStatusCode["PreconditionFailed"] = 412] = "PreconditionFailed";
	HttpStatusCode[HttpStatusCode["PayloadTooLarge"] = 413] = "PayloadTooLarge";
	HttpStatusCode[HttpStatusCode["UriTooLong"] = 414] = "UriTooLong";
	HttpStatusCode[HttpStatusCode["UnsupportedMediaType"] = 415] = "UnsupportedMediaType";
	HttpStatusCode[HttpStatusCode["RangeNotSatisfiable"] = 416] = "RangeNotSatisfiable";
	HttpStatusCode[HttpStatusCode["ExpectationFailed"] = 417] = "ExpectationFailed";
	HttpStatusCode[HttpStatusCode["ImATeapot"] = 418] = "ImATeapot";
	HttpStatusCode[HttpStatusCode["MisdirectedRequest"] = 421] = "MisdirectedRequest";
	HttpStatusCode[HttpStatusCode["UnprocessableEntity"] = 422] = "UnprocessableEntity";
	HttpStatusCode[HttpStatusCode["Locked"] = 423] = "Locked";
	HttpStatusCode[HttpStatusCode["FailedDependency"] = 424] = "FailedDependency";
	HttpStatusCode[HttpStatusCode["TooEarly"] = 425] = "TooEarly";
	HttpStatusCode[HttpStatusCode["UpgradeRequired"] = 426] = "UpgradeRequired";
	HttpStatusCode[HttpStatusCode["PreconditionRequired"] = 428] = "PreconditionRequired";
	HttpStatusCode[HttpStatusCode["TooManyRequests"] = 429] = "TooManyRequests";
	HttpStatusCode[HttpStatusCode["RequestHeaderFieldsTooLarge"] = 431] = "RequestHeaderFieldsTooLarge";
	HttpStatusCode[HttpStatusCode["UnavailableForLegalReasons"] = 451] = "UnavailableForLegalReasons";
	HttpStatusCode[HttpStatusCode["InternalServerError"] = 500] = "InternalServerError";
	HttpStatusCode[HttpStatusCode["NotImplemented"] = 501] = "NotImplemented";
	HttpStatusCode[HttpStatusCode["BadGateway"] = 502] = "BadGateway";
	HttpStatusCode[HttpStatusCode["ServiceUnavailable"] = 503] = "ServiceUnavailable";
	HttpStatusCode[HttpStatusCode["GatewayTimeout"] = 504] = "GatewayTimeout";
	HttpStatusCode[HttpStatusCode["HttpVersionNotSupported"] = 505] = "HttpVersionNotSupported";
	HttpStatusCode[HttpStatusCode["VariantAlsoNegotiates"] = 506] = "VariantAlsoNegotiates";
	HttpStatusCode[HttpStatusCode["InsufficientStorage"] = 507] = "InsufficientStorage";
	HttpStatusCode[HttpStatusCode["LoopDetected"] = 508] = "LoopDetected";
	HttpStatusCode[HttpStatusCode["NotExtended"] = 510] = "NotExtended";
	HttpStatusCode[HttpStatusCode["NetworkAuthenticationRequired"] = 511] = "NetworkAuthenticationRequired";
})(HttpStatusCode || (HttpStatusCode = {}));
var XSSI_PREFIX$1 = /^\)\]\}',?\n/;
var HTTP_FETCH_MAX_RESPONSE_SIZE = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "HTTP_FETCH_MAX_RESPONSE_SIZE" : "", { factory: () => null });
var FetchBackend = class {
	constructor() {
		_defineProperty(this, "fetchImpl", inject(FetchFactory, { optional: true })?.fetch ?? ((...args) => globalThis.fetch(...args)));
		_defineProperty(this, "ngZone", inject(NgZone));
		_defineProperty(this, "destroyRef", inject(DestroyRef));
		_defineProperty(this, "maxResponseSize", inject(HTTP_FETCH_MAX_RESPONSE_SIZE));
	}
	handle(request) {
		return new Observable((observer) => {
			const aborter = new AbortController();
			let done = false;
			const wrappedObserver = {
				next: (val) => {
					if (val.type === HttpEventType.Response) done = true;
					observer.next(val);
				},
				error: (err) => {
					done = true;
					observer.error(err);
				},
				complete: () => {
					done = true;
					observer.complete();
				}
			};
			this.doRequest(request, aborter.signal, wrappedObserver).then(noop, (error) => wrappedObserver.error(new HttpErrorResponse({ error })));
			let timeoutId;
			if (request.timeout) timeoutId = this.ngZone.runOutsideAngular(() => setTimeout(() => {
				if (!aborter.signal.aborted) aborter.abort(new DOMException("signal timed out", "TimeoutError"));
			}, request.timeout));
			return () => {
				if (timeoutId !== void 0) clearTimeout(timeoutId);
				if (!done && !aborter.signal.aborted) aborter.abort();
			};
		});
	}
	async doRequest(request, signal, observer) {
		const init = this.createRequestInit(request);
		let response;
		try {
			const fetchPromise = this.ngZone.runOutsideAngular(() => this.fetchImpl(request.urlWithParams, {
				signal,
				...init
			}));
			silenceSuperfluousUnhandledPromiseRejection(fetchPromise);
			observer.next({ type: HttpEventType.Sent });
			response = await fetchPromise;
		} catch (error) {
			observer.error(new HttpErrorResponse({
				error,
				status: error.status ?? 0,
				statusText: error.statusText,
				url: request.urlWithParams,
				headers: error.headers
			}));
			return;
		}
		const headers = new HttpHeaders(response.headers);
		const statusText = response.statusText;
		const url = response.url || request.urlWithParams;
		let status = response.status;
		let body = null;
		const reportDownloadProgress = request.reportProgress || request.reportDownloadProgress;
		if (reportDownloadProgress) observer.next(new HttpHeaderResponse({
			headers,
			status,
			statusText,
			url
		}));
		if (response.body) {
			const contentType = response.headers.get(CONTENT_TYPE_HEADER) ?? "";
			const contentLength = response.headers.get("content-length");
			const contentLengthValue = contentLength !== null ? Number(contentLength) : NaN;
			if (this.maxResponseSize !== null && Number.isFinite(contentLengthValue) && contentLengthValue > this.maxResponseSize) {
				await response.body.cancel();
				throwBodyTooLargeError(this.maxResponseSize);
			}
			const chunks = [];
			const reader = response.body.getReader();
			let receivedLength = 0;
			let decoder;
			let partialText;
			const reqZone = typeof Zone !== "undefined" && Zone.current;
			let canceled = false;
			await this.ngZone.runOutsideAngular(async () => {
				while (true) {
					if (this.destroyRef.destroyed) {
						await reader.cancel();
						canceled = true;
						break;
					}
					const { done, value } = await reader.read();
					if (done) break;
					chunks.push(value);
					receivedLength += value.length;
					if (this.maxResponseSize !== null && receivedLength > this.maxResponseSize) {
						await reader.cancel();
						throwBodyTooLargeError(this.maxResponseSize);
					}
					if (reportDownloadProgress) {
						partialText = request.responseType === "text" ? (partialText ?? "") + (decoder ??= getTextDecoder(contentType)).decode(value, { stream: true }) : void 0;
						const reportProgress = () => observer.next({
							type: HttpEventType.DownloadProgress,
							total: Number.isFinite(contentLengthValue) ? contentLengthValue : void 0,
							loaded: receivedLength,
							partialText
						});
						reqZone ? reqZone.run(reportProgress) : reportProgress();
					}
				}
			});
			if (canceled) {
				observer.complete();
				return;
			}
			const chunksAll = this.concatChunks(chunks, receivedLength);
			try {
				body = this.parseBody(request, chunksAll, contentType, status);
			} catch (error) {
				observer.error(new HttpErrorResponse({
					error,
					headers: new HttpHeaders(response.headers),
					status: response.status,
					statusText: response.statusText,
					url: response.url || request.urlWithParams
				}));
				return;
			}
		}
		if (status === 0) status = body ? HTTP_STATUS_CODE_OK : 0;
		const ok = status >= 200 && status < 300;
		const redirected = response.redirected;
		const responseType = response.type;
		if (ok) {
			observer.next(new HttpResponse({
				body,
				headers,
				status,
				statusText,
				url,
				redirected,
				responseType
			}));
			observer.complete();
		} else observer.error(new HttpErrorResponse({
			error: body,
			headers,
			status,
			statusText,
			url,
			redirected,
			responseType
		}));
	}
	parseBody(request, binContent, contentType, status) {
		switch (request.responseType) {
			case "json":
				const text = new TextDecoder().decode(binContent).replace(XSSI_PREFIX$1, "");
				if (text === "") return null;
				try {
					return JSON.parse(text);
				} catch (e) {
					if (status < 200 || status >= 300) return text;
					throw e;
				}
			case "text": return getTextDecoder(contentType).decode(binContent);
			case "blob": return new Blob([binContent], { type: contentType });
			case "arraybuffer": return binContent.buffer;
		}
	}
	createRequestInit(req) {
		if (req.reportUploadProgress) throw new RuntimeError(2824, ngDevMode && "The FetchBackend does not support upload progress reporting. Please use `withXhr()` on your `provideHttpClient()` configuration if you want to report upload progress.");
		const headers = {};
		let credentials;
		credentials = req.credentials;
		if (req.withCredentials) {
			(typeof ngDevMode === "undefined" || ngDevMode) && warningOptionsMessage(req);
			credentials = "include";
		}
		req.headers.forEach((name, values) => headers[name] = values.join(","));
		if (!req.headers.has(ACCEPT_HEADER)) headers[ACCEPT_HEADER] = ACCEPT_HEADER_VALUE;
		if (!req.headers.has(CONTENT_TYPE_HEADER)) {
			const detectedType = req.detectContentTypeHeader();
			if (detectedType !== null) headers[CONTENT_TYPE_HEADER] = detectedType;
		}
		return {
			body: req.serializeBody(),
			method: req.method,
			headers,
			credentials,
			keepalive: req.keepalive,
			cache: req.cache,
			priority: req.priority,
			mode: req.mode,
			redirect: req.redirect,
			referrer: req.referrer,
			integrity: req.integrity,
			referrerPolicy: req.referrerPolicy
		};
	}
	concatChunks(chunks, totalLength) {
		const chunksAll = new Uint8Array(totalLength);
		let position = 0;
		for (const chunk of chunks) {
			chunksAll.set(chunk, position);
			position += chunk.length;
		}
		return chunksAll;
	}
};
_FetchBackend = FetchBackend;
_defineProperty(FetchBackend, "ɵfac", function FetchBackend_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _FetchBackend)();
});
_defineProperty(FetchBackend, "ɵprov", /* @__PURE__ */ ɵɵdefineService({
	token: _FetchBackend,
	factory: _FetchBackend.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(FetchBackend, [{ type: Service }], null, null);
})();
var FetchFactory = class {};
function noop() {}
function warningOptionsMessage(req) {
	if (req.credentials && req.withCredentials) console.warn(formatRuntimeError(2819, `Angular detected that a \`HttpClient\` request has both \`withCredentials: true\` and \`credentials: '${req.credentials}'\` options. The \`withCredentials\` option is overriding the explicit \`credentials\` setting to 'include'. Consider removing \`withCredentials\` and using \`credentials: '${req.credentials}'\` directly for clarity.`));
}
function silenceSuperfluousUnhandledPromiseRejection(promise) {
	promise.then(noop, noop);
}
function throwBodyTooLargeError(maxResponseSize) {
	throw new RuntimeError(-2825, ngDevMode && `Fetch response body exceeded the configured buffer limit (${maxResponseSize} bytes).`);
}
var CHARSET_REGEX = /charset=\s*["']?([^;"'\s]+)["']?/i;
function getTextDecoder(contentType) {
	const match = contentType.match(CHARSET_REGEX);
	if (match !== null) try {
		return new TextDecoder(match[1]);
	} catch {}
	return new TextDecoder();
}
var XSRF_ENABLED = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "XSRF_ENABLED" : "", { factory: () => true });
var XSRF_DEFAULT_COOKIE_NAME = "XSRF-TOKEN";
var XSRF_COOKIE_NAME = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "XSRF_COOKIE_NAME" : "", { factory: () => XSRF_DEFAULT_COOKIE_NAME });
var XSRF_DEFAULT_HEADER_NAME = "X-XSRF-TOKEN";
var XSRF_HEADER_NAME = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "XSRF_HEADER_NAME" : "", { factory: () => XSRF_DEFAULT_HEADER_NAME });
var HttpXsrfCookieExtractor = class {
	constructor() {
		_defineProperty(this, "cookieName", inject(XSRF_COOKIE_NAME));
		_defineProperty(this, "doc", inject(DOCUMENT));
		_defineProperty(this, "lastCookieString", "");
		_defineProperty(this, "lastToken", null);
		_defineProperty(this, "parseCount", 0);
	}
	getToken() {
		const cookieString = this.doc.cookie || "";
		if (cookieString !== this.lastCookieString) {
			this.parseCount++;
			this.lastToken = parseCookieValue(cookieString, this.cookieName);
			this.lastCookieString = cookieString;
		}
		return this.lastToken;
	}
};
_HttpXsrfCookieExtractor = HttpXsrfCookieExtractor;
_defineProperty(HttpXsrfCookieExtractor, "ɵfac", function HttpXsrfCookieExtractor_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _HttpXsrfCookieExtractor)();
});
_defineProperty(HttpXsrfCookieExtractor, "ɵprov", /* @__PURE__ */ ɵɵdefineService({
	token: _HttpXsrfCookieExtractor,
	factory: _HttpXsrfCookieExtractor.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HttpXsrfCookieExtractor, [{ type: Service }], null, null);
})();
var HttpXsrfTokenExtractor = class {};
_HttpXsrfTokenExtractor = HttpXsrfTokenExtractor;
_defineProperty(HttpXsrfTokenExtractor, "ɵfac", function HttpXsrfTokenExtractor_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _HttpXsrfTokenExtractor)();
});
_defineProperty(HttpXsrfTokenExtractor, "ɵprov", /* @__PURE__ */ ɵɵdefineInjectable({
	token: _HttpXsrfTokenExtractor,
	factory: function HttpXsrfTokenExtractor_Factory(__ngFactoryType__) {
		let __ngConditionalFactory__ = null;
		if (__ngFactoryType__) __ngConditionalFactory__ = new (__ngFactoryType__ || _HttpXsrfTokenExtractor)();
		else __ngConditionalFactory__ = ɵɵinject(HttpXsrfCookieExtractor);
		return __ngConditionalFactory__;
	},
	providedIn: "root"
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HttpXsrfTokenExtractor, [{
		type: Injectable,
		args: [{
			providedIn: "root",
			useExisting: HttpXsrfCookieExtractor
		}]
	}], null, null);
})();
function xsrfInterceptorFn(req, next) {
	if (!inject(XSRF_ENABLED) || req.method === "GET" || req.method === "HEAD") return next(req);
	try {
		const locationHref = inject(PlatformLocation).href;
		const { origin: locationOrigin } = new URL(locationHref);
		const { origin: requestOrigin } = new URL(req.url, locationOrigin);
		if (locationOrigin !== requestOrigin) return next(req);
	} catch {
		return next(req);
	}
	const token = inject(HttpXsrfTokenExtractor).getToken();
	const headerName = inject(XSRF_HEADER_NAME);
	if (token != null && !req.headers.has(headerName)) req = req.clone({ headers: req.headers.set(headerName, token) });
	return next(req);
}
var HttpXsrfInterceptor = class {
	constructor() {
		_defineProperty(this, "injector", inject(EnvironmentInjector));
	}
	intercept(initialRequest, next) {
		return runInInjectionContext(this.injector, () => xsrfInterceptorFn(initialRequest, (downstreamRequest) => next.handle(downstreamRequest)));
	}
};
_HttpXsrfInterceptor = HttpXsrfInterceptor;
_defineProperty(HttpXsrfInterceptor, "ɵfac", function HttpXsrfInterceptor_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _HttpXsrfInterceptor)();
});
_defineProperty(HttpXsrfInterceptor, "ɵprov", /* @__PURE__ */ ɵɵdefineInjectable({
	token: _HttpXsrfInterceptor,
	factory: _HttpXsrfInterceptor.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HttpXsrfInterceptor, [{ type: Injectable }], null, null);
})();
function interceptorChainEndFn(req, finalHandlerFn) {
	return finalHandlerFn(req);
}
function adaptLegacyInterceptorToChain(chainTailFn, interceptor) {
	return (initialRequest, finalHandlerFn) => interceptor.intercept(initialRequest, { handle: (downstreamRequest) => chainTailFn(downstreamRequest, finalHandlerFn) });
}
function chainedInterceptorFn(chainTailFn, interceptorFn, injector) {
	return (initialRequest, finalHandlerFn) => runInInjectionContext(injector, () => interceptorFn(initialRequest, (downstreamRequest) => chainTailFn(downstreamRequest, finalHandlerFn)));
}
var HTTP_INTERCEPTORS = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "HTTP_INTERCEPTORS" : "");
var HTTP_INTERCEPTOR_FNS = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "HTTP_INTERCEPTOR_FNS" : "", { factory: () => [xsrfInterceptorFn] });
var HTTP_ROOT_INTERCEPTOR_FNS = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "HTTP_ROOT_INTERCEPTOR_FNS" : "");
var REQUESTS_CONTRIBUTE_TO_STABILITY = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "REQUESTS_CONTRIBUTE_TO_STABILITY" : "", { factory: () => true });
function legacyInterceptorFnFactory() {
	let chain = null;
	return (req, handler) => {
		if (chain === null) chain = (inject(HTTP_INTERCEPTORS, { optional: true }) ?? []).reduceRight(adaptLegacyInterceptorToChain, interceptorChainEndFn);
		const pendingTasks = inject(PendingTasks);
		if (inject(REQUESTS_CONTRIBUTE_TO_STABILITY)) {
			const removeTask = pendingTasks.add();
			return chain(req, handler).pipe(finalize(removeTask));
		} else return chain(req, handler);
	};
}
var HttpBackend = class {};
_HttpBackend = HttpBackend;
_defineProperty(HttpBackend, "ɵfac", function HttpBackend_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _HttpBackend)();
});
_defineProperty(HttpBackend, "ɵprov", /* @__PURE__ */ ɵɵdefineInjectable({
	token: _HttpBackend,
	factory: function HttpBackend_Factory(__ngFactoryType__) {
		let __ngConditionalFactory__ = null;
		if (__ngFactoryType__) __ngConditionalFactory__ = new (__ngFactoryType__ || _HttpBackend)();
		else __ngConditionalFactory__ = ɵɵinject(FetchBackend);
		return __ngConditionalFactory__;
	},
	providedIn: "root"
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HttpBackend, [{
		type: Injectable,
		args: [{
			providedIn: "root",
			useExisting: FetchBackend
		}]
	}], null, null);
})();
var HttpInterceptorHandler = class {
	constructor(backend, injector) {
		_defineProperty(this, "backend", void 0);
		_defineProperty(this, "injector", void 0);
		_defineProperty(this, "chain", null);
		_defineProperty(this, "pendingTasks", inject(PendingTasks));
		_defineProperty(this, "contributeToStability", inject(REQUESTS_CONTRIBUTE_TO_STABILITY));
		this.backend = backend;
		this.injector = injector;
		if ((typeof ngDevMode === "undefined" || ngDevMode) && true) this.backend.isTestingBackend;
	}
	handle(initialRequest) {
		if (this.chain === null) {
			const parentHandler = this.injector.get(HttpHandler, null, { skipSelf: true });
			const isDelegating = parentHandler !== null && this.backend === parentHandler;
			const rootInterceptorFns = this.injector.get(HTTP_ROOT_INTERCEPTOR_FNS, [], isDelegating ? { self: true } : void 0);
			const dedupedInterceptorFns = Array.from(/* @__PURE__ */ new Set([...this.injector.get(HTTP_INTERCEPTOR_FNS), ...rootInterceptorFns]));
			this.chain = dedupedInterceptorFns.reduceRight((nextSequencedFn, interceptorFn) => chainedInterceptorFn(nextSequencedFn, interceptorFn, this.injector), interceptorChainEndFn);
		}
		const chain = this.chain;
		if (this.contributeToStability) {
			const removeTask = this.pendingTasks.add();
			return untracked(() => chain(initialRequest, (downstreamRequest) => this.backend.handle(downstreamRequest))).pipe(finalize(removeTask));
		} else return untracked(() => chain(initialRequest, (downstreamRequest) => this.backend.handle(downstreamRequest)));
	}
};
_HttpInterceptorHandler = HttpInterceptorHandler;
_defineProperty(HttpInterceptorHandler, "ɵfac", function HttpInterceptorHandler_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _HttpInterceptorHandler)(ɵɵinject(HttpBackend), ɵɵinject(EnvironmentInjector));
});
_defineProperty(HttpInterceptorHandler, "ɵprov", /* @__PURE__ */ ɵɵdefineInjectable({
	token: _HttpInterceptorHandler,
	factory: _HttpInterceptorHandler.ɵfac,
	providedIn: "root"
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HttpInterceptorHandler, [{
		type: Injectable,
		args: [{ providedIn: "root" }]
	}], () => [{ type: HttpBackend }, { type: EnvironmentInjector }], null);
})();
var HttpHandler = class {};
_HttpHandler = HttpHandler;
_defineProperty(HttpHandler, "ɵfac", function HttpHandler_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _HttpHandler)();
});
_defineProperty(HttpHandler, "ɵprov", /* @__PURE__ */ ɵɵdefineInjectable({
	token: _HttpHandler,
	factory: function HttpHandler_Factory(__ngFactoryType__) {
		let __ngConditionalFactory__ = null;
		if (__ngFactoryType__) __ngConditionalFactory__ = new (__ngFactoryType__ || _HttpHandler)();
		else __ngConditionalFactory__ = ɵɵinject(HttpInterceptorHandler);
		return __ngConditionalFactory__;
	},
	providedIn: "root"
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HttpHandler, [{
		type: Injectable,
		args: [{
			providedIn: "root",
			useExisting: HttpInterceptorHandler
		}]
	}], null, null);
})();
function addBody(options, body) {
	return {
		body,
		...options
	};
}
var HttpClient = class {
	constructor(handler) {
		_defineProperty(this, "handler", void 0);
		this.handler = handler;
	}
	request(first, url, options = {}) {
		let req;
		if (first instanceof HttpRequest) req = first;
		else {
			let headers = void 0;
			if (options.headers instanceof HttpHeaders) headers = options.headers;
			else headers = new HttpHeaders(options.headers);
			let params = void 0;
			if (!!options.params) if (options.params instanceof HttpParams) params = options.params;
			else params = new HttpParams({ fromObject: options.params });
			req = new HttpRequest(first, url, options.body !== void 0 ? options.body : null, {
				headers,
				context: options.context,
				params,
				reportProgress: options.reportProgress,
				reportUploadProgress: options.reportUploadProgress,
				reportDownloadProgress: options.reportDownloadProgress,
				responseType: options.responseType || "json",
				withCredentials: options.withCredentials,
				transferCache: options.transferCache,
				keepalive: options.keepalive,
				priority: options.priority,
				cache: options.cache,
				mode: options.mode,
				redirect: options.redirect,
				credentials: options.credentials,
				referrer: options.referrer,
				referrerPolicy: options.referrerPolicy,
				integrity: options.integrity,
				timeout: options.timeout
			});
		}
		const events$ = of(req).pipe(concatMap((req) => this.handler.handle(req)));
		if (first instanceof HttpRequest || options.observe === "events") return events$;
		const res$ = events$.pipe(filter((event) => event instanceof HttpResponse));
		switch (options.observe || "body") {
			case "body": switch (req.responseType) {
				case "arraybuffer": return res$.pipe(map((res) => {
					if (res.body !== null && !(res.body instanceof ArrayBuffer)) throw new RuntimeError(2806, ngDevMode && "Response is not an ArrayBuffer.");
					return res.body;
				}));
				case "blob": return res$.pipe(map((res) => {
					if (res.body !== null && !(res.body instanceof Blob)) throw new RuntimeError(2807, ngDevMode && "Response is not a Blob.");
					return res.body;
				}));
				case "text": return res$.pipe(map((res) => {
					if (res.body !== null && typeof res.body !== "string") throw new RuntimeError(2808, ngDevMode && "Response is not a string.");
					return res.body;
				}));
				default: return res$.pipe(map((res) => res.body));
			}
			case "response": return res$;
			default: throw new RuntimeError(2809, ngDevMode && `Unreachable: unhandled observe type ${options.observe}}`);
		}
	}
	delete(url, options = {}) {
		return this.request("DELETE", url, options);
	}
	get(url, options = {}) {
		return this.request("GET", url, options);
	}
	head(url, options = {}) {
		return this.request("HEAD", url, options);
	}
	jsonp(url, callbackParam) {
		return this.request("JSONP", url, {
			params: new HttpParams().append(callbackParam, "JSONP_CALLBACK"),
			observe: "body",
			responseType: "json"
		});
	}
	options(url, options = {}) {
		return this.request("OPTIONS", url, options);
	}
	patch(url, body, options = {}) {
		return this.request("PATCH", url, addBody(options, body));
	}
	post(url, body, options = {}) {
		return this.request("POST", url, addBody(options, body));
	}
	put(url, body, options = {}) {
		return this.request("PUT", url, addBody(options, body));
	}
};
_HttpClient = HttpClient;
_defineProperty(HttpClient, "ɵfac", function HttpClient_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _HttpClient)(ɵɵinject(HttpHandler));
});
_defineProperty(HttpClient, "ɵprov", /* @__PURE__ */ ɵɵdefineInjectable({
	token: _HttpClient,
	factory: _HttpClient.ɵfac,
	providedIn: "root"
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HttpClient, [{
		type: Injectable,
		args: [{ providedIn: "root" }]
	}], () => [{ type: HttpHandler }], null);
})();
var nextRequestId = 0;
var foreignDocument;
var JSONP_ERR_NO_CALLBACK = "JSONP injected script did not invoke callback.";
var JSONP_ERR_WRONG_METHOD = "JSONP requests must use JSONP request method.";
var JSONP_ERR_WRONG_RESPONSE_TYPE = "JSONP requests must use Json response type.";
var JSONP_ERR_HEADERS_NOT_SUPPORTED = "JSONP requests do not support headers.";
var JSONP_ERR_UNSAFE_URL = "JSONP requests only support absolute URLs with HTTP(S) protocols.";
var JsonpCallbackContext = class {};
function jsonpCallbackContext() {
	if (typeof window === "object") return window;
	return {};
}
var JsonpClientBackend = class {
	constructor(callbackMap, document) {
		_defineProperty(this, "callbackMap", void 0);
		_defineProperty(this, "document", void 0);
		_defineProperty(this, "resolvedPromise", Promise.resolve());
		_defineProperty(this, "nonce", inject(CSP_NONCE, { optional: true }));
		this.callbackMap = callbackMap;
		this.document = document;
		if (typeof ngDevMode === "undefined" || ngDevMode) console.warn("JSONP support is deprecated as it can cause XSS vulnerabilities, and will be removed in a future version of Angular. Please use standard HTTP requests instead.");
	}
	nextCallback() {
		return `ng_jsonp_callback_${nextRequestId++}`;
	}
	handle(req) {
		if (req.method !== "JSONP") throw new RuntimeError(2810, ngDevMode && JSONP_ERR_WRONG_METHOD);
		else if (req.responseType !== "json") throw new RuntimeError(2811, ngDevMode && JSONP_ERR_WRONG_RESPONSE_TYPE);
		if (req.headers.keys().length > 0) throw new RuntimeError(2812, ngDevMode && JSONP_ERR_HEADERS_NOT_SUPPORTED);
		if (!this.isAllowedJsonpUrl(req.urlWithParams)) throw new RuntimeError(2826, ngDevMode && JSONP_ERR_UNSAFE_URL);
		return new Observable((observer) => {
			const callback = this.nextCallback();
			const url = req.urlWithParams.replace(/=JSONP_CALLBACK(&|$)/, `=${callback}$1`);
			const node = this.document.createElement("script");
			node.src = url;
			if (this.nonce) node.setAttribute("nonce", this.nonce);
			let body = null;
			let finished = false;
			this.callbackMap[callback] = (data) => {
				delete this.callbackMap[callback];
				body = data;
				finished = true;
			};
			const cleanup = () => {
				node.removeEventListener("load", onLoad);
				node.removeEventListener("error", onError);
				node.remove();
				delete this.callbackMap[callback];
			};
			const onLoad = () => {
				this.resolvedPromise.then(() => {
					cleanup();
					if (!finished) {
						observer.error(new HttpErrorResponse({
							url,
							status: 0,
							statusText: "JSONP Error",
							error: /* @__PURE__ */ new Error(JSONP_ERR_NO_CALLBACK)
						}));
						return;
					}
					observer.next(new HttpResponse({
						body,
						status: HTTP_STATUS_CODE_OK,
						statusText: "OK",
						url
					}));
					observer.complete();
				});
			};
			const onError = (error) => {
				cleanup();
				observer.error(new HttpErrorResponse({
					error,
					status: 0,
					statusText: "JSONP Error",
					url
				}));
			};
			node.addEventListener("load", onLoad);
			node.addEventListener("error", onError);
			this.document.body.appendChild(node);
			observer.next({ type: HttpEventType.Sent });
			return () => {
				if (!finished) this.removeListeners(node);
				cleanup();
			};
		});
	}
	removeListeners(script) {
		foreignDocument ??= this.document.implementation.createHTMLDocument();
		foreignDocument.adoptNode(script);
	}
	isAllowedJsonpUrl(url) {
		return /^https?:\/\//i.test(url);
	}
};
_JsonpClientBackend = JsonpClientBackend;
_defineProperty(JsonpClientBackend, "ɵfac", function JsonpClientBackend_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _JsonpClientBackend)(ɵɵinject(JsonpCallbackContext), ɵɵinject(DOCUMENT));
});
_defineProperty(JsonpClientBackend, "ɵprov", /* @__PURE__ */ ɵɵdefineInjectable({
	token: _JsonpClientBackend,
	factory: _JsonpClientBackend.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(JsonpClientBackend, [{ type: Injectable }], () => [{ type: JsonpCallbackContext }, {
		type: void 0,
		decorators: [{
			type: Inject,
			args: [DOCUMENT]
		}]
	}], null);
})();
function jsonpInterceptorFn(req, next) {
	if (req.method === "JSONP") return inject(JsonpClientBackend).handle(req);
	return next(req);
}
var JsonpInterceptor = class {
	constructor(injector) {
		_defineProperty(this, "injector", void 0);
		this.injector = injector;
	}
	intercept(initialRequest, next) {
		return runInInjectionContext(this.injector, () => jsonpInterceptorFn(initialRequest, (downstreamRequest) => next.handle(downstreamRequest)));
	}
};
_JsonpInterceptor = JsonpInterceptor;
_defineProperty(JsonpInterceptor, "ɵfac", function JsonpInterceptor_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _JsonpInterceptor)(ɵɵinject(EnvironmentInjector));
});
_defineProperty(JsonpInterceptor, "ɵprov", /* @__PURE__ */ ɵɵdefineInjectable({
	token: _JsonpInterceptor,
	factory: _JsonpInterceptor.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(JsonpInterceptor, [{ type: Injectable }], () => [{ type: EnvironmentInjector }], null);
})();
var XSSI_PREFIX = /^\)\]\}',?\n/;
function validateXhrCompatibility(req) {
	for (const { property, errorCode } of [
		{
			property: "keepalive",
			errorCode: 2813
		},
		{
			property: "cache",
			errorCode: 2814
		},
		{
			property: "priority",
			errorCode: 2815
		},
		{
			property: "mode",
			errorCode: 2816
		},
		{
			property: "redirect",
			errorCode: 2817
		},
		{
			property: "credentials",
			errorCode: 2818
		},
		{
			property: "integrity",
			errorCode: 2820
		},
		{
			property: "referrer",
			errorCode: 2821
		},
		{
			property: "referrerPolicy",
			errorCode: 2823
		}
	]) if (req[property]) console.warn(formatRuntimeError(errorCode, `Angular detected that a \`HttpClient\` request with the \`${property}\` option was sent using XHR, which does not support it. To use the \`${property}\` option, use the Fetch API by removing \`withXhr()\` from the \`provideHttpClient()\` call.`));
}
var HttpXhrBackend = class {
	constructor(xhrFactory) {
		_defineProperty(this, "xhrFactory", void 0);
		_defineProperty(this, "tracingService", inject(TracingService, { optional: true }));
		this.xhrFactory = xhrFactory;
	}
	maybePropagateTrace(fn) {
		return this.tracingService?.propagate ? this.tracingService.propagate(fn) : fn;
	}
	handle(req) {
		if (req.method === "JSONP") throw new RuntimeError(-2800, (typeof ngDevMode === "undefined" || ngDevMode) && `Cannot make a JSONP request without JSONP support. To fix the problem, either add the \`withJsonpSupport()\` call (if \`provideHttpClient()\` is used) or import the \`HttpClientJsonpModule\` in the root NgModule.`);
		ngDevMode && validateXhrCompatibility(req);
		const xhrFactory = this.xhrFactory;
		return of(null).pipe(switchMap(() => {
			return new Observable((observer) => {
				const xhr = xhrFactory.build();
				xhr.open(req.method, req.urlWithParams);
				if (req.withCredentials) xhr.withCredentials = true;
				req.headers.forEach((name, values) => xhr.setRequestHeader(name, values.join(",")));
				if (!req.headers.has(ACCEPT_HEADER)) xhr.setRequestHeader(ACCEPT_HEADER, ACCEPT_HEADER_VALUE);
				if (!req.headers.has(CONTENT_TYPE_HEADER)) {
					const detectedType = req.detectContentTypeHeader();
					if (detectedType !== null) xhr.setRequestHeader(CONTENT_TYPE_HEADER, detectedType);
				}
				if (req.timeout) xhr.timeout = req.timeout;
				if (req.responseType) {
					const responseType = req.responseType.toLowerCase();
					xhr.responseType = responseType !== "json" ? responseType : "text";
				}
				const reqBody = req.serializeBody();
				let headerResponse = null;
				const partialFromXhr = () => {
					if (headerResponse !== null) return headerResponse;
					const statusText = xhr.statusText || "OK";
					const headers = new HttpHeaders(xhr.getAllResponseHeaders());
					const url = xhr.responseURL || req.url;
					headerResponse = new HttpHeaderResponse({
						headers,
						status: xhr.status,
						statusText,
						url
					});
					return headerResponse;
				};
				const onLoad = this.maybePropagateTrace(() => {
					let { headers, status, statusText, url } = partialFromXhr();
					let body = null;
					if (status !== HTTP_STATUS_CODE_NO_CONTENT) body = typeof xhr.response === "undefined" ? xhr.responseText : xhr.response;
					if (status === 0) status = !!body ? HTTP_STATUS_CODE_OK : 0;
					let ok = status >= 200 && status < 300;
					if (req.responseType === "json" && typeof body === "string") {
						const originalBody = body;
						body = body.replace(XSSI_PREFIX, "");
						try {
							body = body !== "" ? JSON.parse(body) : null;
						} catch (error) {
							body = originalBody;
							if (ok) {
								ok = false;
								body = {
									error,
									text: body
								};
							}
						}
					}
					if (ok) {
						observer.next(new HttpResponse({
							body,
							headers,
							status,
							statusText,
							url: url || void 0
						}));
						observer.complete();
					} else observer.error(new HttpErrorResponse({
						error: body,
						headers,
						status,
						statusText,
						url: url || void 0
					}));
				});
				const onError = this.maybePropagateTrace((error) => {
					const { url } = partialFromXhr();
					const res = new HttpErrorResponse({
						error,
						status: xhr.status || 0,
						statusText: xhr.statusText || "Unknown Error",
						url: url || void 0
					});
					observer.error(res);
				});
				let onTimeout = onError;
				if (req.timeout) onTimeout = this.maybePropagateTrace((_) => {
					const { url } = partialFromXhr();
					const res = new HttpErrorResponse({
						error: new DOMException("Request timed out", "TimeoutError"),
						status: xhr.status || 0,
						statusText: xhr.statusText || "Request timeout",
						url: url || void 0
					});
					observer.error(res);
				});
				let sentHeaders = false;
				const onDownProgress = this.maybePropagateTrace((event) => {
					if (!sentHeaders) {
						observer.next(partialFromXhr());
						sentHeaders = true;
					}
					let progressEvent = {
						type: HttpEventType.DownloadProgress,
						loaded: event.loaded
					};
					if (event.lengthComputable) progressEvent.total = event.total;
					if (req.responseType === "text" && !!xhr.responseText) progressEvent.partialText = xhr.responseText;
					observer.next(progressEvent);
				});
				const onUpProgress = this.maybePropagateTrace((event) => {
					let progress = {
						type: HttpEventType.UploadProgress,
						loaded: event.loaded
					};
					if (event.lengthComputable) progress.total = event.total;
					observer.next(progress);
				});
				xhr.addEventListener("load", onLoad);
				xhr.addEventListener("error", onError);
				xhr.addEventListener("timeout", onTimeout);
				xhr.addEventListener("abort", onError);
				const reportUploadProgress = req.reportProgress || req.reportUploadProgress;
				const reportDownloadProgress = req.reportProgress || req.reportDownloadProgress;
				if (reportDownloadProgress) xhr.addEventListener("progress", onDownProgress);
				if (reportUploadProgress && reqBody !== null && xhr.upload) xhr.upload.addEventListener("progress", onUpProgress);
				xhr.send(reqBody);
				observer.next({ type: HttpEventType.Sent });
				return () => {
					xhr.removeEventListener("error", onError);
					xhr.removeEventListener("abort", onError);
					xhr.removeEventListener("load", onLoad);
					xhr.removeEventListener("timeout", onTimeout);
					if (reportDownloadProgress) xhr.removeEventListener("progress", onDownProgress);
					if (reportUploadProgress && reqBody !== null && xhr.upload) xhr.upload.removeEventListener("progress", onUpProgress);
					if (xhr.readyState !== xhr.DONE) xhr.abort();
				};
			});
		}));
	}
};
_HttpXhrBackend = HttpXhrBackend;
_defineProperty(HttpXhrBackend, "ɵfac", function HttpXhrBackend_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _HttpXhrBackend)(ɵɵinject(XhrFactory));
});
_defineProperty(HttpXhrBackend, "ɵprov", /* @__PURE__ */ ɵɵdefineInjectable({
	token: _HttpXhrBackend,
	factory: _HttpXhrBackend.ɵfac,
	providedIn: "root"
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HttpXhrBackend, [{
		type: Injectable,
		args: [{ providedIn: "root" }]
	}], () => [{ type: XhrFactory }], null);
})();
var HttpFeatureKind;
(function(HttpFeatureKind) {
	HttpFeatureKind[HttpFeatureKind["Interceptors"] = 0] = "Interceptors";
	HttpFeatureKind[HttpFeatureKind["LegacyInterceptors"] = 1] = "LegacyInterceptors";
	HttpFeatureKind[HttpFeatureKind["CustomXsrfConfiguration"] = 2] = "CustomXsrfConfiguration";
	HttpFeatureKind[HttpFeatureKind["NoXsrfProtection"] = 3] = "NoXsrfProtection";
	HttpFeatureKind[HttpFeatureKind["JsonpSupport"] = 4] = "JsonpSupport";
	HttpFeatureKind[HttpFeatureKind["RequestsMadeViaParent"] = 5] = "RequestsMadeViaParent";
	HttpFeatureKind[HttpFeatureKind["Fetch"] = 6] = "Fetch";
	HttpFeatureKind[HttpFeatureKind["Xhr"] = 7] = "Xhr";
})(HttpFeatureKind || (HttpFeatureKind = {}));
function makeHttpFeature(kind, providers) {
	return {
		ɵkind: kind,
		ɵproviders: providers
	};
}
function provideHttpClient(...features) {
	if (ngDevMode) {
		const featureKinds = new Set(features.map((f) => f.ɵkind));
		if (featureKinds.has(HttpFeatureKind.NoXsrfProtection) && featureKinds.has(HttpFeatureKind.CustomXsrfConfiguration)) throw new Error(`Configuration error: found both withXsrfConfiguration() and withNoXsrfProtection() in the same call to provideHttpClient(), which is a contradiction.`);
		const hasBackendOverride = featureKinds.has(HttpFeatureKind.Fetch) || featureKinds.has(HttpFeatureKind.Xhr);
		if (featureKinds.has(HttpFeatureKind.RequestsMadeViaParent) && hasBackendOverride) throw new Error(`Configuration error: withRequestsMadeViaParent() cannot be combined with withFetch() or withXhr() in the same call to provideHttpClient().`);
	}
	const providers = [
		HttpClient,
		FetchBackend,
		HttpInterceptorHandler,
		{
			provide: HttpHandler,
			useExisting: HttpInterceptorHandler
		},
		{
			provide: HttpBackend,
			useFactory: () => {
				return inject(FetchBackend);
			}
		},
		{
			provide: HTTP_INTERCEPTOR_FNS,
			useValue: xsrfInterceptorFn,
			multi: true
		}
	];
	for (const feature of features) providers.push(...feature.ɵproviders);
	return makeEnvironmentProviders(providers);
}
var LEGACY_INTERCEPTOR_FN = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "LEGACY_INTERCEPTOR_FN" : "");
function withInterceptorsFromDi() {
	return makeHttpFeature(HttpFeatureKind.LegacyInterceptors, [{
		provide: LEGACY_INTERCEPTOR_FN,
		useFactory: legacyInterceptorFnFactory
	}, {
		provide: HTTP_INTERCEPTOR_FNS,
		useExisting: LEGACY_INTERCEPTOR_FN,
		multi: true
	}]);
}
function withXsrfConfiguration({ cookieName, headerName }) {
	const providers = [];
	if (cookieName !== void 0) providers.push({
		provide: XSRF_COOKIE_NAME,
		useValue: cookieName
	});
	if (headerName !== void 0) providers.push({
		provide: XSRF_HEADER_NAME,
		useValue: headerName
	});
	return makeHttpFeature(HttpFeatureKind.CustomXsrfConfiguration, providers);
}
function withNoXsrfProtection() {
	return makeHttpFeature(HttpFeatureKind.NoXsrfProtection, [{
		provide: XSRF_ENABLED,
		useValue: false
	}]);
}
function withJsonpSupport() {
	return makeHttpFeature(HttpFeatureKind.JsonpSupport, [
		JsonpClientBackend,
		{
			provide: JsonpCallbackContext,
			useFactory: jsonpCallbackContext
		},
		{
			provide: HTTP_INTERCEPTOR_FNS,
			useValue: jsonpInterceptorFn,
			multi: true
		}
	]);
}
function withXhr() {
	return makeHttpFeature(HttpFeatureKind.Xhr, [HttpXhrBackend, {
		provide: HttpBackend,
		useExisting: HttpXhrBackend
	}]);
}
var HttpClientXsrfModule = class HttpClientXsrfModule {
	static disable() {
		return {
			ngModule: HttpClientXsrfModule,
			providers: [withNoXsrfProtection().ɵproviders]
		};
	}
	static withOptions(options = {}) {
		return {
			ngModule: HttpClientXsrfModule,
			providers: withXsrfConfiguration(options).ɵproviders
		};
	}
};
_HttpClientXsrfModule = HttpClientXsrfModule;
_defineProperty(HttpClientXsrfModule, "ɵfac", function HttpClientXsrfModule_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _HttpClientXsrfModule)();
});
_defineProperty(HttpClientXsrfModule, "ɵmod", /* @__PURE__ */ ɵɵdefineNgModule({ type: _HttpClientXsrfModule }));
_defineProperty(HttpClientXsrfModule, "ɵinj", /* @__PURE__ */ ɵɵdefineInjector({ providers: [
	HttpXsrfInterceptor,
	{
		provide: HTTP_INTERCEPTORS,
		useExisting: HttpXsrfInterceptor,
		multi: true
	},
	{
		provide: HttpXsrfTokenExtractor,
		useClass: HttpXsrfCookieExtractor
	},
	withXsrfConfiguration({
		cookieName: XSRF_DEFAULT_COOKIE_NAME,
		headerName: XSRF_DEFAULT_HEADER_NAME
	}).ɵproviders,
	{
		provide: XSRF_ENABLED,
		useValue: true
	}
] }));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HttpClientXsrfModule, [{
		type: NgModule,
		args: [{ providers: [
			HttpXsrfInterceptor,
			{
				provide: HTTP_INTERCEPTORS,
				useExisting: HttpXsrfInterceptor,
				multi: true
			},
			{
				provide: HttpXsrfTokenExtractor,
				useClass: HttpXsrfCookieExtractor
			},
			withXsrfConfiguration({
				cookieName: XSRF_DEFAULT_COOKIE_NAME,
				headerName: XSRF_DEFAULT_HEADER_NAME
			}).ɵproviders,
			{
				provide: XSRF_ENABLED,
				useValue: true
			}
		] }]
	}], null, null);
})();
var HttpClientModule = class {};
_HttpClientModule = HttpClientModule;
_defineProperty(HttpClientModule, "ɵfac", function HttpClientModule_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _HttpClientModule)();
});
_defineProperty(HttpClientModule, "ɵmod", /* @__PURE__ */ ɵɵdefineNgModule({ type: _HttpClientModule }));
_defineProperty(HttpClientModule, "ɵinj", /* @__PURE__ */ ɵɵdefineInjector({ providers: [provideHttpClient(withInterceptorsFromDi(), withXhr())] }));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HttpClientModule, [{
		type: NgModule,
		args: [{ providers: [provideHttpClient(withInterceptorsFromDi(), withXhr())] }]
	}], null, null);
})();
var HttpClientJsonpModule = class {};
_HttpClientJsonpModule = HttpClientJsonpModule;
_defineProperty(HttpClientJsonpModule, "ɵfac", function HttpClientJsonpModule_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _HttpClientJsonpModule)();
});
_defineProperty(HttpClientJsonpModule, "ɵmod", /* @__PURE__ */ ɵɵdefineNgModule({ type: _HttpClientJsonpModule }));
_defineProperty(HttpClientJsonpModule, "ɵinj", /* @__PURE__ */ ɵɵdefineInjector({ providers: [withJsonpSupport().ɵproviders] }));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HttpClientJsonpModule, [{
		type: NgModule,
		args: [{ providers: [withJsonpSupport().ɵproviders] }]
	}], null, null);
})();
//#endregion
//#region node_modules/@angular/common/fesm2022/http.mjs
/**
* @license Angular v22.1.5
* (c) 2010-2026 Google LLC. https://angular.dev/
* License: MIT
*/
var HTTP_TRANSFER_CACHE_ORIGIN_MAP = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "HTTP_TRANSFER_CACHE_ORIGIN_MAP" : "");
var BODY = "b";
var HEADERS = "h";
var STATUS = "s";
var STATUS_TEXT = "st";
var REQ_URL = "u";
var RESPONSE_TYPE = "rt";
var CACHE_OPTIONS = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "HTTP_TRANSFER_STATE_CACHE_OPTIONS" : "");
var ALLOWED_METHODS = ["GET", "HEAD"];
function canUseOrCacheRequest(req, options) {
	const { isCacheActive, filter, includePostRequests, includeRequestsWithAuthHeaders, includeRequestsWithCredentials, includeNonCacheableRequests } = options;
	const { transferCache: requestOptions, method: requestMethod } = req;
	if (!isCacheActive || requestOptions === false || requestMethod === "POST" && !includePostRequests && !requestOptions || requestMethod !== "POST" && !ALLOWED_METHODS.includes(requestMethod) || !includeRequestsWithAuthHeaders && hasAuthHeaders(req) || !includeRequestsWithCredentials && hasOutgoingCredentials(req) || !includeNonCacheableRequests && (hasUncacheableCacheControl(req.headers) || isNonCacheableRequest(req.cache)) || filter?.(req) === false) return false;
	return true;
}
function getHeadersToInclude(options, requestOptions) {
	return typeof requestOptions === "object" && requestOptions.includeHeaders ? requestOptions.includeHeaders : options.includeHeaders;
}
function retrieveStateFromCache(req, options, transferState, originMap, storeKey, skipUseCacheChecks = false) {
	if (!skipUseCacheChecks && !canUseOrCacheRequest(req, options)) return null;
	if (originMap) throw new RuntimeError(2803, ngDevMode && "Angular detected that the `HTTP_TRANSFER_CACHE_ORIGIN_MAP` token is configured and present in the client side code. Please ensure that this token is only provided in the server code of the application.");
	if (!storeKey) {
		const requestUrl = req.url;
		storeKey = makeCacheKey(req, requestUrl);
	}
	const response = transferState.get(storeKey, null);
	if (!response) return null;
	const { [BODY]: undecodedBody, [RESPONSE_TYPE]: responseType, [HEADERS]: httpHeaders, [STATUS]: status, [STATUS_TEXT]: statusText, [REQ_URL]: url } = response;
	let body = undecodedBody;
	switch (responseType) {
		case "arraybuffer":
			body = fromBase64(undecodedBody);
			break;
		case "blob":
			body = new Blob([fromBase64(undecodedBody)]);
			break;
	}
	let headers = new HttpHeaders(httpHeaders);
	if (typeof ngDevMode === "undefined" || ngDevMode) {
		const { transferCache: requestOptions } = req;
		const headersToInclude = getHeadersToInclude(options, requestOptions);
		headers = appendMissingHeadersDetection(req.url, headers, headersToInclude ?? []);
	}
	return new HttpResponse({
		body,
		headers,
		status,
		statusText,
		url
	});
}
function transferCacheInterceptorFn(req, next) {
	const options = inject(CACHE_OPTIONS);
	if (!canUseOrCacheRequest(req, options)) return next(req);
	const transferState = inject(TransferState);
	inject(HTTP_TRANSFER_CACHE_ORIGIN_MAP, { optional: true });
	const requestUrl = req.url;
	const cachedResponse = retrieveStateFromCache(req, options, transferState, null, makeCacheKey(req, requestUrl), true);
	if (cachedResponse) return of(cachedResponse);
	return next(req);
}
function hasAuthHeaders(req) {
	const headers = req.headers;
	return headers.has("authorization") || headers.has("proxy-authorization") || headers.has("cookie");
}
var UNCACHEABLE_CACHE_CONTROL_DIRECTIVES = /* @__PURE__ */ new Set([
	"no-store",
	"private",
	"no-cache"
]);
function hasUncacheableCacheControl(headers) {
	const cacheControl = headers.get("cache-control");
	if (!cacheControl) return false;
	return cacheControl.split(",").some((directive) => {
		const directiveName = directive.split("=", 1)[0].trim().toLowerCase();
		return UNCACHEABLE_CACHE_CONTROL_DIRECTIVES.has(directiveName);
	});
}
function isNonCacheableRequest(cache) {
	return cache === "no-cache" || cache === "no-store";
}
function hasOutgoingCredentials(req) {
	const { withCredentials, credentials } = req;
	return withCredentials || credentials === "include" || credentials === "same-origin";
}
function sortAndConcatParams(params) {
	const searchParams = new URLSearchParams(params instanceof URLSearchParams ? params : params.toString());
	searchParams.sort();
	return searchParams.toString();
}
function makeCacheKey(request, mappedRequestUrl) {
	const { params, method, responseType } = request;
	const encodedParams = sortAndConcatParams(params);
	let serializedBody = request.serializeBody();
	if (serializedBody instanceof URLSearchParams) serializedBody = sortAndConcatParams(serializedBody);
	else if (typeof serializedBody !== "string") serializedBody = "";
	return makeStateKey(generateHash([
		method,
		responseType,
		mappedRequestUrl,
		serializedBody,
		encodedParams
	].join("\0")));
}
function fromBase64(base64) {
	const binary = atob(base64);
	return Uint8Array.from(binary, (c) => c.charCodeAt(0)).buffer;
}
function withHttpTransferCache(cacheOptions) {
	return [
		{
			provide: CACHE_OPTIONS,
			useFactory: () => {
				performanceMarkFeature("NgHttpTransferCache");
				return {
					isCacheActive: true,
					...cacheOptions
				};
			}
		},
		{
			provide: HTTP_ROOT_INTERCEPTOR_FNS,
			useValue: transferCacheInterceptorFn,
			multi: true
		},
		{
			provide: APP_BOOTSTRAP_LISTENER,
			multi: true,
			useFactory: () => {
				const appRef = inject(ApplicationRef);
				const cacheState = inject(CACHE_OPTIONS);
				return () => {
					appRef.whenStable().then(() => {
						cacheState.isCacheActive = false;
					});
				};
			}
		}
	];
}
function appendMissingHeadersDetection(url, headers, headersToInclude) {
	const warningProduced = /* @__PURE__ */ new Set();
	return new Proxy(headers, { get(target, prop) {
		const value = Reflect.get(target, prop);
		if (typeof value !== "function" || !(/* @__PURE__ */ new Set([
			"get",
			"has",
			"getAll"
		])).has(prop)) return value;
		return (headerName) => {
			const key = (prop + ":" + headerName).toLowerCase();
			if (!headersToInclude.includes(headerName) && !warningProduced.has(key)) {
				warningProduced.add(key);
				const truncatedUrl = truncateMiddle(url);
				console.warn(formatRuntimeError(-2802, `Angular detected that the \`${headerName}\` header is accessed, but the value of the header was not transferred from the server to the client by the HttpTransferCache. To include the value of the \`${headerName}\` header for the \`${truncatedUrl}\` request, use the \`includeHeaders\` list. The \`includeHeaders\` can be defined either on a request level by adding the \`transferCache\` parameter, or on an application level by adding the \`httpCacheTransfer.includeHeaders\` argument to the \`provideClientHydration()\` call. `));
			}
			return value.apply(target, [headerName]);
		};
	} });
}
var SHA256_ROUND_CONSTANTS = /* @__PURE__ */ new Uint32Array([
	1116352408,
	1899447441,
	3049323471,
	3921009573,
	961987163,
	1508970993,
	2453635748,
	2870763221,
	3624381080,
	310598401,
	607225278,
	1426881987,
	1925078388,
	2162078206,
	2614888103,
	3248222580,
	3835390401,
	4022224774,
	264347078,
	604807628,
	770255983,
	1249150122,
	1555081692,
	1996064986,
	2554220882,
	2821834349,
	2952996808,
	3210313671,
	3336571891,
	3584528711,
	113926993,
	338241895,
	666307205,
	773529912,
	1294757372,
	1396182291,
	1695183700,
	1986661051,
	2177026350,
	2456956037,
	2730485921,
	2820302411,
	3259730800,
	3345764771,
	3516065817,
	3600352804,
	4094571909,
	275423344,
	430227734,
	506948616,
	659060556,
	883997877,
	958139571,
	1322822218,
	1537002063,
	1747873779,
	1955562222,
	2024104815,
	2227730452,
	2361852424,
	2428436474,
	2756734187,
	3204031479,
	3329325298
]);
var textEncoder;
function generateHash(value) {
	textEncoder ??= new TextEncoder();
	const inputBytes = textEncoder.encode(value);
	let hashState0 = 1779033703;
	let hashState1 = 3144134277;
	let hashState2 = 1013904242;
	let hashState3 = 2773480762;
	let hashState4 = 1359893119;
	let hashState5 = 2600822924;
	let hashState6 = 528734635;
	let hashState7 = 1541459225;
	const messageLengthInBits = inputBytes.length * 8;
	const paddedLengthInBytes = (inputBytes.length + 8 >> 6) + 1 << 6;
	const paddedBytes = new Uint8Array(paddedLengthInBytes);
	paddedBytes.set(inputBytes);
	paddedBytes[inputBytes.length] = 128;
	const paddedBytesView = new DataView(paddedBytes.buffer);
	const lowBits = messageLengthInBits >>> 0;
	const highBits = messageLengthInBits / 4294967296 >>> 0;
	paddedBytesView.setUint32(paddedLengthInBytes - 8, highBits, false);
	paddedBytesView.setUint32(paddedLengthInBytes - 4, lowBits, false);
	const messageSchedule = /* @__PURE__ */ new Uint32Array(64);
	for (let chunkOffset = 0; chunkOffset < paddedLengthInBytes; chunkOffset += 64) {
		for (let i = 0; i < 16; i++) messageSchedule[i] = paddedBytesView.getUint32(chunkOffset + i * 4, false);
		for (let i = 16; i < 64; i++) {
			const prevWord15 = messageSchedule[i - 15];
			const sigma0 = ((prevWord15 >>> 7 | prevWord15 << 25) ^ (prevWord15 >>> 18 | prevWord15 << 14) ^ prevWord15 >>> 3) >>> 0;
			const prevWord2 = messageSchedule[i - 2];
			const sigma1 = ((prevWord2 >>> 17 | prevWord2 << 15) ^ (prevWord2 >>> 19 | prevWord2 << 13) ^ prevWord2 >>> 10) >>> 0;
			messageSchedule[i] = messageSchedule[i - 16] + sigma0 + messageSchedule[i - 7] + sigma1 >>> 0;
		}
		let workingStateA = hashState0;
		let workingStateB = hashState1;
		let workingStateC = hashState2;
		let workingStateD = hashState3;
		let workingStateE = hashState4;
		let workingStateF = hashState5;
		let workingStateG = hashState6;
		let workingStateH = hashState7;
		for (let i = 0; i < 64; i++) {
			const capitalSigma1 = ((workingStateE >>> 6 | workingStateE << 26) ^ (workingStateE >>> 11 | workingStateE << 21) ^ (workingStateE >>> 25 | workingStateE << 7)) >>> 0;
			const chFunction = (workingStateE & workingStateF ^ ~workingStateE & workingStateG) >>> 0;
			const temp1 = workingStateH + capitalSigma1 + chFunction + SHA256_ROUND_CONSTANTS[i] + messageSchedule[i] >>> 0;
			const temp2 = (((workingStateA >>> 2 | workingStateA << 30) ^ (workingStateA >>> 13 | workingStateA << 19) ^ (workingStateA >>> 22 | workingStateA << 10)) >>> 0) + ((workingStateA & workingStateB ^ workingStateA & workingStateC ^ workingStateB & workingStateC) >>> 0) >>> 0;
			workingStateH = workingStateG;
			workingStateG = workingStateF;
			workingStateF = workingStateE;
			workingStateE = workingStateD + temp1 >>> 0;
			workingStateD = workingStateC;
			workingStateC = workingStateB;
			workingStateB = workingStateA;
			workingStateA = temp1 + temp2 >>> 0;
		}
		hashState0 = hashState0 + workingStateA >>> 0;
		hashState1 = hashState1 + workingStateB >>> 0;
		hashState2 = hashState2 + workingStateC >>> 0;
		hashState3 = hashState3 + workingStateD >>> 0;
		hashState4 = hashState4 + workingStateE >>> 0;
		hashState5 = hashState5 + workingStateF >>> 0;
		hashState6 = hashState6 + workingStateG >>> 0;
		hashState7 = hashState7 + workingStateH >>> 0;
	}
	return [
		hashState0,
		hashState1,
		hashState2,
		hashState3,
		hashState4,
		hashState5,
		hashState6,
		hashState7
	].map((x) => x.toString(16).padStart(8, "0")).join("");
}
(() => {
	const jsonFn = makeHttpResourceFn("json");
	jsonFn.arrayBuffer = makeHttpResourceFn("arraybuffer");
	jsonFn.blob = makeHttpResourceFn("blob");
	jsonFn.text = makeHttpResourceFn("text");
	return jsonFn;
})();
function makeHttpResourceFn(responseType) {
	return function httpResource(request, options) {
		if (ngDevMode && !options?.injector) assertInInjectionContext(httpResource);
		const injector = options?.injector ?? inject(Injector);
		const cacheOptions = injector.get(CACHE_OPTIONS, null, { optional: true });
		const transferState = injector.get(TransferState, null, { optional: true });
		const originMap = injector.get(HTTP_TRANSFER_CACHE_ORIGIN_MAP, null, { optional: true });
		const getInitialStream = (req) => {
			if (cacheOptions && transferState && req) {
				const cachedResponse = retrieveStateFromCache(req, cacheOptions, transferState, originMap);
				if (cachedResponse) try {
					const body = cachedResponse.body;
					return signal({ value: options?.parse ? options.parse(body) : body });
				} catch (e) {
					if (typeof ngDevMode === "undefined" || ngDevMode) console.warn(`Angular detected an error while parsing the cached response for the httpResource at \`${req.url}\`. The resource will fall back to its default value and try again asynchronously.`, e);
				}
			}
		};
		return new HttpResourceImpl(injector, (ctx) => normalizeRequest(ctx, request, responseType), options?.defaultValue, options?.debugName, options?.parse, options?.equal, getInitialStream);
	};
}
function normalizeRequest(ctx, request, responseType) {
	let unwrappedRequest = typeof request === "function" ? request(ctx) : request;
	if (unwrappedRequest === void 0) return;
	else if (typeof unwrappedRequest === "string") unwrappedRequest = { url: unwrappedRequest };
	const headers = unwrappedRequest.headers instanceof HttpHeaders ? unwrappedRequest.headers : new HttpHeaders(unwrappedRequest.headers);
	const params = unwrappedRequest.params instanceof HttpParams ? unwrappedRequest.params : new HttpParams({ fromObject: unwrappedRequest.params });
	return new HttpRequest(unwrappedRequest.method ?? "GET", unwrappedRequest.url, unwrappedRequest.body ?? null, {
		headers,
		params,
		reportProgress: unwrappedRequest.reportProgress,
		withCredentials: unwrappedRequest.withCredentials,
		keepalive: unwrappedRequest.keepalive,
		cache: unwrappedRequest.cache,
		priority: unwrappedRequest.priority,
		mode: unwrappedRequest.mode,
		redirect: unwrappedRequest.redirect,
		responseType,
		context: unwrappedRequest.context,
		transferCache: unwrappedRequest.transferCache,
		credentials: unwrappedRequest.credentials,
		referrer: unwrappedRequest.referrer,
		referrerPolicy: unwrappedRequest.referrerPolicy,
		integrity: unwrappedRequest.integrity,
		timeout: unwrappedRequest.timeout
	});
}
var HttpResourceImpl = class extends ResourceImpl {
	constructor(injector, request, defaultValue, debugName, parse, equal, getInitialStream) {
		super(request, ({ params: request, abortSignal }) => {
			let sub;
			let aborted = false;
			const onAbort = () => {
				aborted = true;
				sub?.unsubscribe();
			};
			abortSignal.addEventListener("abort", onAbort);
			const stream = signal({ value: void 0 }, ...ngDevMode ? [{ debugName: "stream" }] : []);
			let resolve;
			const promise = new Promise((r) => resolve = r);
			const send = (value) => {
				stream.set(value);
				resolve?.(stream);
				resolve = void 0;
			};
			sub = this.client.request(request).subscribe({
				next: (event) => {
					switch (event.type) {
						case HttpEventType.Response:
							this._headers.set(event.headers);
							this._statusCode.set(event.status);
							try {
								send({ value: parse ? parse(event.body) : event.body });
							} catch (error) {
								send({ error: encapsulateResourceError(error) });
							}
							break;
						case HttpEventType.DownloadProgress:
							this._progress.set(event);
							break;
					}
				},
				error: (error) => {
					if (error instanceof HttpErrorResponse) {
						this._headers.set(error.headers);
						this._statusCode.set(error.status);
					}
					send({ error });
					abortSignal.removeEventListener("abort", onAbort);
				},
				complete: () => {
					if (resolve) send({ error: new RuntimeError(-991, ngDevMode && "Resource completed before producing a value") });
					abortSignal.removeEventListener("abort", onAbort);
				}
			});
			if (aborted) sub.unsubscribe();
			return promise;
		}, defaultValue, equal, debugName, injector, void 0, getInitialStream);
		_defineProperty(this, "client", void 0);
		_defineProperty(this, "_headers", linkedSignal({
			...ngDevMode ? { debugName: "_headers" } : {},
			source: this.extRequest,
			computation: () => void 0
		}));
		_defineProperty(this, "_progress", linkedSignal({
			...ngDevMode ? { debugName: "_progress" } : {},
			source: this.extRequest,
			computation: () => void 0
		}));
		_defineProperty(this, "_statusCode", linkedSignal({
			...ngDevMode ? { debugName: "_statusCode" } : {},
			source: this.extRequest,
			computation: () => void 0
		}));
		_defineProperty(this, "headers", computed(() => this.status() === "resolved" || this.status() === "error" ? this._headers() : void 0, ...ngDevMode ? [{ debugName: "headers" }] : []));
		_defineProperty(this, "progress", this._progress.asReadonly());
		_defineProperty(this, "statusCode", this._statusCode.asReadonly());
		this.client = injector.get(HttpClient);
	}
	set(value) {
		super.set(value);
		this._headers.set(void 0);
		this._progress.set(void 0);
		this._statusCode.set(void 0);
	}
};
//#endregion
//#region node_modules/@angular/platform-browser/fesm2022/platform-browser.mjs
var _Meta;
var _Title;
var _CssVarNamespacer;
var _DomSanitizer;
var _DomSanitizerImpl;
/**
* @license Angular v22.1.5
* (c) 2010-2026 Google LLC. https://angular.dev/
* License: MIT
*/
var Meta = class {
	constructor() {
		_defineProperty(this, "_doc", inject(DOCUMENT));
		_defineProperty(this, "_dom", getDOM());
		_defineProperty(this, "_cachedHead", void 0);
	}
	addTag(tag, forceCreation = false) {
		if (!tag) return null;
		return this._getOrCreateElement(tag, forceCreation);
	}
	addTags(tags, forceCreation = false) {
		return tags.filter((tag) => !!tag).map((tag) => this._getOrCreateElement(tag, forceCreation));
	}
	getTag(attrSelector) {
		if (!attrSelector) return null;
		const meta = this._doc.querySelector(buildMetaSelector(attrSelector));
		return isMetaTag(meta) ? meta : null;
	}
	getTags(attrSelector) {
		if (!attrSelector) return [];
		const list = this._doc.querySelectorAll(buildMetaSelector(attrSelector));
		return list ? Array.from(list).filter((elem) => isMetaTag(elem)) : [];
	}
	updateTag(tag, selector) {
		validateMetaDefinition(tag);
		selector ??= parseSelector(tag);
		const meta = this.getTag(selector);
		if (meta) {
			setMetaElementAttributes(tag, meta);
			return meta;
		}
		return this._getOrCreateElement(tag, true);
	}
	removeTag(attrSelector) {
		this.removeTagElement(this.getTag(attrSelector));
	}
	removeTagElement(meta) {
		if (meta) this._dom.remove(meta);
	}
	_getOrCreateElement(meta, forceCreation = false) {
		validateMetaDefinition(meta);
		if (!forceCreation) {
			const selector = parseSelector(meta);
			const elem = this.getTags(selector).filter((elem) => containsAttributes(meta, elem))[0];
			if (elem !== void 0) return elem;
		}
		const element = this._dom.createElement("meta");
		setMetaElementAttributes(meta, element);
		this._doc.getElementsByTagName("head")[0].appendChild(element);
		return element;
	}
};
_Meta = Meta;
_defineProperty(Meta, "ɵfac", function Meta_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _Meta)();
});
_defineProperty(Meta, "ɵprov", /* @__PURE__ */ ɵɵdefineService({
	token: _Meta,
	factory: _Meta.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Meta, [{ type: Service }], null, null);
})();
function buildMetaSelector(attrSelector) {
	return `meta[${attrSelector}]`;
}
function setMetaElementAttributes(tag, el) {
	Object.keys(tag).forEach((prop) => el.setAttribute(getMetaKeyMap(prop), tag[prop]));
}
function validateMetaDefinition(tag) {
	for (const prop of Object.keys(tag)) {
		const attributeName = getMetaKeyMap(prop);
		if (attributeName.toLowerCase().startsWith("on")) throw new RuntimeError(5203, (typeof ngDevMode === "undefined" || ngDevMode) && `The Meta service does not allow setting event handler attribute '${attributeName}' for security reasons.`);
	}
}
function parseSelector(tag) {
	const attr = tag.name ? "name" : "property";
	return `${attr}=${escapeSelectorValue(String(tag[attr]))}`;
}
function escapeSelectorValue(value) {
	return `"${value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}"`;
}
function containsAttributes(tag, elem) {
	return Object.keys(tag).every((key) => elem.getAttribute(getMetaKeyMap(key)) === tag[key]);
}
function getMetaKeyMap(prop) {
	return Object.hasOwn(META_KEYS_MAP, prop) ? META_KEYS_MAP[prop] : prop;
}
function isMetaTag(tag) {
	return tag?.nodeName.toLowerCase() === "meta";
}
var META_KEYS_MAP = { httpEquiv: "http-equiv" };
var Title = class {
	constructor(_doc) {
		_defineProperty(this, "_doc", void 0);
		this._doc = _doc;
	}
	getTitle() {
		return this._doc.title;
	}
	setTitle(newTitle) {
		this._doc.title = newTitle || "";
	}
};
_Title = Title;
_defineProperty(Title, "ɵfac", function Title_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _Title)(ɵɵinject(DOCUMENT));
});
_defineProperty(Title, "ɵprov", /* @__PURE__ */ ɵɵdefineInjectable({
	token: _Title,
	factory: _Title.ɵfac,
	providedIn: "root"
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Title, [{
		type: Injectable,
		args: [{ providedIn: "root" }]
	}], () => [{
		type: void 0,
		decorators: [{
			type: Inject,
			args: [DOCUMENT]
		}]
	}], null);
})();
function exportNgVar(name, value) {
	if (typeof COMPILED === "undefined" || !COMPILED) {
		const ng = _global["ng"] = _global["ng"] || {};
		ng[name] = value;
	}
}
var ChangeDetectionPerfRecord = class {
	constructor(msPerTick, numTicks) {
		_defineProperty(this, "msPerTick", void 0);
		_defineProperty(this, "numTicks", void 0);
		this.msPerTick = msPerTick;
		this.numTicks = numTicks;
	}
};
var AngularProfiler = class {
	constructor(ref) {
		_defineProperty(this, "appRef", void 0);
		this.appRef = ref.injector.get(ApplicationRef);
	}
	timeChangeDetection(config) {
		const record = config && config["record"];
		const profileName = "Change Detection";
		if (record && "profile" in console && typeof console.profile === "function") console.profile(profileName);
		const start = performance.now();
		let numTicks = 0;
		while (numTicks < 5 || performance.now() - start < 500) {
			this.appRef.tick();
			numTicks++;
		}
		const end = performance.now();
		if (record && "profileEnd" in console && typeof console.profileEnd === "function") console.profileEnd(profileName);
		const msPerTick = (end - start) / numTicks;
		console.log(`ran ${numTicks} change detection cycles`);
		console.log(`${msPerTick.toFixed(2)} ms per check`);
		return new ChangeDetectionPerfRecord(msPerTick, numTicks);
	}
};
var PROFILER_GLOBAL_NAME = "profiler";
function enableDebugTools(ref) {
	exportNgVar(PROFILER_GLOBAL_NAME, new AngularProfiler(ref));
	return ref;
}
function disableDebugTools() {
	exportNgVar(PROFILER_GLOBAL_NAME, null);
}
var By = class {
	static all() {
		return () => true;
	}
	static css(selector) {
		return (debugElement) => {
			return debugElement.nativeElement != null ? elementMatches(debugElement.nativeElement, selector) : false;
		};
	}
	static directive(type) {
		return (debugNode) => debugNode.providerTokens.indexOf(type) !== -1;
	}
};
function elementMatches(n, selector) {
	if (getDOM().isElementNode(n)) return n.matches && n.matches(selector) || n.msMatchesSelector && n.msMatchesSelector(selector) || n.webkitMatchesSelector && n.webkitMatchesSelector(selector);
	return false;
}
var CssVarNamespacer = class {
	constructor() {
		_defineProperty(this, "namespacePrefix", inject(CSS_VAR_NAMESPACE, { optional: true }) ?? "");
	}
	namespace(name) {
		if (typeof ngDevMode === "undefined" || ngDevMode) {
			if (!name.startsWith("--")) throw new Error(`CSS variable names passed to \`CssVarNamespacer\` must start with '--', got: '${name}'`);
		}
		if (!this.namespacePrefix) return name;
		return `--${this.namespacePrefix}${name.substring(2)}`;
	}
};
_CssVarNamespacer = CssVarNamespacer;
_defineProperty(CssVarNamespacer, "ɵfac", function CssVarNamespacer_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _CssVarNamespacer)();
});
_defineProperty(CssVarNamespacer, "ɵprov", /* @__PURE__ */ ɵɵdefineService({
	token: _CssVarNamespacer,
	factory: _CssVarNamespacer.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(CssVarNamespacer, [{ type: Service }], null, null);
})();
var HydrationFeatureKind;
(function(HydrationFeatureKind) {
	HydrationFeatureKind[HydrationFeatureKind["NoHttpTransferCache"] = 0] = "NoHttpTransferCache";
	HydrationFeatureKind[HydrationFeatureKind["HttpTransferCacheOptions"] = 1] = "HttpTransferCacheOptions";
	HydrationFeatureKind[HydrationFeatureKind["I18nSupport"] = 2] = "I18nSupport";
	HydrationFeatureKind[HydrationFeatureKind["EventReplay"] = 3] = "EventReplay";
	HydrationFeatureKind[HydrationFeatureKind["IncrementalHydration"] = 4] = "IncrementalHydration";
	HydrationFeatureKind[HydrationFeatureKind["NoIncrementalHydration"] = 5] = "NoIncrementalHydration";
})(HydrationFeatureKind || (HydrationFeatureKind = {}));
function hydrationFeature(ɵkind, ɵproviders = [], ɵoptions = {}) {
	return {
		ɵkind,
		ɵproviders
	};
}
function withNoHttpTransferCache() {
	return hydrationFeature(HydrationFeatureKind.NoHttpTransferCache);
}
function withHttpTransferCacheOptions(options) {
	return hydrationFeature(HydrationFeatureKind.HttpTransferCacheOptions, withHttpTransferCache(options));
}
function withI18nSupport() {
	return hydrationFeature(HydrationFeatureKind.I18nSupport, withI18nSupport$1());
}
function withEventReplay() {
	return hydrationFeature(HydrationFeatureKind.EventReplay, withEventReplay$1());
}
function withIncrementalHydration() {
	return hydrationFeature(HydrationFeatureKind.IncrementalHydration, withIncrementalHydration$1());
}
function withNoIncrementalHydration() {
	return hydrationFeature(HydrationFeatureKind.NoIncrementalHydration);
}
function provideEnabledBlockingInitialNavigationDetector() {
	return [{
		provide: ENVIRONMENT_INITIALIZER,
		useValue: () => {
			if (inject(IS_ENABLED_BLOCKING_INITIAL_NAVIGATION, { optional: true })) {
				const console = inject(Console);
				const message = formatRuntimeError(5001, "Configuration error: found both hydration and enabledBlocking initial navigation in the same application, which is a contradiction.");
				console.warn(message);
			}
		},
		multi: true
	}];
}
function provideClientHydration(...features) {
	const providers = [];
	const featuresKind = /* @__PURE__ */ new Set();
	for (const { ɵproviders, ɵkind } of features) {
		featuresKind.add(ɵkind);
		if (ɵproviders.length) providers.push(ɵproviders);
	}
	const hasHttpTransferCacheOptions = featuresKind.has(HydrationFeatureKind.HttpTransferCacheOptions);
	if (typeof ngDevMode !== "undefined" && ngDevMode) {
		if (featuresKind.has(HydrationFeatureKind.NoHttpTransferCache) && hasHttpTransferCacheOptions) throw new RuntimeError(5001, "Configuration error: found both withHttpTransferCacheOptions() and withNoHttpTransferCache() in the same call to provideClientHydration(), which is a contradiction.");
		if (featuresKind.has(HydrationFeatureKind.IncrementalHydration) && featuresKind.has(HydrationFeatureKind.NoIncrementalHydration)) throw new RuntimeError(5001, "Configuration error: found both withIncrementalHydration() and withNoIncrementalHydration() in the same call to provideClientHydration(), which is a contradiction.");
	}
	return makeEnvironmentProviders([
		typeof ngDevMode !== "undefined" && ngDevMode ? provideEnabledBlockingInitialNavigationDetector() : [],
		typeof ngDevMode !== "undefined" && ngDevMode ? provideStabilityDebugging() : [],
		withDomHydration(),
		featuresKind.has(HydrationFeatureKind.NoHttpTransferCache) || hasHttpTransferCacheOptions ? [] : withHttpTransferCache({}),
		featuresKind.has(HydrationFeatureKind.NoIncrementalHydration) ? [] : withIncrementalHydration$1(),
		providers,
		{
			provide: CACHE_ACTIVE,
			useValue: { isActive: true }
		},
		{
			provide: APP_BOOTSTRAP_LISTENER,
			multi: true,
			useFactory: () => {
				const appRef = inject(ApplicationRef);
				const cacheState = inject(CACHE_ACTIVE);
				return () => {
					appRef.whenStable().then(() => {
						cacheState.isActive = false;
					});
				};
			}
		}
	]);
}
var DomSanitizer = class {};
_DomSanitizer = DomSanitizer;
_defineProperty(DomSanitizer, "ɵfac", function DomSanitizer_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _DomSanitizer)();
});
_defineProperty(DomSanitizer, "ɵprov", /* @__PURE__ */ ɵɵdefineInjectable({
	token: _DomSanitizer,
	factory: function DomSanitizer_Factory(__ngFactoryType__) {
		let __ngConditionalFactory__ = null;
		if (__ngFactoryType__) __ngConditionalFactory__ = new (__ngFactoryType__ || _DomSanitizer)();
		else __ngConditionalFactory__ = ɵɵinject(DomSanitizerImpl);
		return __ngConditionalFactory__;
	},
	providedIn: "root"
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DomSanitizer, [{
		type: Injectable,
		args: [{
			providedIn: "root",
			useExisting: forwardRef(() => DomSanitizerImpl)
		}]
	}], null, null);
})();
var DomSanitizerImpl = class extends DomSanitizer {
	constructor(..._args) {
		super(..._args);
		_defineProperty(this, "_doc", inject(DOCUMENT));
	}
	sanitize(ctx, value) {
		if (value == null) return null;
		switch (ctx) {
			case SecurityContext.NONE: return value;
			case SecurityContext.HTML:
				if (allowSanitizationBypassAndThrow(value, "HTML")) return unwrapSafeValue(value);
				return _sanitizeHtml(this._doc, String(value)).toString();
			case SecurityContext.STYLE:
				if (allowSanitizationBypassAndThrow(value, "Style")) return unwrapSafeValue(value);
				return value;
			case SecurityContext.SCRIPT:
				if (allowSanitizationBypassAndThrow(value, "Script")) return unwrapSafeValue(value);
				throw new RuntimeError(5200, (typeof ngDevMode === "undefined" || ngDevMode) && "unsafe value used in a script context");
			case SecurityContext.URL:
				if (allowSanitizationBypassAndThrow(value, "URL")) return unwrapSafeValue(value);
				return _sanitizeUrl(String(value));
			case SecurityContext.RESOURCE_URL:
				if (allowSanitizationBypassAndThrow(value, "ResourceURL")) return unwrapSafeValue(value);
				throw new RuntimeError(-5201, (typeof ngDevMode === "undefined" || ngDevMode) && `unsafe value used in a resource URL context (see https://angular.dev/best-practices/security#preventing-cross-site-scripting-xss)`);
			default: throw new RuntimeError(5202, (typeof ngDevMode === "undefined" || ngDevMode) && `Unexpected SecurityContext ${ctx} (see https://angular.dev/best-practices/security#preventing-cross-site-scripting-xss)`);
		}
	}
	bypassSecurityTrustHtml(value) {
		return bypassSanitizationTrustHtml(value);
	}
	bypassSecurityTrustStyle(value) {
		return bypassSanitizationTrustStyle(value);
	}
	bypassSecurityTrustScript(value) {
		return bypassSanitizationTrustScript(value);
	}
	bypassSecurityTrustUrl(value) {
		return bypassSanitizationTrustUrl(value);
	}
	bypassSecurityTrustResourceUrl(value) {
		return bypassSanitizationTrustResourceUrl(value);
	}
};
_DomSanitizerImpl = DomSanitizerImpl;
_defineProperty(DomSanitizerImpl, "ɵfac", function DomSanitizerImpl_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _DomSanitizerImpl)();
});
_defineProperty(DomSanitizerImpl, "ɵprov", /* @__PURE__ */ ɵɵdefineService({
	token: _DomSanitizerImpl,
	factory: _DomSanitizerImpl.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DomSanitizerImpl, [{ type: Service }], null, null);
})();
var VERSION = /* @__PURE__ */ new Version("22.1.5");
//#endregion
export { BrowserModule, By, CssVarNamespacer, DomSanitizer, EVENT_MANAGER_PLUGINS, EventManager, EventManagerPlugin, HydrationFeatureKind, Meta, REMOVE_STYLES_ON_COMPONENT_DESTROY, Title, VERSION, bootstrapApplication, createApplication, disableDebugTools, enableDebugTools, platformBrowser, provideClientHydration, provideCssVarNamespacing, provideProtractorTestingSupport, withEventReplay, withHttpTransferCacheOptions, withI18nSupport, withIncrementalHydration, withNoHttpTransferCache, withNoIncrementalHydration, BrowserDomAdapter as ɵBrowserDomAdapter, BrowserGetTestability as ɵBrowserGetTestability, DomEventsPlugin as ɵDomEventsPlugin, DomRendererFactory2 as ɵDomRendererFactory2, DomSanitizerImpl as ɵDomSanitizerImpl, KeyEventsPlugin as ɵKeyEventsPlugin, SharedStylesHost as ɵSharedStylesHost, getDOM as ɵgetDOM };
