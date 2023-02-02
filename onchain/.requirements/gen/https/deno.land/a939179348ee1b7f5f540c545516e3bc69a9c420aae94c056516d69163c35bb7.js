// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// A module to print ANSI terminal colors. Inspired by chalk, kleur, and colors
// on npm.
/**
 * String formatters and utilities for dealing with ANSI color codes.
 *
 * This module is browser compatible.
 *
 * ```ts
 * import { bgBlue, red, bold } from "https://deno.land/std@$STD_VERSION/fmt/colors.ts";
 * console.log(bgBlue(red(bold("Hello world!"))));
 * ```
 *
 * This module supports `NO_COLOR` environmental variable disabling any coloring
 * if `NO_COLOR` is set.
 *
 * @module
 */ // deno-lint-ignore no-explicit-any
const { Deno  } = globalThis;
const noColor = typeof Deno?.noColor === "boolean" ? Deno.noColor : true;
let enabled = !noColor;
/**
 * Set changing text color to enabled or disabled
 * @param value
 */ export function setColorEnabled(value) {
    if (noColor) {
        return;
    }
    enabled = value;
}
/** Get whether text color change is enabled or disabled. */ export function getColorEnabled() {
    return enabled;
}
/**
 * Builds color code
 * @param open
 * @param close
 */ function code(open, close) {
    return {
        open: `\x1b[${open.join(";")}m`,
        close: `\x1b[${close}m`,
        regexp: new RegExp(`\\x1b\\[${close}m`, "g")
    };
}
/**
 * Applies color and background based on color code and its associated text
 * @param str text to apply color settings to
 * @param code color code to apply
 */ function run(str, code) {
    return enabled ? `${code.open}${str.replace(code.regexp, code.open)}${code.close}` : str;
}
/**
 * Reset the text modified
 * @param str text to reset
 */ export function reset(str) {
    return run(str, code([
        0
    ], 0));
}
/**
 * Make the text bold.
 * @param str text to make bold
 */ export function bold(str) {
    return run(str, code([
        1
    ], 22));
}
/**
 * The text emits only a small amount of light.
 * @param str text to dim
 */ export function dim(str) {
    return run(str, code([
        2
    ], 22));
}
/**
 * Make the text italic.
 * @param str text to make italic
 */ export function italic(str) {
    return run(str, code([
        3
    ], 23));
}
/**
 * Make the text underline.
 * @param str text to underline
 */ export function underline(str) {
    return run(str, code([
        4
    ], 24));
}
/**
 * Invert background color and text color.
 * @param str text to invert its color
 */ export function inverse(str) {
    return run(str, code([
        7
    ], 27));
}
/**
 * Make the text hidden.
 * @param str text to hide
 */ export function hidden(str) {
    return run(str, code([
        8
    ], 28));
}
/**
 * Put horizontal line through the center of the text.
 * @param str text to strike through
 */ export function strikethrough(str) {
    return run(str, code([
        9
    ], 29));
}
/**
 * Set text color to black.
 * @param str text to make black
 */ export function black(str) {
    return run(str, code([
        30
    ], 39));
}
/**
 * Set text color to red.
 * @param str text to make red
 */ export function red(str) {
    return run(str, code([
        31
    ], 39));
}
/**
 * Set text color to green.
 * @param str text to make green
 */ export function green(str) {
    return run(str, code([
        32
    ], 39));
}
/**
 * Set text color to yellow.
 * @param str text to make yellow
 */ export function yellow(str) {
    return run(str, code([
        33
    ], 39));
}
/**
 * Set text color to blue.
 * @param str text to make blue
 */ export function blue(str) {
    return run(str, code([
        34
    ], 39));
}
/**
 * Set text color to magenta.
 * @param str text to make magenta
 */ export function magenta(str) {
    return run(str, code([
        35
    ], 39));
}
/**
 * Set text color to cyan.
 * @param str text to make cyan
 */ export function cyan(str) {
    return run(str, code([
        36
    ], 39));
}
/**
 * Set text color to white.
 * @param str text to make white
 */ export function white(str) {
    return run(str, code([
        37
    ], 39));
}
/**
 * Set text color to gray.
 * @param str text to make gray
 */ export function gray(str) {
    return brightBlack(str);
}
/**
 * Set text color to bright black.
 * @param str text to make bright-black
 */ export function brightBlack(str) {
    return run(str, code([
        90
    ], 39));
}
/**
 * Set text color to bright red.
 * @param str text to make bright-red
 */ export function brightRed(str) {
    return run(str, code([
        91
    ], 39));
}
/**
 * Set text color to bright green.
 * @param str text to make bright-green
 */ export function brightGreen(str) {
    return run(str, code([
        92
    ], 39));
}
/**
 * Set text color to bright yellow.
 * @param str text to make bright-yellow
 */ export function brightYellow(str) {
    return run(str, code([
        93
    ], 39));
}
/**
 * Set text color to bright blue.
 * @param str text to make bright-blue
 */ export function brightBlue(str) {
    return run(str, code([
        94
    ], 39));
}
/**
 * Set text color to bright magenta.
 * @param str text to make bright-magenta
 */ export function brightMagenta(str) {
    return run(str, code([
        95
    ], 39));
}
/**
 * Set text color to bright cyan.
 * @param str text to make bright-cyan
 */ export function brightCyan(str) {
    return run(str, code([
        96
    ], 39));
}
/**
 * Set text color to bright white.
 * @param str text to make bright-white
 */ export function brightWhite(str) {
    return run(str, code([
        97
    ], 39));
}
/**
 * Set background color to black.
 * @param str text to make its background black
 */ export function bgBlack(str) {
    return run(str, code([
        40
    ], 49));
}
/**
 * Set background color to red.
 * @param str text to make its background red
 */ export function bgRed(str) {
    return run(str, code([
        41
    ], 49));
}
/**
 * Set background color to green.
 * @param str text to make its background green
 */ export function bgGreen(str) {
    return run(str, code([
        42
    ], 49));
}
/**
 * Set background color to yellow.
 * @param str text to make its background yellow
 */ export function bgYellow(str) {
    return run(str, code([
        43
    ], 49));
}
/**
 * Set background color to blue.
 * @param str text to make its background blue
 */ export function bgBlue(str) {
    return run(str, code([
        44
    ], 49));
}
/**
 *  Set background color to magenta.
 * @param str text to make its background magenta
 */ export function bgMagenta(str) {
    return run(str, code([
        45
    ], 49));
}
/**
 * Set background color to cyan.
 * @param str text to make its background cyan
 */ export function bgCyan(str) {
    return run(str, code([
        46
    ], 49));
}
/**
 * Set background color to white.
 * @param str text to make its background white
 */ export function bgWhite(str) {
    return run(str, code([
        47
    ], 49));
}
/**
 * Set background color to bright black.
 * @param str text to make its background bright-black
 */ export function bgBrightBlack(str) {
    return run(str, code([
        100
    ], 49));
}
/**
 * Set background color to bright red.
 * @param str text to make its background bright-red
 */ export function bgBrightRed(str) {
    return run(str, code([
        101
    ], 49));
}
/**
 * Set background color to bright green.
 * @param str text to make its background bright-green
 */ export function bgBrightGreen(str) {
    return run(str, code([
        102
    ], 49));
}
/**
 * Set background color to bright yellow.
 * @param str text to make its background bright-yellow
 */ export function bgBrightYellow(str) {
    return run(str, code([
        103
    ], 49));
}
/**
 * Set background color to bright blue.
 * @param str text to make its background bright-blue
 */ export function bgBrightBlue(str) {
    return run(str, code([
        104
    ], 49));
}
/**
 * Set background color to bright magenta.
 * @param str text to make its background bright-magenta
 */ export function bgBrightMagenta(str) {
    return run(str, code([
        105
    ], 49));
}
/**
 * Set background color to bright cyan.
 * @param str text to make its background bright-cyan
 */ export function bgBrightCyan(str) {
    return run(str, code([
        106
    ], 49));
}
/**
 * Set background color to bright white.
 * @param str text to make its background bright-white
 */ export function bgBrightWhite(str) {
    return run(str, code([
        107
    ], 49));
}
/* Special Color Sequences */ /**
 * Clam and truncate color codes
 * @param n
 * @param max number to truncate to
 * @param min number to truncate from
 */ function clampAndTruncate(n, max = 255, min = 0) {
    return Math.trunc(Math.max(Math.min(n, max), min));
}
/**
 * Set text color using paletted 8bit colors.
 * https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit
 * @param str text color to apply paletted 8bit colors to
 * @param color code
 */ export function rgb8(str, color) {
    return run(str, code([
        38,
        5,
        clampAndTruncate(color)
    ], 39));
}
/**
 * Set background color using paletted 8bit colors.
 * https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit
 * @param str text color to apply paletted 8bit background colors to
 * @param color code
 */ export function bgRgb8(str, color) {
    return run(str, code([
        48,
        5,
        clampAndTruncate(color)
    ], 49));
}
/**
 * Set text color using 24bit rgb.
 * `color` can be a number in range `0x000000` to `0xffffff` or
 * an `Rgb`.
 *
 * To produce the color magenta:
 *
 * ```ts
 *      import { rgb24 } from "./colors.ts";
 *      rgb24("foo", 0xff00ff);
 *      rgb24("foo", {r: 255, g: 0, b: 255});
 * ```
 * @param str text color to apply 24bit rgb to
 * @param color code
 */ export function rgb24(str, color) {
    if (typeof color === "number") {
        return run(str, code([
            38,
            2,
            color >> 16 & 0xff,
            color >> 8 & 0xff,
            color & 0xff
        ], 39));
    }
    return run(str, code([
        38,
        2,
        clampAndTruncate(color.r),
        clampAndTruncate(color.g),
        clampAndTruncate(color.b), 
    ], 39));
}
/**
 * Set background color using 24bit rgb.
 * `color` can be a number in range `0x000000` to `0xffffff` or
 * an `Rgb`.
 *
 * To produce the color magenta:
 *
 * ```ts
 *      import { bgRgb24 } from "./colors.ts";
 *      bgRgb24("foo", 0xff00ff);
 *      bgRgb24("foo", {r: 255, g: 0, b: 255});
 * ```
 * @param str text color to apply 24bit rgb to
 * @param color code
 */ export function bgRgb24(str, color) {
    if (typeof color === "number") {
        return run(str, code([
            48,
            2,
            color >> 16 & 0xff,
            color >> 8 & 0xff,
            color & 0xff
        ], 49));
    }
    return run(str, code([
        48,
        2,
        clampAndTruncate(color.r),
        clampAndTruncate(color.g),
        clampAndTruncate(color.b), 
    ], 49));
}
// https://github.com/chalk/ansi-regex/blob/02fa893d619d3da85411acc8fd4e2eea0e95a9d9/index.js
const ANSI_PATTERN = new RegExp([
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))", 
].join("|"), "g");
/**
 * Remove ANSI escape codes from the string.
 * @param string to remove ANSI escape codes from
 */ export function stripColor(string) {
    return string.replace(ANSI_PATTERN, "");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1OS4wL2ZtdC9jb2xvcnMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMiB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIEEgbW9kdWxlIHRvIHByaW50IEFOU0kgdGVybWluYWwgY29sb3JzLiBJbnNwaXJlZCBieSBjaGFsaywga2xldXIsIGFuZCBjb2xvcnNcbi8vIG9uIG5wbS5cblxuLyoqXG4gKiBTdHJpbmcgZm9ybWF0dGVycyBhbmQgdXRpbGl0aWVzIGZvciBkZWFsaW5nIHdpdGggQU5TSSBjb2xvciBjb2Rlcy5cbiAqXG4gKiBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IGJnQmx1ZSwgcmVkLCBib2xkIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vZm10L2NvbG9ycy50c1wiO1xuICogY29uc29sZS5sb2coYmdCbHVlKHJlZChib2xkKFwiSGVsbG8gd29ybGQhXCIpKSkpO1xuICogYGBgXG4gKlxuICogVGhpcyBtb2R1bGUgc3VwcG9ydHMgYE5PX0NPTE9SYCBlbnZpcm9ubWVudGFsIHZhcmlhYmxlIGRpc2FibGluZyBhbnkgY29sb3JpbmdcbiAqIGlmIGBOT19DT0xPUmAgaXMgc2V0LlxuICpcbiAqIEBtb2R1bGVcbiAqL1xuXG4vLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuY29uc3QgeyBEZW5vIH0gPSBnbG9iYWxUaGlzIGFzIGFueTtcbmNvbnN0IG5vQ29sb3IgPSB0eXBlb2YgRGVubz8ubm9Db2xvciA9PT0gXCJib29sZWFuXCJcbiAgPyBEZW5vLm5vQ29sb3IgYXMgYm9vbGVhblxuICA6IHRydWU7XG5cbmludGVyZmFjZSBDb2RlIHtcbiAgb3Blbjogc3RyaW5nO1xuICBjbG9zZTogc3RyaW5nO1xuICByZWdleHA6IFJlZ0V4cDtcbn1cblxuLyoqIFJHQiA4LWJpdHMgcGVyIGNoYW5uZWwuIEVhY2ggaW4gcmFuZ2UgYDAtPjI1NWAgb3IgYDB4MDAtPjB4ZmZgICovXG5pbnRlcmZhY2UgUmdiIHtcbiAgcjogbnVtYmVyO1xuICBnOiBudW1iZXI7XG4gIGI6IG51bWJlcjtcbn1cblxubGV0IGVuYWJsZWQgPSAhbm9Db2xvcjtcblxuLyoqXG4gKiBTZXQgY2hhbmdpbmcgdGV4dCBjb2xvciB0byBlbmFibGVkIG9yIGRpc2FibGVkXG4gKiBAcGFyYW0gdmFsdWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldENvbG9yRW5hYmxlZCh2YWx1ZTogYm9vbGVhbikge1xuICBpZiAobm9Db2xvcikge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGVuYWJsZWQgPSB2YWx1ZTtcbn1cblxuLyoqIEdldCB3aGV0aGVyIHRleHQgY29sb3IgY2hhbmdlIGlzIGVuYWJsZWQgb3IgZGlzYWJsZWQuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29sb3JFbmFibGVkKCk6IGJvb2xlYW4ge1xuICByZXR1cm4gZW5hYmxlZDtcbn1cblxuLyoqXG4gKiBCdWlsZHMgY29sb3IgY29kZVxuICogQHBhcmFtIG9wZW5cbiAqIEBwYXJhbSBjbG9zZVxuICovXG5mdW5jdGlvbiBjb2RlKG9wZW46IG51bWJlcltdLCBjbG9zZTogbnVtYmVyKTogQ29kZSB7XG4gIHJldHVybiB7XG4gICAgb3BlbjogYFxceDFiWyR7b3Blbi5qb2luKFwiO1wiKX1tYCxcbiAgICBjbG9zZTogYFxceDFiWyR7Y2xvc2V9bWAsXG4gICAgcmVnZXhwOiBuZXcgUmVnRXhwKGBcXFxceDFiXFxcXFske2Nsb3NlfW1gLCBcImdcIiksXG4gIH07XG59XG5cbi8qKlxuICogQXBwbGllcyBjb2xvciBhbmQgYmFja2dyb3VuZCBiYXNlZCBvbiBjb2xvciBjb2RlIGFuZCBpdHMgYXNzb2NpYXRlZCB0ZXh0XG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gYXBwbHkgY29sb3Igc2V0dGluZ3MgdG9cbiAqIEBwYXJhbSBjb2RlIGNvbG9yIGNvZGUgdG8gYXBwbHlcbiAqL1xuZnVuY3Rpb24gcnVuKHN0cjogc3RyaW5nLCBjb2RlOiBDb2RlKTogc3RyaW5nIHtcbiAgcmV0dXJuIGVuYWJsZWRcbiAgICA/IGAke2NvZGUub3Blbn0ke3N0ci5yZXBsYWNlKGNvZGUucmVnZXhwLCBjb2RlLm9wZW4pfSR7Y29kZS5jbG9zZX1gXG4gICAgOiBzdHI7XG59XG5cbi8qKlxuICogUmVzZXQgdGhlIHRleHQgbW9kaWZpZWRcbiAqIEBwYXJhbSBzdHIgdGV4dCB0byByZXNldFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzZXQoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMF0sIDApKTtcbn1cblxuLyoqXG4gKiBNYWtlIHRoZSB0ZXh0IGJvbGQuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBib2xkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBib2xkKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzFdLCAyMikpO1xufVxuXG4vKipcbiAqIFRoZSB0ZXh0IGVtaXRzIG9ubHkgYSBzbWFsbCBhbW91bnQgb2YgbGlnaHQuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gZGltXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaW0oc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMl0sIDIyKSk7XG59XG5cbi8qKlxuICogTWFrZSB0aGUgdGV4dCBpdGFsaWMuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBpdGFsaWNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGl0YWxpYyhzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFszXSwgMjMpKTtcbn1cblxuLyoqXG4gKiBNYWtlIHRoZSB0ZXh0IHVuZGVybGluZS5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byB1bmRlcmxpbmVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVuZGVybGluZShzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFs0XSwgMjQpKTtcbn1cblxuLyoqXG4gKiBJbnZlcnQgYmFja2dyb3VuZCBjb2xvciBhbmQgdGV4dCBjb2xvci5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBpbnZlcnQgaXRzIGNvbG9yXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnZlcnNlKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzddLCAyNykpO1xufVxuXG4vKipcbiAqIE1ha2UgdGhlIHRleHQgaGlkZGVuLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIGhpZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGhpZGRlbihzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFs4XSwgMjgpKTtcbn1cblxuLyoqXG4gKiBQdXQgaG9yaXpvbnRhbCBsaW5lIHRocm91Z2ggdGhlIGNlbnRlciBvZiB0aGUgdGV4dC5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBzdHJpa2UgdGhyb3VnaFxuICovXG5leHBvcnQgZnVuY3Rpb24gc3RyaWtldGhyb3VnaChzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFs5XSwgMjkpKTtcbn1cblxuLyoqXG4gKiBTZXQgdGV4dCBjb2xvciB0byBibGFjay5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGJsYWNrXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBibGFjayhzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFszMF0sIDM5KSk7XG59XG5cbi8qKlxuICogU2V0IHRleHQgY29sb3IgdG8gcmVkLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgcmVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWQoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMzFdLCAzOSkpO1xufVxuXG4vKipcbiAqIFNldCB0ZXh0IGNvbG9yIHRvIGdyZWVuLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgZ3JlZW5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdyZWVuKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzMyXSwgMzkpKTtcbn1cblxuLyoqXG4gKiBTZXQgdGV4dCBjb2xvciB0byB5ZWxsb3cuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSB5ZWxsb3dcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHllbGxvdyhzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFszM10sIDM5KSk7XG59XG5cbi8qKlxuICogU2V0IHRleHQgY29sb3IgdG8gYmx1ZS5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGJsdWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJsdWUoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMzRdLCAzOSkpO1xufVxuXG4vKipcbiAqIFNldCB0ZXh0IGNvbG9yIHRvIG1hZ2VudGEuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBtYWdlbnRhXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYWdlbnRhKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzM1XSwgMzkpKTtcbn1cblxuLyoqXG4gKiBTZXQgdGV4dCBjb2xvciB0byBjeWFuLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgY3lhblxuICovXG5leHBvcnQgZnVuY3Rpb24gY3lhbihzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFszNl0sIDM5KSk7XG59XG5cbi8qKlxuICogU2V0IHRleHQgY29sb3IgdG8gd2hpdGUuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSB3aGl0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gd2hpdGUoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMzddLCAzOSkpO1xufVxuXG4vKipcbiAqIFNldCB0ZXh0IGNvbG9yIHRvIGdyYXkuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBncmF5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBncmF5KHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGJyaWdodEJsYWNrKHN0cik7XG59XG5cbi8qKlxuICogU2V0IHRleHQgY29sb3IgdG8gYnJpZ2h0IGJsYWNrLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgYnJpZ2h0LWJsYWNrXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBicmlnaHRCbGFjayhzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFs5MF0sIDM5KSk7XG59XG5cbi8qKlxuICogU2V0IHRleHQgY29sb3IgdG8gYnJpZ2h0IHJlZC5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGJyaWdodC1yZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJyaWdodFJlZChzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFs5MV0sIDM5KSk7XG59XG5cbi8qKlxuICogU2V0IHRleHQgY29sb3IgdG8gYnJpZ2h0IGdyZWVuLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgYnJpZ2h0LWdyZWVuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBicmlnaHRHcmVlbihzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFs5Ml0sIDM5KSk7XG59XG5cbi8qKlxuICogU2V0IHRleHQgY29sb3IgdG8gYnJpZ2h0IHllbGxvdy5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGJyaWdodC15ZWxsb3dcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJyaWdodFllbGxvdyhzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFs5M10sIDM5KSk7XG59XG5cbi8qKlxuICogU2V0IHRleHQgY29sb3IgdG8gYnJpZ2h0IGJsdWUuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBicmlnaHQtYmx1ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gYnJpZ2h0Qmx1ZShzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFs5NF0sIDM5KSk7XG59XG5cbi8qKlxuICogU2V0IHRleHQgY29sb3IgdG8gYnJpZ2h0IG1hZ2VudGEuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBicmlnaHQtbWFnZW50YVxuICovXG5leHBvcnQgZnVuY3Rpb24gYnJpZ2h0TWFnZW50YShzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFs5NV0sIDM5KSk7XG59XG5cbi8qKlxuICogU2V0IHRleHQgY29sb3IgdG8gYnJpZ2h0IGN5YW4uXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBicmlnaHQtY3lhblxuICovXG5leHBvcnQgZnVuY3Rpb24gYnJpZ2h0Q3lhbihzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFs5Nl0sIDM5KSk7XG59XG5cbi8qKlxuICogU2V0IHRleHQgY29sb3IgdG8gYnJpZ2h0IHdoaXRlLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgYnJpZ2h0LXdoaXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBicmlnaHRXaGl0ZShzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFs5N10sIDM5KSk7XG59XG5cbi8qKlxuICogU2V0IGJhY2tncm91bmQgY29sb3IgdG8gYmxhY2suXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBpdHMgYmFja2dyb3VuZCBibGFja1xuICovXG5leHBvcnQgZnVuY3Rpb24gYmdCbGFjayhzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFs0MF0sIDQ5KSk7XG59XG5cbi8qKlxuICogU2V0IGJhY2tncm91bmQgY29sb3IgdG8gcmVkLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgaXRzIGJhY2tncm91bmQgcmVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiZ1JlZChzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFs0MV0sIDQ5KSk7XG59XG5cbi8qKlxuICogU2V0IGJhY2tncm91bmQgY29sb3IgdG8gZ3JlZW4uXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBpdHMgYmFja2dyb3VuZCBncmVlblxuICovXG5leHBvcnQgZnVuY3Rpb24gYmdHcmVlbihzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFs0Ml0sIDQ5KSk7XG59XG5cbi8qKlxuICogU2V0IGJhY2tncm91bmQgY29sb3IgdG8geWVsbG93LlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgaXRzIGJhY2tncm91bmQgeWVsbG93XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiZ1llbGxvdyhzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFs0M10sIDQ5KSk7XG59XG5cbi8qKlxuICogU2V0IGJhY2tncm91bmQgY29sb3IgdG8gYmx1ZS5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGl0cyBiYWNrZ3JvdW5kIGJsdWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJnQmx1ZShzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFs0NF0sIDQ5KSk7XG59XG5cbi8qKlxuICogIFNldCBiYWNrZ3JvdW5kIGNvbG9yIHRvIG1hZ2VudGEuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBpdHMgYmFja2dyb3VuZCBtYWdlbnRhXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiZ01hZ2VudGEoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbNDVdLCA0OSkpO1xufVxuXG4vKipcbiAqIFNldCBiYWNrZ3JvdW5kIGNvbG9yIHRvIGN5YW4uXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBpdHMgYmFja2dyb3VuZCBjeWFuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiZ0N5YW4oc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbNDZdLCA0OSkpO1xufVxuXG4vKipcbiAqIFNldCBiYWNrZ3JvdW5kIGNvbG9yIHRvIHdoaXRlLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgaXRzIGJhY2tncm91bmQgd2hpdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJnV2hpdGUoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbNDddLCA0OSkpO1xufVxuXG4vKipcbiAqIFNldCBiYWNrZ3JvdW5kIGNvbG9yIHRvIGJyaWdodCBibGFjay5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGl0cyBiYWNrZ3JvdW5kIGJyaWdodC1ibGFja1xuICovXG5leHBvcnQgZnVuY3Rpb24gYmdCcmlnaHRCbGFjayhzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFsxMDBdLCA0OSkpO1xufVxuXG4vKipcbiAqIFNldCBiYWNrZ3JvdW5kIGNvbG9yIHRvIGJyaWdodCByZWQuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBpdHMgYmFja2dyb3VuZCBicmlnaHQtcmVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiZ0JyaWdodFJlZChzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFsxMDFdLCA0OSkpO1xufVxuXG4vKipcbiAqIFNldCBiYWNrZ3JvdW5kIGNvbG9yIHRvIGJyaWdodCBncmVlbi5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGl0cyBiYWNrZ3JvdW5kIGJyaWdodC1ncmVlblxuICovXG5leHBvcnQgZnVuY3Rpb24gYmdCcmlnaHRHcmVlbihzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFsxMDJdLCA0OSkpO1xufVxuXG4vKipcbiAqIFNldCBiYWNrZ3JvdW5kIGNvbG9yIHRvIGJyaWdodCB5ZWxsb3cuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBpdHMgYmFja2dyb3VuZCBicmlnaHQteWVsbG93XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiZ0JyaWdodFllbGxvdyhzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFsxMDNdLCA0OSkpO1xufVxuXG4vKipcbiAqIFNldCBiYWNrZ3JvdW5kIGNvbG9yIHRvIGJyaWdodCBibHVlLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgaXRzIGJhY2tncm91bmQgYnJpZ2h0LWJsdWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJnQnJpZ2h0Qmx1ZShzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFsxMDRdLCA0OSkpO1xufVxuXG4vKipcbiAqIFNldCBiYWNrZ3JvdW5kIGNvbG9yIHRvIGJyaWdodCBtYWdlbnRhLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgaXRzIGJhY2tncm91bmQgYnJpZ2h0LW1hZ2VudGFcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJnQnJpZ2h0TWFnZW50YShzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFsxMDVdLCA0OSkpO1xufVxuXG4vKipcbiAqIFNldCBiYWNrZ3JvdW5kIGNvbG9yIHRvIGJyaWdodCBjeWFuLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgaXRzIGJhY2tncm91bmQgYnJpZ2h0LWN5YW5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJnQnJpZ2h0Q3lhbihzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFsxMDZdLCA0OSkpO1xufVxuXG4vKipcbiAqIFNldCBiYWNrZ3JvdW5kIGNvbG9yIHRvIGJyaWdodCB3aGl0ZS5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGl0cyBiYWNrZ3JvdW5kIGJyaWdodC13aGl0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gYmdCcmlnaHRXaGl0ZShzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFsxMDddLCA0OSkpO1xufVxuXG4vKiBTcGVjaWFsIENvbG9yIFNlcXVlbmNlcyAqL1xuXG4vKipcbiAqIENsYW0gYW5kIHRydW5jYXRlIGNvbG9yIGNvZGVzXG4gKiBAcGFyYW0gblxuICogQHBhcmFtIG1heCBudW1iZXIgdG8gdHJ1bmNhdGUgdG9cbiAqIEBwYXJhbSBtaW4gbnVtYmVyIHRvIHRydW5jYXRlIGZyb21cbiAqL1xuZnVuY3Rpb24gY2xhbXBBbmRUcnVuY2F0ZShuOiBudW1iZXIsIG1heCA9IDI1NSwgbWluID0gMCk6IG51bWJlciB7XG4gIHJldHVybiBNYXRoLnRydW5jKE1hdGgubWF4KE1hdGgubWluKG4sIG1heCksIG1pbikpO1xufVxuXG4vKipcbiAqIFNldCB0ZXh0IGNvbG9yIHVzaW5nIHBhbGV0dGVkIDhiaXQgY29sb3JzLlxuICogaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQU5TSV9lc2NhcGVfY29kZSM4LWJpdFxuICogQHBhcmFtIHN0ciB0ZXh0IGNvbG9yIHRvIGFwcGx5IHBhbGV0dGVkIDhiaXQgY29sb3JzIHRvXG4gKiBAcGFyYW0gY29sb3IgY29kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmdiOChzdHI6IHN0cmluZywgY29sb3I6IG51bWJlcik6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFszOCwgNSwgY2xhbXBBbmRUcnVuY2F0ZShjb2xvcildLCAzOSkpO1xufVxuXG4vKipcbiAqIFNldCBiYWNrZ3JvdW5kIGNvbG9yIHVzaW5nIHBhbGV0dGVkIDhiaXQgY29sb3JzLlxuICogaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQU5TSV9lc2NhcGVfY29kZSM4LWJpdFxuICogQHBhcmFtIHN0ciB0ZXh0IGNvbG9yIHRvIGFwcGx5IHBhbGV0dGVkIDhiaXQgYmFja2dyb3VuZCBjb2xvcnMgdG9cbiAqIEBwYXJhbSBjb2xvciBjb2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiZ1JnYjgoc3RyOiBzdHJpbmcsIGNvbG9yOiBudW1iZXIpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbNDgsIDUsIGNsYW1wQW5kVHJ1bmNhdGUoY29sb3IpXSwgNDkpKTtcbn1cblxuLyoqXG4gKiBTZXQgdGV4dCBjb2xvciB1c2luZyAyNGJpdCByZ2IuXG4gKiBgY29sb3JgIGNhbiBiZSBhIG51bWJlciBpbiByYW5nZSBgMHgwMDAwMDBgIHRvIGAweGZmZmZmZmAgb3JcbiAqIGFuIGBSZ2JgLlxuICpcbiAqIFRvIHByb2R1Y2UgdGhlIGNvbG9yIG1hZ2VudGE6XG4gKlxuICogYGBgdHNcbiAqICAgICAgaW1wb3J0IHsgcmdiMjQgfSBmcm9tIFwiLi9jb2xvcnMudHNcIjtcbiAqICAgICAgcmdiMjQoXCJmb29cIiwgMHhmZjAwZmYpO1xuICogICAgICByZ2IyNChcImZvb1wiLCB7cjogMjU1LCBnOiAwLCBiOiAyNTV9KTtcbiAqIGBgYFxuICogQHBhcmFtIHN0ciB0ZXh0IGNvbG9yIHRvIGFwcGx5IDI0Yml0IHJnYiB0b1xuICogQHBhcmFtIGNvbG9yIGNvZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJnYjI0KHN0cjogc3RyaW5nLCBjb2xvcjogbnVtYmVyIHwgUmdiKTogc3RyaW5nIHtcbiAgaWYgKHR5cGVvZiBjb2xvciA9PT0gXCJudW1iZXJcIikge1xuICAgIHJldHVybiBydW4oXG4gICAgICBzdHIsXG4gICAgICBjb2RlKFxuICAgICAgICBbMzgsIDIsIChjb2xvciA+PiAxNikgJiAweGZmLCAoY29sb3IgPj4gOCkgJiAweGZmLCBjb2xvciAmIDB4ZmZdLFxuICAgICAgICAzOSxcbiAgICAgICksXG4gICAgKTtcbiAgfVxuICByZXR1cm4gcnVuKFxuICAgIHN0cixcbiAgICBjb2RlKFxuICAgICAgW1xuICAgICAgICAzOCxcbiAgICAgICAgMixcbiAgICAgICAgY2xhbXBBbmRUcnVuY2F0ZShjb2xvci5yKSxcbiAgICAgICAgY2xhbXBBbmRUcnVuY2F0ZShjb2xvci5nKSxcbiAgICAgICAgY2xhbXBBbmRUcnVuY2F0ZShjb2xvci5iKSxcbiAgICAgIF0sXG4gICAgICAzOSxcbiAgICApLFxuICApO1xufVxuXG4vKipcbiAqIFNldCBiYWNrZ3JvdW5kIGNvbG9yIHVzaW5nIDI0Yml0IHJnYi5cbiAqIGBjb2xvcmAgY2FuIGJlIGEgbnVtYmVyIGluIHJhbmdlIGAweDAwMDAwMGAgdG8gYDB4ZmZmZmZmYCBvclxuICogYW4gYFJnYmAuXG4gKlxuICogVG8gcHJvZHVjZSB0aGUgY29sb3IgbWFnZW50YTpcbiAqXG4gKiBgYGB0c1xuICogICAgICBpbXBvcnQgeyBiZ1JnYjI0IH0gZnJvbSBcIi4vY29sb3JzLnRzXCI7XG4gKiAgICAgIGJnUmdiMjQoXCJmb29cIiwgMHhmZjAwZmYpO1xuICogICAgICBiZ1JnYjI0KFwiZm9vXCIsIHtyOiAyNTUsIGc6IDAsIGI6IDI1NX0pO1xuICogYGBgXG4gKiBAcGFyYW0gc3RyIHRleHQgY29sb3IgdG8gYXBwbHkgMjRiaXQgcmdiIHRvXG4gKiBAcGFyYW0gY29sb3IgY29kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gYmdSZ2IyNChzdHI6IHN0cmluZywgY29sb3I6IG51bWJlciB8IFJnYik6IHN0cmluZyB7XG4gIGlmICh0eXBlb2YgY29sb3IgPT09IFwibnVtYmVyXCIpIHtcbiAgICByZXR1cm4gcnVuKFxuICAgICAgc3RyLFxuICAgICAgY29kZShcbiAgICAgICAgWzQ4LCAyLCAoY29sb3IgPj4gMTYpICYgMHhmZiwgKGNvbG9yID4+IDgpICYgMHhmZiwgY29sb3IgJiAweGZmXSxcbiAgICAgICAgNDksXG4gICAgICApLFxuICAgICk7XG4gIH1cbiAgcmV0dXJuIHJ1bihcbiAgICBzdHIsXG4gICAgY29kZShcbiAgICAgIFtcbiAgICAgICAgNDgsXG4gICAgICAgIDIsXG4gICAgICAgIGNsYW1wQW5kVHJ1bmNhdGUoY29sb3IuciksXG4gICAgICAgIGNsYW1wQW5kVHJ1bmNhdGUoY29sb3IuZyksXG4gICAgICAgIGNsYW1wQW5kVHJ1bmNhdGUoY29sb3IuYiksXG4gICAgICBdLFxuICAgICAgNDksXG4gICAgKSxcbiAgKTtcbn1cblxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2NoYWxrL2Fuc2ktcmVnZXgvYmxvYi8wMmZhODkzZDYxOWQzZGE4NTQxMWFjYzhmZDRlMmVlYTBlOTVhOWQ5L2luZGV4LmpzXG5jb25zdCBBTlNJX1BBVFRFUk4gPSBuZXcgUmVnRXhwKFxuICBbXG4gICAgXCJbXFxcXHUwMDFCXFxcXHUwMDlCXVtbXFxcXF0oKSM7P10qKD86KD86KD86KD86O1stYS16QS1aXFxcXGRcXFxcLyMmLjo9PyVAfl9dKykqfFthLXpBLVpcXFxcZF0rKD86O1stYS16QS1aXFxcXGRcXFxcLyMmLjo9PyVAfl9dKikqKT9cXFxcdTAwMDcpXCIsXG4gICAgXCIoPzooPzpcXFxcZHsxLDR9KD86O1xcXFxkezAsNH0pKik/W1xcXFxkQS1QUi1UWmNmLW5xLXV5PT48fl0pKVwiLFxuICBdLmpvaW4oXCJ8XCIpLFxuICBcImdcIixcbik7XG5cbi8qKlxuICogUmVtb3ZlIEFOU0kgZXNjYXBlIGNvZGVzIGZyb20gdGhlIHN0cmluZy5cbiAqIEBwYXJhbSBzdHJpbmcgdG8gcmVtb3ZlIEFOU0kgZXNjYXBlIGNvZGVzIGZyb21cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0cmlwQ29sb3Ioc3RyaW5nOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gc3RyaW5nLnJlcGxhY2UoQU5TSV9QQVRURVJOLCBcIlwiKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUsK0VBQStFO0FBQy9FLFVBQVU7QUFFVjs7Ozs7Ozs7Ozs7Ozs7R0FjRyxDQUVILG1DQUFtQztBQUNuQyxNQUFNLEVBQUUsSUFBSSxDQUFBLEVBQUUsR0FBRyxVQUFVLEFBQU8sQUFBQztBQUNuQyxNQUFNLE9BQU8sR0FBRyxPQUFPLElBQUksRUFBRSxPQUFPLEtBQUssU0FBUyxHQUM5QyxJQUFJLENBQUMsT0FBTyxHQUNaLElBQUksQUFBQztBQWVULElBQUksT0FBTyxHQUFHLENBQUMsT0FBTyxBQUFDO0FBRXZCOzs7R0FHRyxDQUNILE9BQU8sU0FBUyxlQUFlLENBQUMsS0FBYyxFQUFFO0lBQzlDLElBQUksT0FBTyxFQUFFO1FBQ1gsT0FBTztLQUNSO0lBRUQsT0FBTyxHQUFHLEtBQUssQ0FBQztDQUNqQjtBQUVELDREQUE0RCxDQUM1RCxPQUFPLFNBQVMsZUFBZSxHQUFZO0lBQ3pDLE9BQU8sT0FBTyxDQUFDO0NBQ2hCO0FBRUQ7Ozs7R0FJRyxDQUNILFNBQVMsSUFBSSxDQUFDLElBQWMsRUFBRSxLQUFhLEVBQVE7SUFDakQsT0FBTztRQUNMLElBQUksRUFBRSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMvQixLQUFLLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUN2QixNQUFNLEVBQUUsSUFBSSxNQUFNLENBQUMsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQztLQUM3QyxDQUFDO0NBQ0g7QUFFRDs7OztHQUlHLENBQ0gsU0FBUyxHQUFHLENBQUMsR0FBVyxFQUFFLElBQVUsRUFBVTtJQUM1QyxPQUFPLE9BQU8sR0FDVixDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FDakUsR0FBRyxDQUFDO0NBQ1Q7QUFFRDs7O0dBR0csQ0FDSCxPQUFPLFNBQVMsS0FBSyxDQUFDLEdBQVcsRUFBVTtJQUN6QyxPQUFPLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDO0FBQUMsU0FBQztLQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUMvQjtBQUVEOzs7R0FHRyxDQUNILE9BQU8sU0FBUyxJQUFJLENBQUMsR0FBVyxFQUFVO0lBQ3hDLE9BQU8sR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUM7QUFBQyxTQUFDO0tBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0NBQ2hDO0FBRUQ7OztHQUdHLENBQ0gsT0FBTyxTQUFTLEdBQUcsQ0FBQyxHQUFXLEVBQVU7SUFDdkMsT0FBTyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQztBQUFDLFNBQUM7S0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Q0FDaEM7QUFFRDs7O0dBR0csQ0FDSCxPQUFPLFNBQVMsTUFBTSxDQUFDLEdBQVcsRUFBVTtJQUMxQyxPQUFPLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDO0FBQUMsU0FBQztLQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztDQUNoQztBQUVEOzs7R0FHRyxDQUNILE9BQU8sU0FBUyxTQUFTLENBQUMsR0FBVyxFQUFVO0lBQzdDLE9BQU8sR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUM7QUFBQyxTQUFDO0tBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0NBQ2hDO0FBRUQ7OztHQUdHLENBQ0gsT0FBTyxTQUFTLE9BQU8sQ0FBQyxHQUFXLEVBQVU7SUFDM0MsT0FBTyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQztBQUFDLFNBQUM7S0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Q0FDaEM7QUFFRDs7O0dBR0csQ0FDSCxPQUFPLFNBQVMsTUFBTSxDQUFDLEdBQVcsRUFBVTtJQUMxQyxPQUFPLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDO0FBQUMsU0FBQztLQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztDQUNoQztBQUVEOzs7R0FHRyxDQUNILE9BQU8sU0FBUyxhQUFhLENBQUMsR0FBVyxFQUFVO0lBQ2pELE9BQU8sR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUM7QUFBQyxTQUFDO0tBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0NBQ2hDO0FBRUQ7OztHQUdHLENBQ0gsT0FBTyxTQUFTLEtBQUssQ0FBQyxHQUFXLEVBQVU7SUFDekMsT0FBTyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQztBQUFDLFVBQUU7S0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Q0FDakM7QUFFRDs7O0dBR0csQ0FDSCxPQUFPLFNBQVMsR0FBRyxDQUFDLEdBQVcsRUFBVTtJQUN2QyxPQUFPLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDO0FBQUMsVUFBRTtLQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztDQUNqQztBQUVEOzs7R0FHRyxDQUNILE9BQU8sU0FBUyxLQUFLLENBQUMsR0FBVyxFQUFVO0lBQ3pDLE9BQU8sR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUM7QUFBQyxVQUFFO0tBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0NBQ2pDO0FBRUQ7OztHQUdHLENBQ0gsT0FBTyxTQUFTLE1BQU0sQ0FBQyxHQUFXLEVBQVU7SUFDMUMsT0FBTyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQztBQUFDLFVBQUU7S0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Q0FDakM7QUFFRDs7O0dBR0csQ0FDSCxPQUFPLFNBQVMsSUFBSSxDQUFDLEdBQVcsRUFBVTtJQUN4QyxPQUFPLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDO0FBQUMsVUFBRTtLQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztDQUNqQztBQUVEOzs7R0FHRyxDQUNILE9BQU8sU0FBUyxPQUFPLENBQUMsR0FBVyxFQUFVO0lBQzNDLE9BQU8sR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUM7QUFBQyxVQUFFO0tBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0NBQ2pDO0FBRUQ7OztHQUdHLENBQ0gsT0FBTyxTQUFTLElBQUksQ0FBQyxHQUFXLEVBQVU7SUFDeEMsT0FBTyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQztBQUFDLFVBQUU7S0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Q0FDakM7QUFFRDs7O0dBR0csQ0FDSCxPQUFPLFNBQVMsS0FBSyxDQUFDLEdBQVcsRUFBVTtJQUN6QyxPQUFPLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDO0FBQUMsVUFBRTtLQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztDQUNqQztBQUVEOzs7R0FHRyxDQUNILE9BQU8sU0FBUyxJQUFJLENBQUMsR0FBVyxFQUFVO0lBQ3hDLE9BQU8sV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQ3pCO0FBRUQ7OztHQUdHLENBQ0gsT0FBTyxTQUFTLFdBQVcsQ0FBQyxHQUFXLEVBQVU7SUFDL0MsT0FBTyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQztBQUFDLFVBQUU7S0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Q0FDakM7QUFFRDs7O0dBR0csQ0FDSCxPQUFPLFNBQVMsU0FBUyxDQUFDLEdBQVcsRUFBVTtJQUM3QyxPQUFPLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDO0FBQUMsVUFBRTtLQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztDQUNqQztBQUVEOzs7R0FHRyxDQUNILE9BQU8sU0FBUyxXQUFXLENBQUMsR0FBVyxFQUFVO0lBQy9DLE9BQU8sR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUM7QUFBQyxVQUFFO0tBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0NBQ2pDO0FBRUQ7OztHQUdHLENBQ0gsT0FBTyxTQUFTLFlBQVksQ0FBQyxHQUFXLEVBQVU7SUFDaEQsT0FBTyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQztBQUFDLFVBQUU7S0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Q0FDakM7QUFFRDs7O0dBR0csQ0FDSCxPQUFPLFNBQVMsVUFBVSxDQUFDLEdBQVcsRUFBVTtJQUM5QyxPQUFPLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDO0FBQUMsVUFBRTtLQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztDQUNqQztBQUVEOzs7R0FHRyxDQUNILE9BQU8sU0FBUyxhQUFhLENBQUMsR0FBVyxFQUFVO0lBQ2pELE9BQU8sR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUM7QUFBQyxVQUFFO0tBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0NBQ2pDO0FBRUQ7OztHQUdHLENBQ0gsT0FBTyxTQUFTLFVBQVUsQ0FBQyxHQUFXLEVBQVU7SUFDOUMsT0FBTyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQztBQUFDLFVBQUU7S0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Q0FDakM7QUFFRDs7O0dBR0csQ0FDSCxPQUFPLFNBQVMsV0FBVyxDQUFDLEdBQVcsRUFBVTtJQUMvQyxPQUFPLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDO0FBQUMsVUFBRTtLQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztDQUNqQztBQUVEOzs7R0FHRyxDQUNILE9BQU8sU0FBUyxPQUFPLENBQUMsR0FBVyxFQUFVO0lBQzNDLE9BQU8sR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUM7QUFBQyxVQUFFO0tBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0NBQ2pDO0FBRUQ7OztHQUdHLENBQ0gsT0FBTyxTQUFTLEtBQUssQ0FBQyxHQUFXLEVBQVU7SUFDekMsT0FBTyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQztBQUFDLFVBQUU7S0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Q0FDakM7QUFFRDs7O0dBR0csQ0FDSCxPQUFPLFNBQVMsT0FBTyxDQUFDLEdBQVcsRUFBVTtJQUMzQyxPQUFPLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDO0FBQUMsVUFBRTtLQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztDQUNqQztBQUVEOzs7R0FHRyxDQUNILE9BQU8sU0FBUyxRQUFRLENBQUMsR0FBVyxFQUFVO0lBQzVDLE9BQU8sR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUM7QUFBQyxVQUFFO0tBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0NBQ2pDO0FBRUQ7OztHQUdHLENBQ0gsT0FBTyxTQUFTLE1BQU0sQ0FBQyxHQUFXLEVBQVU7SUFDMUMsT0FBTyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQztBQUFDLFVBQUU7S0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Q0FDakM7QUFFRDs7O0dBR0csQ0FDSCxPQUFPLFNBQVMsU0FBUyxDQUFDLEdBQVcsRUFBVTtJQUM3QyxPQUFPLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDO0FBQUMsVUFBRTtLQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztDQUNqQztBQUVEOzs7R0FHRyxDQUNILE9BQU8sU0FBUyxNQUFNLENBQUMsR0FBVyxFQUFVO0lBQzFDLE9BQU8sR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUM7QUFBQyxVQUFFO0tBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0NBQ2pDO0FBRUQ7OztHQUdHLENBQ0gsT0FBTyxTQUFTLE9BQU8sQ0FBQyxHQUFXLEVBQVU7SUFDM0MsT0FBTyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQztBQUFDLFVBQUU7S0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Q0FDakM7QUFFRDs7O0dBR0csQ0FDSCxPQUFPLFNBQVMsYUFBYSxDQUFDLEdBQVcsRUFBVTtJQUNqRCxPQUFPLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDO0FBQUMsV0FBRztLQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztDQUNsQztBQUVEOzs7R0FHRyxDQUNILE9BQU8sU0FBUyxXQUFXLENBQUMsR0FBVyxFQUFVO0lBQy9DLE9BQU8sR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUM7QUFBQyxXQUFHO0tBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0NBQ2xDO0FBRUQ7OztHQUdHLENBQ0gsT0FBTyxTQUFTLGFBQWEsQ0FBQyxHQUFXLEVBQVU7SUFDakQsT0FBTyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQztBQUFDLFdBQUc7S0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Q0FDbEM7QUFFRDs7O0dBR0csQ0FDSCxPQUFPLFNBQVMsY0FBYyxDQUFDLEdBQVcsRUFBVTtJQUNsRCxPQUFPLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDO0FBQUMsV0FBRztLQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztDQUNsQztBQUVEOzs7R0FHRyxDQUNILE9BQU8sU0FBUyxZQUFZLENBQUMsR0FBVyxFQUFVO0lBQ2hELE9BQU8sR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUM7QUFBQyxXQUFHO0tBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0NBQ2xDO0FBRUQ7OztHQUdHLENBQ0gsT0FBTyxTQUFTLGVBQWUsQ0FBQyxHQUFXLEVBQVU7SUFDbkQsT0FBTyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQztBQUFDLFdBQUc7S0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Q0FDbEM7QUFFRDs7O0dBR0csQ0FDSCxPQUFPLFNBQVMsWUFBWSxDQUFDLEdBQVcsRUFBVTtJQUNoRCxPQUFPLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDO0FBQUMsV0FBRztLQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztDQUNsQztBQUVEOzs7R0FHRyxDQUNILE9BQU8sU0FBUyxhQUFhLENBQUMsR0FBVyxFQUFVO0lBQ2pELE9BQU8sR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUM7QUFBQyxXQUFHO0tBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0NBQ2xDO0FBRUQsNkJBQTZCLENBRTdCOzs7OztHQUtHLENBQ0gsU0FBUyxnQkFBZ0IsQ0FBQyxDQUFTLEVBQUUsR0FBRyxHQUFHLEdBQUcsRUFBRSxHQUFHLEdBQUcsQ0FBQyxFQUFVO0lBQy9ELE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7Q0FDcEQ7QUFFRDs7Ozs7R0FLRyxDQUNILE9BQU8sU0FBUyxJQUFJLENBQUMsR0FBVyxFQUFFLEtBQWEsRUFBVTtJQUN2RCxPQUFPLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDO0FBQUMsVUFBRTtBQUFFLFNBQUM7UUFBRSxnQkFBZ0IsQ0FBQyxLQUFLLENBQUM7S0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Q0FDN0Q7QUFFRDs7Ozs7R0FLRyxDQUNILE9BQU8sU0FBUyxNQUFNLENBQUMsR0FBVyxFQUFFLEtBQWEsRUFBVTtJQUN6RCxPQUFPLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDO0FBQUMsVUFBRTtBQUFFLFNBQUM7UUFBRSxnQkFBZ0IsQ0FBQyxLQUFLLENBQUM7S0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Q0FDN0Q7QUFFRDs7Ozs7Ozs7Ozs7Ozs7R0FjRyxDQUNILE9BQU8sU0FBUyxLQUFLLENBQUMsR0FBVyxFQUFFLEtBQW1CLEVBQVU7SUFDOUQsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUU7UUFDN0IsT0FBTyxHQUFHLENBQ1IsR0FBRyxFQUNILElBQUksQ0FDRjtBQUFDLGNBQUU7QUFBRSxhQUFDO1lBQUUsQUFBQyxLQUFLLElBQUksRUFBRSxHQUFJLElBQUk7WUFBRSxBQUFDLEtBQUssSUFBSSxDQUFDLEdBQUksSUFBSTtZQUFFLEtBQUssR0FBRyxJQUFJO1NBQUMsRUFDaEUsRUFBRSxDQUNILENBQ0YsQ0FBQztLQUNIO0lBQ0QsT0FBTyxHQUFHLENBQ1IsR0FBRyxFQUNILElBQUksQ0FDRjtBQUNFLFVBQUU7QUFDRixTQUFDO1FBQ0QsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUN6QixnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3pCLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7S0FDMUIsRUFDRCxFQUFFLENBQ0gsQ0FDRixDQUFDO0NBQ0g7QUFFRDs7Ozs7Ozs7Ozs7Ozs7R0FjRyxDQUNILE9BQU8sU0FBUyxPQUFPLENBQUMsR0FBVyxFQUFFLEtBQW1CLEVBQVU7SUFDaEUsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUU7UUFDN0IsT0FBTyxHQUFHLENBQ1IsR0FBRyxFQUNILElBQUksQ0FDRjtBQUFDLGNBQUU7QUFBRSxhQUFDO1lBQUUsQUFBQyxLQUFLLElBQUksRUFBRSxHQUFJLElBQUk7WUFBRSxBQUFDLEtBQUssSUFBSSxDQUFDLEdBQUksSUFBSTtZQUFFLEtBQUssR0FBRyxJQUFJO1NBQUMsRUFDaEUsRUFBRSxDQUNILENBQ0YsQ0FBQztLQUNIO0lBQ0QsT0FBTyxHQUFHLENBQ1IsR0FBRyxFQUNILElBQUksQ0FDRjtBQUNFLFVBQUU7QUFDRixTQUFDO1FBQ0QsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUN6QixnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3pCLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7S0FDMUIsRUFDRCxFQUFFLENBQ0gsQ0FDRixDQUFDO0NBQ0g7QUFFRCw2RkFBNkY7QUFDN0YsTUFBTSxZQUFZLEdBQUcsSUFBSSxNQUFNLENBQzdCO0lBQ0UsOEhBQThIO0lBQzlILDBEQUEwRDtDQUMzRCxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFDWCxHQUFHLENBQ0osQUFBQztBQUVGOzs7R0FHRyxDQUNILE9BQU8sU0FBUyxVQUFVLENBQUMsTUFBYyxFQUFVO0lBQ2pELE9BQU8sTUFBTSxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsRUFBRSxDQUFDLENBQUM7Q0FDekMifQ==