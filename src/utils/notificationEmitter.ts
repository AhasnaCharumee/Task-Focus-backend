import { EventEmitter } from "events";

// Single emitter instance for in-process notification events
const notificationEmitter = new EventEmitter();

export default notificationEmitter;
