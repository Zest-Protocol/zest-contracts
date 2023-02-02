// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Converts the input into a string. Objects, Sets and Maps are sorted so as to
 * make tests less flaky
 * @param v Value to be formatted
 */ export function format(v) {
    // deno-lint-ignore no-explicit-any
    const { Deno  } = globalThis;
    return typeof Deno?.inspect === "function" ? Deno.inspect(v, {
        depth: Infinity,
        sorted: true,
        trailingComma: true,
        compact: false,
        iterableLimit: Infinity,
        // getters should be true in assertEquals.
        getters: true
    }) : `"${String(v).replace(/(?=["\\])/g, "\\")}"`;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1OS4wL3Rlc3RpbmcvX2Zvcm1hdC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIyIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG4vKipcbiAqIENvbnZlcnRzIHRoZSBpbnB1dCBpbnRvIGEgc3RyaW5nLiBPYmplY3RzLCBTZXRzIGFuZCBNYXBzIGFyZSBzb3J0ZWQgc28gYXMgdG9cbiAqIG1ha2UgdGVzdHMgbGVzcyBmbGFreVxuICogQHBhcmFtIHYgVmFsdWUgdG8gYmUgZm9ybWF0dGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXQodjogdW5rbm93bik6IHN0cmluZyB7XG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIGNvbnN0IHsgRGVubyB9ID0gZ2xvYmFsVGhpcyBhcyBhbnk7XG4gIHJldHVybiB0eXBlb2YgRGVubz8uaW5zcGVjdCA9PT0gXCJmdW5jdGlvblwiXG4gICAgPyBEZW5vLmluc3BlY3Qodiwge1xuICAgICAgZGVwdGg6IEluZmluaXR5LFxuICAgICAgc29ydGVkOiB0cnVlLFxuICAgICAgdHJhaWxpbmdDb21tYTogdHJ1ZSxcbiAgICAgIGNvbXBhY3Q6IGZhbHNlLFxuICAgICAgaXRlcmFibGVMaW1pdDogSW5maW5pdHksXG4gICAgICAvLyBnZXR0ZXJzIHNob3VsZCBiZSB0cnVlIGluIGFzc2VydEVxdWFscy5cbiAgICAgIGdldHRlcnM6IHRydWUsXG4gICAgfSlcbiAgICA6IGBcIiR7U3RyaW5nKHYpLnJlcGxhY2UoLyg/PVtcIlxcXFxdKS9nLCBcIlxcXFxcIil9XCJgO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckM7Ozs7R0FJRyxDQUNILE9BQU8sU0FBUyxNQUFNLENBQUMsQ0FBVSxFQUFVO0lBQ3pDLG1DQUFtQztJQUNuQyxNQUFNLEVBQUUsSUFBSSxDQUFBLEVBQUUsR0FBRyxVQUFVLEFBQU8sQUFBQztJQUNuQyxPQUFPLE9BQU8sSUFBSSxFQUFFLE9BQU8sS0FBSyxVQUFVLEdBQ3RDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFO1FBQ2hCLEtBQUssRUFBRSxRQUFRO1FBQ2YsTUFBTSxFQUFFLElBQUk7UUFDWixhQUFhLEVBQUUsSUFBSTtRQUNuQixPQUFPLEVBQUUsS0FBSztRQUNkLGFBQWEsRUFBRSxRQUFRO1FBQ3ZCLDBDQUEwQztRQUMxQyxPQUFPLEVBQUUsSUFBSTtLQUNkLENBQUMsR0FDQSxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxlQUFlLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2xEIn0=