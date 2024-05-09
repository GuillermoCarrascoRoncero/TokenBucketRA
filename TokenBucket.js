class TokenBucket {
    constructor(capacity, rate) {
        this.capacity = capacity; 
        this.tokens = capacity;   
        this.rate = rate;         
        this.lastRefill = Date.now();
    }

    tryConsume(tokens) {
        this.refill();
        if (this.tokens >= tokens) {
            this.tokens -= tokens;
            return true;
        }
        return false; 
    }

    refill() {
        const now = Date.now();
        const elapsedTime = (now - this.lastRefill) / 1000; 
        const newTokens = elapsedTime * this.rate;
        this.tokens = Math.min(this.capacity, this.tokens + newTokens); 
        this.lastRefill = now; 
    }
}

module.exports = TokenBucket;
