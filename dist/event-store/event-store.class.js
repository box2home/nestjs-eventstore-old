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
const common_1 = require("@nestjs/common");
class EventStore {
    constructor(settings, endpoint) {
        this.settings = settings;
        this.endpoint = endpoint;
        this.isConnected = false;
        this.logger = new common_1.Logger(this.constructor.name);
        this.retryAttempts = 0;
        this.connect();
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            this.connection = node_eventstore_client_1.createConnection(this.settings, this.endpoint);
            this.connection.connect();
            this.connection.on('connected', () => {
                this.logger.log('Connection to EventStore established!');
                this.retryAttempts = 0;
                this.isConnected = true;
            });
            this.connection.on('closed', () => {
                this.logger.error(`Connection to EventStore closed! reconnecting attempt(${this.retryAttempts})...`);
                this.retryAttempts += 1;
                this.isConnected = false;
                this.connect();
            });
        });
    }
    getConnection() {
        return this.connection;
    }
    close() {
        this.connection.close();
    }
}
exports.EventStore = EventStore;
