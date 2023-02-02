// Ported from Go
// https://github.com/golang/go/blob/go1.12.5/src/encoding/hex/hex.go
// Copyright 2009 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.
// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
const hextable = new TextEncoder().encode("0123456789abcdef");
export function errInvalidByte(byte) {
    return new Error("encoding/hex: invalid byte: " + new TextDecoder().decode(new Uint8Array([
        byte
    ])));
}
export function errLength() {
    return new Error("encoding/hex: odd length hex string");
}
// fromHexChar converts a hex character into its value.
function fromHexChar(byte) {
    // '0' <= byte && byte <= '9'
    if (48 <= byte && byte <= 57) return byte - 48;
    // 'a' <= byte && byte <= 'f'
    if (97 <= byte && byte <= 102) return byte - 97 + 10;
    // 'A' <= byte && byte <= 'F'
    if (65 <= byte && byte <= 70) return byte - 65 + 10;
    throw errInvalidByte(byte);
}
/**
 * EncodedLen returns the length of an encoding of n source bytes. Specifically,
 * it returns n * 2.
 * @param n
 */ export function encodedLen(n) {
    return n * 2;
}
/**
 * Encode encodes `src` into `encodedLen(src.length)` bytes.
 * @param src
 */ export function encode(src) {
    const dst = new Uint8Array(encodedLen(src.length));
    for(let i = 0; i < dst.length; i++){
        const v = src[i];
        dst[i * 2] = hextable[v >> 4];
        dst[i * 2 + 1] = hextable[v & 0x0f];
    }
    return dst;
}
/**
 * EncodeToString returns the hexadecimal encoding of `src`.
 * @param src
 */ export function encodeToString(src) {
    return new TextDecoder().decode(encode(src));
}
/**
 * Decode decodes `src` into `decodedLen(src.length)` bytes
 * If the input is malformed an error will be thrown
 * the error.
 * @param src
 */ export function decode(src) {
    const dst = new Uint8Array(decodedLen(src.length));
    for(let i = 0; i < dst.length; i++){
        const a = fromHexChar(src[i * 2]);
        const b = fromHexChar(src[i * 2 + 1]);
        dst[i] = a << 4 | b;
    }
    if (src.length % 2 == 1) {
        // Check for invalid char before reporting bad length,
        // since the invalid char (if present) is an earlier problem.
        fromHexChar(src[dst.length * 2]);
        throw errLength();
    }
    return dst;
}
/**
 * DecodedLen returns the length of decoding `x` source bytes.
 * Specifically, it returns `x / 2`.
 * @param x
 */ export function decodedLen(x) {
    return x >>> 1;
}
/**
 * DecodeString returns the bytes represented by the hexadecimal string `s`.
 * DecodeString expects that src contains only hexadecimal characters and that
 * src has even length.
 * If the input is malformed, DecodeString will throw an error.
 * @param s the `string` to decode to `Uint8Array`
 */ export function decodeString(s) {
    return decode(new TextEncoder().encode(s));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjY3LjAvZW5jb2RpbmcvaGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIFBvcnRlZCBmcm9tIEdvXG4vLyBodHRwczovL2dpdGh1Yi5jb20vZ29sYW5nL2dvL2Jsb2IvZ28xLjEyLjUvc3JjL2VuY29kaW5nL2hleC9oZXguZ29cbi8vIENvcHlyaWdodCAyMDA5IFRoZSBHbyBBdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy8gVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYSBCU0Qtc3R5bGVcbi8vIGxpY2Vuc2UgdGhhdCBjYW4gYmUgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZS5cbi8vIENvcHlyaWdodCAyMDE4LTIwMjAgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5cbmNvbnN0IGhleHRhYmxlID0gbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKFwiMDEyMzQ1Njc4OWFiY2RlZlwiKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGVyckludmFsaWRCeXRlKGJ5dGU6IG51bWJlcik6IEVycm9yIHtcbiAgcmV0dXJuIG5ldyBFcnJvcihcbiAgICBcImVuY29kaW5nL2hleDogaW52YWxpZCBieXRlOiBcIiArXG4gICAgICBuZXcgVGV4dERlY29kZXIoKS5kZWNvZGUobmV3IFVpbnQ4QXJyYXkoW2J5dGVdKSksXG4gICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlcnJMZW5ndGgoKTogRXJyb3Ige1xuICByZXR1cm4gbmV3IEVycm9yKFwiZW5jb2RpbmcvaGV4OiBvZGQgbGVuZ3RoIGhleCBzdHJpbmdcIik7XG59XG5cbi8vIGZyb21IZXhDaGFyIGNvbnZlcnRzIGEgaGV4IGNoYXJhY3RlciBpbnRvIGl0cyB2YWx1ZS5cbmZ1bmN0aW9uIGZyb21IZXhDaGFyKGJ5dGU6IG51bWJlcik6IG51bWJlciB7XG4gIC8vICcwJyA8PSBieXRlICYmIGJ5dGUgPD0gJzknXG4gIGlmICg0OCA8PSBieXRlICYmIGJ5dGUgPD0gNTcpIHJldHVybiBieXRlIC0gNDg7XG4gIC8vICdhJyA8PSBieXRlICYmIGJ5dGUgPD0gJ2YnXG4gIGlmICg5NyA8PSBieXRlICYmIGJ5dGUgPD0gMTAyKSByZXR1cm4gYnl0ZSAtIDk3ICsgMTA7XG4gIC8vICdBJyA8PSBieXRlICYmIGJ5dGUgPD0gJ0YnXG4gIGlmICg2NSA8PSBieXRlICYmIGJ5dGUgPD0gNzApIHJldHVybiBieXRlIC0gNjUgKyAxMDtcblxuICB0aHJvdyBlcnJJbnZhbGlkQnl0ZShieXRlKTtcbn1cblxuLyoqXG4gKiBFbmNvZGVkTGVuIHJldHVybnMgdGhlIGxlbmd0aCBvZiBhbiBlbmNvZGluZyBvZiBuIHNvdXJjZSBieXRlcy4gU3BlY2lmaWNhbGx5LFxuICogaXQgcmV0dXJucyBuICogMi5cbiAqIEBwYXJhbSBuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbmNvZGVkTGVuKG46IG51bWJlcik6IG51bWJlciB7XG4gIHJldHVybiBuICogMjtcbn1cblxuLyoqXG4gKiBFbmNvZGUgZW5jb2RlcyBgc3JjYCBpbnRvIGBlbmNvZGVkTGVuKHNyYy5sZW5ndGgpYCBieXRlcy5cbiAqIEBwYXJhbSBzcmNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVuY29kZShzcmM6IFVpbnQ4QXJyYXkpOiBVaW50OEFycmF5IHtcbiAgY29uc3QgZHN0ID0gbmV3IFVpbnQ4QXJyYXkoZW5jb2RlZExlbihzcmMubGVuZ3RoKSk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZHN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgdiA9IHNyY1tpXTtcbiAgICBkc3RbaSAqIDJdID0gaGV4dGFibGVbdiA+PiA0XTtcbiAgICBkc3RbaSAqIDIgKyAxXSA9IGhleHRhYmxlW3YgJiAweDBmXTtcbiAgfVxuICByZXR1cm4gZHN0O1xufVxuXG4vKipcbiAqIEVuY29kZVRvU3RyaW5nIHJldHVybnMgdGhlIGhleGFkZWNpbWFsIGVuY29kaW5nIG9mIGBzcmNgLlxuICogQHBhcmFtIHNyY1xuICovXG5leHBvcnQgZnVuY3Rpb24gZW5jb2RlVG9TdHJpbmcoc3JjOiBVaW50OEFycmF5KTogc3RyaW5nIHtcbiAgcmV0dXJuIG5ldyBUZXh0RGVjb2RlcigpLmRlY29kZShlbmNvZGUoc3JjKSk7XG59XG5cbi8qKlxuICogRGVjb2RlIGRlY29kZXMgYHNyY2AgaW50byBgZGVjb2RlZExlbihzcmMubGVuZ3RoKWAgYnl0ZXNcbiAqIElmIHRoZSBpbnB1dCBpcyBtYWxmb3JtZWQgYW4gZXJyb3Igd2lsbCBiZSB0aHJvd25cbiAqIHRoZSBlcnJvci5cbiAqIEBwYXJhbSBzcmNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlY29kZShzcmM6IFVpbnQ4QXJyYXkpOiBVaW50OEFycmF5IHtcbiAgY29uc3QgZHN0ID0gbmV3IFVpbnQ4QXJyYXkoZGVjb2RlZExlbihzcmMubGVuZ3RoKSk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZHN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgYSA9IGZyb21IZXhDaGFyKHNyY1tpICogMl0pO1xuICAgIGNvbnN0IGIgPSBmcm9tSGV4Q2hhcihzcmNbaSAqIDIgKyAxXSk7XG4gICAgZHN0W2ldID0gKGEgPDwgNCkgfCBiO1xuICB9XG5cbiAgaWYgKHNyYy5sZW5ndGggJSAyID09IDEpIHtcbiAgICAvLyBDaGVjayBmb3IgaW52YWxpZCBjaGFyIGJlZm9yZSByZXBvcnRpbmcgYmFkIGxlbmd0aCxcbiAgICAvLyBzaW5jZSB0aGUgaW52YWxpZCBjaGFyIChpZiBwcmVzZW50KSBpcyBhbiBlYXJsaWVyIHByb2JsZW0uXG4gICAgZnJvbUhleENoYXIoc3JjW2RzdC5sZW5ndGggKiAyXSk7XG4gICAgdGhyb3cgZXJyTGVuZ3RoKCk7XG4gIH1cblxuICByZXR1cm4gZHN0O1xufVxuXG4vKipcbiAqIERlY29kZWRMZW4gcmV0dXJucyB0aGUgbGVuZ3RoIG9mIGRlY29kaW5nIGB4YCBzb3VyY2UgYnl0ZXMuXG4gKiBTcGVjaWZpY2FsbHksIGl0IHJldHVybnMgYHggLyAyYC5cbiAqIEBwYXJhbSB4XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWNvZGVkTGVuKHg6IG51bWJlcik6IG51bWJlciB7XG4gIHJldHVybiB4ID4+PiAxO1xufVxuXG4vKipcbiAqIERlY29kZVN0cmluZyByZXR1cm5zIHRoZSBieXRlcyByZXByZXNlbnRlZCBieSB0aGUgaGV4YWRlY2ltYWwgc3RyaW5nIGBzYC5cbiAqIERlY29kZVN0cmluZyBleHBlY3RzIHRoYXQgc3JjIGNvbnRhaW5zIG9ubHkgaGV4YWRlY2ltYWwgY2hhcmFjdGVycyBhbmQgdGhhdFxuICogc3JjIGhhcyBldmVuIGxlbmd0aC5cbiAqIElmIHRoZSBpbnB1dCBpcyBtYWxmb3JtZWQsIERlY29kZVN0cmluZyB3aWxsIHRocm93IGFuIGVycm9yLlxuICogQHBhcmFtIHMgdGhlIGBzdHJpbmdgIHRvIGRlY29kZSB0byBgVWludDhBcnJheWBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlY29kZVN0cmluZyhzOiBzdHJpbmcpOiBVaW50OEFycmF5IHtcbiAgcmV0dXJuIGRlY29kZShuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUocykpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLGlCQUFpQjtBQUNqQixxRUFBcUU7QUFDckUsc0RBQXNEO0FBQ3RELHFEQUFxRDtBQUNyRCxpREFBaUQ7QUFDakQsMEVBQTBFO0FBRTFFLE1BQU0sUUFBUSxHQUFHLElBQUksV0FBVyxFQUFFLENBQUMsTUFBTSxDQUFDLGtCQUFrQixDQUFDLEFBQUM7QUFFOUQsT0FBTyxTQUFTLGNBQWMsQ0FBQyxJQUFZLEVBQVM7SUFDbEQsT0FBTyxJQUFJLEtBQUssQ0FDZCw4QkFBOEIsR0FDNUIsSUFBSSxXQUFXLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxVQUFVLENBQUM7UUFBQyxJQUFJO0tBQUMsQ0FBQyxDQUFDLENBQ25ELENBQUM7Q0FDSDtBQUVELE9BQU8sU0FBUyxTQUFTLEdBQVU7SUFDakMsT0FBTyxJ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