"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var EventStoreModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const event_store_class_1 = require("./event-store.class");
let EventStoreModule = EventStoreModule_1 = class EventStoreModule {
    static forRoot(settings, endpoint) {
        return {
            module: EventStoreModule_1,
            providers: [
                {
                    provide: event_store_class_1.EventStore,
                    useFactory: () => {
                        return new event_store_class_1.EventStore(settings, endpoint);
                    },
                },
            ],
            exports: [event_store_class_1.EventStore],
        };
    }
    static forRootAsync(options) {
        return {
            module: EventStoreModule_1,
            providers: [
                {
                    provide: event_store_class_1.EventStore,
                    useFactory: (...args) => __awaiter(this, void 0, void 0, function* () {
                        const { connectionSettings, endpoint } = yield options.useFactory(...args);
                        return new event_store_class_1.EventStore(connectionSettings, endpoint);
                    }),
                    inject: options.inject,
                },
            ],
            exports: [event_store_class_1.EventStore],
        };
    }
};
EventStoreModule = EventStoreModule_1 = __decorate([
    common_1.Global(),
    common_1.Module({
        providers: [event_store_class_1.EventStore],
        exports: [event_store_class_1.EventStore],
    })
], EventStoreModule);
exports.EventStoreModule = EventStoreModule;
