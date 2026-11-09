import { createHmac } from 'node:crypto';

const DEFAULT_TURN_PORT = 3478;
const DEFAULT_CREDENTIAL_TTL_SECONDS = 12 * 60 * 60;

const parsePort = (value) => {
    if (!value) return null;
    const port = Number(value);
    return Number.isInteger(port) && port > 0 && port <= 65535 ? port : null;
};

// Issues short-lived Coturn credentials using the TURN REST API scheme
// (coturn: use-auth-secret + static-auth-secret=<TURN_SHARED_SECRET>).
//
// Env:
//   TURN_SERVER_HOST             public hostname/IP of the Coturn server (required)
//   TURN_SHARED_SECRET           same value as static-auth-secret in turnserver.conf (required)
//   TURN_PORT                    plain TURN port, defaults to 3478
//   TURN_TLS_PORT                optional; when set, a turns: URL is also returned
//                                (requires cert/pkey configured in coturn)
//   TURN_CREDENTIAL_TTL_SECONDS  60..86400, defaults to 12h
export const getTurnCredentials = (req, res) => {
    const host = process.env.TURN_SERVER_HOST?.trim();
    const sharedSecret = process.env.TURN_SHARED_SECRET;
    const port = parsePort(process.env.TURN_PORT) ?? DEFAULT_TURN_PORT;
    const tlsPort = parsePort(process.env.TURN_TLS_PORT);
    const ttlSeconds = Number(
        process.env.TURN_CREDENTIAL_TTL_SECONDS || DEFAULT_CREDENTIAL_TTL_SECONDS
    );

    if (!host || !sharedSecret || !Number.isSafeInteger(ttlSeconds) || ttlSeconds < 60 || ttlSeconds > 86400) {
        return res.status(503).json({ error: 'TURN service is not configured' });
    }

    const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
    const username = `${expiresAt}:${req.user.id}`;
    const credential = createHmac('sha1', sharedSecret)
        .update(username)
        .digest('base64');

    const urls = [
        `turn:${host}:${port}?transport=udp`,
        `turn:${host}:${port}?transport=tcp`,
    ];
    if (tlsPort) {
        urls.push(`turns:${host}:${tlsPort}?transport=tcp`);
    }

    res.set('Cache-Control', 'no-store');

    return res.json({
        iceServers: [{ urls, username, credential }],
        expiresAt,
    });
};
