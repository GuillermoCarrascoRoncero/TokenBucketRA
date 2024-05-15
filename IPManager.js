const fs = require('fs');

class IPManager {
    constructor(limit, blockTime) {
        this.limit = limit; // Límite de solicitudes por IP
        this.blockTime = blockTime; // Tiempo de bloqueo ms
        this.requestCounts = new Map(); // Cont solicitudes IP
        this.lastResetTimes = new Map(); // Tiempos por IP
        this.blockedIPs = new Set(); // IPs bloqueadas
        this.whiteListIp = new Set(); // IPs whitelisteadas

        // Cargar listas negras y blancas desde archivos CSV al inicializar
        this.loadBlackList();
        this.loadWhiteList();
    }

    trackRequest(ip) {
        const now = Date.now();

        if (this.getBlockedIPs(ip)) {
            return false;
        }

        // Si es la primera solicitud o ha pasado el tiempo se reinicia el contador
        if (!this.requestCounts.has(ip) || (now - (this.lastResetTimes.get(ip) || 0)) > this.blockTime) {
            this.requestCounts.set(ip, 0);
            this.lastResetTimes.set(ip, now);
            return true;
        }

        const count = (this.requestCounts.get(ip) || 0) + 1;
        this.requestCounts.set(ip, count);

        // Si el num de solicitudes supera el limite, bloquear la IP
        if (count > this.limit) {
            this.setBlackList(ip);
            return false;
        }

        return true;
    }

    loadBlackList() {
        try {
            const data = fs.readFileSync('./db/blacklist.csv', 'utf8');
            const ips = data.split('\n').filter(ip => ip.trim() !== '');
            ips.forEach(ip => this.blockedIPs.add(ip));
            console.log('Lista negra cargada correctamente.');
        } catch (err) {
            console.error('Error al cargar la lista negra:', err);
        }
    }

    loadWhiteList() {
        try {
            const data = fs.readFileSync('./db/whitelist.csv', 'utf8');
            const ips = data.split('\n').filter(ip => ip.trim() !== '');
            ips.forEach(ip => this.whiteListIp.add(ip));
            console.log('Lista blanca cargada correctamente.');
        } catch (err) {
            console.error('Error al cargar la lista blanca:', err);
        }
    }

    saveBlackList() {
        try {
            const writer = fs.createWriteStream('./db/blacklist.csv');
            const ips = Array.from(this.blockedIPs);
            ips.forEach(ip => writer.write(ip + '\n'));
            writer.end();
            console.log('Lista negra guardada correctamente.');
        } catch (err) {
            console.error('Error al guardar lista negra:', err);
        }
    }

    saveWhiteList() {
        try {
            const writer = fs.createWriteStream('./db/whitelist.csv');
            const ips = Array.from(this.whiteListIp);
            ips.forEach(ip => writer.write(ip + '\n'));
            writer.end();
            console.log('Lista blanca guardada correctamente.');
        } catch (err) {
            console.error('Error al guardar lista blanca:', err);
        }
    }

    setBlackList(ip) {
        this.blockedIPs.add(ip);
        this.saveBlackList();
    }

    setWhiteList(ip) {
        this.whiteListIp.add(ip);
        this.saveWhiteList();
    }

    getWhiteList(ip) {
        return this.whiteListIp.has(ip);
    }

    getBlockedIPs(ip) {
        return this.blockedIPs.has(ip);
    }
}

module.exports = IPManager;
