// Event bus for communication between components
class EventBus {
    constructor() {
        this.events = {};
    }

    on(event, callback) {
        console.log(`EventBus: listener added for event: ${event}`);
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    off(event, callback) {
        console.log(`EventBus: listener removed for event: ${event}`);
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(cb => cb !== callback);
    }

    emit(event, data) {
        console.log(`EventBus: emitting event: ${event}`, data);
        if (!this.events[event]) return;
        this.events[event].forEach(callback => callback(data));
    }
}

const eventBus = new EventBus();
export default eventBus;
