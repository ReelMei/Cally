import { createHmac } from 'node:crypto';

const TURN_PORT = 3478;
const DEFAULT_CREDENTIAL_TTL_SECONDS = 12 * 60 * 60;

export const getTurnCredentials = (req, res) => {
    const host = process.env.TURN_SERVER_HOST;
    const sharedSecret = process.env.TURN_SHARED_SECRET;
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

    res.set('Cache-Control', 'no-store');

    return res.json({
        iceServers: [
            {
                urls: [
                    `turn:${host}:${TURN_PORT}?transport=udp`,
                    `turn:${host}:${TURN_PORT}?transport=tcp`,
                ],
                username,
                credential,
            },
        ],
        expiresAt,
    });
};
