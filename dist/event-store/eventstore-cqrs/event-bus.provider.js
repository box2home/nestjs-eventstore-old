"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const util_1 = require("util");
const cqrs_1 = require("@nestjs/cqrs");
const constants_1 = require("@nestjs/cqrs/dist/decorators/constants");
const event_store_bus_1 = require("./event-store.bus");
const event_store_class_1 = require("../event-store.class");
var EventStoreSubscriptionType;
(function (EventStoreSubscriptionType) {
    EventStoreSubscriptionType[EventStoreSubscriptionType["Persistent"] = 0] = "Persistent";
    EventStoreSubscriptionType[EventStoreSubscriptionType["CatchUp"] = 1] = "CatchUp";
})(EventStoreSubscriptionType = exports.EventStoreSubscriptionType || (exports.EventStoreSubscriptionType = {}));
let EventBusProvider = class EventBusProvider extends cqrs_1.ObservableBus {
    constructor(commandBus, moduleRef, eventStore, config) {
        super();
        this.commandBus = commandBus;
        this.moduleRef = moduleRef;
        this.eventStore = eventStore;
        this.config = config;
        this.subscriptions = [];
        this.useDefaultPublisher();
    }
    get publisher() {
        return this._publisher;
    }
    set publisher(_publisher) {
        this._publisher = _publisher;
    }
    onModuleDestroy() {
        this.subscriptions.forEach(subscription => subscription.unsubscribe());
    }
    publish(event, stream) {
        this._publisher.publish(event, stream);
    }
    publishWithMaxAge(event, stream) {
        this._publisher.publishWithMaxAge(event, stream);
    }
    publishAll(events) {
        (events || []).forEach(event => this._publisher.publish(event));
    }
    bind(handler, name) {
        const stream$ = name ? this.ofEventName(name) : this.subject$;
        const subscription = stream$.subscribe(event => handler.handle(event));
        this.subscriptions.push(subscription);
    }
    registerSagas(types = []) {
        const sagas = types
            .map((target) => {
            const metadata = Reflect.getMetadata(constants_1.SAGA_METADATA, target) || [];
            const instance = this.moduleRef.get(target, { strict: false });
            if (!instance) {
                throw new cqrs_1.InvalidSagaException();
            }
            return metadata.map((key) => instance[key]);
        })
            .reduce((a, b) => a.concat(b), []);
        sagas.forEach(saga => this.registerSaga(saga));
    }
    register(handlers = []) {
        handlers.forEach(handler => this.registerHandler(handler));
    }
    registerHandler(handler) {
        const instance = this.moduleRef.get(handler, { strict: false });
        if (!instance) {
            return;
        }
        const eventsNames = this.reflectEventsNames(handler);
        eventsNames.map(event => this.bind(instance, event.name));
    }
    ofEventName(name) {
        return this.subject$.pipe(operators_1.filter(event => this.getEventName(event) === name));
    }
    getEventName(event) {
        const { constructor } = Object.getPrototypeOf(event);
        return constructor.name;
    }
    registerSaga(saga) {
        if (!util_1.isFunction(saga)) {
            throw new cqrs_1.InvalidSagaException();
        }
        const stream$ = saga(this);
        if (!(stream$ instanceof rxjs_1.Observable)) {
            throw new cqrs_1.InvalidSagaException();
        }
        const subscription = stream$
            .pipe(operators_1.filter(e => !!e))
            .subscribe(command => this.commandBus.execute(command));
        this.subscriptions.push(subscription);
    }
    reflectEventsNames(handler) {
        return Reflect.getMetadata(constants_1.EVENTS_HANDLER_METADATA, handler);
    }
    useDefaultPublisher() {
        const pubSub = new event_store_bus_1.EventStoreBus(this.eventStore, this.subject$, this.config);
        this._publisher = pubSub;
    }
};
EventBusProvider = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [cqrs_1.CommandBus,
        core_1.ModuleRef,
        event_store_class_1.EventStore, Object])
], EventBusProvider);
exports.EventBusProvider = EventBusProvider;
