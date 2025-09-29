import crypto from 'crypto';

export function registerGlobalProperties() {
    globalThis.$md5 = (password) => {
        var md5 = crypto.createHash('md5');
        return md5.update(password).digest('hex');
    };
}