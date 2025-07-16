"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_eventstore_client_1 = require("node-eventstore-client");
const uuid_1 = require("uuid");
const common_1 = require("@nestjs/common");
const event_bus_provider_1 = require("./event-bus.provider");
class EventStoreBus {
    constructor(eventStore, subject$, config) {
        this.eventStore = eventStore;
        this.subject$ = subject$;
        this.logger = new common_1.Logger('EventStoreBus');
        this.catchupSubscriptions = [];
        this.configuredStreams = new Set();
        this.persistentSubscriptions = [];
        this.addEventHandlers(config.eventInstantiators);
        const catchupSubscriptions = config.subscriptions.filter((sub) => {
            return sub.type === event_bus_provider_1.EventStoreSubscriptionType.CatchUp;
        });
        const persistentSubscriptions = config.subscriptions.filter((sub) => {
            return sub.type === event_bus_provider_1.EventStoreSubscriptionType.Persistent;
        });
        this.subscribeToCatchUpSubscriptions(catchupSubscriptions);
        this.subscribeToPersistentSubscriptions(persistentSubscriptions);
    }
    subscribeToPersistentSubscriptions(subscriptions) {
        return __awaiter(this, void 0, void 0, function* () {
            this.persistentSubscriptionsCount = subscriptions.length;
            this.persistentSubscriptions = yield Promise.all(subscriptions.map((subscription) => __awaiter(this, void 0, void 0, function* () {
                return yield this.subscribeToPersistentSubscription(subscription.stream, subscription.persistentSubscriptionName);
            })));
        });
    }
    subscribeToCatchUpSubscriptions(subscriptions) {
        this.catchupSubscriptionsCount = subscriptions.length;
        this.catchupSubscriptions = subscriptions.map((subscription) => {
            return this.subscribeToCatchupSubscription(subscription.stream);
        });
    }
    get allCatchUpSubscriptionsLive() {
        const initialized = this.catchupSubscriptions.length === this.catchupSubscriptionsCount;
        return (initialized &&
            this.catchupSubscriptions.every((subscription) => {
                return !!subscription && subscription.isLive;
            }));
    }
    get allPersistentSubscriptionsLive() {
        const initialized = this.persistentSubscriptions.length === this.persistentSubscriptionsCount;
        return (initialized &&
            this.persistentSubscriptions.every((subscription) => {
                return !!subscription && subscription.isLive;
            }));
    }
    get isLive() {
        return (this.allCatchUpSubscriptionsLive && this.allPersistentSubscriptionsLive);
    }
    publish(event, stream) {
        return __awaiter(this, void 0, void 0, function* () {
            const payload = node_eventstore_client_1.createEventData(uuid_1.v4(), event.constructor.name, true, Buffer.from(JSON.stringify(event)));
            try {
                yield this.eventStore.getConnection().appendToStream(stream, -2, [payload]);
            }
            catch (err) {
                this.logger.error(err.message, err.stack);
            }
        });
    }
    publishWithMaxAge(event, streamName, maxAgeSeconds = 60) {
        return __awaiter(this, void 0, void 0, function* () {
            const payload = node_eventstore_client_1.createEventData(uuid_1.v4(), event.constructor.name, true, Buffer.from(JSON.stringify(event)));
            const conn = this.eventStore.getConnection();
            yield conn.appendToStream(streamName, -1, [payload]);
            if (!this.configuredStreams.has(streamName)) {
                const metadata = Buffer.from(JSON.stringify({ $maxAge: maxAgeSeconds }), 'utf8');
                yield conn.setStreamMetadataRaw(streamName, -2, metadata);
                this.configuredStreams.add(streamName);
                this.logger.log(`Configured stream ${streamName} with $maxAge = ${maxAgeSeconds}`);
            }
        });
    }
    publishAll(events, stream) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.eventStore.getConnection().appendToStream(stream, -2, (events || []).map((event) => node_eventstore_client_1.createEventData(uuid_1.v4(), event.constructor.name, true, Buffer.from(JSON.stringify(event)))));
            }
            catch (err) {
                this.logger.error(err);
            }
        });
    }
    subscribeToCatchupSubscription(stream) {
        this.logger.log(`Catching up and subscribing to stream ${stream}!`);
        try {
            return this.eventStore.getConnection().subscribeToStreamFrom(stream, 0, true, (sub, payload) => this.onEvent(sub, payload), subscription => this.onLiveProcessingStarted(subscription), (sub, reason, error) => this.onDropped(sub, reason, error));
        }
        catch (err) {
            this.logger.error(err.message, err.stack);
        }
    }
    subscribeToPersistentSubscription(stream, subscriptionName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const resolved = (yield this.eventStore.getConnection().connectToPersistentSubscription(stream, subscriptionName, (sub, payload) => this.onEvent(sub, payload), (sub, reason, error) => this.onDropped(sub, reason, error)));
                this.logger.log(`Connection to persistent subscription ${subscriptionName} on stream ${stream} established!`);
                resolved.isLive = true;
                return resolved;
            }
            catch (err) {
                this.logger.error(`[${stream}][${subscriptionName}] ${err.message}`, err.stack);
                this.reSubscribeToPersistentSubscription(stream, subscriptionName);
            }
        });
    }
    onEvent(_subscription, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const { event } = payload;
            if ((payload.link !== null && !payload.isResolved) || !event || !event.isJson) {
                this.logger.error(`${event.eventType} could not be resolved!`);
                return;
            }
            const handler = this.eventHandlers[event.eventType];
            if (!handler) {
                this.logger.error(`${event.eventType} could not be handled!`);
                return;
            }
            const data = Object.values(JSON.parse(event.data.toString()));
            this.subject$.next(this.eventHandlers[event.eventType](...data));
        });
    }
    onDropped(subscription, _reason, error) {
        subscription.isLive = false;
        this.logger.error(error.message, error.stack);
        if (subscription._subscriptionId != undefined)
            this.reSubscribeToPersistentSubscription(subscription._streamId, subscription._subscriptionId);
    }
    reSubscribeToPersistentSubscription(stream, subscriptionName) {
        this.logger.warn(`connecting to subscription ${subscriptionName} ${stream}. Retrying...`);
        setTimeout((stream, subscriptionName) => this.subscribeToPersistentSubscription(stream, subscriptionName), 3000, stream, subscriptionName);
    }
    onLiveProcessingStarted(subscription) {
        subscription.isLive = true;
        this.logger.log('Live processing of EventStore events started!');
    }
    addEventHandlers(eventHandlers) {
        this.eventHandlers = Object.assign(Object.assign({}, this.eventHandlers), eventHandlers);
    }
}
exports.EventStoreBus = EventStoreBus;
