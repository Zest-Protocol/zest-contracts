// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
/**
 * Converts given data with base64 encoding
 * @param data input to encode
 */ export function encode(data) {
    if (typeof data === "string") {
        return btoa(data);
    } else {
        const d = new Uint8Array(data);
        let dataString = "";
        for(let i = 0; i < d.length; ++i){
            dataString += String.fromCharCode(d[i]);
        }
        return btoa(dataString);
    }
}
/**
 * Converts given base64 encoded data back to original
 * @param data input to decode
 */ export function decode(data) {
    const binaryString = decodeString(data);
    const binary = new Uint8Array(binaryString.length);
    for(let i = 0; i < binary.length; ++i){
        binary[i] = binaryString.charCodeAt(i);
    }
    return binary.buffer;
}
/**
 * Decodes data assuming the output is in string type
 * @param data input to decode
 */ export function decodeString(data) {
    return atob(data);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjY3LjAvZW5jb2RpbmcvYmFzZTY0LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjAgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5cbi8qKlxuICogQ29udmVydHMgZ2l2ZW4gZGF0YSB3aXRoIGJhc2U2NCBlbmNvZGluZ1xuICogQHBhcmFtIGRhdGEgaW5wdXQgdG8gZW5jb2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbmNvZGUoZGF0YTogc3RyaW5nIHwgQXJyYXlCdWZmZXIpOiBzdHJpbmcge1xuICBpZiAodHlwZW9mIGRhdGEgPT09IFwic3RyaW5nXCIpIHtcbiAgICByZXR1cm4gYnRvYShkYXRhKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBkID0gbmV3IFVpbnQ4QXJyYXkoZGF0YSk7XG4gICAgbGV0IGRhdGFTdHJpbmcgPSBcIlwiO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZC5sZW5ndGg7ICsraSkge1xuICAgICAgZGF0YVN0cmluZyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGRbaV0pO1xuICAgIH1cblxuICAgIHJldHVybiBidG9hKGRhdGFTdHJpbmcpO1xuICB9XG59XG5cbi8qKlxuICogQ29udmVydHMgZ2l2ZW4gYmFzZTY0IGVuY29kZWQgZGF0YSBiYWNrIHRvIG9yaWdpbmFsXG4gKiBAcGFyYW0gZGF0YSBpbnB1dCB0byBkZWNvZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlY29kZShkYXRhOiBzdHJpbmcpOiBBcnJheUJ1ZmZlciB7XG4gIGNvbnN0IGJpbmFyeVN0cmluZyA9IGRlY29kZVN0cmluZyhkYXRhKTtcbiAgY29uc3QgYmluYXJ5ID0gbmV3IFVpbnQ4QXJyYXkoYmluYXJ5U3RyaW5nLmxlbmd0aCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYmluYXJ5Lmxlbmd0aDsgKytpKSB7XG4gICAgYmluYXJ5W2ldID0gYmluYXJ5U3RyaW5nLmNoYXJDb2RlQXQoaSk7XG4gIH1cblxuICByZXR1cm4gYmluYXJ5LmJ1ZmZlcjtcbn1cblxuLyoqXG4gKiBEZWNvZGVzIGRhdGEgYXNzdW1pbmcgdGhlIG91dHB1dCBpcyBpbiBzdHJpbmcgdHlwZVxuICogQHBhcmFtIGRhdGEgaW5wdXQgdG8gZGVjb2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWNvZGVTdHJpbmcoZGF0YTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGF0b2IoZGF0YSk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBRTFFOzs7R0FHRyxDQUNILE9BQU8sU0FBUyxNQUFNLENBQUMsSUFBMEIsRUFBVTtJQUN6RCxJQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsRUFBRTtRQUM1QixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUNuQixNQUFNO1FBQ0wsTUFBTSxDQUFDLEdBQUcsSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLEFBQUM7UUFDL0IsSUFBSSxVQUFVLEdBQUcsRUFBRSxBQUFDO1FBQ3BCLElBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFFO1lBQ2pDLFVBQVUsSUFBSSxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ3pDO1FBRUQsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7S0FDekI7Q0FDRjtBQUVEOzs7R0FHRyxDQUNILE9BQU8sU0FBUyxNQUFNLENBQUMsSUFBWSxFQUFlO0lBQ2hELE1BQU0sWUFBWSxHQUFHLFlBQVksQ0FBQyxJQUFJLENBQUMsQUFBQztJQUN4QyxNQUFNLE1BQU0sR0FBRyxJQUFJLFVBQVUsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLEFBQUM7SUFDbkQsSUFBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUU7UUFDdEMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDeEM7SUFFRCxPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUM7Q0FDdEI7QUFFRDs7O0dBR0csQ0FDSCxPQUFPLFNBQVMsWUFBWSxDQUFDLElBQVksRUFBVTtJQUNqRCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztDQUNuQiJ9