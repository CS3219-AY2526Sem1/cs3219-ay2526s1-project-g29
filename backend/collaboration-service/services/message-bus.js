export class MessageBus {
  constructor(channel, exchange) {
    this.channel = channel;
    this.exchange = exchange;
  }

  async publish(routingKey, payload) {
    if (!this.channel || !this.exchange) {
      return;
    }

    const buffer = Buffer.from(JSON.stringify(payload));
    const published = this.channel.publish(
      this.exchange,
      routingKey,
      buffer,
      {
        contentType: 'application/json',
        persistent: false,
      },
    );

    if (!published) {
      await new Promise((resolve) => this.channel.once('drain', resolve));
    }
  }
}

export class NoopMessageBus {
  async publish() {
    // intentionally left blank
  }
}
