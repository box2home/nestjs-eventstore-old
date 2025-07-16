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
var EventStoreCqrsModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const event_bus_provider_1 = require("./event-bus.provider");
const event_store_class_1 = require("../event-store.class");
const explorer_service_1 = require("@nestjs/cqrs/dist/services/explorer.service");
const core_1 = require("@nestjs/core");
const event_store_module_1 = require("../event-store.module");
const event_publisher_1 = require("./event-publisher");
let EventStoreCqrsModule = EventStoreCqrsModule_1 = class EventStoreCqrsModule {
    constructor(explorerService, eventsBus, commandsBus, queryBus) {
        this.explorerService = explorerService;
        this.eventsBus = eventsBus;
        this.commandsBus = commandsBus;
        this.queryBus = queryBus;
    }
    onModuleInit() {
        const { events, queries, sagas, commands } = this.explorerService.explore();
        this.eventsBus.register(events);
        this.commandsBus.register(commands);
        this.queryBus.register(queries);
        this.eventsBus.registerSagas(sagas);
    }
    static forRootAsync(options, eventStoreBusConfig) {
        return {
            module: EventStoreCqrsModule_1,
            imports: [event_store_module_1.EventStoreModule.forRootAsync(options)],
            providers: [
                cqrs_1.CommandBus,
                cqrs_1.QueryBus,
                event_publisher_1.EventPublisher,
                explorer_service_1.ExplorerService,
                {
                    provide: cqrs_1.EventBus,
                    useFactory: (commandBus, moduleRef, eventStore) => {
                        return new event_bus_provider_1.EventBusProvider(commandBus, moduleRef, eventStore, eventStoreBusConfig);
                    },
                    inject: [cqrs_1.CommandBus, core_1.ModuleRef, event_store_class_1.EventStore],
                },
                {
                    provide: event_bus_provider_1.EventBusProvider,
                    useExisting: cqrs_1.EventBus,
                },
            ],
            exports: [
                event_store_module_1.EventStoreModule,
                event_bus_provider_1.EventBusProvider,
                cqrs_1.EventBus,
                cqrs_1.CommandBus,
                cqrs_1.QueryBus,
                explorer_service_1.ExplorerService,
                event_publisher_1.EventPublisher,
            ],
        };
    }
};
EventStoreCqrsModule = EventStoreCqrsModule_1 = __decorate([
    common_1.Global(),
    common_1.Module({}),
    __metadata("design:paramtypes", [explorer_service_1.ExplorerService,
        cqrs_1.EventBus,
        cqrs_1.CommandBus,
        cqrs_1.QueryBus])
], EventStoreCqrsModule);
exports.EventStoreCqrsModule = EventStoreCqrsModule;
