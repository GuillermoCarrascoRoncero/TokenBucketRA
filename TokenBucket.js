class TokenBucket {
    constructor(capacidad, rate) {
        this.capacidad = capacidad;
        this.tokens = capacidad;
        this.rate = rate;
        this.last = Date.now();
    }

    async consume(tokens) {
        await this.addToken();
        if (this.tokens >= tokens) {
            this.tokens -= tokens;
            return true;
        }
        return false;
    }

    async addToken() {
        const now = Date.now();
        const elapsedTime = (now - this.last) / 1000;
        const newTokens = elapsedTime * this.rate;
        this.tokens = Math.min(this.capacidad, this.tokens + newTokens);
        this.last = now;
    }
}

module.exports = TokenBucket;
