const HEX_CHARS = "0123456789abcdef".split("");
const EXTRA = [
    -2147483648,
    8388608,
    32768,
    128
];
const SHIFT = [
    24,
    16,
    8,
    0
];
// deno-fmt-ignore
const K = [
    0x428a2f98,
    0x71374491,
    0xb5c0fbcf,
    0xe9b5dba5,
    0x3956c25b,
    0x59f111f1,
    0x923f82a4,
    0xab1c5ed5,
    0xd807aa98,
    0x12835b01,
    0x243185be,
    0x550c7dc3,
    0x72be5d74,
    0x80deb1fe,
    0x9bdc06a7,
    0xc19bf174,
    0xe49b69c1,
    0xefbe4786,
    0x0fc19dc6,
    0x240ca1cc,
    0x2de92c6f,
    0x4a7484aa,
    0x5cb0a9dc,
    0x76f988da,
    0x983e5152,
    0xa831c66d,
    0xb00327c8,
    0xbf597fc7,
    0xc6e00bf3,
    0xd5a79147,
    0x06ca6351,
    0x14292967,
    0x27b70a85,
    0x2e1b2138,
    0x4d2c6dfc,
    0x53380d13,
    0x650a7354,
    0x766a0abb,
    0x81c2c92e,
    0x92722c85,
    0xa2bfe8a1,
    0xa81a664b,
    0xc24b8b70,
    0xc76c51a3,
    0xd192e819,
    0xd6990624,
    0xf40e3585,
    0x106aa070,
    0x19a4c116,
    0x1e376c08,
    0x2748774c,
    0x34b0bcb5,
    0x391c0cb3,
    0x4ed8aa4a,
    0x5b9cca4f,
    0x682e6ff3,
    0x748f82ee,
    0x78a5636f,
    0x84c87814,
    0x8cc70208,
    0x90befffa,
    0xa4506ceb,
    0xbef9a3f7,
    0xc67178f2, 
];
const blocks = [];
export class Sha256 {
    #block;
    #blocks;
    #bytes;
    #finalized;
    #first;
    #h0;
    #h1;
    #h2;
    #h3;
    #h4;
    #h5;
    #h6;
    #h7;
    #hashed;
    #hBytes;
    #is224;
    #lastByteIndex = 0;
    #start;
    constructor(is224 = false, sharedMemory = false){
        this.init(is224, sharedMemory);
    }
    init(is224, sharedMemory) {
        if (sharedMemory) {
            // deno-fmt-ignore
            blocks[0] = blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
            this.#blocks = blocks;
        } else {
            this.#blocks = [
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0
            ];
        }
        if (is224) {
            this.#h0 = 0xc1059ed8;
            this.#h1 = 0x367cd507;
            this.#h2 = 0x3070dd17;
            this.#h3 = 0xf70e5939;
            this.#h4 = 0xffc00b31;
            this.#h5 = 0x68581511;
            this.#h6 = 0x64f98fa7;
            this.#h7 = 0xbefa4fa4;
        } else {
            // 256
            this.#h0 = 0x6a09e667;
            this.#h1 = 0xbb67ae85;
            this.#h2 = 0x3c6ef372;
            this.#h3 = 0xa54ff53a;
            this.#h4 = 0x510e527f;
            this.#h5 = 0x9b05688c;
            this.#h6 = 0x1f83d9ab;
            this.#h7 = 0x5be0cd19;
        }
        this.#block = this.#start = this.#bytes = this.#hBytes = 0;
        this.#finalized = this.#hashed = false;
        this.#first = true;
        this.#is224 = is224;
    }
    /** Update hash
   *
   * @param message The message you want to hash.
   */ update(message) {
        if (this.#finalized) {
            return this;
        }
        let msg;
        if (message instanceof ArrayBuffer) {
            msg = new Uint8Array(message);
        } else {
            msg = message;
        }
        let index = 0;
        const length = msg.length;
        const blocks = this.#blocks;
        while(index < length){
            let i;
            if (this.#hashed) {
                this.#hashed = false;
                blocks[0] = this.#block;
                // deno-fmt-ignore
                blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
            }
            if (typeof msg !== "string") {
                for(i = this.#start; index < length && i < 64; ++index){
                    blocks[i >> 2] |= msg[index] << SHIFT[(i++) & 3];
                }
            } else {
                for(i = this.#start; index < length && i < 64; ++index){
                    let code = msg.charCodeAt(index);
                    if (code < 0x80) {
                        blocks[i >> 2] |= code << SHIFT[(i++) & 3];
                    } else if (code < 0x800) {
                        blocks[i >> 2] |= (0xc0 | code >> 6) << SHIFT[(i++) & 3];
                        blocks[i >> 2] |= (0x80 | code & 0x3f) << SHIFT[(i++) & 3];
                    } else if (code < 0xd800 || code >= 0xe000) {
                        blocks[i >> 2] |= (0xe0 | code >> 12) << SHIFT[(i++) & 3];
                        blocks[i >> 2] |= (0x80 | code >> 6 & 0x3f) << SHIFT[(i++) & 3];
                        blocks[i >> 2] |= (0x80 | code & 0x3f) << SHIFT[(i++) & 3];
                    } else {
                        code = 0x10000 + ((code & 0x3ff) << 10 | msg.charCodeAt(++index) & 0x3ff);
                        blocks[i >> 2] |= (0xf0 | code >> 18) << SHIFT[(i++) & 3];
                        blocks[i >> 2] |= (0x80 | code >> 12 & 0x3f) << SHIFT[(i++) & 3];
                        blocks[i >> 2] |= (0x80 | code >> 6 & 0x3f) << SHIFT[(i++) & 3];
                        blocks[i >> 2] |= (0x80 | code & 0x3f) << SHIFT[(i++) & 3];
                    }
                }
            }
            this.#lastByteIndex = i;
            this.#bytes += i - this.#start;
            if (i >= 64) {
                this.#block = blocks[16];
                this.#start = i - 64;
                this.hash();
                this.#hashed = true;
            } else {
                this.#start = i;
            }
        }
        if (this.#bytes > 4294967295) {
            this.#hBytes += this.#bytes / 4294967296 << 0;
            this.#bytes = this.#bytes % 4294967296;
        }
        return this;
    }
    finalize() {
        if (this.#finalized) {
            return;
        }
        this.#finalized = true;
        const blocks = this.#blocks;
        const i = this.#lastByteIndex;
        blocks[16] = this.#block;
        blocks[i >> 2] |= EXTRA[i & 3];
        this.#block = blocks[16];
        if (i >= 56) {
            if (!this.#hashed) {
                this.hash();
            }
            blocks[0] = this.#block;
            // deno-fmt-ignore
            blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
        }
        blocks[14] = this.#hBytes << 3 | this.#bytes >>> 29;
        blocks[15] = this.#bytes << 3;
        this.hash();
    }
    hash() {
        let a = this.#h0;
        let b = this.#h1;
        let c = this.#h2;
        let d = this.#h3;
        let e = this.#h4;
        let f = this.#h5;
        let g = this.#h6;
        let h = this.#h7;
        const blocks = this.#blocks;
        let s0;
        let s1;
        let maj;
        let t1;
        let t2;
        let ch;
        let ab;
        let da;
        let cd;
        let bc;
        for(let j = 16; j < 64; ++j){
            // rightrotate
            t1 = blocks[j - 15];
            s0 = (t1 >>> 7 | t1 << 25) ^ (t1 >>> 18 | t1 << 14) ^ t1 >>> 3;
            t1 = blocks[j - 2];
            s1 = (t1 >>> 17 | t1 << 15) ^ (t1 >>> 19 | t1 << 13) ^ t1 >>> 10;
            blocks[j] = blocks[j - 16] + s0 + blocks[j - 7] + s1 << 0;
        }
        bc = b & c;
        for(let j1 = 0; j1 < 64; j1 += 4){
            if (this.#first) {
                if (this.#is224) {
                    ab = 300032;
                    t1 = blocks[0] - 1413257819;
                    h = t1 - 150054599 << 0;
                    d = t1 + 24177077 << 0;
                } else {
                    ab = 704751109;
                    t1 = blocks[0] - 210244248;
                    h = t1 - 1521486534 << 0;
                    d = t1 + 143694565 << 0;
                }
                this.#first = false;
            } else {
                s0 = (a >>> 2 | a << 30) ^ (a >>> 13 | a << 19) ^ (a >>> 22 | a << 10);
                s1 = (e >>> 6 | e << 26) ^ (e >>> 11 | e << 21) ^ (e >>> 25 | e << 7);
                ab = a & b;
                maj = ab ^ a & c ^ bc;
                ch = e & f ^ ~e & g;
                t1 = h + s1 + ch + K[j1] + blocks[j1];
                t2 = s0 + maj;
                h = d + t1 << 0;
                d = t1 + t2 << 0;
            }
            s0 = (d >>> 2 | d << 30) ^ (d >>> 13 | d << 19) ^ (d >>> 22 | d << 10);
            s1 = (h >>> 6 | h << 26) ^ (h >>> 11 | h << 21) ^ (h >>> 25 | h << 7);
            da = d & a;
            maj = da ^ d & b ^ ab;
            ch = h & e ^ ~h & f;
            t1 = g + s1 + ch + K[j1 + 1] + blocks[j1 + 1];
            t2 = s0 + maj;
            g = c + t1 << 0;
            c = t1 + t2 << 0;
            s0 = (c >>> 2 | c << 30) ^ (c >>> 13 | c << 19) ^ (c >>> 22 | c << 10);
            s1 = (g >>> 6 | g << 26) ^ (g >>> 11 | g << 21) ^ (g >>> 25 | g << 7);
            cd = c & d;
            maj = cd ^ c & a ^ da;
            ch = g & h ^ ~g & e;
            t1 = f + s1 + ch + K[j1 + 2] + blocks[j1 + 2];
            t2 = s0 + maj;
            f = b + t1 << 0;
            b = t1 + t2 << 0;
            s0 = (b >>> 2 | b << 30) ^ (b >>> 13 | b << 19) ^ (b >>> 22 | b << 10);
            s1 = (f >>> 6 | f << 26) ^ (f >>> 11 | f << 21) ^ (f >>> 25 | f << 7);
            bc = b & c;
            maj = bc ^ b & d ^ cd;
            ch = f & g ^ ~f & h;
            t1 = e + s1 + ch + K[j1 + 3] + blocks[j1 + 3];
            t2 = s0 + maj;
            e = a + t1 << 0;
            a = t1 + t2 << 0;
        }
        this.#h0 = this.#h0 + a << 0;
        this.#h1 = this.#h1 + b << 0;
        this.#h2 = this.#h2 + c << 0;
        this.#h3 = this.#h3 + d << 0;
        this.#h4 = this.#h4 + e << 0;
        this.#h5 = this.#h5 + f << 0;
        this.#h6 = this.#h6 + g << 0;
        this.#h7 = this.#h7 + h << 0;
    }
    /** Return hash in hex string. */ hex() {
        this.finalize();
        const h0 = this.#h0;
        const h1 = this.#h1;
        const h2 = this.#h2;
        const h3 = this.#h3;
        const h4 = this.#h4;
        const h5 = this.#h5;
        const h6 = this.#h6;
        const h7 = this.#h7;
        let hex = HEX_CHARS[h0 >> 28 & 0x0f] + HEX_CHARS[h0 >> 24 & 0x0f] + HEX_CHARS[h0 >> 20 & 0x0f] + HEX_CHARS[h0 >> 16 & 0x0f] + HEX_CHARS[h0 >> 12 & 0x0f] + HEX_CHARS[h0 >> 8 & 0x0f] + HEX_CHARS[h0 >> 4 & 0x0f] + HEX_CHARS[h0 & 0x0f] + HEX_CHARS[h1 >> 28 & 0x0f] + HEX_CHARS[h1 >> 24 & 0x0f] + HEX_CHARS[h1 >> 20 & 0x0f] + HEX_CHARS[h1 >> 16 & 0x0f] + HEX_CHARS[h1 >> 12 & 0x0f] + HEX_CHARS[h1 >> 8 & 0x0f] + HEX_CHARS[h1 >> 4 & 0x0f] + HEX_CHARS[h1 & 0x0f] + HEX_CHARS[h2 >> 28 & 0x0f] + HEX_CHARS[h2 >> 24 & 0x0f] + HEX_CHARS[h2 >> 20 & 0x0f] + HEX_CHARS[h2 >> 16 & 0x0f] + HEX_CHARS[h2 >> 12 & 0x0f] + HEX_CHARS[h2 >> 8 & 0x0f] + HEX_CHARS[h2 >> 4 & 0x0f] + HEX_CHARS[h2 & 0x0f] + HEX_CHARS[h3 >> 28 & 0x0f] + HEX_CHARS[h3 >> 24 & 0x0f] + HEX_CHARS[h3 >> 20 & 0x0f] + HEX_CHARS[h3 >> 16 & 0x0f] + HEX_CHARS[h3 >> 12 & 0x0f] + HEX_CHARS[h3 >> 8 & 0x0f] + HEX_CHARS[h3 >> 4 & 0x0f] + HEX_CHARS[h3 & 0x0f] + HEX_CHARS[h4 >> 28 & 0x0f] + HEX_CHARS[h4 >> 24 & 0x0f] + HEX_CHARS[h4 >> 20 & 0x0f] + HEX_CHARS[h4 >> 16 & 0x0f] + HEX_CHARS[h4 >> 12 & 0x0f] + HEX_CHARS[h4 >> 8 & 0x0f] + HEX_CHARS[h4 >> 4 & 0x0f] + HEX_CHARS[h4 & 0x0f] + HEX_CHARS[h5 >> 28 & 0x0f] + HEX_CHARS[h5 >> 24 & 0x0f] + HEX_CHARS[h5 >> 20 & 0x0f] + HEX_CHARS[h5 >> 16 & 0x0f] + HEX_CHARS[h5 >> 12 & 0x0f] + HEX_CHARS[h5 >> 8 & 0x0f] + HEX_CHARS[h5 >> 4 & 0x0f] + HEX_CHARS[h5 & 0x0f] + HEX_CHARS[h6 >> 28 & 0x0f] + HEX_CHARS[h6 >> 24 & 0x0f] + HEX_CHARS[h6 >> 20 & 0x0f] + HEX_CHARS[h6 >> 16 & 0x0f] + HEX_CHARS[h6 >> 12 & 0x0f] + HEX_CHARS[h6 >> 8 & 0x0f] + HEX_CHARS[h6 >> 4 & 0x0f] + HEX_CHARS[h6 & 0x0f];
        if (!this.#is224) {
            hex += HEX_CHARS[h7 >> 28 & 0x0f] + HEX_CHARS[h7 >> 24 & 0x0f] + HEX_CHARS[h7 >> 20 & 0x0f] + HEX_CHARS[h7 >> 16 & 0x0f] + HEX_CHARS[h7 >> 12 & 0x0f] + HEX_CHARS[h7 >> 8 & 0x0f] + HEX_CHARS[h7 >> 4 & 0x0f] + HEX_CHARS[h7 & 0x0f];
        }
        return hex;
    }
    /** Return hash in hex string. */ toString() {
        return this.hex();
    }
    /** Return hash in integer array. */ digest() {
        this.finalize();
        const h0 = this.#h0;
        const h1 = this.#h1;
        const h2 = this.#h2;
        const h3 = this.#h3;
        const h4 = this.#h4;
        const h5 = this.#h5;
        const h6 = this.#h6;
        const h7 = this.#h7;
        const arr = [
            h0 >> 24 & 0xff,
            h0 >> 16 & 0xff,
            h0 >> 8 & 0xff,
            h0 & 0xff,
            h1 >> 24 & 0xff,
            h1 >> 16 & 0xff,
            h1 >> 8 & 0xff,
            h1 & 0xff,
            h2 >> 24 & 0xff,
            h2 >> 16 & 0xff,
            h2 >> 8 & 0xff,
            h2 & 0xff,
            h3 >> 24 & 0xff,
            h3 >> 16 & 0xff,
            h3 >> 8 & 0xff,
            h3 & 0xff,
            h4 >> 24 & 0xff,
            h4 >> 16 & 0xff,
            h4 >> 8 & 0xff,
            h4 & 0xff,
            h5 >> 24 & 0xff,
            h5 >> 16 & 0xff,
            h5 >> 8 & 0xff,
            h5 & 0xff,
            h6 >> 24 & 0xff,
            h6 >> 16 & 0xff,
            h6 >> 8 & 0xff,
            h6 & 0xff, 
        ];
        if (!this.#is224) {
            arr.push(h7 >> 24 & 0xff, h7 >> 16 & 0xff, h7 >> 8 & 0xff, h7 & 0xff);
        }
        return arr;
    }
    /** Return hash in integer array. */ array() {
        return this.digest();
    }
    /** Return hash in ArrayBuffer. */ arrayBuffer() {
        this.finalize();
        const buffer = new ArrayBuffer(this.#is224 ? 28 : 32);
        const dataView = new DataView(buffer);
        dataView.setUint32(0, this.#h0);
        dataView.setUint32(4, this.#h1);
        dataView.setUint32(8, this.#h2);
        dataView.setUint32(12, this.#h3);
        dataView.setUint32(16, this.#h4);
        dataView.setUint32(20, this.#h5);
        dataView.setUint32(24, this.#h6);
        if (!this.#is224) {
            dataView.setUint32(28, this.#h7);
        }
        return buffer;
    }
}
export class HmacSha256 extends Sha256 {
    #inner;
    #is224;
    #oKeyPad;
    #sharedMemory;
    constructor(secretKey, is224 = false, sharedMemory = false){
        super(is224, sharedMemory);
        let key;
        if (typeof secretKey === "string") {
            const bytes = [];
            const length = secretKey.length;
            let index = 0;
            for(let i = 0; i < length; ++i){
                let code = secretKey.charCodeAt(i);
                if (code < 0x80) {
                    bytes[index++] = code;
                } else if (code < 0x800) {
                    bytes[index++] = 0xc0 | code >> 6;
                    bytes[index++] = 0x80 | code & 0x3f;
                } else if (code < 0xd800 || code >= 0xe000) {
                    bytes[index++] = 0xe0 | code >> 12;
                    bytes[index++] = 0x80 | code >> 6 & 0x3f;
                    bytes[index++] = 0x80 | code & 0x3f;
                } else {
                    code = 0x10000 + ((code & 0x3ff) << 10 | secretKey.charCodeAt(++i) & 0x3ff);
                    bytes[index++] = 0xf0 | code >> 18;
                    bytes[index++] = 0x80 | code >> 12 & 0x3f;
                    bytes[index++] = 0x80 | code >> 6 & 0x3f;
                    bytes[index++] = 0x80 | code & 0x3f;
                }
            }
            key = bytes;
        } else {
            if (secretKey instanceof ArrayBuffer) {
                key = new Uint8Array(secretKey);
            } else {
                key = secretKey;
            }
        }
        if (key.length > 64) {
            key = new Sha256(is224, true).update(key).array();
        }
        const oKeyPad = [];
        const iKeyPad = [];
        for(let i1 = 0; i1 < 64; ++i1){
            const b = key[i1] || 0;
            oKeyPad[i1] = 0x5c ^ b;
            iKeyPad[i1] = 0x36 ^ b;
        }
        this.update(iKeyPad);
        this.#oKeyPad = oKeyPad;
        this.#inner = true;
        this.#is224 = is224;
        this.#sharedMemory = sharedMemory;
    }
    finalize() {
        super.finalize();
        if (this.#inner) {
            this.#inner = false;
            const innerHash = this.array();
            super.init(this.#is224, this.#sharedMemory);
            this.update(this.#oKeyPad);
            this.update(innerHash);
            super.finalize();
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjY3LjAvaGFzaC9zaGEyNTYudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIEFkYXB0ZWQgdG8gZGVubyBmcm9tOlxuICpcbiAqIFtqcy1zaGEyNTZde0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9lbW4xNzgvanMtc2hhMjU2fVxuICpcbiAqIEB2ZXJzaW9uIDAuOS4wXG4gKiBAYXV0aG9yIENoZW4sIFlpLUN5dWFuIFtlbW4xNzhAZ21haWwuY29tXVxuICogQGNvcHlyaWdodCBDaGVuLCBZaS1DeXVhbiAyMDE0LTIwMTdcbiAqIEBsaWNlbnNlIE1JVFxuICovXG5cbmV4cG9ydCB0eXBlIE1lc3NhZ2UgPSBzdHJpbmcgfCBudW1iZXJbXSB8IEFycmF5QnVmZmVyO1xuXG5jb25zdCBIRVhfQ0hBUlMgPSBcIjAxMjM0NTY3ODlhYmNkZWZcIi5zcGxpdChcIlwiKTtcbmNvbnN0IEVYVFJBID0gWy0yMTQ3NDgzNjQ4LCA4Mzg4NjA4LCAzMjc2OCwgMTI4XSBhcyBjb25zdDtcbmNvbnN0IFNISUZUID0gWzI0LCAxNiwgOCwgMF0gYXMgY29uc3Q7XG4vLyBkZW5vLWZtdC1pZ25vcmVcbmNvbnN0IEsgPSBbXG4gIDB4NDI4YTJmOTgsIDB4NzEzNzQ0OTEsIDB4YjVjMGZiY2YsIDB4ZTliNWRiYTUsIDB4Mzk1NmMyNWIsIDB4NTlmMTExZjEsXG4gIDB4OTIzZjgyYTQsIDB4YWIxYzVlZDUsIDB4ZDgwN2FhOTgsIDB4MTI4MzViMDEsIDB4MjQzMTg1YmUsIDB4NTUwYzdkYzMsXG4gIDB4NzJiZTVkNzQsIDB4ODBkZWIxZmUsIDB4OWJkYzA2YTcsIDB4YzE5YmYxNzQsIDB4ZTQ5YjY5YzEsIDB4ZWZiZTQ3ODYsXG4gIDB4MGZjMTlkYzYsIDB4MjQwY2ExY2MsIDB4MmRlOTJjNmYsIDB4NGE3NDg0YWEsIDB4NWNiMGE5ZGMsIDB4NzZmOTg4ZGEsXG4gIDB4OTgzZTUxNTIsIDB4YTgzMWM2NmQsIDB4YjAwMzI3YzgsIDB4YmY1OTdmYzcsIDB4YzZlMDBiZjMsIDB4ZDVhNzkxNDcsXG4gIDB4MDZjYTYzNTEsIDB4MTQyOTI5NjcsIDB4MjdiNzBhODUsIDB4MmUxYjIxMzgsIDB4NGQyYzZkZmMsIDB4NTMzODBkMTMsXG4gIDB4NjUwYTczNTQsIDB4NzY2YTBhYmIsIDB4ODFjMmM5MmUsIDB4OTI3MjJjODUsIDB4YTJiZmU4YTEsIDB4YTgxYTY2NGIsXG4gIDB4YzI0YjhiNzAsIDB4Yzc2YzUxYTMsIDB4ZDE5MmU4MTksIDB4ZDY5OTA2MjQsIDB4ZjQwZTM1ODUsIDB4MTA2YWEwNzAsXG4gIDB4MTlhNGMxMTYsIDB4MWUzNzZjMDgsIDB4Mjc0ODc3NGMsIDB4MzRiMGJjYjUsIDB4MzkxYzBjYjMsIDB4NGVkOGFhNGEsXG4gIDB4NWI5Y2NhNGYsIDB4NjgyZTZmZjMsIDB4NzQ4ZjgyZWUsIDB4NzhhNTYzNmYsIDB4ODRjODc4MTQsIDB4OGNjNzAyMDgsXG4gIDB4OTBiZWZmZmEsIDB4YTQ1MDZjZWIsIDB4YmVmOWEzZjcsIDB4YzY3MTc4ZjIsXG5dIGFzIGNvbnN0O1xuXG5jb25zdCBibG9ja3M6IG51bWJlcltdID0gW107XG5cbmV4cG9ydCBjbGFzcyBTaGEyNTYge1xuICAjYmxvY2shOiBudW1iZXI7XG4gICNibG9ja3MhOiBudW1iZXJbXTtcbiAgI2J5dGVzITogbnVtYmVyO1xuICAjZmluYWxpemVkITogYm9vbGVhbjtcbiAgI2ZpcnN0ITogYm9vbGVhbjtcbiAgI2gwITogbnVtYmVyO1xuICAjaDEhOiBudW1iZXI7XG4gICNoMiE6IG51bWJlcjtcbiAgI2gzITogbnVtYmVyO1xuICAjaDQhOiBudW1iZXI7XG4gICNoNSE6IG51bWJlcjtcbiAgI2g2ITogbnVtYmVyO1xuICAjaDchOiBudW1iZXI7XG4gICNoYXNoZWQhOiBib29sZWFuO1xuICAjaEJ5dGVzITogbnVtYmVyO1xuICAjaXMyMjQhOiBib29sZWFuO1xuICAjbGFzdEJ5dGVJbmRleCA9IDA7XG4gICNzdGFydCE6IG51bWJlcjtcblxuICBjb25zdHJ1Y3RvcihpczIyNCA9IGZhbHNlLCBzaGFyZWRNZW1vcnkgPSBmYWxzZSkge1xuICAgIHRoaXMuaW5pdChpczIyNCwgc2hhcmVkTWVtb3J5KTtcbiAgfVxuXG4gIHByb3RlY3RlZCBpbml0KGlzMjI0OiBib29sZWFuLCBzaGFyZWRNZW1vcnk6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICBpZiAoc2hhcmVkTWVtb3J5KSB7XG4gICAgICAvLyBkZW5vLWZtdC1pZ25vcmVcbiAgICAgIGJsb2Nrc1swXSA9IGJsb2Nrc1sxNl0gPSBibG9ja3NbMV0gPSBibG9ja3NbMl0gPSBibG9ja3NbM10gPSBibG9ja3NbNF0gPSBibG9ja3NbNV0gPSBibG9ja3NbNl0gPSBibG9ja3NbN10gPSBibG9ja3NbOF0gPSBibG9ja3NbOV0gPSBibG9ja3NbMTBdID0gYmxvY2tzWzExXSA9IGJsb2Nrc1sxMl0gPSBibG9ja3NbMTNdID0gYmxvY2tzWzE0XSA9IGJsb2Nrc1sxNV0gPSAwO1xuICAgICAgdGhpcy4jYmxvY2tzID0gYmxvY2tzO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLiNibG9ja3MgPSBbMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMF07XG4gICAgfVxuXG4gICAgaWYgKGlzMjI0KSB7XG4gICAgICB0aGlzLiNoMCA9IDB4YzEwNTllZDg7XG4gICAgICB0aGlzLiNoMSA9IDB4MzY3Y2Q1MDc7XG4gICAgICB0aGlzLiNoMiA9IDB4MzA3MGRkMTc7XG4gICAgICB0aGlzLiNoMyA9IDB4ZjcwZTU5Mzk7XG4gICAgICB0aGlzLiNoNCA9IDB4ZmZjMDBiMzE7XG4gICAgICB0aGlzLiNoNSA9IDB4Njg1ODE1MTE7XG4gICAgICB0aGlzLiNoNiA9IDB4NjRmOThmYTc7XG4gICAgICB0aGlzLiNoNyA9IDB4YmVmYTRmYTQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIDI1NlxuICAgICAgdGhpcy4jaDAgPSAweDZhMDllNjY3O1xuICAgICAgdGhpcy4jaDEgPSAweGJiNjdhZTg1O1xuICAgICAgdGhpcy4jaDIgPSAweDNjNmVmMzcyO1xuICAgICAgdGhpcy4jaDMgPSAweGE1NGZmNTNhO1xuICAgICAgdGhpcy4jaDQgPSAweDUxMGU1MjdmO1xuICAgICAgdGhpcy4jaDUgPSAweDliMDU2ODhjO1xuICAgICAgdGhpcy4jaDYgPSAweDFmODNkOWFiO1xuICAgICAgdGhpcy4jaDcgPSAweDViZTBjZDE5O1xuICAgIH1cblxuICAgIHRoaXMuI2Jsb2NrID0gdGhpcy4jc3RhcnQgPSB0aGlzLiNieXRlcyA9IHRoaXMuI2hCeXRlcyA9IDA7XG4gICAgdGhpcy4jZmluYWxpemVkID0gdGhpcy4jaGFzaGVkID0gZmFsc2U7XG4gICAgdGhpcy4jZmlyc3QgPSB0cnVlO1xuICAgIHRoaXMuI2lzMjI0ID0gaXMyMjQ7XG4gIH1cblxuICAvKiogVXBkYXRlIGhhc2hcbiAgICpcbiAgICogQHBhcmFtIG1lc3NhZ2UgVGhlIG1lc3NhZ2UgeW91IHdhbnQgdG8gaGFzaC5cbiAgICovXG4gIHVwZGF0ZShtZXNzYWdlOiBNZXNzYWdlKTogdGhpcyB7XG4gICAgaWYgKHRoaXMuI2ZpbmFsaXplZCkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgbGV0IG1zZzogc3RyaW5nIHwgbnVtYmVyW10gfCBVaW50OEFycmF5IHwgdW5kZWZpbmVkO1xuICAgIGlmIChtZXNzYWdlIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICAgIG1zZyA9IG5ldyBVaW50OEFycmF5KG1lc3NhZ2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICBtc2cgPSBtZXNzYWdlO1xuICAgIH1cblxuICAgIGxldCBpbmRleCA9IDA7XG4gICAgY29uc3QgbGVuZ3RoID0gbXNnLmxlbmd0aDtcbiAgICBjb25zdCBibG9ja3MgPSB0aGlzLiNibG9ja3M7XG5cbiAgICB3aGlsZSAoaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgIGxldCBpOiBudW1iZXI7XG4gICAgICBpZiAodGhpcy4jaGFzaGVkKSB7XG4gICAgICAgIHRoaXMuI2hhc2hlZCA9IGZhbHNlO1xuICAgICAgICBibG9ja3NbMF0gPSB0aGlzLiNibG9jaztcbiAgICAgICAgLy8gZGVuby1mbXQtaWdub3JlXG4gICAgICAgIGJsb2Nrc1sxNl0gPSBibG9ja3NbMV0gPSBibG9ja3NbMl0gPSBibG9ja3NbM10gPSBibG9ja3NbNF0gPSBibG9ja3NbNV0gPSBibG9ja3NbNl0gPSBibG9ja3NbN10gPSBibG9ja3NbOF0gPSBibG9ja3NbOV0gPSBibG9ja3NbMTBdID0gYmxvY2tzWzExXSA9IGJsb2Nrc1sxMl0gPSBibG9ja3NbMTNdID0gYmxvY2tzWzE0XSA9IGJsb2Nrc1sxNV0gPSAwO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIG1zZyAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICBmb3IgKGkgPSB0aGlzLiNzdGFydDsgaW5kZXggPCBsZW5ndGggJiYgaSA8IDY0OyArK2luZGV4KSB7XG4gICAgICAgICAgYmxvY2tzW2kgPj4gMl0gfD0gbXNnW2luZGV4XSA8PCBTSElGVFtpKysgJiAzXTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yIChpID0gdGhpcy4jc3RhcnQ7IGluZGV4IDwgbGVuZ3RoICYmIGkgPCA2NDsgKytpbmRleCkge1xuICAgICAgICAgIGxldCBjb2RlID0gbXNnLmNoYXJDb2RlQXQoaW5kZXgpO1xuICAgICAgICAgIGlmIChjb2RlIDwgMHg4MCkge1xuICAgICAgICAgICAgYmxvY2tzW2kgPj4gMl0gfD0gY29kZSA8PCBTSElGVFtpKysgJiAzXTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGNvZGUgPCAweDgwMCkge1xuICAgICAgICAgICAgYmxvY2tzW2kgPj4gMl0gfD0gKDB4YzAgfCAoY29kZSA+PiA2KSkgPDwgU0hJRlRbaSsrICYgM107XG4gICAgICAgICAgICBibG9ja3NbaSA+PiAyXSB8PSAoMHg4MCB8IChjb2RlICYgMHgzZikpIDw8IFNISUZUW2krKyAmIDNdO1xuICAgICAgICAgIH0gZWxzZSBpZiAoY29kZSA8IDB4ZDgwMCB8fCBjb2RlID49IDB4ZTAwMCkge1xuICAgICAgICAgICAgYmxvY2tzW2kgPj4gMl0gfD0gKDB4ZTAgfCAoY29kZSA+PiAxMikpIDw8IFNISUZUW2krKyAmIDNdO1xuICAgICAgICAgICAgYmxvY2tzW2kgPj4gMl0gfD0gKDB4ODAgfCAoKGNvZGUgPj4gNikgJiAweDNmKSkgPDwgU0hJRlRbaSsrICYgM107XG4gICAgICAgICAgICBibG9ja3NbaSA+PiAyXSB8PSAoMHg4MCB8IChjb2RlICYgMHgzZikpIDw8IFNISUZUW2krKyAmIDNdO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb2RlID0gMHgxMDAwMCArXG4gICAgICAgICAgICAgICgoKGNvZGUgJiAweDNmZikgPDwgMTApIHwgKG1zZy5jaGFyQ29kZUF0KCsraW5kZXgpICYgMHgzZmYpKTtcbiAgICAgICAgICAgIGJsb2Nrc1tpID4+IDJdIHw9ICgweGYwIHwgKGNvZGUgPj4gMTgpKSA8PCBTSElGVFtpKysgJiAzXTtcbiAgICAgICAgICAgIGJsb2Nrc1tpID4+IDJdIHw9ICgweDgwIHwgKChjb2RlID4+IDEyKSAmIDB4M2YpKSA8PCBTSElGVFtpKysgJiAzXTtcbiAgICAgICAgICAgIGJsb2Nrc1tpID4+IDJdIHw9ICgweDgwIHwgKChjb2RlID4+IDYpICYgMHgzZikpIDw8IFNISUZUW2krKyAmIDNdO1xuICAgICAgICAgICAgYmxvY2tzW2kgPj4gMl0gfD0gKDB4ODAgfCAoY29kZSAmIDB4M2YpKSA8PCBTSElGVFtpKysgJiAzXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdGhpcy4jbGFzdEJ5dGVJbmRleCA9IGk7XG4gICAgICB0aGlzLiNieXRlcyArPSBpIC0gdGhpcy4jc3RhcnQ7XG4gICAgICBpZiAoaSA+PSA2NCkge1xuICAgICAgICB0aGlzLiNibG9jayA9IGJsb2Nrc1sxNl07XG4gICAgICAgIHRoaXMuI3N0YXJ0ID0gaSAtIDY0O1xuICAgICAgICB0aGlzLmhhc2goKTtcbiAgICAgICAgdGhpcy4jaGFzaGVkID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuI3N0YXJ0ID0gaTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRoaXMuI2J5dGVzID4gNDI5NDk2NzI5NSkge1xuICAgICAgdGhpcy4jaEJ5dGVzICs9ICh0aGlzLiNieXRlcyAvIDQyOTQ5NjcyOTYpIDw8IDA7XG4gICAgICB0aGlzLiNieXRlcyA9IHRoaXMuI2J5dGVzICUgNDI5NDk2NzI5NjtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBwcm90ZWN0ZWQgZmluYWxpemUoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuI2ZpbmFsaXplZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLiNmaW5hbGl6ZWQgPSB0cnVlO1xuICAgIGNvbnN0IGJsb2NrcyA9IHRoaXMuI2Jsb2NrcztcbiAgICBjb25zdCBpID0gdGhpcy4jbGFzdEJ5dGVJbmRleDtcbiAgICBibG9ja3NbMTZdID0gdGhpcy4jYmxvY2s7XG4gICAgYmxvY2tzW2kgPj4gMl0gfD0gRVhUUkFbaSAmIDNdO1xuICAgIHRoaXMuI2Jsb2NrID0gYmxvY2tzWzE2XTtcbiAgICBpZiAoaSA+PSA1Nikge1xuICAgICAgaWYgKCF0aGlzLiNoYXNoZWQpIHtcbiAgICAgICAgdGhpcy5oYXNoKCk7XG4gICAgICB9XG4gICAgICBibG9ja3NbMF0gPSB0aGlzLiNibG9jaztcbiAgICAgIC8vIGRlbm8tZm10LWlnbm9yZVxuICAgICAgYmxvY2tzWzE2XSA9IGJsb2Nrc1sxXSA9IGJsb2Nrc1syXSA9IGJsb2Nrc1szXSA9IGJsb2Nrc1s0XSA9IGJsb2Nrc1s1XSA9IGJsb2Nrc1s2XSA9IGJsb2Nrc1s3XSA9IGJsb2Nrc1s4XSA9IGJsb2Nrc1s5XSA9IGJsb2Nrc1sxMF0gPSBibG9ja3NbMTFdID0gYmxvY2tzWzEyXSA9IGJsb2Nrc1sxM10gPSBibG9ja3NbMTRdID0gYmxvY2tzWzE1XSA9IDA7XG4gICAgfVxuICAgIGJsb2Nrc1sxNF0gPSAodGhpcy4jaEJ5dGVzIDw8IDMpIHwgKHRoaXMuI2J5dGVzID4+PiAyOSk7XG4gICAgYmxvY2tzWzE1XSA9IHRoaXMuI2J5dGVzIDw8IDM7XG4gICAgdGhpcy5oYXNoKCk7XG4gIH1cblxuICBwcm90ZWN0ZWQgaGFzaCgpOiB2b2lkIHtcbiAgICBsZXQgYSA9IHRoaXMuI2gwO1xuICAgIGxldCBiID0gdGhpcy4jaDE7XG4gICAgbGV0IGMgPSB0aGlzLiNoMjtcbiAgICBsZXQgZCA9IHRoaXMuI2gzO1xuICAgIGxldCBlID0gdGhpcy4jaDQ7XG4gICAgbGV0IGYgPSB0aGlzLiNoNTtcbiAgICBsZXQgZyA9IHRoaXMuI2g2O1xuICAgIGxldCBoID0gdGhpcy4jaDc7XG4gICAgY29uc3QgYmxvY2tzID0gdGhpcy4jYmxvY2tzO1xuICAgIGxldCBzMDogbnVtYmVyO1xuICAgIGxldCBzMTogbnVtYmVyO1xuICAgIGxldCBtYWo6IG51bWJlcjtcbiAgICBsZXQgdDE6IG51bWJlcjtcbiAgICBsZXQgdDI6IG51bWJlcjtcbiAgICBsZXQgY2g6IG51bWJlcjtcbiAgICBsZXQgYWI6IG51bWJlcjtcbiAgICBsZXQgZGE6IG51bWJlcjtcbiAgICBsZXQgY2Q6IG51bWJlcjtcbiAgICBsZXQgYmM6IG51bWJlcjtcblxuICAgIGZvciAobGV0IGogPSAxNjsgaiA8IDY0OyArK2opIHtcbiAgICAgIC8vIHJpZ2h0cm90YXRlXG4gICAgICB0MSA9IGJsb2Nrc1tqIC0gMTVdO1xuICAgICAgczAgPSAoKHQxID4+PiA3KSB8ICh0MSA8PCAyNSkpIF4gKCh0MSA+Pj4gMTgpIHwgKHQxIDw8IDE0KSkgXiAodDEgPj4+IDMpO1xuICAgICAgdDEgPSBibG9ja3NbaiAtIDJdO1xuICAgICAgczEgPSAoKHQxID4+PiAxNykgfCAodDEgPDwgMTUpKSBeICgodDEgPj4+IDE5KSB8ICh0MSA8PCAxMykpIF5cbiAgICAgICAgKHQxID4+PiAxMCk7XG4gICAgICBibG9ja3Nbal0gPSAoYmxvY2tzW2ogLSAxNl0gKyBzMCArIGJsb2Nrc1tqIC0gN10gKyBzMSkgPDwgMDtcbiAgICB9XG5cbiAgICBiYyA9IGIgJiBjO1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgNjQ7IGogKz0gNCkge1xuICAgICAgaWYgKHRoaXMuI2ZpcnN0KSB7XG4gICAgICAgIGlmICh0aGlzLiNpczIyNCkge1xuICAgICAgICAgIGFiID0gMzAwMDMyO1xuICAgICAgICAgIHQxID0gYmxvY2tzWzBdIC0gMTQxMzI1NzgxOTtcbiAgICAgICAgICBoID0gKHQxIC0gMTUwMDU0NTk5KSA8PCAwO1xuICAgICAgICAgIGQgPSAodDEgKyAyNDE3NzA3NykgPDwgMDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhYiA9IDcwNDc1MTEwOTtcbiAgICAgICAgICB0MSA9IGJsb2Nrc1swXSAtIDIxMDI0NDI0ODtcbiAgICAgICAgICBoID0gKHQxIC0gMTUyMTQ4NjUzNCkgPDwgMDtcbiAgICAgICAgICBkID0gKHQxICsgMTQzNjk0NTY1KSA8PCAwO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuI2ZpcnN0ID0gZmFsc2U7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzMCA9ICgoYSA+Pj4gMikgfCAoYSA8PCAzMCkpIF5cbiAgICAgICAgICAoKGEgPj4+IDEzKSB8IChhIDw8IDE5KSkgXlxuICAgICAgICAgICgoYSA+Pj4gMjIpIHwgKGEgPDwgMTApKTtcbiAgICAgICAgczEgPSAoKGUgPj4+IDYpIHwgKGUgPDwgMjYpKSBeXG4gICAgICAgICAgKChlID4+PiAxMSkgfCAoZSA8PCAyMSkpIF5cbiAgICAgICAgICAoKGUgPj4+IDI1KSB8IChlIDw8IDcpKTtcbiAgICAgICAgYWIgPSBhICYgYjtcbiAgICAgICAgbWFqID0gYWIgXiAoYSAmIGMpIF4gYmM7XG4gICAgICAgIGNoID0gKGUgJiBmKSBeICh+ZSAmIGcpO1xuICAgICAgICB0MSA9IGggKyBzMSArIGNoICsgS1tqXSArIGJsb2Nrc1tqXTtcbiAgICAgICAgdDIgPSBzMCArIG1hajtcbiAgICAgICAgaCA9IChkICsgdDEpIDw8IDA7XG4gICAgICAgIGQgPSAodDEgKyB0MikgPDwgMDtcbiAgICAgIH1cbiAgICAgIHMwID0gKChkID4+PiAyKSB8IChkIDw8IDMwKSkgXlxuICAgICAgICAoKGQgPj4+IDEzKSB8IChkIDw8IDE5KSkgXlxuICAgICAgICAoKGQgPj4+IDIyKSB8IChkIDw8IDEwKSk7XG4gICAgICBzMSA9ICgoaCA+Pj4gNikgfCAoaCA8PCAyNikpIF5cbiAgICAgICAgKChoID4+PiAxMSkgfCAoaCA8PCAyMSkpIF5cbiAgICAgICAgKChoID4+PiAyNSkgfCAoaCA8PCA3KSk7XG4gICAgICBkYSA9IGQgJiBhO1xuICAgICAgbWFqID0gZGEgXiAoZCAmIGIpIF4gYWI7XG4gICAgICBjaCA9IChoICYgZSkgXiAofmggJiBmKTtcbiAgICAgIHQxID0gZyArIHMxICsgY2ggKyBLW2ogKyAxXSArIGJsb2Nrc1tqICsgMV07XG4gICAgICB0MiA9IHMwICsgbWFqO1xuICAgICAgZyA9IChjICsgdDEpIDw8IDA7XG4gICAgICBjID0gKHQxICsgdDIpIDw8IDA7XG4gICAgICBzMCA9ICgoYyA+Pj4gMikgfCAoYyA8PCAzMCkpIF5cbiAgICAgICAgKChjID4+PiAxMykgfCAoYyA8PCAxOSkpIF5cbiAgICAgICAgKChjID4+PiAyMikgfCAoYyA8PCAxMCkpO1xuICAgICAgczEgPSAoKGcgPj4+IDYpIHwgKGcgPDwgMjYpKSBeXG4gICAgICAgICgoZyA+Pj4gMTEpIHwgKGcgPDwgMjEpKSBeXG4gICAgICAgICgoZyA+Pj4gMjUpIHwgKGcgPDwgNykpO1xuICAgICAgY2QgPSBjICYgZDtcbiAgICAgIG1haiA9IGNkIF4gKGMgJiBhKSBeIGRhO1xuICAgICAgY2ggPSAoZyAmIGgpIF4gKH5nICYgZSk7XG4gICAgICB0MSA9IGYgKyBzMSArIGNoICsgS1tqICsgMl0gKyBibG9ja3NbaiArIDJdO1xuICAgICAgdDIgPSBzMCArIG1hajtcbiAgICAgIGYgPSAoYiArIHQxKSA8PCAwO1xuICAgICAgYiA9ICh0MSArIHQyKSA8PCAwO1xuICAgICAgczAgPSAoKGIgPj4+IDIpIHwgKGIgPDwgMzApKSBeXG4gICAgICAgICgoYiA+Pj4gMTMpIHwgKGIgPDwgMTkpKSBeXG4gICAgICAgICgoYiA+Pj4gMjIpIHwgKGIgPDwgMTApKTtcbiAgICAgIHMxID0gKChmID4+PiA2KSB8IChmIDw8IDI2KSkgXlxuICAgICAgICAoKGYgPj4+IDExKSB8IChmIDw8IDIxKSkgXlxuICAgICAgICAoKGYgPj4+IDI1KSB8IChmIDw8IDcpKTtcbiAgICAgIGJjID0gYiAmIGM7XG4gICAgICBtYWogPSBiYyBeIChiICYgZCkgXiBjZDtcbiAgICAgIGNoID0gKGYgJiBnKSBeICh+ZiAmIGgpO1xuICAgICAgdDEgPSBlICsgczEgKyBjaCArIEtbaiArIDNdICsgYmxvY2tzW2ogKyAzXTtcbiAgICAgIHQyID0gczAgKyBtYWo7XG4gICAgICBlID0gKGEgKyB0MSkgPDwgMDtcbiAgICAgIGEgPSAodDEgKyB0MikgPDwgMDtcbiAgICB9XG5cbiAgICB0aGlzLiNoMCA9ICh0aGlzLiNoMCArIGEpIDw8IDA7XG4gICAgdGhpcy4jaDEgPSAodGhpcy4jaDEgKyBiKSA8PCAwO1xuICAgIHRoaXMuI2gyID0gKHRoaXMuI2gyICsgYykgPDwgMDtcbiAgICB0aGlzLiNoMyA9ICh0aGlzLiNoMyArIGQpIDw8IDA7XG4gICAgdGhpcy4jaDQgPSAodGhpcy4jaDQgKyBlKSA8PCAwO1xuICAgIHRoaXMuI2g1ID0gKHRoaXMuI2g1ICsgZikgPDwgMDtcbiAgICB0aGlzLiNoNiA9ICh0aGlzLiNoNiArIGcpIDw8IDA7XG4gICAgdGhpcy4jaDcgPSAodGhpcy4jaDcgKyBoKSA8PCAwO1xuICB9XG5cbiAgLyoqIFJldHVybiBoYXNoIGluIGhleCBzdHJpbmcuICovXG4gIGhleCgpOiBzdHJpbmcge1xuICAgIHRoaXMuZmluYWxpemUoKTtcblxuICAgIGNvbnN0IGgwID0gdGhpcy4jaDA7XG4gICAgY29uc3QgaDEgPSB0aGlzLiNoMTtcbiAgICBjb25zdCBoMiA9IHRoaXMuI2gyO1xuICAgIGNvbnN0IGgzID0gdGhpcy4jaDM7XG4gICAgY29uc3QgaDQgPSB0aGlzLiNoNDtcbiAgICBjb25zdCBoNSA9IHRoaXMuI2g1O1xuICAgIGNvbnN0IGg2ID0gdGhpcy4jaDY7XG4gICAgY29uc3QgaDcgPSB0aGlzLiNoNztcblxuICAgIGxldCBoZXggPSBIRVhfQ0hBUlNbKGgwID4+IDI4KSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1soaDAgPj4gMjQpICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTWyhoMCA+PiAyMCkgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbKGgwID4+IDE2KSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1soaDAgPj4gMTIpICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTWyhoMCA+PiA4KSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1soaDAgPj4gNCkgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbaDAgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbKGgxID4+IDI4KSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1soaDEgPj4gMjQpICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTWyhoMSA+PiAyMCkgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbKGgxID4+IDE2KSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1soaDEgPj4gMTIpICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTWyhoMSA+PiA4KSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1soaDEgPj4gNCkgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbaDEgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbKGgyID4+IDI4KSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1soaDIgPj4gMjQpICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTWyhoMiA+PiAyMCkgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbKGgyID4+IDE2KSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1soaDIgPj4gMTIpICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTWyhoMiA+PiA4KSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1soaDIgPj4gNCkgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbaDIgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbKGgzID4+IDI4KSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1soaDMgPj4gMjQpICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTWyhoMyA+PiAyMCkgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbKGgzID4+IDE2KSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1soaDMgPj4gMTIpICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTWyhoMyA+PiA4KSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1soaDMgPj4gNCkgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbaDMgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbKGg0ID4+IDI4KSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1soaDQgPj4gMjQpICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTWyhoNCA+PiAyMCkgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbKGg0ID4+IDE2KSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1soaDQgPj4gMTIpICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTWyhoNCA+PiA4KSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1soaDQgPj4gNCkgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbaDQgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbKGg1ID4+IDI4KSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1soaDUgPj4gMjQpICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTWyhoNSA+PiAyMCkgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbKGg1ID4+IDE2KSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1soaDUgPj4gMTIpICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTWyhoNSA+PiA4KSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1soaDUgPj4gNCkgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbaDUgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbKGg2ID4+IDI4KSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1soaDYgPj4gMjQpICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTWyhoNiA+PiAyMCkgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbKGg2ID4+IDE2KSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1soaDYgPj4gMTIpICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTWyhoNiA+PiA4KSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1soaDYgPj4gNCkgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbaDYgJiAweDBmXTtcbiAgICBpZiAoIXRoaXMuI2lzMjI0KSB7XG4gICAgICBoZXggKz0gSEVYX0NIQVJTWyhoNyA+PiAyOCkgJiAweDBmXSArXG4gICAgICAgIEhFWF9DSEFSU1soaDcgPj4gMjQpICYgMHgwZl0gK1xuICAgICAgICBIRVhfQ0hBUlNbKGg3ID4+IDIwKSAmIDB4MGZdICtcbiAgICAgICAgSEVYX0NIQVJTWyhoNyA+PiAxNikgJiAweDBmXSArXG4gICAgICAgIEhFWF9DSEFSU1soaDcgPj4gMTIpICYgMHgwZl0gK1xuICAgICAgICBIRVhfQ0hBUlNbKGg3ID4+IDgpICYgMHgwZl0gK1xuICAgICAgICBIRVhfQ0hBUlNbKGg3ID4+IDQpICYgMHgwZl0gK1xuICAgICAgICBIRVhfQ0hBUlNbaDcgJiAweDBmXTtcbiAgICB9XG4gICAgcmV0dXJuIGhleDtcbiAgfVxuXG4gIC8qKiBSZXR1cm4gaGFzaCBpbiBoZXggc3RyaW5nLiAqL1xuICB0b1N0cmluZygpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLmhleCgpO1xuICB9XG5cbiAgLyoqIFJldHVybiBoYXNoIGluIGludGVnZXIgYXJyYXkuICovXG4gIGRpZ2VzdCgpOiBudW1iZXJbXSB7XG4gICAgdGhpcy5maW5hbGl6ZSgpO1xuXG4gICAgY29uc3QgaDAgPSB0aGlzLiNoMDtcbiAgICBjb25zdCBoMSA9IHRoaXMuI2gxO1xuICAgIGNvbnN0IGgyID0gdGhpcy4jaDI7XG4gICAgY29uc3QgaDMgPSB0aGlzLiNoMztcbiAgICBjb25zdCBoNCA9IHRoaXMuI2g0O1xuICAgIGNvbnN0IGg1ID0gdGhpcy4jaDU7XG4gICAgY29uc3QgaDYgPSB0aGlzLiNoNjtcbiAgICBjb25zdCBoNyA9IHRoaXMuI2g3O1xuXG4gICAgY29uc3QgYXJyID0gW1xuICAgICAgKGgwID4+IDI0KSAmIDB4ZmYsXG4gICAgICAoaDAgPj4gMTYpICYgMHhmZixcbiAgICAgIChoMCA+PiA4KSAmIDB4ZmYsXG4gICAgICBoMCAmIDB4ZmYsXG4gICAgICAoaDEgPj4gMjQpICYgMHhmZixcbiAgICAgIChoMSA+PiAxNikgJiAweGZmLFxuICAgICAgKGgxID4+IDgpICYgMHhmZixcbiAgICAgIGgxICYgMHhmZixcbiAgICAgIChoMiA+PiAyNCkgJiAweGZmLFxuICAgICAgKGgyID4+IDE2KSAmIDB4ZmYsXG4gICAgICAoaDIgPj4gOCkgJiAweGZmLFxuICAgICAgaDIgJiAweGZmLFxuICAgICAgKGgzID4+IDI0KSAmIDB4ZmYsXG4gICAgICAoaDMgPj4gMTYpICYgMHhmZixcbiAgICAgIChoMyA+PiA4KSAmIDB4ZmYsXG4gICAgICBoMyAmIDB4ZmYsXG4gICAgICAoaDQgPj4gMjQpICYgMHhmZixcbiAgICAgIChoNCA+PiAxNikgJiAweGZmLFxuICAgICAgKGg0ID4+IDgpICYgMHhmZixcbiAgICAgIGg0ICYgMHhmZixcbiAgICAgIChoNSA+PiAyNCkgJiAweGZmLFxuICAgICAgKGg1ID4+IDE2KSAmIDB4ZmYsXG4gICAgICAoaDUgPj4gOCkgJiAweGZmLFxuICAgICAgaDUgJiAweGZmLFxuICAgICAgKGg2ID4+IDI0KSAmIDB4ZmYsXG4gICAgICAoaDYgPj4gMTYpICYgMHhmZixcbiAgICAgIChoNiA+PiA4KSAmIDB4ZmYsXG4gICAgICBoNiAmIDB4ZmYsXG4gICAgXTtcbiAgICBpZiAoIXRoaXMuI2lzMjI0KSB7XG4gICAgICBhcnIucHVzaChcbiAgICAgICAgKGg3ID4+IDI0KSAmIDB4ZmYsXG4gICAgICAgIChoNyA+PiAxNikgJiAweGZmLFxuICAgICAgICAoaDcgPj4gOCkgJiAweGZmLFxuICAgICAgICBoNyAmIDB4ZmYsXG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gYXJyO1xuICB9XG5cbiAgLyoqIFJldHVybiBoYXNoIGluIGludGVnZXIgYXJyYXkuICovXG4gIGFycmF5KCk6IG51bWJlcltdIHtcbiAgICByZXR1cm4gdGhpcy5kaWdlc3QoKTtcbiAgfVxuXG4gIC8qKiBSZXR1cm4gaGFzaCBpbiBBcnJheUJ1ZmZlci4gKi9cbiAgYXJyYXlCdWZmZXIoKTogQXJyYXlCdWZmZXIge1xuICAgIHRoaXMuZmluYWxpemUoKTtcblxuICAgIGNvbnN0IGJ1ZmZlciA9IG5ldyBBcnJheUJ1ZmZlcih0aGlzLiNpczIyNCA/IDI4IDogMzIpO1xuICAgIGNvbnN0IGRhdGFWaWV3ID0gbmV3IERhdGFWaWV3KGJ1ZmZlcik7XG4gICAgZGF0YVZpZXcuc2V0VWludDMyKDAsIHRoaXMuI2gwKTtcbiAgICBkYXRhVmlldy5zZXRVaW50MzIoNCwgdGhpcy4jaDEpO1xuICAgIGRhdGFWaWV3LnNldFVpbnQzMig4LCB0aGlzLiNoMik7XG4gICAgZGF0YVZpZXcuc2V0VWludDMyKDEyLCB0aGlzLiNoMyk7XG4gICAgZGF0YVZpZXcuc2V0VWludDMyKDE2LCB0aGlzLiNoNCk7XG4gICAgZGF0YVZpZXcuc2V0VWludDMyKDIwLCB0aGlzLiNoNSk7XG4gICAgZGF0YVZpZXcuc2V0VWludDMyKDI0LCB0aGlzLiNoNik7XG4gICAgaWYgKCF0aGlzLiNpczIyNCkge1xuICAgICAgZGF0YVZpZXcuc2V0VWludDMyKDI4LCB0aGlzLiNoNyk7XG4gICAgfVxuICAgIHJldHVybiBidWZmZXI7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEhtYWNTaGEyNTYgZXh0ZW5kcyBTaGEyNTYge1xuICAjaW5uZXI6IGJvb2xlYW47XG4gICNpczIyNDogYm9vbGVhbjtcbiAgI29LZXlQYWQ6IG51bWJlcltdO1xuICAjc2hhcmVkTWVtb3J5OiBib29sZWFuO1xuXG4gIGNvbnN0cnVjdG9yKHNlY3JldEtleTogTWVzc2FnZSwgaXMyMjQgPSBmYWxzZSwgc2hhcmVkTWVtb3J5ID0gZmFsc2UpIHtcbiAgICBzdXBlcihpczIyNCwgc2hhcmVkTWVtb3J5KTtcblxuICAgIGxldCBrZXk6IG51bWJlcltdIHwgVWludDhBcnJheSB8IHVuZGVmaW5lZDtcbiAgICBpZiAodHlwZW9mIHNlY3JldEtleSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgY29uc3QgYnl0ZXM6IG51bWJlcltdID0gW107XG4gICAgICBjb25zdCBsZW5ndGggPSBzZWNyZXRLZXkubGVuZ3RoO1xuICAgICAgbGV0IGluZGV4ID0gMDtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyArK2kpIHtcbiAgICAgICAgbGV0IGNvZGUgPSBzZWNyZXRLZXkuY2hhckNvZGVBdChpKTtcbiAgICAgICAgaWYgKGNvZGUgPCAweDgwKSB7XG4gICAgICAgICAgYnl0ZXNbaW5kZXgrK10gPSBjb2RlO1xuICAgICAgICB9IGVsc2UgaWYgKGNvZGUgPCAweDgwMCkge1xuICAgICAgICAgIGJ5dGVzW2luZGV4KytdID0gMHhjMCB8IChjb2RlID4+IDYpO1xuICAgICAgICAgIGJ5dGVzW2luZGV4KytdID0gMHg4MCB8IChjb2RlICYgMHgzZik7XG4gICAgICAgIH0gZWxzZSBpZiAoY29kZSA8IDB4ZDgwMCB8fCBjb2RlID49IDB4ZTAwMCkge1xuICAgICAgICAgIGJ5dGVzW2luZGV4KytdID0gMHhlMCB8IChjb2RlID4+IDEyKTtcbiAgICAgICAgICBieXRlc1tpbmRleCsrXSA9IDB4ODAgfCAoKGNvZGUgPj4gNikgJiAweDNmKTtcbiAgICAgICAgICBieXRlc1tpbmRleCsrXSA9IDB4ODAgfCAoY29kZSAmIDB4M2YpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvZGUgPSAweDEwMDAwICtcbiAgICAgICAgICAgICgoKGNvZGUgJiAweDNmZikgPDwgMTApIHwgKHNlY3JldEtleS5jaGFyQ29kZUF0KCsraSkgJiAweDNmZikpO1xuICAgICAgICAgIGJ5dGVzW2luZGV4KytdID0gMHhmMCB8IChjb2RlID4+IDE4KTtcbiAgICAgICAgICBieXRlc1tpbmRleCsrXSA9IDB4ODAgfCAoKGNvZGUgPj4gMTIpICYgMHgzZik7XG4gICAgICAgICAgYnl0ZXNbaW5kZXgrK10gPSAweDgwIHwgKChjb2RlID4+IDYpICYgMHgzZik7XG4gICAgICAgICAgYnl0ZXNbaW5kZXgrK10gPSAweDgwIHwgKGNvZGUgJiAweDNmKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAga2V5ID0gYnl0ZXM7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChzZWNyZXRLZXkgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuICAgICAgICBrZXkgPSBuZXcgVWludDhBcnJheShzZWNyZXRLZXkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAga2V5ID0gc2VjcmV0S2V5O1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChrZXkubGVuZ3RoID4gNjQpIHtcbiAgICAgIGtleSA9IG5ldyBTaGEyNTYoaXMyMjQsIHRydWUpLnVwZGF0ZShrZXkpLmFycmF5KCk7XG4gICAgfVxuXG4gICAgY29uc3Qgb0tleVBhZDogbnVtYmVyW10gPSBbXTtcbiAgICBjb25zdCBpS2V5UGFkOiBudW1iZXJbXSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgNjQ7ICsraSkge1xuICAgICAgY29uc3QgYiA9IGtleVtpXSB8fCAwO1xuICAgICAgb0tleVBhZFtpXSA9IDB4NWMgXiBiO1xuICAgICAgaUtleVBhZFtpXSA9IDB4MzYgXiBiO1xuICAgIH1cblxuICAgIHRoaXMudXBkYXRlKGlLZXlQYWQpO1xuICAgIHRoaXMuI29LZXlQYWQgPSBvS2V5UGFkO1xuICAgIHRoaXMuI2lubmVyID0gdHJ1ZTtcbiAgICB0aGlzLiNpczIyNCA9IGlzMjI0O1xuICAgIHRoaXMuI3NoYXJlZE1lbW9yeSA9IHNoYXJlZE1lbW9yeTtcbiAgfVxuXG4gIHByb3RlY3RlZCBmaW5hbGl6ZSgpOiB2b2lkIHtcbiAgICBzdXBlci5maW5hbGl6ZSgpO1xuICAgIGlmICh0aGlzLiNpbm5lcikge1xuICAgICAgdGhpcy4jaW5uZXIgPSBmYWxzZTtcbiAgICAgIGNvbnN0IGlubmVySGFzaCA9IHRoaXMuYXJyYXkoKTtcbiAgICAgIHN1cGVyLmluaXQodGhpcy4jaXMyMjQsIHRoaXMuI3NoYXJlZE1lbW9yeSk7XG4gICAgICB0aGlzLnVwZGF0ZSh0aGlzLiNvS2V5UGFkKTtcbiAgICAgIHRoaXMudXBkYXRlKGlubmVySGFzaCk7XG4gICAgICBzdXBlci5maW5hbGl6ZSgpO1xuICAgIH1cbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQWFBLE1BQU0sU0FBUyxHQUFHLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQUFBQztBQUMvQyxNQUFNLEtBQUssR0FBRztJQUFDLENBQUMsVUFBVTtBQUFFLFdBQU87QUFBRSxTQUFLO0FBQUUsT0FBRztDQUFDLEFBQVMsQUFBQztBQUMxRCxNQUFNLEtBQUssR0FBRztBQUFDLE1BQUU7QUFBRSxNQUFFO0FBQUUsS0FBQztBQUFFLEtBQUM7Q0FBQyxBQUFTLEFBQUM7QUFDdEMsa0JBQWtCO0FBQ2xCLE1BQU0sQ0FBQyxHQUFHO0FBQ1IsY0FBVTtBQUFFLGNBQVU7QUFBRSxjQUFVO0FBQUUsY0FBVTtBQUFFLGNBQVU7QUFBRSxjQUFVO0FBQ3RFLGNBQVU7QUFBRSxjQUFVO0FBQUUsY0FBVTtBQUFFLGNBQVU7QUFBRSxjQUFVO0FBQUUsY0FBVTtBQUN0RSxjQUFVO0FBQUUsY0FBVTtBQUFFLGNBQVU7QUFBRSxjQUFVO0FBQUUsY0FBVTtBQUFFLGNBQVU7QUFDdEUs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QzthQUFDLENBQUM7U0FDcEU7UUFFRCxJQUFJLEtBQUssRUFBRTtZQUNULElBQUksQ0FBQyxDQUFDLEVBQUUsR0FBRyxVQUFVLENBQUM7WUFDdEIsSUFBSSxDQUFDLENBQUMsRUFBRSxHQUFHLFVBQVUsQ0FBQztZQUN0QixJQUFJLENBQUMsQ0FBQyxFQUFFLEdBQUcsVUFBVSxDQUFDO1lBQ3RCLElBQUksQ0FBQyxDQUFDLEVBQUUsR0FBRyxVQUFVLENBQUM7WUFDdEIsSUFBSSxDQUFDLENBQUMsRUFBRSxHQUFHLFVBQVUsQ0FBQztZQUN0QixJQUFJLENBQUMsQ0FBQyxFQUFFLEdBQUcsVUFBVSxDQUFDO1lBQ3RCLElBQUksQ0FBQyxDQUFDLEVBQUUsR0FBRyxVQUFVLENBQUM7WUFDdEIsSUFBSSxDQUFDLENBQUMsRUFBRSxHQUFHLFVBQVUsQ0FBQztTQUN2QixNQUFNO1lBQ0wsTUFBTTtZQUNOLElBQUksQ0FBQyxDQUFDLEVBQUUsR0FBRyxVQUFVLENBQUM7WUFDdEIsSUFBSSxDQUFDLENBQUMsRUFBRSxHQUFHLFVBQVUsQ0FBQztZQUN0QixJQUFJLENBQUMsQ0FBQyxFQUFFLEdBQUcsVUFBVSxDQUFDO1lBQ3RCLElBQUksQ0FBQyxDQUFDLEVBQUUsR0FBRyxVQUFVLENBQUM7WUFDdEIsSUFBSSxDQUFDLENBQUMsRUFBRSxHQUFHLFVBQVUsQ0FBQztZQUN0QixJQUFJLENBQUMsQ0FBQyxFQUFFLEdBQUcsVUFBVSxDQUFDO1lBQ3RCLElBQUksQ0FBQyxDQUFDLEVBQUUsR0FBRyxVQUFVLENBQUM7WUFDdEIsSUFBSSxDQUFDLENBQUMsRUFBRSxHQUFHLFVBQVUsQ0FBQztTQUN2QjtRQUVELElBQUksQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFDM0QsSUFBSSxDQUFDLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7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QyxDQUFDLENBQUM7d0JBQ3pELE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUksSUFBSSxHQUFHLElBQUksQUFBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUEsQ0FBQyxFQUFFLENBQUEsR0FBRyxDQUFDLENBQUMsQ0FBQztxQkFDNUQsTUFBTSxJQUFJLElBQUksR0FBRyxNQUFNLElBQUksSUFBSSxJQUFJLE1BQU0sRUFBRTt3QkFDMUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksR0FBSSxJQUFJLElBQUksRUFBRSxBQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQSxDQUFDLEVBQUUsQ0FBQSxHQUFHLENBQUMsQ0FBQyxDQUFDO3dCQUMxRCxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFJLEFBQUMsSUFBSSxJQUFJLENBQUMsR0FBSSxJQUFJLEFBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFBLENBQUMsRUFBRSxDQUFBLEdBQUcsQ0FBQyxDQUFDLENBQUM7d0JBQ2xFLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUksSUFBSSxHQUFHLElBQUksQUFBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUEsQ0FBQyxFQUFFLENBQUEsR0FBRyxDQUFDLENBQUMsQ0FBQztxQkFDNUQsTUFBTTt3QkFDTCxJQUFJLEdBQUcsT0FBTyxHQUNaLENBQUMsQUFBQyxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxFQUFFLEdBQUssR0FBRyxDQUFDLFVBQVUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxHQUFHLEtBQUssQUFBQyxDQUFDLENBQUM7d0JBQy9ELE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUksSUFBSSxJQUFJLEVBQUUsQUFBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUEsQ0FBQyxFQUFFLENBQUEsR0FB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QUFDLElBQUksQ0FBQyxBQUFDLENBQUMsQ0FBQztZQUMxQixFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNYLEdBQUcsR0FBRyxFQUFFLEdBQUksQ0FBQyxHQUFHLENBQUMsR0FBSSxFQUFFLENBQUM7WUFDeEIsRUFBRSxHQUFHLEFBQUMsQ0FBQyxHQUFHLENBQUMsR0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLEFBQUMsQ0FBQztZQUN4QixFQUFFLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsRUFBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzVDLEVBQUUsR0FBRyxFQUFFLEdBQUcsR0FBRyxDQUFDO1lBQ2QsQ0FBQyxHQUFHLEFBQUMsQ0FBQyxHQUFHLEVBQUUsSUFBSyxDQUFDLENBQUM7WUFDbEIsQ0FBQyxHQUFHLEFBQUMsRUFBRSxHQUFHLEVBQUUsSUFBSyxDQUFDLENBQUM7WUFDbkIsRUFBRSxHQUFHLENBQUMsQUFBQyxDQUFDLEtBQUssQ0FBQyxHQUFLLENBQUMsSUFBSSxFQUFFLEFBQUMsQ0FBQyxHQUMxQixDQUFDLEFBQUMsQ0FBQyxLQUFLLEVBQUUsR0FBSyxDQUFDLElBQUksRUFBRSxBQUFDLENBQUMsR0FDeEIsQ0FBQyxBQUFDLENBQUMsS0FBSyxFQUFFLEdBQUssQ0FBQyxJQUFJLEVBQUUsQUFBQyxDQUFDLENBQUM7WUFDM0IsRUFBRSxHQUFHLENBQUMsQUFBQyxDQUFDLEtBQUssQ0FBQyxHQUFLLENBQUMsSUFBSSxFQUFFLEFBQUMsQ0FBQyxHQUMxQixDQUFDLEFBQUMsQ0FBQyxLQUFLLEVBQUUsR0FBSyxDQUFDLElBQUksRUFBRSxBQUFDLENBQUMsR0FDeEIsQ0FBQyxBQUFDLENBQUMsS0FBSyxFQUFFLEdBQUssQ0FBQyxJQUFJLENBQUMsQUFBQyxDQUFDLENBQUM7WUFDMUIsRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDWCxHQUFHLEdBQUcsRUFBRSxHQUFJLENBQUMsR0FBRyxDQUFDLEdBQUksRUFBRSxDQUFDO1lBQ3hCLEVBQUUsR0FBRyxBQUFDLENBQUMsR0FBRyxDQUFDLEdBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxBQUFDLENBQUM7WUFDeEIsRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLEVBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUM1QyxFQUFFLEdBQUcsRUFBRSxHQUFHLEdBQUcsQ0FBQztZQUNkLENBQUMsR0FBRyxBQUFDLENBQUMsR0FBRyxFQUFFLElBQUssQ0FBQyxDQUFDO1lBQ2xCLENBQUMsR0FBRyxBQUFDLEVBQUUsR0FBRyxFQUFFLElBQUssQ0FBQyxDQUFDO1lBQ25CLEVBQUUsR0FBRyxDQUFDLEFBQUMsQ0FBQyxLQUFLLENBQUMsR0FBSyxDQUFDLElBQUksRUFBRSxBQUFDLENBQUMsR0FDMUIsQ0FBQyxBQUFDLENBQUMsS0FBSyxFQUFFLEdBQUssQ0FBQyxJQUFJLEVBQUUsQUFBQyxDQUFDLEdBQ3hCLENBQUMsQUFBQyxDQUFDLEtBQUssRUFBRSxHQUFLLENBQUMsSUFBSSxFQUFFLEFBQUMsQ0FBQyxDQUFDO1lBQzNCLEVBQUUsR0FBRyxDQUFDLEFBQUMsQ0FBQyxLQUFLLENBQUMsR0FBSyxDQUFDLElBQUksRUFBRSxBQUFDLENBQUMsR0FDMUIsQ0FBQyxBQUFDLENBQUMsS0FBSyxFQUFFLEdBQUssQ0FBQyxJQUFJLEVBQUUsQUFBQyxDQUFDLEdBQ3hCLENBQUMsQUFBQyxDQUFDLEtBQUssRUFBRSxHQUFLLENBQUMsSUFBSSxDQUFDLEFBQUMsQ0FBQyxDQUFDO1lBQzFCLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ1gsR0FBRyxHQUFHLEVBQUUsR0FBSSxDQUFDLEdBQUcsQ0FBQyxHQUFJLEVBQUUsQ0FBQztZQUN4QixFQUFFLEdBQUcsQUFBQyxDQUFDLEdBQUcsQ0FBQyxHQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQUFBQyxDQUFDO1lBQ3hCLEVBQUUsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxFQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDNUMsRUFBRSxHQUFHLEVBQUUsR0FBRyxHQUFHLENBQUM7WUFDZCxDQUFDLEdBQUcsQUFBQyxDQUFDLEdBQUcsRUFBRSxJQUFLLENBQUMsQ0FBQztZQUNsQixDQUFDLEdBQUcsQUFBQyxFQUFFLEdBQUcsRUFBRSxJQUFLLENBQUMsQ0FBQztTQUNwQjtRQUVELElBQUksQ0FBQyxDQUFDLEVBQUUsR0FBRyxBQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLElBQUssQ0FBQyxDQUFDO1FBQy9CLElBQUksQ0FBQyxDQUFDLEVBQUUsR0FBRyxBQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLElBQUssQ0FBQyxDQUFDO1FBQy9CLElBQUksQ0FBQyxDQUFDLEVBQUUsR0FBRyxBQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLElBQUssQ0FBQyxDQUFDO1FBQy9CLElBQUksQ0FBQyxDQUFDLEVBQUUsR0FBRyxBQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLElBQUssQ0FBQyxDQUFDO1FBQy9CLElBQUksQ0FBQyxDQUFDLEVBQUUsR0FBRyxBQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLElBQUssQ0FBQyxDQUFDO1FBQy9CLElBQUksQ0FBQyxDQUFDLEVBQUUsR0FBRyxBQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLElBQUssQ0FBQyxDQUFDO1FBQy9CLElBQUksQ0FBQyxDQUFDLEVBQUUsR0FBRyxBQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLElBQUssQ0FBQyxDQUFDO1FBQy9CLElBQUksQ0FBQyxDQUFDLEVBQUUsR0FBRyxBQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLElBQUssQ0FBQyxDQUFDO0tBQ2hDO0lBRUQsaUNBQWlDLENBQ2pDLEdBQUcsR0FBVztRQUNaLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUVoQixNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLEFBQUM7UUFDcEIsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxBQUFDO1FBQ3BCLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsQUFBQztRQUNwQixNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLEFBQUM7UUFDcEIsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxBQUFDO1FBQ3BCLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsQUFBQztRQUNwQixNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLEFBQUM7UUFDcEIsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxBQUFDO1FBRXBCLElBQUksR0FBRyxHQUFHLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUksSUFBSSxDQUFDLEdBQ3BDLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUksSUFBSSxDQUFDLEdBQzVCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUksSUFBSSxDQUFDLEdBQzVCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUksSUFBSSxDQUFDLEdBQzVCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUksSUFBSSxDQUFDLEdBQzVCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUksSUFBSSxDQUFDLEdBQzNCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUksSUFBSSxDQUFDLEdBQzNCLFNBQVMsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQ3BCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUksSUFBSSxDQUFDLEdBQzVCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUksSUFBSSxDQUFDLEdBQzVCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUksSUFBSSxDQUFDLEdBQzVCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUksSUFBSSxDQUFDLEdBQzVCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUksSUFBSSxDQUFDLEdBQzVCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUksSUFBSSxDQUFDLEdBQzNCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUksSUFBSSxDQUFDLEdBQzNCLFNBQVMsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQ3BCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUksSUFBSSxDQUFDLEdBQzVCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUksSUFBSSxDQUFDLEdBQzVCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUksSUFBSSxDQUFDLEdBQzVCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUksSUFBSSxDQUFDLEdBQzVCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUksSUFBSSxDQUFDLEdBQzVCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUksSUFBSSxDQUFDLEdBQzNCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUksSUFBSSxDQUFDLEdBQzNCLFNBQVMsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQ3BCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUksSUFBSSxDQUFDLEdBQzVCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUksSUFBSSxDQUFDLEdBQzVCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUksSUFBSSxDQUFDLEdBQzVCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUksSUFBSSxDQUFDLEdBQzVCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUksSUFBSSxDQUFDLEdBQzVCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUksSUFBSSxDQUFDLEdBQzNCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUksSUFBSSxDQUFDLEdBQzNCLFNBQVMsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQ3BCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUksSUFBSSxDQUFDLEdBQzVCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUksSUFBSSxDQUFDLEdBQzVCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUksSUFBSSxDQUFDLEdBQzVCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUksSUFBSSxDQUFDLEdBQzVCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUksSUFBSSxDQUFDLEdBQzVCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUksSUFBSSxDQUFDLEdBQzNCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUksSUFBSSxDQUFDLEdBQzNCLFNBQVMsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQ3BCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUksSUFBSSxDQUFDLEdBQzVCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUksSUFBSSxDQUFDLEdBQzVCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUksSUFBSSxDQUFDLEdBQzVCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUksSUFBSSxDQUFDLEdBQzVCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUksSUFBSSxDQUFDLEdBQzVCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUksSUFBSSxDQUFDLEdBQzNCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUksSUFBSSxDQUFDLEdBQzNCLFNBQVMsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQ3BCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUksSUFBSSxDQUFDLEdBQzVCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUksSUFBSSxDQUFDLEdBQzVCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUksSUFBSSxDQUFDLEdBQzVCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUksSUFBSSxDQUFDLEdBQzVCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUksSUFBSSxDQUFDLEdBQzVCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUksSUFBSSxDQUFDLEdBQzNCLFNBQVMsQ0FBQyxBQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUksSUFBSSxDQUFDLEdBQzNCLFNBQVMsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEFBQUM7UUFDdkIsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssRUFBRTtZQUNoQixHQUFHLElBQUksU0FBUyxDQUFDLEFBQUMsRUFBRSxJQUFJLEVBQUUsR0FBSSxJQUFJLENBQUMsR0FDakMsU0FBUyxDQUFDLEFBQUMsRUFBRSxJQUFJLEVBQUUsR0FBSSxJQUFJLENBQUMsR0FDNUIsU0FBUyxDQUFDLEFBQUMsRUFBRSxJQUFJLEVBQUUsR0FBSSxJQUFJLENBQUMsR0FDNUIsU0FBUyxDQUFDLEFBQUMsRUFBRSxJQUFJLEVBQUUsR0FBSSxJQUFJLENBQUMsR0FDNUIsU0FBUyxDQUFDLEFBQUMsRUFBRSxJQUFJLEVBQUUsR0FBSSxJQUFJLENBQUMsR0FDNUIsU0FBUyxDQUFDLEFBQUMsRUFBRSxJQUFJLENBQUMsR0FBSSxJQUFJLENBQUMsR0FDM0IsU0FBUyxDQUFDLEFBQUMs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