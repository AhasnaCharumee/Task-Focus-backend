"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
// Single emitter instance for in-process notification events
const notificationEmitter = new events_1.EventEmitter();
exports.default = notificationEmitter;
