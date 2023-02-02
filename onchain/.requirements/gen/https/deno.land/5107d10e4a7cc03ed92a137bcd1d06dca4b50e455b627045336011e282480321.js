// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright Node.js contributors. All rights reserved. MIT License.
/** NOT IMPLEMENTED
 * ERR_MANIFEST_ASSERT_INTEGRITY
 * ERR_QUICSESSION_VERSION_NEGOTIATION
 * ERR_REQUIRE_ESM
 * ERR_TLS_CERT_ALTNAME_INVALID
 * ERR_WORKER_INVALID_EXEC_ARGV
 * ERR_WORKER_PATH
 * ERR_QUIC_ERROR
 * ERR_SYSTEM_ERROR //System error, shouldn't ever happen inside Deno
 * ERR_TTY_INIT_FAILED //System error, shouldn't ever happen inside Deno
 * ERR_INVALID_PACKAGE_CONFIG // package.json stuff, probably useless
 */ import { inspect } from "../internal/util/inspect.mjs";
import { codes } from "./error_codes.ts";
import { codeMap, errorMap, mapSysErrnoToUvErrno } from "../internal_binding/uv.ts";
import { assert } from "../../_util/assert.ts";
import { isWindows } from "../../_util/os.ts";
import { os as osConstants } from "../internal_binding/constants.ts";
const { errno: { ENOTDIR , ENOENT  } ,  } = osConstants;
import { hideStackFrames } from "./hide_stack_frames.ts";
import { getSystemErrorName } from "../_utils.ts";
export { errorMap };
const kIsNodeError = Symbol("kIsNodeError");
/**
 * @see https://github.com/nodejs/node/blob/f3eb224/lib/internal/errors.js
 */ const classRegExp = /^([A-Z][a-z0-9]*)+$/;
/**
 * @see https://github.com/nodejs/node/blob/f3eb224/lib/internal/errors.js
 * @description Sorted by a rough estimate on most frequently used entries.
 */ const kTypes = [
    "string",
    "function",
    "number",
    "object",
    // Accept 'Function' and 'Object' as alternative to the lower cased version.
    "Function",
    "Object",
    "boolean",
    "bigint",
    "symbol", 
];
// Node uses an AbortError that isn't exactly the same as the DOMException
// to make usage of the error in userland and readable-stream easier.
// It is a regular error with `.code` and `.name`.
export class AbortError extends Error {
    code;
    constructor(){
        super("The operation was aborted");
        this.code = "ABORT_ERR";
        this.name = "AbortError";
    }
}
let maxStack_ErrorName;
let maxStack_ErrorMessage;
/**
 * Returns true if `err.name` and `err.message` are equal to engine-specific
 * values indicating max call stack size has been exceeded.
 * "Maximum call stack size exceeded" in V8.
 */ export function isStackOverflowError(err) {
    if (maxStack_ErrorMessage === undefined) {
        try {
            // deno-lint-ignore no-inner-declarations
            function overflowStack() {
                overflowStack();
            }
            overflowStack();
        // deno-lint-ignore no-explicit-any
        } catch (err1) {
            maxStack_ErrorMessage = err1.message;
            maxStack_ErrorName = err1.name;
        }
    }
    return err && err.name === maxStack_ErrorName && err.message === maxStack_ErrorMessage;
}
function addNumericalSeparator(val) {
    let res = "";
    let i = val.length;
    const start = val[0] === "-" ? 1 : 0;
    for(; i >= start + 4; i -= 3){
        res = `_${val.slice(i - 3, i)}${res}`;
    }
    return `${val.slice(0, i)}${res}`;
}
const captureLargerStackTrace = hideStackFrames(function captureLargerStackTrace(err) {
    // @ts-ignore this function is not available in lib.dom.d.ts
    Error.captureStackTrace(err);
    return err;
});
/**
 * This creates an error compatible with errors produced in the C++
 * This function should replace the deprecated
 * `exceptionWithHostPort()` function.
 *
 * @param err A libuv error number
 * @param syscall
 * @param address
 * @param port
 * @return The error.
 */ export const uvExceptionWithHostPort = hideStackFrames(function uvExceptionWithHostPort(err, syscall, address, port) {
    const { 0: code , 1: uvmsg  } = uvErrmapGet(err) || uvUnmappedError;
    const message = `${syscall} ${code}: ${uvmsg}`;
    let details = "";
    if (port && port > 0) {
        details = ` ${address}:${port}`;
    } else if (address) {
        details = ` ${address}`;
    }
    // deno-lint-ignore no-explicit-any
    const ex = new Error(`${message}${details}`);
    ex.code = code;
    ex.errno = err;
    ex.syscall = syscall;
    ex.address = address;
    if (port) {
        ex.port = port;
    }
    return captureLargerStackTrace(ex);
});
/**
 * This used to be `util._errnoException()`.
 *
 * @param err A libuv error number
 * @param syscall
 * @param original
 * @return A `ErrnoException`
 */ export const errnoException = hideStackFrames(function errnoException(err, syscall, original) {
    const code = getSystemErrorName(err);
    const message = original ? `${syscall} ${code} ${original}` : `${syscall} ${code}`;
    // deno-lint-ignore no-explicit-any
    const ex = new Error(message);
    ex.errno = err;
    ex.code = code;
    ex.syscall = syscall;
    return captureLargerStackTrace(ex);
});
function uvErrmapGet(name) {
    return errorMap.get(name);
}
const uvUnmappedError = [
    "UNKNOWN",
    "unknown error"
];
/**
 * This creates an error compatible with errors produced in the C++
 * function UVException using a context object with data assembled in C++.
 * The goal is to migrate them to ERR_* errors later when compatibility is
 * not a concern.
 *
 * @param ctx
 * @return The error.
 */ export const uvException = hideStackFrames(function uvException(ctx) {
    const { 0: code , 1: uvmsg  } = uvErrmapGet(ctx.errno) || uvUnmappedError;
    let message = `${code}: ${ctx.message || uvmsg}, ${ctx.syscall}`;
    let path;
    let dest;
    if (ctx.path) {
        path = ctx.path.toString();
        message += ` '${path}'`;
    }
    if (ctx.dest) {
        dest = ctx.dest.toString();
        message += ` -> '${dest}'`;
    }
    // deno-lint-ignore no-explicit-any
    const err = new Error(message);
    for (const prop of Object.keys(ctx)){
        if (prop === "message" || prop === "path" || prop === "dest") {
            continue;
        }
        err[prop] = ctx[prop];
    }
    err.code = code;
    if (path) {
        err.path = path;
    }
    if (dest) {
        err.dest = dest;
    }
    return captureLargerStackTrace(err);
});
/**
 * Deprecated, new function is `uvExceptionWithHostPort()`
 * New function added the error description directly
 * from C++. this method for backwards compatibility
 * @param err A libuv error number
 * @param syscall
 * @param address
 * @param port
 * @param additional
 */ export const exceptionWithHostPort = hideStackFrames(function exceptionWithHostPort(err, syscall, address, port, additional) {
    const code = getSystemErrorName(err);
    let details = "";
    if (port && port > 0) {
        details = ` ${address}:${port}`;
    } else if (address) {
        details = ` ${address}`;
    }
    if (additional) {
        details += ` - Local (${additional})`;
    }
    // deno-lint-ignore no-explicit-any
    const ex = new Error(`${syscall} ${code}${details}`);
    ex.errno = err;
    ex.code = code;
    ex.syscall = syscall;
    ex.address = address;
    if (port) {
        ex.port = port;
    }
    return captureLargerStackTrace(ex);
});
/**
 * @param code A libuv error number or a c-ares error code
 * @param syscall
 * @param hostname
 */ export const dnsException = hideStackFrames(function(code, syscall, hostname) {
    let errno;
    // If `code` is of type number, it is a libuv error number, else it is a
    // c-ares error code.
    if (typeof code === "number") {
        errno = code;
        // ENOTFOUND is not a proper POSIX error, but this error has been in place
        // long enough that it's not practical to remove it.
        if (code === codeMap.get("EAI_NODATA") || code === codeMap.get("EAI_NONAME")) {
            code = "ENOTFOUND"; // Fabricated error name.
        } else {
            code = getSystemErrorName(code);
        }
    }
    const message = `${syscall} ${code}${hostname ? ` ${hostname}` : ""}`;
    // deno-lint-ignore no-explicit-any
    const ex = new Error(message);
    ex.errno = errno;
    ex.code = code;
    ex.syscall = syscall;
    if (hostname) {
        ex.hostname = hostname;
    }
    return captureLargerStackTrace(ex);
});
/**
 * All error instances in Node have additional methods and properties
 * This export class is meant to be extended by these instances abstracting native JS error instances
 */ export class NodeErrorAbstraction extends Error {
    code;
    constructor(name, code, message){
        super(message);
        this.code = code;
        this.name = name;
        //This number changes depending on the name of this class
        //20 characters as of now
        this.stack = this.stack && `${name} [${this.code}]${this.stack.slice(20)}`;
    }
    toString() {
        return `${this.name} [${this.code}]: ${this.message}`;
    }
}
export class NodeError extends NodeErrorAbstraction {
    constructor(code, message){
        super(Error.prototype.name, code, message);
    }
}
export class NodeSyntaxError extends NodeErrorAbstraction {
    constructor(code, message){
        super(SyntaxError.prototype.name, code, message);
        Object.setPrototypeOf(this, SyntaxError.prototype);
        this.toString = function() {
            return `${this.name} [${this.code}]: ${this.message}`;
        };
    }
}
export class NodeRangeError extends NodeErrorAbstraction {
    constructor(code, message){
        super(RangeError.prototype.name, code, message);
        Object.setPrototypeOf(this, RangeError.prototype);
        this.toString = function() {
            return `${this.name} [${this.code}]: ${this.message}`;
        };
    }
}
export class NodeTypeError extends NodeErrorAbstraction {
    constructor(code, message){
        super(TypeError.prototype.name, code, message);
        Object.setPrototypeOf(this, TypeError.prototype);
        this.toString = function() {
            return `${this.name} [${this.code}]: ${this.message}`;
        };
    }
}
export class NodeURIError extends NodeErrorAbstraction {
    constructor(code, message){
        super(URIError.prototype.name, code, message);
        Object.setPrototypeOf(this, URIError.prototype);
        this.toString = function() {
            return `${this.name} [${this.code}]: ${this.message}`;
        };
    }
}
// A specialized Error that includes an additional info property with
// additional information about the error condition.
// It has the properties present in a UVException but with a custom error
// message followed by the uv error code and uv error message.
// It also has its own error code with the original uv error context put into
// `err.info`.
// The context passed into this error must have .code, .syscall and .message,
// and may have .path and .dest.
class NodeSystemError extends NodeErrorAbstraction {
    constructor(key, context, msgPrefix){
        let message = `${msgPrefix}: ${context.syscall} returned ` + `${context.code} (${context.message})`;
        if (context.path !== undefined) {
            message += ` ${context.path}`;
        }
        if (context.dest !== undefined) {
            message += ` => ${context.dest}`;
        }
        super("SystemError", key, message);
        captureLargerStackTrace(this);
        Object.defineProperties(this, {
            [kIsNodeError]: {
                value: true,
                enumerable: false,
                writable: false,
                configurable: true
            },
            info: {
                value: context,
                enumerable: true,
                configurable: true,
                writable: false
            },
            errno: {
                get () {
                    return context.errno;
                },
                set: (value)=>{
                    context.errno = value;
                },
                enumerable: true,
                configurable: true
            },
            syscall: {
                get () {
                    return context.syscall;
                },
                set: (value)=>{
                    context.syscall = value;
                },
                enumerable: true,
                configurable: true
            }
        });
        if (context.path !== undefined) {
            Object.defineProperty(this, "path", {
                get () {
                    return context.path;
                },
                set: (value)=>{
                    context.path = value;
                },
                enumerable: true,
                configurable: true
            });
        }
        if (context.dest !== undefined) {
            Object.defineProperty(this, "dest", {
                get () {
                    return context.dest;
                },
                set: (value)=>{
                    context.dest = value;
                },
                enumerable: true,
                configurable: true
            });
        }
    }
    toString() {
        return `${this.name} [${this.code}]: ${this.message}`;
    }
}
function makeSystemErrorWithCode(key, msgPrfix) {
    return class NodeError extends NodeSystemError {
        constructor(ctx){
            super(key, ctx, msgPrfix);
        }
    };
}
export const ERR_FS_EISDIR = makeSystemErrorWithCode("ERR_FS_EISDIR", "Path is a directory");
function createInvalidArgType(name, expected) {
    // https://github.com/nodejs/node/blob/f3eb224/lib/internal/errors.js#L1037-L1087
    expected = Array.isArray(expected) ? expected : [
        expected
    ];
    let msg = "The ";
    if (name.endsWith(" argument")) {
        // For cases like 'first argument'
        msg += `${name} `;
    } else {
        const type = name.includes(".") ? "property" : "argument";
        msg += `"${name}" ${type} `;
    }
    msg += "must be ";
    const types = [];
    const instances = [];
    const other = [];
    for (const value of expected){
        if (kTypes.includes(value)) {
            types.push(value.toLocaleLowerCase());
        } else if (classRegExp.test(value)) {
            instances.push(value);
        } else {
            other.push(value);
        }
    }
    // Special handle `object` in case other instances are allowed to outline
    // the differences between each other.
    if (instances.length > 0) {
        const pos = types.indexOf("object");
        if (pos !== -1) {
            types.splice(pos, 1);
            instances.push("Object");
        }
    }
    if (types.length > 0) {
        if (types.length > 2) {
            const last = types.pop();
            msg += `one of type ${types.join(", ")}, or ${last}`;
        } else if (types.length === 2) {
            msg += `one of type ${types[0]} or ${types[1]}`;
        } else {
            msg += `of type ${types[0]}`;
        }
        if (instances.length > 0 || other.length > 0) {
            msg += " or ";
        }
    }
    if (instances.length > 0) {
        if (instances.length > 2) {
            const last1 = instances.pop();
            msg += `an instance of ${instances.join(", ")}, or ${last1}`;
        } else {
            msg += `an instance of ${instances[0]}`;
            if (instances.length === 2) {
                msg += ` or ${instances[1]}`;
            }
        }
        if (other.length > 0) {
            msg += " or ";
        }
    }
    if (other.length > 0) {
        if (other.length > 2) {
            const last2 = other.pop();
            msg += `one of ${other.join(", ")}, or ${last2}`;
        } else if (other.length === 2) {
            msg += `one of ${other[0]} or ${other[1]}`;
        } else {
            if (other[0].toLowerCase() !== other[0]) {
                msg += "an ";
            }
            msg += `${other[0]}`;
        }
    }
    return msg;
}
export class ERR_INVALID_ARG_TYPE_RANGE extends NodeRangeError {
    constructor(name, expected, actual){
        const msg = createInvalidArgType(name, expected);
        super("ERR_INVALID_ARG_TYPE", `${msg}.${invalidArgTypeHelper(actual)}`);
    }
}
export class ERR_INVALID_ARG_TYPE extends NodeTypeError {
    constructor(name, expected, actual){
        const msg = createInvalidArgType(name, expected);
        super("ERR_INVALID_ARG_TYPE", `${msg}.${invalidArgTypeHelper(actual)}`);
    }
    static RangeError = ERR_INVALID_ARG_TYPE_RANGE;
}
export class ERR_INVALID_ARG_VALUE_RANGE extends NodeRangeError {
    constructor(name, value, reason = "is invalid"){
        const type = name.includes(".") ? "property" : "argument";
        const inspected = inspect(value);
        super("ERR_INVALID_ARG_VALUE", `The ${type} '${name}' ${reason}. Received ${inspected}`);
    }
}
export class ERR_INVALID_ARG_VALUE extends NodeTypeError {
    constructor(name, value, reason = "is invalid"){
        const type = name.includes(".") ? "property" : "argument";
        const inspected = inspect(value);
        super("ERR_INVALID_ARG_VALUE", `The ${type} '${name}' ${reason}. Received ${inspected}`);
    }
    static RangeError = ERR_INVALID_ARG_VALUE_RANGE;
}
// A helper function to simplify checking for ERR_INVALID_ARG_TYPE output.
// deno-lint-ignore no-explicit-any
function invalidArgTypeHelper(input) {
    if (input == null) {
        return ` Received ${input}`;
    }
    if (typeof input === "function" && input.name) {
        return ` Received function ${input.name}`;
    }
    if (typeof input === "object") {
        if (input.constructor && input.constructor.name) {
            return ` Received an instance of ${input.constructor.name}`;
        }
        return ` Received ${inspect(input, {
            depth: -1
        })}`;
    }
    let inspected = inspect(input, {
        colors: false
    });
    if (inspected.length > 25) {
        inspected = `${inspected.slice(0, 25)}...`;
    }
    return ` Received type ${typeof input} (${inspected})`;
}
export class ERR_OUT_OF_RANGE extends RangeError {
    code = "ERR_OUT_OF_RANGE";
    constructor(str, range, input, replaceDefaultBoolean = false){
        assert(range, 'Missing "range" argument');
        let msg = replaceDefaultBoolean ? str : `The value of "${str}" is out of range.`;
        let received;
        if (Number.isInteger(input) && Math.abs(input) > 2 ** 32) {
            received = addNumericalSeparator(String(input));
        } else if (typeof input === "bigint") {
            received = String(input);
            if (input > 2n ** 32n || input < -(2n ** 32n)) {
                received = addNumericalSeparator(received);
            }
            received += "n";
        } else {
            received = inspect(input);
        }
        msg += ` It must be ${range}. Received ${received}`;
        super(msg);
        const { name  } = this;
        // Add the error code to the name to include it in the stack trace.
        this.name = `${name} [${this.code}]`;
        // Access the stack to generate the error message including the error code from the name.
        this.stack;
        // Reset the name to the actual name.
        this.name = name;
    }
}
export class ERR_AMBIGUOUS_ARGUMENT extends NodeTypeError {
    constructor(x, y){
        super("ERR_AMBIGUOUS_ARGUMENT", `The "${x}" argument is ambiguous. ${y}`);
    }
}
export class ERR_ARG_NOT_ITERABLE extends NodeTypeError {
    constructor(x){
        super("ERR_ARG_NOT_ITERABLE", `${x} must be iterable`);
    }
}
export class ERR_ASSERTION extends NodeError {
    constructor(x){
        super("ERR_ASSERTION", `${x}`);
    }
}
export class ERR_ASYNC_CALLBACK extends NodeTypeError {
    constructor(x){
        super("ERR_ASYNC_CALLBACK", `${x} must be a function`);
    }
}
export class ERR_ASYNC_TYPE extends NodeTypeError {
    constructor(x){
        super("ERR_ASYNC_TYPE", `Invalid name for async "type": ${x}`);
    }
}
export class ERR_BROTLI_INVALID_PARAM extends NodeRangeError {
    constructor(x){
        super("ERR_BROTLI_INVALID_PARAM", `${x} is not a valid Brotli parameter`);
    }
}
export class ERR_BUFFER_OUT_OF_BOUNDS extends NodeRangeError {
    constructor(name){
        super("ERR_BUFFER_OUT_OF_BOUNDS", name ? `"${name}" is outside of buffer bounds` : "Attempt to access memory outside buffer bounds");
    }
}
export class ERR_BUFFER_TOO_LARGE extends NodeRangeError {
    constructor(x){
        super("ERR_BUFFER_TOO_LARGE", `Cannot create a Buffer larger than ${x} bytes`);
    }
}
export class ERR_CANNOT_WATCH_SIGINT extends NodeError {
    constructor(){
        super("ERR_CANNOT_WATCH_SIGINT", "Cannot watch for SIGINT signals");
    }
}
export class ERR_CHILD_CLOSED_BEFORE_REPLY extends NodeError {
    constructor(){
        super("ERR_CHILD_CLOSED_BEFORE_REPLY", "Child closed before reply received");
    }
}
export class ERR_CHILD_PROCESS_IPC_REQUIRED extends NodeError {
    constructor(x){
        super("ERR_CHILD_PROCESS_IPC_REQUIRED", `Forked processes must have an IPC channel, missing value 'ipc' in ${x}`);
    }
}
export class ERR_CHILD_PROCESS_STDIO_MAXBUFFER extends NodeRangeError {
    constructor(x){
        super("ERR_CHILD_PROCESS_STDIO_MAXBUFFER", `${x} maxBuffer length exceeded`);
    }
}
export class ERR_CONSOLE_WRITABLE_STREAM extends NodeTypeError {
    constructor(x){
        super("ERR_CONSOLE_WRITABLE_STREAM", `Console expects a writable stream instance for ${x}`);
    }
}
export class ERR_CONTEXT_NOT_INITIALIZED extends NodeError {
    constructor(){
        super("ERR_CONTEXT_NOT_INITIALIZED", "context used is not initialized");
    }
}
export class ERR_CPU_USAGE extends NodeError {
    constructor(x){
        super("ERR_CPU_USAGE", `Unable to obtain cpu usage ${x}`);
    }
}
export class ERR_CRYPTO_CUSTOM_ENGINE_NOT_SUPPORTED extends NodeError {
    constructor(){
        super("ERR_CRYPTO_CUSTOM_ENGINE_NOT_SUPPORTED", "Custom engines not supported by this OpenSSL");
    }
}
export class ERR_CRYPTO_ECDH_INVALID_FORMAT extends NodeTypeError {
    constructor(x){
        super("ERR_CRYPTO_ECDH_INVALID_FORMAT", `Invalid ECDH format: ${x}`);
    }
}
export class ERR_CRYPTO_ECDH_INVALID_PUBLIC_KEY extends NodeError {
    constructor(){
        super("ERR_CRYPTO_ECDH_INVALID_PUBLIC_KEY", "Public key is not valid for specified curve");
    }
}
export class ERR_CRYPTO_ENGINE_UNKNOWN extends NodeError {
    constructor(x){
        super("ERR_CRYPTO_ENGINE_UNKNOWN", `Engine "${x}" was not found`);
    }
}
export class ERR_CRYPTO_FIPS_FORCED extends NodeError {
    constructor(){
        super("ERR_CRYPTO_FIPS_FORCED", "Cannot set FIPS mode, it was forced with --force-fips at startup.");
    }
}
export class ERR_CRYPTO_FIPS_UNAVAILABLE extends NodeError {
    constructor(){
        super("ERR_CRYPTO_FIPS_UNAVAILABLE", "Cannot set FIPS mode in a non-FIPS build.");
    }
}
export class ERR_CRYPTO_HASH_FINALIZED extends NodeError {
    constructor(){
        super("ERR_CRYPTO_HASH_FINALIZED", "Digest already called");
    }
}
export class ERR_CRYPTO_HASH_UPDATE_FAILED extends NodeError {
    constructor(){
        super("ERR_CRYPTO_HASH_UPDATE_FAILED", "Hash update failed");
    }
}
export class ERR_CRYPTO_INCOMPATIBLE_KEY extends NodeError {
    constructor(x, y){
        super("ERR_CRYPTO_INCOMPATIBLE_KEY", `Incompatible ${x}: ${y}`);
    }
}
export class ERR_CRYPTO_INCOMPATIBLE_KEY_OPTIONS extends NodeError {
    constructor(x, y){
        super("ERR_CRYPTO_INCOMPATIBLE_KEY_OPTIONS", `The selected key encoding ${x} ${y}.`);
    }
}
export class ERR_CRYPTO_INVALID_DIGEST extends NodeTypeError {
    constructor(x){
        super("ERR_CRYPTO_INVALID_DIGEST", `Invalid digest: ${x}`);
    }
}
export class ERR_CRYPTO_INVALID_KEY_OBJECT_TYPE extends NodeTypeError {
    constructor(x, y){
        super("ERR_CRYPTO_INVALID_KEY_OBJECT_TYPE", `Invalid key object type ${x}, expected ${y}.`);
    }
}
export class ERR_CRYPTO_INVALID_STATE extends NodeError {
    constructor(x){
        super("ERR_CRYPTO_INVALID_STATE", `Invalid state for operation ${x}`);
    }
}
export class ERR_CRYPTO_PBKDF2_ERROR extends NodeError {
    constructor(){
        super("ERR_CRYPTO_PBKDF2_ERROR", "PBKDF2 error");
    }
}
export class ERR_CRYPTO_SCRYPT_INVALID_PARAMETER extends NodeError {
    constructor(){
        super("ERR_CRYPTO_SCRYPT_INVALID_PARAMETER", "Invalid scrypt parameter");
    }
}
export class ERR_CRYPTO_SCRYPT_NOT_SUPPORTED extends NodeError {
    constructor(){
        super("ERR_CRYPTO_SCRYPT_NOT_SUPPORTED", "Scrypt algorithm not supported");
    }
}
export class ERR_CRYPTO_SIGN_KEY_REQUIRED extends NodeError {
    constructor(){
        super("ERR_CRYPTO_SIGN_KEY_REQUIRED", "No key provided to sign");
    }
}
export class ERR_DIR_CLOSED extends NodeError {
    constructor(){
        super("ERR_DIR_CLOSED", "Directory handle was closed");
    }
}
export class ERR_DIR_CONCURRENT_OPERATION extends NodeError {
    constructor(){
        super("ERR_DIR_CONCURRENT_OPERATION", "Cannot do synchronous work on directory handle with concurrent asynchronous operations");
    }
}
export class ERR_DNS_SET_SERVERS_FAILED extends NodeError {
    constructor(x, y){
        super("ERR_DNS_SET_SERVERS_FAILED", `c-ares failed to set servers: "${x}" [${y}]`);
    }
}
export class ERR_DOMAIN_CALLBACK_NOT_AVAILABLE extends NodeError {
    constructor(){
        super("ERR_DOMAIN_CALLBACK_NOT_AVAILABLE", "A callback was registered through " + "process.setUncaughtExceptionCaptureCallback(), which is mutually " + "exclusive with using the `domain` module");
    }
}
export class ERR_DOMAIN_CANNOT_SET_UNCAUGHT_EXCEPTION_CAPTURE extends NodeError {
    constructor(){
        super("ERR_DOMAIN_CANNOT_SET_UNCAUGHT_EXCEPTION_CAPTURE", "The `domain` module is in use, which is mutually exclusive with calling " + "process.setUncaughtExceptionCaptureCallback()");
    }
}
export class ERR_ENCODING_INVALID_ENCODED_DATA extends NodeErrorAbstraction {
    errno;
    constructor(encoding, ret){
        super(TypeError.prototype.name, "ERR_ENCODING_INVALID_ENCODED_DATA", `The encoded data was not valid for encoding ${encoding}`);
        Object.setPrototypeOf(this, TypeError.prototype);
        this.errno = ret;
    }
}
export class ERR_ENCODING_NOT_SUPPORTED extends NodeRangeError {
    constructor(x){
        super("ERR_ENCODING_NOT_SUPPORTED", `The "${x}" encoding is not supported`);
    }
}
export class ERR_EVAL_ESM_CANNOT_PRINT extends NodeError {
    constructor(){
        super("ERR_EVAL_ESM_CANNOT_PRINT", `--print cannot be used with ESM input`);
    }
}
export class ERR_EVENT_RECURSION extends NodeError {
    constructor(x){
        super("ERR_EVENT_RECURSION", `The event "${x}" is already being dispatched`);
    }
}
export class ERR_FEATURE_UNAVAILABLE_ON_PLATFORM extends NodeTypeError {
    constructor(x){
        super("ERR_FEATURE_UNAVAILABLE_ON_PLATFORM", `The feature ${x} is unavailable on the current platform, which is being used to run Node.js`);
    }
}
export class ERR_FS_FILE_TOO_LARGE extends NodeRangeError {
    constructor(x){
        super("ERR_FS_FILE_TOO_LARGE", `File size (${x}) is greater than 2 GB`);
    }
}
export class ERR_FS_INVALID_SYMLINK_TYPE extends NodeError {
    constructor(x){
        super("ERR_FS_INVALID_SYMLINK_TYPE", `Symlink type must be one of "dir", "file", or "junction". Received "${x}"`);
    }
}
export class ERR_HTTP2_ALTSVC_INVALID_ORIGIN extends NodeTypeError {
    constructor(){
        super("ERR_HTTP2_ALTSVC_INVALID_ORIGIN", `HTTP/2 ALTSVC frames require a valid origin`);
    }
}
export class ERR_HTTP2_ALTSVC_LENGTH extends NodeTypeError {
    constructor(){
        super("ERR_HTTP2_ALTSVC_LENGTH", `HTTP/2 ALTSVC frames are limited to 16382 bytes`);
    }
}
export class ERR_HTTP2_CONNECT_AUTHORITY extends NodeError {
    constructor(){
        super("ERR_HTTP2_CONNECT_AUTHORITY", `:authority header is required for CONNECT requests`);
    }
}
export class ERR_HTTP2_CONNECT_PATH extends NodeError {
    constructor(){
        super("ERR_HTTP2_CONNECT_PATH", `The :path header is forbidden for CONNECT requests`);
    }
}
export class ERR_HTTP2_CONNECT_SCHEME extends NodeError {
    constructor(){
        super("ERR_HTTP2_CONNECT_SCHEME", `The :scheme header is forbidden for CONNECT requests`);
    }
}
export class ERR_HTTP2_GOAWAY_SESSION extends NodeError {
    constructor(){
        super("ERR_HTTP2_GOAWAY_SESSION", `New streams cannot be created after receiving a GOAWAY`);
    }
}
export class ERR_HTTP2_HEADERS_AFTER_RESPOND extends NodeError {
    constructor(){
        super("ERR_HTTP2_HEADERS_AFTER_RESPOND", `Cannot specify additional headers after response initiated`);
    }
}
export class ERR_HTTP2_HEADERS_SENT extends NodeError {
    constructor(){
        super("ERR_HTTP2_HEADERS_SENT", `Response has already been initiated.`);
    }
}
export class ERR_HTTP2_HEADER_SINGLE_VALUE extends NodeTypeError {
    constructor(x){
        super("ERR_HTTP2_HEADER_SINGLE_VALUE", `Header field "${x}" must only have a single value`);
    }
}
export class ERR_HTTP2_INFO_STATUS_NOT_ALLOWED extends NodeRangeError {
    constructor(){
        super("ERR_HTTP2_INFO_STATUS_NOT_ALLOWED", `Informational status codes cannot be used`);
    }
}
export class ERR_HTTP2_INVALID_CONNECTION_HEADERS extends NodeTypeError {
    constructor(x){
        super("ERR_HTTP2_INVALID_CONNECTION_HEADERS", `HTTP/1 Connection specific headers are forbidden: "${x}"`);
    }
}
export class ERR_HTTP2_INVALID_HEADER_VALUE extends NodeTypeError {
    constructor(x, y){
        super("ERR_HTTP2_INVALID_HEADER_VALUE", `Invalid value "${x}" for header "${y}"`);
    }
}
export class ERR_HTTP2_INVALID_INFO_STATUS extends NodeRangeError {
    constructor(x){
        super("ERR_HTTP2_INVALID_INFO_STATUS", `Invalid informational status code: ${x}`);
    }
}
export class ERR_HTTP2_INVALID_ORIGIN extends NodeTypeError {
    constructor(){
        super("ERR_HTTP2_INVALID_ORIGIN", `HTTP/2 ORIGIN frames require a valid origin`);
    }
}
export class ERR_HTTP2_INVALID_PACKED_SETTINGS_LENGTH extends NodeRangeError {
    constructor(){
        super("ERR_HTTP2_INVALID_PACKED_SETTINGS_LENGTH", `Packed settings length must be a multiple of six`);
    }
}
export class ERR_HTTP2_INVALID_PSEUDOHEADER extends NodeTypeError {
    constructor(x){
        super("ERR_HTTP2_INVALID_PSEUDOHEADER", `"${x}" is an invalid pseudoheader or is used incorrectly`);
    }
}
export class ERR_HTTP2_INVALID_SESSION extends NodeError {
    constructor(){
        super("ERR_HTTP2_INVALID_SESSION", `The session has been destroyed`);
    }
}
export class ERR_HTTP2_INVALID_STREAM extends NodeError {
    constructor(){
        super("ERR_HTTP2_INVALID_STREAM", `The stream has been destroyed`);
    }
}
export class ERR_HTTP2_MAX_PENDING_SETTINGS_ACK extends NodeError {
    constructor(){
        super("ERR_HTTP2_MAX_PENDING_SETTINGS_ACK", `Maximum number of pending settings acknowledgements`);
    }
}
export class ERR_HTTP2_NESTED_PUSH extends NodeError {
    constructor(){
        super("ERR_HTTP2_NESTED_PUSH", `A push stream cannot initiate another push stream.`);
    }
}
export class ERR_HTTP2_NO_SOCKET_MANIPULATION extends NodeError {
    constructor(){
        super("ERR_HTTP2_NO_SOCKET_MANIPULATION", `HTTP/2 sockets should not be directly manipulated (e.g. read and written)`);
    }
}
export class ERR_HTTP2_ORIGIN_LENGTH extends NodeTypeError {
    constructor(){
        super("ERR_HTTP2_ORIGIN_LENGTH", `HTTP/2 ORIGIN frames are limited to 16382 bytes`);
    }
}
export class ERR_HTTP2_OUT_OF_STREAMS extends NodeError {
    constructor(){
        super("ERR_HTTP2_OUT_OF_STREAMS", `No stream ID is available because maximum stream ID has been reached`);
    }
}
export class ERR_HTTP2_PAYLOAD_FORBIDDEN extends NodeError {
    constructor(x){
        super("ERR_HTTP2_PAYLOAD_FORBIDDEN", `Responses with ${x} status must not have a payload`);
    }
}
export class ERR_HTTP2_PING_CANCEL extends NodeError {
    constructor(){
        super("ERR_HTTP2_PING_CANCEL", `HTTP2 ping cancelled`);
    }
}
export class ERR_HTTP2_PING_LENGTH extends NodeRangeError {
    constructor(){
        super("ERR_HTTP2_PING_LENGTH", `HTTP2 ping payload must be 8 bytes`);
    }
}
export class ERR_HTTP2_PSEUDOHEADER_NOT_ALLOWED extends NodeTypeError {
    constructor(){
        super("ERR_HTTP2_PSEUDOHEADER_NOT_ALLOWED", `Cannot set HTTP/2 pseudo-headers`);
    }
}
export class ERR_HTTP2_PUSH_DISABLED extends NodeError {
    constructor(){
        super("ERR_HTTP2_PUSH_DISABLED", `HTTP/2 client has disabled push streams`);
    }
}
export class ERR_HTTP2_SEND_FILE extends NodeError {
    constructor(){
        super("ERR_HTTP2_SEND_FILE", `Directories cannot be sent`);
    }
}
export class ERR_HTTP2_SEND_FILE_NOSEEK extends NodeError {
    constructor(){
        super("ERR_HTTP2_SEND_FILE_NOSEEK", `Offset or length can only be specified for regular files`);
    }
}
export class ERR_HTTP2_SESSION_ERROR extends NodeError {
    constructor(x){
        super("ERR_HTTP2_SESSION_ERROR", `Session closed with error code ${x}`);
    }
}
export class ERR_HTTP2_SETTINGS_CANCEL extends NodeError {
    constructor(){
        super("ERR_HTTP2_SETTINGS_CANCEL", `HTTP2 session settings canceled`);
    }
}
export class ERR_HTTP2_SOCKET_BOUND extends NodeError {
    constructor(){
        super("ERR_HTTP2_SOCKET_BOUND", `The socket is already bound to an Http2Session`);
    }
}
export class ERR_HTTP2_SOCKET_UNBOUND extends NodeError {
    constructor(){
        super("ERR_HTTP2_SOCKET_UNBOUND", `The socket has been disconnected from the Http2Session`);
    }
}
export class ERR_HTTP2_STATUS_101 extends NodeError {
    constructor(){
        super("ERR_HTTP2_STATUS_101", `HTTP status code 101 (Switching Protocols) is forbidden in HTTP/2`);
    }
}
export class ERR_HTTP2_STATUS_INVALID extends NodeRangeError {
    constructor(x){
        super("ERR_HTTP2_STATUS_INVALID", `Invalid status code: ${x}`);
    }
}
export class ERR_HTTP2_STREAM_ERROR extends NodeError {
    constructor(x){
        super("ERR_HTTP2_STREAM_ERROR", `Stream closed with error code ${x}`);
    }
}
export class ERR_HTTP2_STREAM_SELF_DEPENDENCY extends NodeError {
    constructor(){
        super("ERR_HTTP2_STREAM_SELF_DEPENDENCY", `A stream cannot depend on itself`);
    }
}
export class ERR_HTTP2_TRAILERS_ALREADY_SENT extends NodeError {
    constructor(){
        super("ERR_HTTP2_TRAILERS_ALREADY_SENT", `Trailing headers have already been sent`);
    }
}
export class ERR_HTTP2_TRAILERS_NOT_READY extends NodeError {
    constructor(){
        super("ERR_HTTP2_TRAILERS_NOT_READY", `Trailing headers cannot be sent until after the wantTrailers event is emitted`);
    }
}
export class ERR_HTTP2_UNSUPPORTED_PROTOCOL extends NodeError {
    constructor(x){
        super("ERR_HTTP2_UNSUPPORTED_PROTOCOL", `protocol "${x}" is unsupported.`);
    }
}
export class ERR_HTTP_HEADERS_SENT extends NodeError {
    constructor(x){
        super("ERR_HTTP_HEADERS_SENT", `Cannot ${x} headers after they are sent to the client`);
    }
}
export class ERR_HTTP_INVALID_HEADER_VALUE extends NodeTypeError {
    constructor(x, y){
        super("ERR_HTTP_INVALID_HEADER_VALUE", `Invalid value "${x}" for header "${y}"`);
    }
}
export class ERR_HTTP_INVALID_STATUS_CODE extends NodeRangeError {
    constructor(x){
        super("ERR_HTTP_INVALID_STATUS_CODE", `Invalid status code: ${x}`);
    }
}
export class ERR_HTTP_SOCKET_ENCODING extends NodeError {
    constructor(){
        super("ERR_HTTP_SOCKET_ENCODING", `Changing the socket encoding is not allowed per RFC7230 Section 3.`);
    }
}
export class ERR_HTTP_TRAILER_INVALID extends NodeError {
    constructor(){
        super("ERR_HTTP_TRAILER_INVALID", `Trailers are invalid with this transfer encoding`);
    }
}
export class ERR_INCOMPATIBLE_OPTION_PAIR extends NodeTypeError {
    constructor(x, y){
        super("ERR_INCOMPATIBLE_OPTION_PAIR", `Option "${x}" cannot be used in combination with option "${y}"`);
    }
}
export class ERR_INPUT_TYPE_NOT_ALLOWED extends NodeError {
    constructor(){
        super("ERR_INPUT_TYPE_NOT_ALLOWED", `--input-type can only be used with string input via --eval, --print, or STDIN`);
    }
}
export class ERR_INSPECTOR_ALREADY_ACTIVATED extends NodeError {
    constructor(){
        super("ERR_INSPECTOR_ALREADY_ACTIVATED", `Inspector is already activated. Close it with inspector.close() before activating it again.`);
    }
}
export class ERR_INSPECTOR_ALREADY_CONNECTED extends NodeError {
    constructor(x){
        super("ERR_INSPECTOR_ALREADY_CONNECTED", `${x} is already connected`);
    }
}
export class ERR_INSPECTOR_CLOSED extends NodeError {
    constructor(){
        super("ERR_INSPECTOR_CLOSED", `Session was closed`);
    }
}
export class ERR_INSPECTOR_COMMAND extends NodeError {
    constructor(x, y){
        super("ERR_INSPECTOR_COMMAND", `Inspector error ${x}: ${y}`);
    }
}
export class ERR_INSPECTOR_NOT_ACTIVE extends NodeError {
    constructor(){
        super("ERR_INSPECTOR_NOT_ACTIVE", `Inspector is not active`);
    }
}
export class ERR_INSPECTOR_NOT_AVAILABLE extends NodeError {
    constructor(){
        super("ERR_INSPECTOR_NOT_AVAILABLE", `Inspector is not available`);
    }
}
export class ERR_INSPECTOR_NOT_CONNECTED extends NodeError {
    constructor(){
        super("ERR_INSPECTOR_NOT_CONNECTED", `Session is not connected`);
    }
}
export class ERR_INSPECTOR_NOT_WORKER extends NodeError {
    constructor(){
        super("ERR_INSPECTOR_NOT_WORKER", `Current thread is not a worker`);
    }
}
export class ERR_INVALID_ASYNC_ID extends NodeRangeError {
    constructor(x, y){
        super("ERR_INVALID_ASYNC_ID", `Invalid ${x} value: ${y}`);
    }
}
export class ERR_INVALID_BUFFER_SIZE extends NodeRangeError {
    constructor(x){
        super("ERR_INVALID_BUFFER_SIZE", `Buffer size must be a multiple of ${x}`);
    }
}
export class ERR_INVALID_CURSOR_POS extends NodeTypeError {
    constructor(){
        super("ERR_INVALID_CURSOR_POS", `Cannot set cursor row without setting its column`);
    }
}
export class ERR_INVALID_FD extends NodeRangeError {
    constructor(x){
        super("ERR_INVALID_FD", `"fd" must be a positive integer: ${x}`);
    }
}
export class ERR_INVALID_FD_TYPE extends NodeTypeError {
    constructor(x){
        super("ERR_INVALID_FD_TYPE", `Unsupported fd type: ${x}`);
    }
}
export class ERR_INVALID_FILE_URL_HOST extends NodeTypeError {
    constructor(x){
        super("ERR_INVALID_FILE_URL_HOST", `File URL host must be "localhost" or empty on ${x}`);
    }
}
export class ERR_INVALID_FILE_URL_PATH extends NodeTypeError {
    constructor(x){
        super("ERR_INVALID_FILE_URL_PATH", `File URL path ${x}`);
    }
}
export class ERR_INVALID_HANDLE_TYPE extends NodeTypeError {
    constructor(){
        super("ERR_INVALID_HANDLE_TYPE", `This handle type cannot be sent`);
    }
}
export class ERR_INVALID_HTTP_TOKEN extends NodeTypeError {
    constructor(x, y){
        super("ERR_INVALID_HTTP_TOKEN", `${x} must be a valid HTTP token ["${y}"]`);
    }
}
export class ERR_INVALID_IP_ADDRESS extends NodeTypeError {
    constructor(x){
        super("ERR_INVALID_IP_ADDRESS", `Invalid IP address: ${x}`);
    }
}
export class ERR_INVALID_OPT_VALUE_ENCODING extends NodeTypeError {
    constructor(x){
        super("ERR_INVALID_OPT_VALUE_ENCODING", `The value "${x}" is invalid for option "encoding"`);
    }
}
export class ERR_INVALID_PERFORMANCE_MARK extends NodeError {
    constructor(x){
        super("ERR_INVALID_PERFORMANCE_MARK", `The "${x}" performance mark has not been set`);
    }
}
export class ERR_INVALID_PROTOCOL extends NodeTypeError {
    constructor(x, y){
        super("ERR_INVALID_PROTOCOL", `Protocol "${x}" not supported. Expected "${y}"`);
    }
}
export class ERR_INVALID_REPL_EVAL_CONFIG extends NodeTypeError {
    constructor(){
        super("ERR_INVALID_REPL_EVAL_CONFIG", `Cannot specify both "breakEvalOnSigint" and "eval" for REPL`);
    }
}
export class ERR_INVALID_REPL_INPUT extends NodeTypeError {
    constructor(x){
        super("ERR_INVALID_REPL_INPUT", `${x}`);
    }
}
export class ERR_INVALID_SYNC_FORK_INPUT extends NodeTypeError {
    constructor(x){
        super("ERR_INVALID_SYNC_FORK_INPUT", `Asynchronous forks do not support Buffer, TypedArray, DataView or string input: ${x}`);
    }
}
export class ERR_INVALID_THIS extends NodeTypeError {
    constructor(x){
        super("ERR_INVALID_THIS", `Value of "this" must be of type ${x}`);
    }
}
export class ERR_INVALID_TUPLE extends NodeTypeError {
    constructor(x, y){
        super("ERR_INVALID_TUPLE", `${x} must be an iterable ${y} tuple`);
    }
}
export class ERR_INVALID_URI extends NodeURIError {
    constructor(){
        super("ERR_INVALID_URI", `URI malformed`);
    }
}
export class ERR_IPC_CHANNEL_CLOSED extends NodeError {
    constructor(){
        super("ERR_IPC_CHANNEL_CLOSED", `Channel closed`);
    }
}
export class ERR_IPC_DISCONNECTED extends NodeError {
    constructor(){
        super("ERR_IPC_DISCONNECTED", `IPC channel is already disconnected`);
    }
}
export class ERR_IPC_ONE_PIPE extends NodeError {
    constructor(){
        super("ERR_IPC_ONE_PIPE", `Child process can have only one IPC pipe`);
    }
}
export class ERR_IPC_SYNC_FORK extends NodeError {
    constructor(){
        super("ERR_IPC_SYNC_FORK", `IPC cannot be used with synchronous forks`);
    }
}
export class ERR_MANIFEST_DEPENDENCY_MISSING extends NodeError {
    constructor(x, y){
        super("ERR_MANIFEST_DEPENDENCY_MISSING", `Manifest resource ${x} does not list ${y} as a dependency specifier`);
    }
}
export class ERR_MANIFEST_INTEGRITY_MISMATCH extends NodeSyntaxError {
    constructor(x){
        super("ERR_MANIFEST_INTEGRITY_MISMATCH", `Manifest resource ${x} has multiple entries but integrity lists do not match`);
    }
}
export class ERR_MANIFEST_INVALID_RESOURCE_FIELD extends NodeTypeError {
    constructor(x, y){
        super("ERR_MANIFEST_INVALID_RESOURCE_FIELD", `Manifest resource ${x} has invalid property value for ${y}`);
    }
}
export class ERR_MANIFEST_TDZ extends NodeError {
    constructor(){
        super("ERR_MANIFEST_TDZ", `Manifest initialization has not yet run`);
    }
}
export class ERR_MANIFEST_UNKNOWN_ONERROR extends NodeSyntaxError {
    constructor(x){
        super("ERR_MANIFEST_UNKNOWN_ONERROR", `Manifest specified unknown error behavior "${x}".`);
    }
}
export class ERR_METHOD_NOT_IMPLEMENTED extends NodeError {
    constructor(x){
        super("ERR_METHOD_NOT_IMPLEMENTED", `The ${x} method is not implemented`);
    }
}
export class ERR_MISSING_ARGS extends NodeTypeError {
    constructor(...args){
        let msg = "The ";
        const len = args.length;
        const wrap = (a)=>`"${a}"`;
        args = args.map((a)=>Array.isArray(a) ? a.map(wrap).join(" or ") : wrap(a));
        switch(len){
            case 1:
                msg += `${args[0]} argument`;
                break;
            case 2:
                msg += `${args[0]} and ${args[1]} arguments`;
                break;
            default:
                msg += args.slice(0, len - 1).join(", ");
                msg += `, and ${args[len - 1]} arguments`;
                break;
        }
        super("ERR_MISSING_ARGS", `${msg} must be specified`);
    }
}
export class ERR_MISSING_OPTION extends NodeTypeError {
    constructor(x){
        super("ERR_MISSING_OPTION", `${x} is required`);
    }
}
export class ERR_MULTIPLE_CALLBACK extends NodeError {
    constructor(){
        super("ERR_MULTIPLE_CALLBACK", `Callback called multiple times`);
    }
}
export class ERR_NAPI_CONS_FUNCTION extends NodeTypeError {
    constructor(){
        super("ERR_NAPI_CONS_FUNCTION", `Constructor must be a function`);
    }
}
export class ERR_NAPI_INVALID_DATAVIEW_ARGS extends NodeRangeError {
    constructor(){
        super("ERR_NAPI_INVALID_DATAVIEW_ARGS", `byte_offset + byte_length should be less than or equal to the size in bytes of the array passed in`);
    }
}
export class ERR_NAPI_INVALID_TYPEDARRAY_ALIGNMENT extends NodeRangeError {
    constructor(x, y){
        super("ERR_NAPI_INVALID_TYPEDARRAY_ALIGNMENT", `start offset of ${x} should be a multiple of ${y}`);
    }
}
export class ERR_NAPI_INVALID_TYPEDARRAY_LENGTH extends NodeRangeError {
    constructor(){
        super("ERR_NAPI_INVALID_TYPEDARRAY_LENGTH", `Invalid typed array length`);
    }
}
export class ERR_NO_CRYPTO extends NodeError {
    constructor(){
        super("ERR_NO_CRYPTO", `Node.js is not compiled with OpenSSL crypto support`);
    }
}
export class ERR_NO_ICU extends NodeTypeError {
    constructor(x){
        super("ERR_NO_ICU", `${x} is not supported on Node.js compiled without ICU`);
    }
}
export class ERR_QUICCLIENTSESSION_FAILED extends NodeError {
    constructor(x){
        super("ERR_QUICCLIENTSESSION_FAILED", `Failed to create a new QuicClientSession: ${x}`);
    }
}
export class ERR_QUICCLIENTSESSION_FAILED_SETSOCKET extends NodeError {
    constructor(){
        super("ERR_QUICCLIENTSESSION_FAILED_SETSOCKET", `Failed to set the QuicSocket`);
    }
}
export class ERR_QUICSESSION_DESTROYED extends NodeError {
    constructor(x){
        super("ERR_QUICSESSION_DESTROYED", `Cannot call ${x} after a QuicSession has been destroyed`);
    }
}
export class ERR_QUICSESSION_INVALID_DCID extends NodeError {
    constructor(x){
        super("ERR_QUICSESSION_INVALID_DCID", `Invalid DCID value: ${x}`);
    }
}
export class ERR_QUICSESSION_UPDATEKEY extends NodeError {
    constructor(){
        super("ERR_QUICSESSION_UPDATEKEY", `Unable to update QuicSession keys`);
    }
}
export class ERR_QUICSOCKET_DESTROYED extends NodeError {
    constructor(x){
        super("ERR_QUICSOCKET_DESTROYED", `Cannot call ${x} after a QuicSocket has been destroyed`);
    }
}
export class ERR_QUICSOCKET_INVALID_STATELESS_RESET_SECRET_LENGTH extends NodeError {
    constructor(){
        super("ERR_QUICSOCKET_INVALID_STATELESS_RESET_SECRET_LENGTH", `The stateResetToken must be exactly 16-bytes in length`);
    }
}
export class ERR_QUICSOCKET_LISTENING extends NodeError {
    constructor(){
        super("ERR_QUICSOCKET_LISTENING", `This QuicSocket is already listening`);
    }
}
export class ERR_QUICSOCKET_UNBOUND extends NodeError {
    constructor(x){
        super("ERR_QUICSOCKET_UNBOUND", `Cannot call ${x} before a QuicSocket has been bound`);
    }
}
export class ERR_QUICSTREAM_DESTROYED extends NodeError {
    constructor(x){
        super("ERR_QUICSTREAM_DESTROYED", `Cannot call ${x} after a QuicStream has been destroyed`);
    }
}
export class ERR_QUICSTREAM_INVALID_PUSH extends NodeError {
    constructor(){
        super("ERR_QUICSTREAM_INVALID_PUSH", `Push streams are only supported on client-initiated, bidirectional streams`);
    }
}
export class ERR_QUICSTREAM_OPEN_FAILED extends NodeError {
    constructor(){
        super("ERR_QUICSTREAM_OPEN_FAILED", `Opening a new QuicStream failed`);
    }
}
export class ERR_QUICSTREAM_UNSUPPORTED_PUSH extends NodeError {
    constructor(){
        super("ERR_QUICSTREAM_UNSUPPORTED_PUSH", `Push streams are not supported on this QuicSession`);
    }
}
export class ERR_QUIC_TLS13_REQUIRED extends NodeError {
    constructor(){
        super("ERR_QUIC_TLS13_REQUIRED", `QUIC requires TLS version 1.3`);
    }
}
export class ERR_SCRIPT_EXECUTION_INTERRUPTED extends NodeError {
    constructor(){
        super("ERR_SCRIPT_EXECUTION_INTERRUPTED", "Script execution was interrupted by `SIGINT`");
    }
}
export class ERR_SERVER_ALREADY_LISTEN extends NodeError {
    constructor(){
        super("ERR_SERVER_ALREADY_LISTEN", `Listen method has been called more than once without closing.`);
    }
}
export class ERR_SERVER_NOT_RUNNING extends NodeError {
    constructor(){
        super("ERR_SERVER_NOT_RUNNING", `Server is not running.`);
    }
}
export class ERR_SOCKET_ALREADY_BOUND extends NodeError {
    constructor(){
        super("ERR_SOCKET_ALREADY_BOUND", `Socket is already bound`);
    }
}
export class ERR_SOCKET_BAD_BUFFER_SIZE extends NodeTypeError {
    constructor(){
        super("ERR_SOCKET_BAD_BUFFER_SIZE", `Buffer size must be a positive integer`);
    }
}
export class ERR_SOCKET_BAD_PORT extends NodeRangeError {
    constructor(name, port, allowZero = true){
        assert(typeof allowZero === "boolean", "The 'allowZero' argument must be of type boolean.");
        const operator = allowZero ? ">=" : ">";
        super("ERR_SOCKET_BAD_PORT", `${name} should be ${operator} 0 and < 65536. Received ${port}.`);
    }
}
export class ERR_SOCKET_BAD_TYPE extends NodeTypeError {
    constructor(){
        super("ERR_SOCKET_BAD_TYPE", `Bad socket type specified. Valid types are: udp4, udp6`);
    }
}
export class ERR_SOCKET_BUFFER_SIZE extends NodeSystemError {
    constructor(ctx){
        super("ERR_SOCKET_BUFFER_SIZE", ctx, "Could not get or set buffer size");
    }
}
export class ERR_SOCKET_CLOSED extends NodeError {
    constructor(){
        super("ERR_SOCKET_CLOSED", `Socket is closed`);
    }
}
export class ERR_SOCKET_DGRAM_IS_CONNECTED extends NodeError {
    constructor(){
        super("ERR_SOCKET_DGRAM_IS_CONNECTED", `Already connected`);
    }
}
export class ERR_SOCKET_DGRAM_NOT_CONNECTED extends NodeError {
    constructor(){
        super("ERR_SOCKET_DGRAM_NOT_CONNECTED", `Not connected`);
    }
}
export class ERR_SOCKET_DGRAM_NOT_RUNNING extends NodeError {
    constructor(){
        super("ERR_SOCKET_DGRAM_NOT_RUNNING", `Not running`);
    }
}
export class ERR_SRI_PARSE extends NodeSyntaxError {
    constructor(name, char, position){
        super("ERR_SRI_PARSE", `Subresource Integrity string ${name} had an unexpected ${char} at position ${position}`);
    }
}
export class ERR_STREAM_ALREADY_FINISHED extends NodeError {
    constructor(x){
        super("ERR_STREAM_ALREADY_FINISHED", `Cannot call ${x} after a stream was finished`);
    }
}
export class ERR_STREAM_CANNOT_PIPE extends NodeError {
    constructor(){
        super("ERR_STREAM_CANNOT_PIPE", `Cannot pipe, not readable`);
    }
}
export class ERR_STREAM_DESTROYED extends NodeError {
    constructor(x){
        super("ERR_STREAM_DESTROYED", `Cannot call ${x} after a stream was destroyed`);
    }
}
export class ERR_STREAM_NULL_VALUES extends NodeTypeError {
    constructor(){
        super("ERR_STREAM_NULL_VALUES", `May not write null values to stream`);
    }
}
export class ERR_STREAM_PREMATURE_CLOSE extends NodeError {
    constructor(){
        super("ERR_STREAM_PREMATURE_CLOSE", `Premature close`);
    }
}
export class ERR_STREAM_PUSH_AFTER_EOF extends NodeError {
    constructor(){
        super("ERR_STREAM_PUSH_AFTER_EOF", `stream.push() after EOF`);
    }
}
export class ERR_STREAM_UNSHIFT_AFTER_END_EVENT extends NodeError {
    constructor(){
        super("ERR_STREAM_UNSHIFT_AFTER_END_EVENT", `stream.unshift() after end event`);
    }
}
export class ERR_STREAM_WRAP extends NodeError {
    constructor(){
        super("ERR_STREAM_WRAP", `Stream has StringDecoder set or is in objectMode`);
    }
}
export class ERR_STREAM_WRITE_AFTER_END extends NodeError {
    constructor(){
        super("ERR_STREAM_WRITE_AFTER_END", `write after end`);
    }
}
export class ERR_SYNTHETIC extends NodeError {
    constructor(){
        super("ERR_SYNTHETIC", `JavaScript Callstack`);
    }
}
export class ERR_TLS_CERT_ALTNAME_INVALID extends NodeError {
    reason;
    host;
    cert;
    constructor(reason, host, cert){
        super("ERR_TLS_CERT_ALTNAME_INVALID", `Hostname/IP does not match certificate's altnames: ${reason}`);
        this.reason = reason;
        this.host = host;
        this.cert = cert;
    }
}
export class ERR_TLS_DH_PARAM_SIZE extends NodeError {
    constructor(x){
        super("ERR_TLS_DH_PARAM_SIZE", `DH parameter size ${x} is less than 2048`);
    }
}
export class ERR_TLS_HANDSHAKE_TIMEOUT extends NodeError {
    constructor(){
        super("ERR_TLS_HANDSHAKE_TIMEOUT", `TLS handshake timeout`);
    }
}
export class ERR_TLS_INVALID_CONTEXT extends NodeTypeError {
    constructor(x){
        super("ERR_TLS_INVALID_CONTEXT", `${x} must be a SecureContext`);
    }
}
export class ERR_TLS_INVALID_STATE extends NodeError {
    constructor(){
        super("ERR_TLS_INVALID_STATE", `TLS socket connection must be securely established`);
    }
}
export class ERR_TLS_INVALID_PROTOCOL_VERSION extends NodeTypeError {
    constructor(protocol, x){
        super("ERR_TLS_INVALID_PROTOCOL_VERSION", `${protocol} is not a valid ${x} TLS protocol version`);
    }
}
export class ERR_TLS_PROTOCOL_VERSION_CONFLICT extends NodeTypeError {
    constructor(prevProtocol, protocol){
        super("ERR_TLS_PROTOCOL_VERSION_CONFLICT", `TLS protocol version ${prevProtocol} conflicts with secureProtocol ${protocol}`);
    }
}
export class ERR_TLS_RENEGOTIATION_DISABLED extends NodeError {
    constructor(){
        super("ERR_TLS_RENEGOTIATION_DISABLED", `TLS session renegotiation disabled for this socket`);
    }
}
export class ERR_TLS_REQUIRED_SERVER_NAME extends NodeError {
    constructor(){
        super("ERR_TLS_REQUIRED_SERVER_NAME", `"servername" is required parameter for Server.addContext`);
    }
}
export class ERR_TLS_SESSION_ATTACK extends NodeError {
    constructor(){
        super("ERR_TLS_SESSION_ATTACK", `TLS session renegotiation attack detected`);
    }
}
export class ERR_TLS_SNI_FROM_SERVER extends NodeError {
    constructor(){
        super("ERR_TLS_SNI_FROM_SERVER", `Cannot issue SNI from a TLS server-side socket`);
    }
}
export class ERR_TRACE_EVENTS_CATEGORY_REQUIRED extends NodeTypeError {
    constructor(){
        super("ERR_TRACE_EVENTS_CATEGORY_REQUIRED", `At least one category is required`);
    }
}
export class ERR_TRACE_EVENTS_UNAVAILABLE extends NodeError {
    constructor(){
        super("ERR_TRACE_EVENTS_UNAVAILABLE", `Trace events are unavailable`);
    }
}
export class ERR_UNAVAILABLE_DURING_EXIT extends NodeError {
    constructor(){
        super("ERR_UNAVAILABLE_DURING_EXIT", `Cannot call function in process exit handler`);
    }
}
export class ERR_UNCAUGHT_EXCEPTION_CAPTURE_ALREADY_SET extends NodeError {
    constructor(){
        super("ERR_UNCAUGHT_EXCEPTION_CAPTURE_ALREADY_SET", "`process.setupUncaughtExceptionCapture()` was called while a capture callback was already active");
    }
}
export class ERR_UNESCAPED_CHARACTERS extends NodeTypeError {
    constructor(x){
        super("ERR_UNESCAPED_CHARACTERS", `${x} contains unescaped characters`);
    }
}
export class ERR_UNHANDLED_ERROR extends NodeError {
    constructor(x){
        super("ERR_UNHANDLED_ERROR", `Unhandled error. (${x})`);
    }
}
export class ERR_UNKNOWN_BUILTIN_MODULE extends NodeError {
    constructor(x){
        super("ERR_UNKNOWN_BUILTIN_MODULE", `No such built-in module: ${x}`);
    }
}
export class ERR_UNKNOWN_CREDENTIAL extends NodeError {
    constructor(x, y){
        super("ERR_UNKNOWN_CREDENTIAL", `${x} identifier does not exist: ${y}`);
    }
}
export class ERR_UNKNOWN_ENCODING extends NodeTypeError {
    constructor(x){
        super("ERR_UNKNOWN_ENCODING", `Unknown encoding: ${x}`);
    }
}
export class ERR_UNKNOWN_FILE_EXTENSION extends NodeTypeError {
    constructor(x, y){
        super("ERR_UNKNOWN_FILE_EXTENSION", `Unknown file extension "${x}" for ${y}`);
    }
}
export class ERR_UNKNOWN_MODULE_FORMAT extends NodeRangeError {
    constructor(x){
        super("ERR_UNKNOWN_MODULE_FORMAT", `Unknown module format: ${x}`);
    }
}
export class ERR_UNKNOWN_SIGNAL extends NodeTypeError {
    constructor(x){
        super("ERR_UNKNOWN_SIGNAL", `Unknown signal: ${x}`);
    }
}
export class ERR_UNSUPPORTED_DIR_IMPORT extends NodeError {
    constructor(x, y){
        super("ERR_UNSUPPORTED_DIR_IMPORT", `Directory import '${x}' is not supported resolving ES modules, imported from ${y}`);
    }
}
export class ERR_UNSUPPORTED_ESM_URL_SCHEME extends NodeError {
    constructor(){
        super("ERR_UNSUPPORTED_ESM_URL_SCHEME", `Only file and data URLs are supported by the default ESM loader`);
    }
}
export class ERR_V8BREAKITERATOR extends NodeError {
    constructor(){
        super("ERR_V8BREAKITERATOR", `Full ICU data not installed. See https://github.com/nodejs/node/wiki/Intl`);
    }
}
export class ERR_VALID_PERFORMANCE_ENTRY_TYPE extends NodeError {
    constructor(){
        super("ERR_VALID_PERFORMANCE_ENTRY_TYPE", `At least one valid performance entry type is required`);
    }
}
export class ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING extends NodeTypeError {
    constructor(){
        super("ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING", `A dynamic import callback was not specified.`);
    }
}
export class ERR_VM_MODULE_ALREADY_LINKED extends NodeError {
    constructor(){
        super("ERR_VM_MODULE_ALREADY_LINKED", `Module has already been linked`);
    }
}
export class ERR_VM_MODULE_CANNOT_CREATE_CACHED_DATA extends NodeError {
    constructor(){
        super("ERR_VM_MODULE_CANNOT_CREATE_CACHED_DATA", `Cached data cannot be created for a module which has been evaluated`);
    }
}
export class ERR_VM_MODULE_DIFFERENT_CONTEXT extends NodeError {
    constructor(){
        super("ERR_VM_MODULE_DIFFERENT_CONTEXT", `Linked modules must use the same context`);
    }
}
export class ERR_VM_MODULE_LINKING_ERRORED extends NodeError {
    constructor(){
        super("ERR_VM_MODULE_LINKING_ERRORED", `Linking has already failed for the provided module`);
    }
}
export class ERR_VM_MODULE_NOT_MODULE extends NodeError {
    constructor(){
        super("ERR_VM_MODULE_NOT_MODULE", `Provided module is not an instance of Module`);
    }
}
export class ERR_VM_MODULE_STATUS extends NodeError {
    constructor(x){
        super("ERR_VM_MODULE_STATUS", `Module status ${x}`);
    }
}
export class ERR_WASI_ALREADY_STARTED extends NodeError {
    constructor(){
        super("ERR_WASI_ALREADY_STARTED", `WASI instance has already started`);
    }
}
export class ERR_WORKER_INIT_FAILED extends NodeError {
    constructor(x){
        super("ERR_WORKER_INIT_FAILED", `Worker initialization failure: ${x}`);
    }
}
export class ERR_WORKER_NOT_RUNNING extends NodeError {
    constructor(){
        super("ERR_WORKER_NOT_RUNNING", `Worker instance not running`);
    }
}
export class ERR_WORKER_OUT_OF_MEMORY extends NodeError {
    constructor(x){
        super("ERR_WORKER_OUT_OF_MEMORY", `Worker terminated due to reaching memory limit: ${x}`);
    }
}
export class ERR_WORKER_UNSERIALIZABLE_ERROR extends NodeError {
    constructor(){
        super("ERR_WORKER_UNSERIALIZABLE_ERROR", `Serializing an uncaught exception failed`);
    }
}
export class ERR_WORKER_UNSUPPORTED_EXTENSION extends NodeTypeError {
    constructor(x){
        super("ERR_WORKER_UNSUPPORTED_EXTENSION", `The worker script extension must be ".js", ".mjs", or ".cjs". Received "${x}"`);
    }
}
export class ERR_WORKER_UNSUPPORTED_OPERATION extends NodeTypeError {
    constructor(x){
        super("ERR_WORKER_UNSUPPORTED_OPERATION", `${x} is not supported in workers`);
    }
}
export class ERR_ZLIB_INITIALIZATION_FAILED extends NodeError {
    constructor(){
        super("ERR_ZLIB_INITIALIZATION_FAILED", `Initialization failed`);
    }
}
export class ERR_FALSY_VALUE_REJECTION extends NodeError {
    reason;
    constructor(reason){
        super("ERR_FALSY_VALUE_REJECTION", "Promise was rejected with falsy value");
        this.reason = reason;
    }
}
export class ERR_HTTP2_INVALID_SETTING_VALUE extends NodeRangeError {
    actual;
    min;
    max;
    constructor(name, actual, min, max){
        super("ERR_HTTP2_INVALID_SETTING_VALUE", `Invalid value for setting "${name}": ${actual}`);
        this.actual = actual;
        if (min !== undefined) {
            this.min = min;
            this.max = max;
        }
    }
}
export class ERR_HTTP2_STREAM_CANCEL extends NodeError {
    cause;
    constructor(error){
        super("ERR_HTTP2_STREAM_CANCEL", typeof error.message === "string" ? `The pending stream has been canceled (caused by: ${error.message})` : "The pending stream has been canceled");
        if (error) {
            this.cause = error;
        }
    }
}
export class ERR_INVALID_ADDRESS_FAMILY extends NodeRangeError {
    host;
    port;
    constructor(addressType, host, port){
        super("ERR_INVALID_ADDRESS_FAMILY", `Invalid address family: ${addressType} ${host}:${port}`);
        this.host = host;
        this.port = port;
    }
}
export class ERR_INVALID_CHAR extends NodeTypeError {
    constructor(name, field){
        super("ERR_INVALID_CHAR", field ? `Invalid character in ${name}` : `Invalid character in ${name} ["${field}"]`);
    }
}
export class ERR_INVALID_OPT_VALUE extends NodeTypeError {
    constructor(name, value){
        super("ERR_INVALID_OPT_VALUE", `The value "${value}" is invalid for option "${name}"`);
    }
}
export class ERR_INVALID_RETURN_PROPERTY extends NodeTypeError {
    constructor(input, name, prop, value){
        super("ERR_INVALID_RETURN_PROPERTY", `Expected a valid ${input} to be returned for the "${prop}" from the "${name}" function but got ${value}.`);
    }
}
// deno-lint-ignore no-explicit-any
function buildReturnPropertyType(value) {
    if (value && value.constructor && value.constructor.name) {
        return `instance of ${value.constructor.name}`;
    } else {
        return `type ${typeof value}`;
    }
}
export class ERR_INVALID_RETURN_PROPERTY_VALUE extends NodeTypeError {
    constructor(input, name, prop, value){
        super("ERR_INVALID_RETURN_PROPERTY_VALUE", `Expected ${input} to be returned for the "${prop}" from the "${name}" function but got ${buildReturnPropertyType(value)}.`);
    }
}
export class ERR_INVALID_RETURN_VALUE extends NodeTypeError {
    constructor(input, name, value){
        super("ERR_INVALID_RETURN_VALUE", `Expected ${input} to be returned from the "${name}" function but got ${determineSpecificType(value)}.`);
    }
}
export class ERR_INVALID_URL extends NodeTypeError {
    input;
    constructor(input){
        super("ERR_INVALID_URL", `Invalid URL: ${input}`);
        this.input = input;
    }
}
export class ERR_INVALID_URL_SCHEME extends NodeTypeError {
    constructor(expected){
        expected = Array.isArray(expected) ? expected : [
            expected
        ];
        const res = expected.length === 2 ? `one of scheme ${expected[0]} or ${expected[1]}` : `of scheme ${expected[0]}`;
        super("ERR_INVALID_URL_SCHEME", `The URL must be ${res}`);
    }
}
export class ERR_MODULE_NOT_FOUND extends NodeError {
    constructor(path, base, type = "package"){
        super("ERR_MODULE_NOT_FOUND", `Cannot find ${type} '${path}' imported from ${base}`);
    }
}
export class ERR_INVALID_PACKAGE_CONFIG extends NodeError {
    constructor(path, base, message){
        const msg = `Invalid package config ${path}${base ? ` while importing ${base}` : ""}${message ? `. ${message}` : ""}`;
        super("ERR_INVALID_PACKAGE_CONFIG", msg);
    }
}
export class ERR_INVALID_MODULE_SPECIFIER extends NodeTypeError {
    constructor(request, reason, base){
        super("ERR_INVALID_MODULE_SPECIFIER", `Invalid module "${request}" ${reason}${base ? ` imported from ${base}` : ""}`);
    }
}
export class ERR_INVALID_PACKAGE_TARGET extends NodeError {
    constructor(pkgPath, key, // deno-lint-ignore no-explicit-any
    target, isImport, base){
        let msg;
        const relError = typeof target === "string" && !isImport && target.length && !target.startsWith("./");
        if (key === ".") {
            assert(isImport === false);
            msg = `Invalid "exports" main target ${JSON.stringify(target)} defined ` + `in the package config ${pkgPath}package.json${base ? ` imported from ${base}` : ""}${relError ? '; targets must start with "./"' : ""}`;
        } else {
            msg = `Invalid "${isImport ? "imports" : "exports"}" target ${JSON.stringify(target)} defined for '${key}' in the package config ${pkgPath}package.json${base ? ` imported from ${base}` : ""}${relError ? '; targets must start with "./"' : ""}`;
        }
        super("ERR_INVALID_PACKAGE_TARGET", msg);
    }
}
export class ERR_PACKAGE_IMPORT_NOT_DEFINED extends NodeTypeError {
    constructor(specifier, packagePath, base){
        const msg = `Package import specifier "${specifier}" is not defined${packagePath ? ` in package ${packagePath}package.json` : ""} imported from ${base}`;
        super("ERR_PACKAGE_IMPORT_NOT_DEFINED", msg);
    }
}
export class ERR_PACKAGE_PATH_NOT_EXPORTED extends NodeError {
    constructor(subpath, pkgPath, basePath){
        let msg;
        if (subpath === ".") {
            msg = `No "exports" main defined in ${pkgPath}package.json${basePath ? ` imported from ${basePath}` : ""}`;
        } else {
            msg = `Package subpath '${subpath}' is not defined by "exports" in ${pkgPath}package.json${basePath ? ` imported from ${basePath}` : ""}`;
        }
        super("ERR_PACKAGE_PATH_NOT_EXPORTED", msg);
    }
}
export class ERR_INTERNAL_ASSERTION extends NodeError {
    constructor(message){
        const suffix = "This is caused by either a bug in Node.js " + "or incorrect usage of Node.js internals.\n" + "Please open an issue with this stack trace at " + "https://github.com/nodejs/node/issues\n";
        super("ERR_INTERNAL_ASSERTION", message === undefined ? suffix : `${message}\n${suffix}`);
    }
}
// Using `fs.rmdir` on a path that is a file results in an ENOENT error on Windows and an ENOTDIR error on POSIX.
export class ERR_FS_RMDIR_ENOTDIR extends NodeSystemError {
    constructor(path){
        const code = isWindows ? "ENOENT" : "ENOTDIR";
        const ctx = {
            message: "not a directory",
            path,
            syscall: "rmdir",
            code,
            errno: isWindows ? ENOENT : ENOTDIR
        };
        super(code, ctx, "Path is not a directory");
    }
}
export function denoErrorToNodeError(e, ctx) {
    const errno = extractOsErrorNumberFromErrorMessage(e);
    if (typeof errno === "undefined") {
        return e;
    }
    const ex = uvException({
        errno: mapSysErrnoToUvErrno(errno),
        ...ctx
    });
    return ex;
}
function extractOsErrorNumberFromErrorMessage(e) {
    const match = e instanceof Error ? e.message.match(/\(os error (\d+)\)/) : false;
    if (match) {
        return +match[1];
    }
    return undefined;
}
export function connResetException(msg) {
    const ex = new Error(msg);
    // deno-lint-ignore no-explicit-any
    (ex).code = "ECONNRESET";
    return ex;
}
export function aggregateTwoErrors(innerError, outerError) {
    if (innerError && outerError && innerError !== outerError) {
        if (Array.isArray(outerError.errors)) {
            // If `outerError` is already an `AggregateError`.
            outerError.errors.push(innerError);
            return outerError;
        }
        // eslint-disable-next-line no-restricted-syntax
        const err = new AggregateError([
            outerError,
            innerError, 
        ], outerError.message);
        // deno-lint-ignore no-explicit-any
        (err).code = outerError.code;
        return err;
    }
    return innerError || outerError;
}
codes.ERR_IPC_CHANNEL_CLOSED = ERR_IPC_CHANNEL_CLOSED;
codes.ERR_INVALID_ARG_TYPE = ERR_INVALID_ARG_TYPE;
codes.ERR_INVALID_ARG_VALUE = ERR_INVALID_ARG_VALUE;
codes.ERR_OUT_OF_RANGE = ERR_OUT_OF_RANGE;
codes.ERR_SOCKET_BAD_PORT = ERR_SOCKET_BAD_PORT;
codes.ERR_BUFFER_OUT_OF_BOUNDS = ERR_BUFFER_OUT_OF_BOUNDS;
codes.ERR_UNKNOWN_ENCODING = ERR_UNKNOWN_ENCODING;
// TODO(kt3k): assign all error classes here.
/**
 * This creates a generic Node.js error.
 *
 * @param message The error message.
 * @param errorProperties Object with additional properties to be added to the error.
 * @returns
 */ const genericNodeError = hideStackFrames(function genericNodeError(message, errorProperties) {
    // eslint-disable-next-line no-restricted-syntax
    const err = new Error(message);
    Object.assign(err, errorProperties);
    return err;
});
/**
 * Determine the specific type of a value for type-mismatch errors.
 * @param {*} value
 * @returns {string}
 */ // deno-lint-ignore no-explicit-any
function determineSpecificType(value) {
    if (value == null) {
        return "" + value;
    }
    if (typeof value === "function" && value.name) {
        return `function ${value.name}`;
    }
    if (typeof value === "object") {
        if (value.constructor?.name) {
            return `an instance of ${value.constructor.name}`;
        }
        return `${inspect(value, {
            depth: -1
        })}`;
    }
    let inspected = inspect(value, {
        colors: false
    });
    if (inspected.length > 28) inspected = `${inspected.slice(0, 25)}...`;
    return `type ${typeof value} (${inspected})`;
}
export { codes, genericNodeError, hideStackFrames };
export default {
    AbortError,
    ERR_AMBIGUOUS_ARGUMENT,
    ERR_ARG_NOT_ITERABLE,
    ERR_ASSERTION,
    ERR_ASYNC_CALLBACK,
    ERR_ASYNC_TYPE,
    ERR_BROTLI_INVALID_PARAM,
    ERR_BUFFER_OUT_OF_BOUNDS,
    ERR_BUFFER_TOO_LARGE,
    ERR_CANNOT_WATCH_SIGINT,
    ERR_CHILD_CLOSED_BEFORE_REPLY,
    ERR_CHILD_PROCESS_IPC_REQUIRED,
    ERR_CHILD_PROCESS_STDIO_MAXBUFFER,
    ERR_CONSOLE_WRITABLE_STREAM,
    ERR_CONTEXT_NOT_INITIALIZED,
    ERR_CPU_USAGE,
    ERR_CRYPTO_CUSTOM_ENGINE_NOT_SUPPORTED,
    ERR_CRYPTO_ECDH_INVALID_FORMAT,
    ERR_CRYPTO_ECDH_INVALID_PUBLIC_KEY,
    ERR_CRYPTO_ENGINE_UNKNOWN,
    ERR_CRYPTO_FIPS_FORCED,
    ERR_CRYPTO_FIPS_UNAVAILABLE,
    ERR_CRYPTO_HASH_FINALIZED,
    ERR_CRYPTO_HASH_UPDATE_FAILED,
    ERR_CRYPTO_INCOMPATIBLE_KEY,
    ERR_CRYPTO_INCOMPATIBLE_KEY_OPTIONS,
    ERR_CRYPTO_INVALID_DIGEST,
    ERR_CRYPTO_INVALID_KEY_OBJECT_TYPE,
    ERR_CRYPTO_INVALID_STATE,
    ERR_CRYPTO_PBKDF2_ERROR,
    ERR_CRYPTO_SCRYPT_INVALID_PARAMETER,
    ERR_CRYPTO_SCRYPT_NOT_SUPPORTED,
    ERR_CRYPTO_SIGN_KEY_REQUIRED,
    ERR_DIR_CLOSED,
    ERR_DIR_CONCURRENT_OPERATION,
    ERR_DNS_SET_SERVERS_FAILED,
    ERR_DOMAIN_CALLBACK_NOT_AVAILABLE,
    ERR_DOMAIN_CANNOT_SET_UNCAUGHT_EXCEPTION_CAPTURE,
    ERR_ENCODING_INVALID_ENCODED_DATA,
    ERR_ENCODING_NOT_SUPPORTED,
    ERR_EVAL_ESM_CANNOT_PRINT,
    ERR_EVENT_RECURSION,
    ERR_FALSY_VALUE_REJECTION,
    ERR_FEATURE_UNAVAILABLE_ON_PLATFORM,
    ERR_FS_EISDIR,
    ERR_FS_FILE_TOO_LARGE,
    ERR_FS_INVALID_SYMLINK_TYPE,
    ERR_FS_RMDIR_ENOTDIR,
    ERR_HTTP2_ALTSVC_INVALID_ORIGIN,
    ERR_HTTP2_ALTSVC_LENGTH,
    ERR_HTTP2_CONNECT_AUTHORITY,
    ERR_HTTP2_CONNECT_PATH,
    ERR_HTTP2_CONNECT_SCHEME,
    ERR_HTTP2_GOAWAY_SESSION,
    ERR_HTTP2_HEADERS_AFTER_RESPOND,
    ERR_HTTP2_HEADERS_SENT,
    ERR_HTTP2_HEADER_SINGLE_VALUE,
    ERR_HTTP2_INFO_STATUS_NOT_ALLOWED,
    ERR_HTTP2_INVALID_CONNECTION_HEADERS,
    ERR_HTTP2_INVALID_HEADER_VALUE,
    ERR_HTTP2_INVALID_INFO_STATUS,
    ERR_HTTP2_INVALID_ORIGIN,
    ERR_HTTP2_INVALID_PACKED_SETTINGS_LENGTH,
    ERR_HTTP2_INVALID_PSEUDOHEADER,
    ERR_HTTP2_INVALID_SESSION,
    ERR_HTTP2_INVALID_SETTING_VALUE,
    ERR_HTTP2_INVALID_STREAM,
    ERR_HTTP2_MAX_PENDING_SETTINGS_ACK,
    ERR_HTTP2_NESTED_PUSH,
    ERR_HTTP2_NO_SOCKET_MANIPULATION,
    ERR_HTTP2_ORIGIN_LENGTH,
    ERR_HTTP2_OUT_OF_STREAMS,
    ERR_HTTP2_PAYLOAD_FORBIDDEN,
    ERR_HTTP2_PING_CANCEL,
    ERR_HTTP2_PING_LENGTH,
    ERR_HTTP2_PSEUDOHEADER_NOT_ALLOWED,
    ERR_HTTP2_PUSH_DISABLED,
    ERR_HTTP2_SEND_FILE,
    ERR_HTTP2_SEND_FILE_NOSEEK,
    ERR_HTTP2_SESSION_ERROR,
    ERR_HTTP2_SETTINGS_CANCEL,
    ERR_HTTP2_SOCKET_BOUND,
    ERR_HTTP2_SOCKET_UNBOUND,
    ERR_HTTP2_STATUS_101,
    ERR_HTTP2_STATUS_INVALID,
    ERR_HTTP2_STREAM_CANCEL,
    ERR_HTTP2_STREAM_ERROR,
    ERR_HTTP2_STREAM_SELF_DEPENDENCY,
    ERR_HTTP2_TRAILERS_ALREADY_SENT,
    ERR_HTTP2_TRAILERS_NOT_READY,
    ERR_HTTP2_UNSUPPORTED_PROTOCOL,
    ERR_HTTP_HEADERS_SENT,
    ERR_HTTP_INVALID_HEADER_VALUE,
    ERR_HTTP_INVALID_STATUS_CODE,
    ERR_HTTP_SOCKET_ENCODING,
    ERR_HTTP_TRAILER_INVALID,
    ERR_INCOMPATIBLE_OPTION_PAIR,
    ERR_INPUT_TYPE_NOT_ALLOWED,
    ERR_INSPECTOR_ALREADY_ACTIVATED,
    ERR_INSPECTOR_ALREADY_CONNECTED,
    ERR_INSPECTOR_CLOSED,
    ERR_INSPECTOR_COMMAND,
    ERR_INSPECTOR_NOT_ACTIVE,
    ERR_INSPECTOR_NOT_AVAILABLE,
    ERR_INSPECTOR_NOT_CONNECTED,
    ERR_INSPECTOR_NOT_WORKER,
    ERR_INTERNAL_ASSERTION,
    ERR_INVALID_ADDRESS_FAMILY,
    ERR_INVALID_ARG_TYPE,
    ERR_INVALID_ARG_TYPE_RANGE,
    ERR_INVALID_ARG_VALUE,
    ERR_INVALID_ARG_VALUE_RANGE,
    ERR_INVALID_ASYNC_ID,
    ERR_INVALID_BUFFER_SIZE,
    ERR_INVALID_CHAR,
    ERR_INVALID_CURSOR_POS,
    ERR_INVALID_FD,
    ERR_INVALID_FD_TYPE,
    ERR_INVALID_FILE_URL_HOST,
    ERR_INVALID_FILE_URL_PATH,
    ERR_INVALID_HANDLE_TYPE,
    ERR_INVALID_HTTP_TOKEN,
    ERR_INVALID_IP_ADDRESS,
    ERR_INVALID_MODULE_SPECIFIER,
    ERR_INVALID_OPT_VALUE,
    ERR_INVALID_OPT_VALUE_ENCODING,
    ERR_INVALID_PACKAGE_CONFIG,
    ERR_INVALID_PACKAGE_TARGET,
    ERR_INVALID_PERFORMANCE_MARK,
    ERR_INVALID_PROTOCOL,
    ERR_INVALID_REPL_EVAL_CONFIG,
    ERR_INVALID_REPL_INPUT,
    ERR_INVALID_RETURN_PROPERTY,
    ERR_INVALID_RETURN_PROPERTY_VALUE,
    ERR_INVALID_RETURN_VALUE,
    ERR_INVALID_SYNC_FORK_INPUT,
    ERR_INVALID_THIS,
    ERR_INVALID_TUPLE,
    ERR_INVALID_URI,
    ERR_INVALID_URL,
    ERR_INVALID_URL_SCHEME,
    ERR_IPC_CHANNEL_CLOSED,
    ERR_IPC_DISCONNECTED,
    ERR_IPC_ONE_PIPE,
    ERR_IPC_SYNC_FORK,
    ERR_MANIFEST_DEPENDENCY_MISSING,
    ERR_MANIFEST_INTEGRITY_MISMATCH,
    ERR_MANIFEST_INVALID_RESOURCE_FIELD,
    ERR_MANIFEST_TDZ,
    ERR_MANIFEST_UNKNOWN_ONERROR,
    ERR_METHOD_NOT_IMPLEMENTED,
    ERR_MISSING_ARGS,
    ERR_MISSING_OPTION,
    ERR_MODULE_NOT_FOUND,
    ERR_MULTIPLE_CALLBACK,
    ERR_NAPI_CONS_FUNCTION,
    ERR_NAPI_INVALID_DATAVIEW_ARGS,
    ERR_NAPI_INVALID_TYPEDARRAY_ALIGNMENT,
    ERR_NAPI_INVALID_TYPEDARRAY_LENGTH,
    ERR_NO_CRYPTO,
    ERR_NO_ICU,
    ERR_OUT_OF_RANGE,
    ERR_PACKAGE_IMPORT_NOT_DEFINED,
    ERR_PACKAGE_PATH_NOT_EXPORTED,
    ERR_QUICCLIENTSESSION_FAILED,
    ERR_QUICCLIENTSESSION_FAILED_SETSOCKET,
    ERR_QUICSESSION_DESTROYED,
    ERR_QUICSESSION_INVALID_DCID,
    ERR_QUICSESSION_UPDATEKEY,
    ERR_QUICSOCKET_DESTROYED,
    ERR_QUICSOCKET_INVALID_STATELESS_RESET_SECRET_LENGTH,
    ERR_QUICSOCKET_LISTENING,
    ERR_QUICSOCKET_UNBOUND,
    ERR_QUICSTREAM_DESTROYED,
    ERR_QUICSTREAM_INVALID_PUSH,
    ERR_QUICSTREAM_OPEN_FAILED,
    ERR_QUICSTREAM_UNSUPPORTED_PUSH,
    ERR_QUIC_TLS13_REQUIRED,
    ERR_SCRIPT_EXECUTION_INTERRUPTED,
    ERR_SERVER_ALREADY_LISTEN,
    ERR_SERVER_NOT_RUNNING,
    ERR_SOCKET_ALREADY_BOUND,
    ERR_SOCKET_BAD_BUFFER_SIZE,
    ERR_SOCKET_BAD_PORT,
    ERR_SOCKET_BAD_TYPE,
    ERR_SOCKET_BUFFER_SIZE,
    ERR_SOCKET_CLOSED,
    ERR_SOCKET_DGRAM_IS_CONNECTED,
    ERR_SOCKET_DGRAM_NOT_CONNECTED,
    ERR_SOCKET_DGRAM_NOT_RUNNING,
    ERR_SRI_PARSE,
    ERR_STREAM_ALREADY_FINISHED,
    ERR_STREAM_CANNOT_PIPE,
    ERR_STREAM_DESTROYED,
    ERR_STREAM_NULL_VALUES,
    ERR_STREAM_PREMATURE_CLOSE,
    ERR_STREAM_PUSH_AFTER_EOF,
    ERR_STREAM_UNSHIFT_AFTER_END_EVENT,
    ERR_STREAM_WRAP,
    ERR_STREAM_WRITE_AFTER_END,
    ERR_SYNTHETIC,
    ERR_TLS_CERT_ALTNAME_INVALID,
    ERR_TLS_DH_PARAM_SIZE,
    ERR_TLS_HANDSHAKE_TIMEOUT,
    ERR_TLS_INVALID_CONTEXT,
    ERR_TLS_INVALID_PROTOCOL_VERSION,
    ERR_TLS_INVALID_STATE,
    ERR_TLS_PROTOCOL_VERSION_CONFLICT,
    ERR_TLS_RENEGOTIATION_DISABLED,
    ERR_TLS_REQUIRED_SERVER_NAME,
    ERR_TLS_SESSION_ATTACK,
    ERR_TLS_SNI_FROM_SERVER,
    ERR_TRACE_EVENTS_CATEGORY_REQUIRED,
    ERR_TRACE_EVENTS_UNAVAILABLE,
    ERR_UNAVAILABLE_DURING_EXIT,
    ERR_UNCAUGHT_EXCEPTION_CAPTURE_ALREADY_SET,
    ERR_UNESCAPED_CHARACTERS,
    ERR_UNHANDLED_ERROR,
    ERR_UNKNOWN_BUILTIN_MODULE,
    ERR_UNKNOWN_CREDENTIAL,
    ERR_UNKNOWN_ENCODING,
    ERR_UNKNOWN_FILE_EXTENSION,
    ERR_UNKNOWN_MODULE_FORMAT,
    ERR_UNKNOWN_SIGNAL,
    ERR_UNSUPPORTED_DIR_IMPORT,
    ERR_UNSUPPORTED_ESM_URL_SCHEME,
    ERR_V8BREAKITERATOR,
    ERR_VALID_PERFORMANCE_ENTRY_TYPE,
    ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING,
    ERR_VM_MODULE_ALREADY_LINKED,
    ERR_VM_MODULE_CANNOT_CREATE_CACHED_DATA,
    ERR_VM_MODULE_DIFFERENT_CONTEXT,
    ERR_VM_MODULE_LINKING_ERRORED,
    ERR_VM_MODULE_NOT_MODULE,
    ERR_VM_MODULE_STATUS,
    ERR_WASI_ALREADY_STARTED,
    ERR_WORKER_INIT_FAILED,
    ERR_WORKER_NOT_RUNNING,
    ERR_WORKER_OUT_OF_MEMORY,
    ERR_WORKER_UNSERIALIZABLE_ERROR,
    ERR_WORKER_UNSUPPORTED_EXTENSION,
    ERR_WORKER_UNSUPPORTED_OPERATION,
    ERR_ZLIB_INITIALIZATION_FAILED,
    NodeError,
    NodeErrorAbstraction,
    NodeRangeError,
    NodeSyntaxError,
    NodeTypeError,
    NodeURIError,
    aggregateTwoErrors,
    codes,
    connResetException,
    denoErrorToNodeError,
    dnsException,
    errnoException,
    errorMap,
    exceptionWithHostPort,
    genericNodeError,
    hideStackFrames,
    isStackOverflowError,
    uvException,
    uvExceptionWithHostPort
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1OS4wL25vZGUvaW50ZXJuYWwvZXJyb3JzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjIgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBDb3B5cmlnaHQgTm9kZS5qcyBjb250cmlidXRvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBMaWNlbnNlLlxuLyoqIE5PVCBJTVBMRU1FTlRFRFxuICogRVJSX01BTklGRVNUX0FTU0VSVF9JTlRFR1JJVFlcbiAqIEVSUl9RVUlDU0VTU0lPTl9WRVJTSU9OX05FR09USUFUSU9OXG4gKiBFUlJfUkVRVUlSRV9FU01cbiAqIEVSUl9UTFNfQ0VSVF9BTFROQU1FX0lOVkFMSURcbiAqIEVSUl9XT1JLRVJfSU5WQUxJRF9FWEVDX0FSR1ZcbiAqIEVSUl9XT1JLRVJfUEFUSFxuICogRVJSX1FVSUNfRVJST1JcbiAqIEVSUl9TWVNURU1fRVJST1IgLy9TeXN0ZW0gZXJyb3IsIHNob3VsZG4ndCBldmVyIGhhcHBlbiBpbnNpZGUgRGVub1xuICogRVJSX1RUWV9JTklUX0ZBSUxFRCAvL1N5c3RlbSBlcnJvciwgc2hvdWxkbid0IGV2ZXIgaGFwcGVuIGluc2lkZSBEZW5vXG4gKiBFUlJfSU5WQUxJRF9QQUNLQUdFX0NPTkZJRyAvLyBwYWNrYWdlLmpzb24gc3R1ZmYsIHByb2JhYmx5IHVzZWxlc3NcbiAqL1xuXG5pbXBvcnQgeyBpbnNwZWN0IH0gZnJvbSBcIi4uL2ludGVybmFsL3V0aWwvaW5zcGVjdC5tanNcIjtcbmltcG9ydCB7IGNvZGVzIH0gZnJvbSBcIi4vZXJyb3JfY29kZXMudHNcIjtcbmltcG9ydCB7XG4gIGNvZGVNYXAsXG4gIGVycm9yTWFwLFxuICBtYXBTeXNFcnJub1RvVXZFcnJubyxcbn0gZnJvbSBcIi4uL2ludGVybmFsX2JpbmRpbmcvdXYudHNcIjtcbmltcG9ydCB7IGFzc2VydCB9IGZyb20gXCIuLi8uLi9fdXRpbC9hc3NlcnQudHNcIjtcbmltcG9ydCB7IGlzV2luZG93cyB9IGZyb20gXCIuLi8uLi9fdXRpbC9vcy50c1wiO1xuaW1wb3J0IHsgb3MgYXMgb3NDb25zdGFudHMgfSBmcm9tIFwiLi4vaW50ZXJuYWxfYmluZGluZy9jb25zdGFudHMudHNcIjtcbmNvbnN0IHtcbiAgZXJybm86IHsgRU5PVERJUiwgRU5PRU5UIH0sXG59ID0gb3NDb25zdGFudHM7XG5pbXBvcnQgeyBoaWRlU3RhY2tGcmFtZXMgfSBmcm9tIFwiLi9oaWRlX3N0YWNrX2ZyYW1lcy50c1wiO1xuaW1wb3J0IHsgZ2V0U3lzdGVtRXJyb3JOYW1lIH0gZnJvbSBcIi4uL191dGlscy50c1wiO1xuXG5leHBvcnQgeyBlcnJvck1hcCB9O1xuXG5jb25zdCBrSXNOb2RlRXJyb3IgPSBTeW1ib2woXCJrSXNOb2RlRXJyb3JcIik7XG5cbi8qKlxuICogQHNlZSBodHRwczovL2dpdGh1Yi5jb20vbm9kZWpzL25vZGUvYmxvYi9mM2ViMjI0L2xpYi9pbnRlcm5hbC9lcnJvcnMuanNcbiAqL1xuY29uc3QgY2xhc3NSZWdFeHAgPSAvXihbQS1aXVthLXowLTldKikrJC87XG5cbi8qKlxuICogQHNlZSBodHRwczovL2dpdGh1Yi5jb20vbm9kZWpzL25vZGUvYmxvYi9mM2ViMjI0L2xpYi9pbnRlcm5hbC9lcnJvcnMuanNcbiAqIEBkZXNjcmlwdGlvbiBTb3J0ZWQgYnkgYSByb3VnaCBlc3RpbWF0ZSBvbiBtb3N0IGZyZXF1ZW50bHkgdXNlZCBlbnRyaWVzLlxuICovXG5jb25zdCBrVHlwZXMgPSBbXG4gIFwic3RyaW5nXCIsXG4gIFwiZnVuY3Rpb25cIixcbiAgXCJudW1iZXJcIixcbiAgXCJvYmplY3RcIixcbiAgLy8gQWNjZXB0ICdGdW5jdGlvbicgYW5kICdPYmplY3QnIGFzIGFsdGVybmF0aXZlIHRvIHRoZSBsb3dlciBjYXNlZCB2ZXJzaW9uLlxuICBcIkZ1bmN0aW9uXCIsXG4gIFwiT2JqZWN0XCIsXG4gIFwiYm9vbGVhblwiLFxuICBcImJpZ2ludFwiLFxuICBcInN5bWJvbFwiLFxuXTtcblxuLy8gTm9kZSB1c2VzIGFuIEFib3J0RXJyb3IgdGhhdCBpc24ndCBleGFjdGx5IHRoZSBzYW1lIGFzIHRoZSBET01FeGNlcHRpb25cbi8vIHRvIG1ha2UgdXNhZ2Ugb2YgdGhlIGVycm9yIGluIHVzZXJsYW5kIGFuZCByZWFkYWJsZS1zdHJlYW0gZWFzaWVyLlxuLy8gSXQgaXMgYSByZWd1bGFyIGVycm9yIHdpdGggYC5jb2RlYCBhbmQgYC5uYW1lYC5cbmV4cG9ydCBjbGFzcyBBYm9ydEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb2RlOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXCJUaGUgb3BlcmF0aW9uIHdhcyBhYm9ydGVkXCIpO1xuICAgIHRoaXMuY29kZSA9IFwiQUJPUlRfRVJSXCI7XG4gICAgdGhpcy5uYW1lID0gXCJBYm9ydEVycm9yXCI7XG4gIH1cbn1cblxubGV0IG1heFN0YWNrX0Vycm9yTmFtZTogc3RyaW5nIHwgdW5kZWZpbmVkO1xubGV0IG1heFN0YWNrX0Vycm9yTWVzc2FnZTogc3RyaW5nIHwgdW5kZWZpbmVkO1xuLyoqXG4gKiBSZXR1cm5zIHRydWUgaWYgYGVyci5uYW1lYCBhbmQgYGVyci5tZXNzYWdlYCBhcmUgZXF1YWwgdG8gZW5naW5lLXNwZWNpZmljXG4gKiB2YWx1ZXMgaW5kaWNhdGluZyBtYXggY2FsbCBzdGFjayBzaXplIGhhcyBiZWVuIGV4Y2VlZGVkLlxuICogXCJNYXhpbXVtIGNhbGwgc3RhY2sgc2l6ZSBleGNlZWRlZFwiIGluIFY4LlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNTdGFja092ZXJmbG93RXJyb3IoZXJyOiBFcnJvcik6IGJvb2xlYW4ge1xuICBpZiAobWF4U3RhY2tfRXJyb3JNZXNzYWdlID09PSB1bmRlZmluZWQpIHtcbiAgICB0cnkge1xuICAgICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1pbm5lci1kZWNsYXJhdGlvbnNcbiAgICAgIGZ1bmN0aW9uIG92ZXJmbG93U3RhY2soKSB7XG4gICAgICAgIG92ZXJmbG93U3RhY2soKTtcbiAgICAgIH1cbiAgICAgIG92ZXJmbG93U3RhY2soKTtcbiAgICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIG1heFN0YWNrX0Vycm9yTWVzc2FnZSA9IGVyci5tZXNzYWdlO1xuICAgICAgbWF4U3RhY2tfRXJyb3JOYW1lID0gZXJyLm5hbWU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGVyciAmJiBlcnIubmFtZSA9PT0gbWF4U3RhY2tfRXJyb3JOYW1lICYmXG4gICAgZXJyLm1lc3NhZ2UgPT09IG1heFN0YWNrX0Vycm9yTWVzc2FnZTtcbn1cblxuZnVuY3Rpb24gYWRkTnVtZXJpY2FsU2VwYXJhdG9yKHZhbDogc3RyaW5nKSB7XG4gIGxldCByZXMgPSBcIlwiO1xuICBsZXQgaSA9IHZhbC5sZW5ndGg7XG4gIGNvbnN0IHN0YXJ0ID0gdmFsWzBdID09PSBcIi1cIiA/IDEgOiAwO1xuICBmb3IgKDsgaSA+PSBzdGFydCArIDQ7IGkgLT0gMykge1xuICAgIHJlcyA9IGBfJHt2YWwuc2xpY2UoaSAtIDMsIGkpfSR7cmVzfWA7XG4gIH1cbiAgcmV0dXJuIGAke3ZhbC5zbGljZSgwLCBpKX0ke3Jlc31gO1xufVxuXG5jb25zdCBjYXB0dXJlTGFyZ2VyU3RhY2tUcmFjZSA9IGhpZGVTdGFja0ZyYW1lcyhcbiAgZnVuY3Rpb24gY2FwdHVyZUxhcmdlclN0YWNrVHJhY2UoZXJyKSB7XG4gICAgLy8gQHRzLWlnbm9yZSB0aGlzIGZ1bmN0aW9uIGlzIG5vdCBhdmFpbGFibGUgaW4gbGliLmRvbS5kLnRzXG4gICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UoZXJyKTtcblxuICAgIHJldHVybiBlcnI7XG4gIH0sXG4pO1xuXG5leHBvcnQgaW50ZXJmYWNlIEVycm5vRXhjZXB0aW9uIGV4dGVuZHMgRXJyb3Ige1xuICBlcnJubz86IG51bWJlcjtcbiAgY29kZT86IHN0cmluZztcbiAgcGF0aD86IHN0cmluZztcbiAgc3lzY2FsbD86IHN0cmluZztcbiAgc3Bhd25hcmdzPzogc3RyaW5nW107XG59XG5cbi8qKlxuICogVGhpcyBjcmVhdGVzIGFuIGVycm9yIGNvbXBhdGlibGUgd2l0aCBlcnJvcnMgcHJvZHVjZWQgaW4gdGhlIEMrK1xuICogVGhpcyBmdW5jdGlvbiBzaG91bGQgcmVwbGFjZSB0aGUgZGVwcmVjYXRlZFxuICogYGV4Y2VwdGlvbldpdGhIb3N0UG9ydCgpYCBmdW5jdGlvbi5cbiAqXG4gKiBAcGFyYW0gZXJyIEEgbGlidXYgZXJyb3IgbnVtYmVyXG4gKiBAcGFyYW0gc3lzY2FsbFxuICogQHBhcmFtIGFkZHJlc3NcbiAqIEBwYXJhbSBwb3J0XG4gKiBAcmV0dXJuIFRoZSBlcnJvci5cbiAqL1xuZXhwb3J0IGNvbnN0IHV2RXhjZXB0aW9uV2l0aEhvc3RQb3J0ID0gaGlkZVN0YWNrRnJhbWVzKFxuICBmdW5jdGlvbiB1dkV4Y2VwdGlvbldpdGhIb3N0UG9ydChcbiAgICBlcnI6IG51bWJlcixcbiAgICBzeXNjYWxsOiBzdHJpbmcsXG4gICAgYWRkcmVzcz86IHN0cmluZyB8IG51bGwsXG4gICAgcG9ydD86IG51bWJlciB8IG51bGwsXG4gICkge1xuICAgIGNvbnN0IHsgMDogY29kZSwgMTogdXZtc2cgfSA9IHV2RXJybWFwR2V0KGVycikgfHwgdXZVbm1hcHBlZEVycm9yO1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBgJHtzeXNjYWxsfSAke2NvZGV9OiAke3V2bXNnfWA7XG4gICAgbGV0IGRldGFpbHMgPSBcIlwiO1xuXG4gICAgaWYgKHBvcnQgJiYgcG9ydCA+IDApIHtcbiAgICAgIGRldGFpbHMgPSBgICR7YWRkcmVzc306JHtwb3J0fWA7XG4gICAgfSBlbHNlIGlmIChhZGRyZXNzKSB7XG4gICAgICBkZXRhaWxzID0gYCAke2FkZHJlc3N9YDtcbiAgICB9XG5cbiAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgIGNvbnN0IGV4OiBhbnkgPSBuZXcgRXJyb3IoYCR7bWVzc2FnZX0ke2RldGFpbHN9YCk7XG4gICAgZXguY29kZSA9IGNvZGU7XG4gICAgZXguZXJybm8gPSBlcnI7XG4gICAgZXguc3lzY2FsbCA9IHN5c2NhbGw7XG4gICAgZXguYWRkcmVzcyA9IGFkZHJlc3M7XG5cbiAgICBpZiAocG9ydCkge1xuICAgICAgZXgucG9ydCA9IHBvcnQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNhcHR1cmVMYXJnZXJTdGFja1RyYWNlKGV4KTtcbiAgfSxcbik7XG5cbi8qKlxuICogVGhpcyB1c2VkIHRvIGJlIGB1dGlsLl9lcnJub0V4Y2VwdGlvbigpYC5cbiAqXG4gKiBAcGFyYW0gZXJyIEEgbGlidXYgZXJyb3IgbnVtYmVyXG4gKiBAcGFyYW0gc3lzY2FsbFxuICogQHBhcmFtIG9yaWdpbmFsXG4gKiBAcmV0dXJuIEEgYEVycm5vRXhjZXB0aW9uYFxuICovXG5leHBvcnQgY29uc3QgZXJybm9FeGNlcHRpb24gPSBoaWRlU3RhY2tGcmFtZXMoZnVuY3Rpb24gZXJybm9FeGNlcHRpb24oXG4gIGVycixcbiAgc3lzY2FsbCxcbiAgb3JpZ2luYWw/LFxuKTogRXJybm9FeGNlcHRpb24ge1xuICBjb25zdCBjb2RlID0gZ2V0U3lzdGVtRXJyb3JOYW1lKGVycik7XG4gIGNvbnN0IG1lc3NhZ2UgPSBvcmlnaW5hbFxuICAgID8gYCR7c3lzY2FsbH0gJHtjb2RlfSAke29yaWdpbmFsfWBcbiAgICA6IGAke3N5c2NhbGx9ICR7Y29kZX1gO1xuXG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIGNvbnN0IGV4OiBhbnkgPSBuZXcgRXJyb3IobWVzc2FnZSk7XG4gIGV4LmVycm5vID0gZXJyO1xuICBleC5jb2RlID0gY29kZTtcbiAgZXguc3lzY2FsbCA9IHN5c2NhbGw7XG5cbiAgcmV0dXJuIGNhcHR1cmVMYXJnZXJTdGFja1RyYWNlKGV4KTtcbn0pO1xuXG5mdW5jdGlvbiB1dkVycm1hcEdldChuYW1lOiBudW1iZXIpIHtcbiAgcmV0dXJuIGVycm9yTWFwLmdldChuYW1lKTtcbn1cblxuY29uc3QgdXZVbm1hcHBlZEVycm9yID0gW1wiVU5LTk9XTlwiLCBcInVua25vd24gZXJyb3JcIl07XG5cbi8qKlxuICogVGhpcyBjcmVhdGVzIGFuIGVycm9yIGNvbXBhdGlibGUgd2l0aCBlcnJvcnMgcHJvZHVjZWQgaW4gdGhlIEMrK1xuICogZnVuY3Rpb24gVVZFeGNlcHRpb24gdXNpbmcgYSBjb250ZXh0IG9iamVjdCB3aXRoIGRhdGEgYXNzZW1ibGVkIGluIEMrKy5cbiAqIFRoZSBnb2FsIGlzIHRvIG1pZ3JhdGUgdGhlbSB0byBFUlJfKiBlcnJvcnMgbGF0ZXIgd2hlbiBjb21wYXRpYmlsaXR5IGlzXG4gKiBub3QgYSBjb25jZXJuLlxuICpcbiAqIEBwYXJhbSBjdHhcbiAqIEByZXR1cm4gVGhlIGVycm9yLlxuICovXG5leHBvcnQgY29uc3QgdXZFeGNlcHRpb24gPSBoaWRlU3RhY2tGcmFtZXMoZnVuY3Rpb24gdXZFeGNlcHRpb24oY3R4KSB7XG4gIGNvbnN0IHsgMDogY29kZSwgMTogdXZtc2cgfSA9IHV2RXJybWFwR2V0KGN0eC5lcnJubykgfHwgdXZVbm1hcHBlZEVycm9yO1xuXG4gIGxldCBtZXNzYWdlID0gYCR7Y29kZX06ICR7Y3R4Lm1lc3NhZ2UgfHwgdXZtc2d9LCAke2N0eC5zeXNjYWxsfWA7XG5cbiAgbGV0IHBhdGg7XG4gIGxldCBkZXN0O1xuXG4gIGlmIChjdHgucGF0aCkge1xuICAgIHBhdGggPSBjdHgucGF0aC50b1N0cmluZygpO1xuICAgIG1lc3NhZ2UgKz0gYCAnJHtwYXRofSdgO1xuICB9XG4gIGlmIChjdHguZGVzdCkge1xuICAgIGRlc3QgPSBjdHguZGVzdC50b1N0cmluZygpO1xuICAgIG1lc3NhZ2UgKz0gYCAtPiAnJHtkZXN0fSdgO1xuICB9XG5cbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgY29uc3QgZXJyOiBhbnkgPSBuZXcgRXJyb3IobWVzc2FnZSk7XG5cbiAgZm9yIChjb25zdCBwcm9wIG9mIE9iamVjdC5rZXlzKGN0eCkpIHtcbiAgICBpZiAocHJvcCA9PT0gXCJtZXNzYWdlXCIgfHwgcHJvcCA9PT0gXCJwYXRoXCIgfHwgcHJvcCA9PT0gXCJkZXN0XCIpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGVycltwcm9wXSA9IGN0eFtwcm9wXTtcbiAgfVxuXG4gIGVyci5jb2RlID0gY29kZTtcblxuICBpZiAocGF0aCkge1xuICAgIGVyci5wYXRoID0gcGF0aDtcbiAgfVxuXG4gIGlmIChkZXN0KSB7XG4gICAgZXJyLmRlc3QgPSBkZXN0O1xuICB9XG5cbiAgcmV0dXJuIGNhcHR1cmVMYXJnZXJTdGFja1RyYWNlKGVycik7XG59KTtcblxuLyoqXG4gKiBEZXByZWNhdGVkLCBuZXcgZnVuY3Rpb24gaXMgYHV2RXhjZXB0aW9uV2l0aEhvc3RQb3J0KClgXG4gKiBOZXcgZnVuY3Rpb24gYWRkZWQgdGhlIGVycm9yIGRlc2NyaXB0aW9uIGRpcmVjdGx5XG4gKiBmcm9tIEMrKy4gdGhpcyBtZXRob2QgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5XG4gKiBAcGFyYW0gZXJyIEEgbGlidXYgZXJyb3IgbnVtYmVyXG4gKiBAcGFyYW0gc3lzY2FsbFxuICogQHBhcmFtIGFkZHJlc3NcbiAqIEBwYXJhbSBwb3J0XG4gKiBAcGFyYW0gYWRkaXRpb25hbFxuICovXG5leHBvcnQgY29uc3QgZXhjZXB0aW9uV2l0aEhvc3RQb3J0ID0gaGlkZVN0YWNrRnJhbWVzKFxuICBmdW5jdGlvbiBleGNlcHRpb25XaXRoSG9zdFBvcnQoXG4gICAgZXJyOiBudW1iZXIsXG4gICAgc3lzY2FsbDogc3RyaW5nLFxuICAgIGFkZHJlc3M6IHN0cmluZyxcbiAgICBwb3J0OiBudW1iZXIsXG4gICAgYWRkaXRpb25hbD86IHN0cmluZyxcbiAgKSB7XG4gICAgY29uc3QgY29kZSA9IGdldFN5c3RlbUVycm9yTmFtZShlcnIpO1xuICAgIGxldCBkZXRhaWxzID0gXCJcIjtcblxuICAgIGlmIChwb3J0ICYmIHBvcnQgPiAwKSB7XG4gICAgICBkZXRhaWxzID0gYCAke2FkZHJlc3N9OiR7cG9ydH1gO1xuICAgIH0gZWxzZSBpZiAoYWRkcmVzcykge1xuICAgICAgZGV0YWlscyA9IGAgJHthZGRyZXNzfWA7XG4gICAgfVxuXG4gICAgaWYgKGFkZGl0aW9uYWwpIHtcbiAgICAgIGRldGFpbHMgKz0gYCAtIExvY2FsICgke2FkZGl0aW9uYWx9KWA7XG4gICAgfVxuXG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICBjb25zdCBleDogYW55ID0gbmV3IEVycm9yKGAke3N5c2NhbGx9ICR7Y29kZX0ke2RldGFpbHN9YCk7XG4gICAgZXguZXJybm8gPSBlcnI7XG4gICAgZXguY29kZSA9IGNvZGU7XG4gICAgZXguc3lzY2FsbCA9IHN5c2NhbGw7XG4gICAgZXguYWRkcmVzcyA9IGFkZHJlc3M7XG5cbiAgICBpZiAocG9ydCkge1xuICAgICAgZXgucG9ydCA9IHBvcnQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNhcHR1cmVMYXJnZXJTdGFja1RyYWNlKGV4KTtcbiAgfSxcbik7XG5cbi8qKlxuICogQHBhcmFtIGNvZGUgQSBsaWJ1diBlcnJvciBudW1iZXIgb3IgYSBjLWFyZXMgZXJyb3IgY29kZVxuICogQHBhcmFtIHN5c2NhbGxcbiAqIEBwYXJhbSBob3N0bmFtZVxuICovXG5leHBvcnQgY29uc3QgZG5zRXhjZXB0aW9uID0gaGlkZVN0YWNrRnJhbWVzKGZ1bmN0aW9uIChjb2RlLCBzeXNjYWxsLCBob3N0bmFtZSkge1xuICBsZXQgZXJybm87XG5cbiAgLy8gSWYgYGNvZGVgIGlzIG9mIHR5cGUgbnVtYmVyLCBpdCBpcyBhIGxpYnV2IGVycm9yIG51bWJlciwgZWxzZSBpdCBpcyBhXG4gIC8vIGMtYXJlcyBlcnJvciBjb2RlLlxuICBpZiAodHlwZW9mIGNvZGUgPT09IFwibnVtYmVyXCIpIHtcbiAgICBlcnJubyA9IGNvZGU7XG4gICAgLy8gRU5PVEZPVU5EIGlzIG5vdCBhIHByb3BlciBQT1NJWCBlcnJvciwgYnV0IHRoaXMgZXJyb3IgaGFzIGJlZW4gaW4gcGxhY2VcbiAgICAvLyBsb25nIGVub3VnaCB0aGF0IGl0J3Mgbm90IHByYWN0aWNhbCB0byByZW1vdmUgaXQuXG4gICAgaWYgKFxuICAgICAgY29kZSA9PT0gY29kZU1hcC5nZXQoXCJFQUlfTk9EQVRBXCIpIHx8XG4gICAgICBjb2RlID09PSBjb2RlTWFwLmdldChcIkVBSV9OT05BTUVcIilcbiAgICApIHtcbiAgICAgIGNvZGUgPSBcIkVOT1RGT1VORFwiOyAvLyBGYWJyaWNhdGVkIGVycm9yIG5hbWUuXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvZGUgPSBnZXRTeXN0ZW1FcnJvck5hbWUoY29kZSk7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgbWVzc2FnZSA9IGAke3N5c2NhbGx9ICR7Y29kZX0ke2hvc3RuYW1lID8gYCAke2hvc3RuYW1lfWAgOiBcIlwifWA7XG5cbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgY29uc3QgZXg6IGFueSA9IG5ldyBFcnJvcihtZXNzYWdlKTtcbiAgZXguZXJybm8gPSBlcnJubztcbiAgZXguY29kZSA9IGNvZGU7XG4gIGV4LnN5c2NhbGwgPSBzeXNjYWxsO1xuXG4gIGlmIChob3N0bmFtZSkge1xuICAgIGV4Lmhvc3RuYW1lID0gaG9zdG5hbWU7XG4gIH1cblxuICByZXR1cm4gY2FwdHVyZUxhcmdlclN0YWNrVHJhY2UoZXgpO1xufSk7XG5cbi8qKlxuICogQWxsIGVycm9yIGluc3RhbmNlcyBpbiBOb2RlIGhhdmUgYWRkaXRpb25hbCBtZXRob2RzIGFuZCBwcm9wZXJ0aWVzXG4gKiBUaGlzIGV4cG9ydCBjbGFzcyBpcyBtZWFudCB0byBiZSBleHRlbmRlZCBieSB0aGVzZSBpbnN0YW5jZXMgYWJzdHJhY3RpbmcgbmF0aXZlIEpTIGVycm9yIGluc3RhbmNlc1xuICovXG5leHBvcnQgY2xhc3MgTm9kZUVycm9yQWJzdHJhY3Rpb24gZXh0ZW5kcyBFcnJvciB7XG4gIGNvZGU6IHN0cmluZztcblxuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGNvZGU6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nKSB7XG4gICAgc3VwZXIobWVzc2FnZSk7XG4gICAgdGhpcy5jb2RlID0gY29kZTtcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIC8vVGhpcyBudW1iZXIgY2hhbmdlcyBkZXBlbmRpbmcgb24gdGhlIG5hbWUgb2YgdGhpcyBjbGFzc1xuICAgIC8vMjAgY2hhcmFjdGVycyBhcyBvZiBub3dcbiAgICB0aGlzLnN0YWNrID0gdGhpcy5zdGFjayAmJiBgJHtuYW1lfSBbJHt0aGlzLmNvZGV9XSR7dGhpcy5zdGFjay5zbGljZSgyMCl9YDtcbiAgfVxuXG4gIG92ZXJyaWRlIHRvU3RyaW5nKCkge1xuICAgIHJldHVybiBgJHt0aGlzLm5hbWV9IFske3RoaXMuY29kZX1dOiAke3RoaXMubWVzc2FnZX1gO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBOb2RlRXJyb3IgZXh0ZW5kcyBOb2RlRXJyb3JBYnN0cmFjdGlvbiB7XG4gIGNvbnN0cnVjdG9yKGNvZGU6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoRXJyb3IucHJvdG90eXBlLm5hbWUsIGNvZGUsIG1lc3NhZ2UpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBOb2RlU3ludGF4RXJyb3IgZXh0ZW5kcyBOb2RlRXJyb3JBYnN0cmFjdGlvblxuICBpbXBsZW1lbnRzIFN5bnRheEVycm9yIHtcbiAgY29uc3RydWN0b3IoY29kZTogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcpIHtcbiAgICBzdXBlcihTeW50YXhFcnJvci5wcm90b3R5cGUubmFtZSwgY29kZSwgbWVzc2FnZSk7XG4gICAgT2JqZWN0LnNldFByb3RvdHlwZU9mKHRoaXMsIFN5bnRheEVycm9yLnByb3RvdHlwZSk7XG4gICAgdGhpcy50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBgJHt0aGlzLm5hbWV9IFske3RoaXMuY29kZX1dOiAke3RoaXMubWVzc2FnZX1gO1xuICAgIH07XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIE5vZGVSYW5nZUVycm9yIGV4dGVuZHMgTm9kZUVycm9yQWJzdHJhY3Rpb24ge1xuICBjb25zdHJ1Y3Rvcihjb2RlOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZykge1xuICAgIHN1cGVyKFJhbmdlRXJyb3IucHJvdG90eXBlLm5hbWUsIGNvZGUsIG1lc3NhZ2UpO1xuICAgIE9iamVjdC5zZXRQcm90b3R5cGVPZih0aGlzLCBSYW5nZUVycm9yLnByb3RvdHlwZSk7XG4gICAgdGhpcy50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBgJHt0aGlzLm5hbWV9IFske3RoaXMuY29kZX1dOiAke3RoaXMubWVzc2FnZX1gO1xuICAgIH07XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIE5vZGVUeXBlRXJyb3IgZXh0ZW5kcyBOb2RlRXJyb3JBYnN0cmFjdGlvbiBpbXBsZW1lbnRzIFR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKGNvZGU6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoVHlwZUVycm9yLnByb3RvdHlwZS5uYW1lLCBjb2RlLCBtZXNzYWdlKTtcbiAgICBPYmplY3Quc2V0UHJvdG90eXBlT2YodGhpcywgVHlwZUVycm9yLnByb3RvdHlwZSk7XG4gICAgdGhpcy50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBgJHt0aGlzLm5hbWV9IFske3RoaXMuY29kZX1dOiAke3RoaXMubWVzc2FnZX1gO1xuICAgIH07XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIE5vZGVVUklFcnJvciBleHRlbmRzIE5vZGVFcnJvckFic3RyYWN0aW9uIGltcGxlbWVudHMgVVJJRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcihjb2RlOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZykge1xuICAgIHN1cGVyKFVSSUVycm9yLnByb3RvdHlwZS5uYW1lLCBjb2RlLCBtZXNzYWdlKTtcbiAgICBPYmplY3Quc2V0UHJvdG90eXBlT2YodGhpcywgVVJJRXJyb3IucHJvdG90eXBlKTtcbiAgICB0aGlzLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIGAke3RoaXMubmFtZX0gWyR7dGhpcy5jb2RlfV06ICR7dGhpcy5tZXNzYWdlfWA7XG4gICAgfTtcbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIE5vZGVTeXN0ZW1FcnJvckN0eCB7XG4gIGNvZGU6IHN0cmluZztcbiAgc3lzY2FsbDogc3RyaW5nO1xuICBtZXNzYWdlOiBzdHJpbmc7XG4gIGVycm5vOiBudW1iZXI7XG4gIHBhdGg/OiBzdHJpbmc7XG4gIGRlc3Q/OiBzdHJpbmc7XG59XG4vLyBBIHNwZWNpYWxpemVkIEVycm9yIHRoYXQgaW5jbHVkZXMgYW4gYWRkaXRpb25hbCBpbmZvIHByb3BlcnR5IHdpdGhcbi8vIGFkZGl0aW9uYWwgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGVycm9yIGNvbmRpdGlvbi5cbi8vIEl0IGhhcyB0aGUgcHJvcGVydGllcyBwcmVzZW50IGluIGEgVVZFeGNlcHRpb24gYnV0IHdpdGggYSBjdXN0b20gZXJyb3Jcbi8vIG1lc3NhZ2UgZm9sbG93ZWQgYnkgdGhlIHV2IGVycm9yIGNvZGUgYW5kIHV2IGVycm9yIG1lc3NhZ2UuXG4vLyBJdCBhbHNvIGhhcyBpdHMgb3duIGVycm9yIGNvZGUgd2l0aCB0aGUgb3JpZ2luYWwgdXYgZXJyb3IgY29udGV4dCBwdXQgaW50b1xuLy8gYGVyci5pbmZvYC5cbi8vIFRoZSBjb250ZXh0IHBhc3NlZCBpbnRvIHRoaXMgZXJyb3IgbXVzdCBoYXZlIC5jb2RlLCAuc3lzY2FsbCBhbmQgLm1lc3NhZ2UsXG4vLyBhbmQgbWF5IGhhdmUgLnBhdGggYW5kIC5kZXN0LlxuY2xhc3MgTm9kZVN5c3RlbUVycm9yIGV4dGVuZHMgTm9kZUVycm9yQWJzdHJhY3Rpb24ge1xuICBjb25zdHJ1Y3RvcihrZXk6IHN0cmluZywgY29udGV4dDogTm9kZVN5c3RlbUVycm9yQ3R4LCBtc2dQcmVmaXg6IHN0cmluZykge1xuICAgIGxldCBtZXNzYWdlID0gYCR7bXNnUHJlZml4fTogJHtjb250ZXh0LnN5c2NhbGx9IHJldHVybmVkIGAgK1xuICAgICAgYCR7Y29udGV4dC5jb2RlfSAoJHtjb250ZXh0Lm1lc3NhZ2V9KWA7XG5cbiAgICBpZiAoY29udGV4dC5wYXRoICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIG1lc3NhZ2UgKz0gYCAke2NvbnRleHQucGF0aH1gO1xuICAgIH1cbiAgICBpZiAoY29udGV4dC5kZXN0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIG1lc3NhZ2UgKz0gYCA9PiAke2NvbnRleHQuZGVzdH1gO1xuICAgIH1cblxuICAgIHN1cGVyKFwiU3lzdGVtRXJyb3JcIiwga2V5LCBtZXNzYWdlKTtcblxuICAgIGNhcHR1cmVMYXJnZXJTdGFja1RyYWNlKHRoaXMpO1xuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXModGhpcywge1xuICAgICAgW2tJc05vZGVFcnJvcl06IHtcbiAgICAgICAgdmFsdWU6IHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBpbmZvOiB7XG4gICAgICAgIHZhbHVlOiBjb250ZXh0LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICBlcnJubzoge1xuICAgICAgICBnZXQoKSB7XG4gICAgICAgICAgcmV0dXJuIGNvbnRleHQuZXJybm87XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogKHZhbHVlKSA9PiB7XG4gICAgICAgICAgY29udGV4dC5lcnJubyA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICB9LFxuICAgICAgc3lzY2FsbDoge1xuICAgICAgICBnZXQoKSB7XG4gICAgICAgICAgcmV0dXJuIGNvbnRleHQuc3lzY2FsbDtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiAodmFsdWUpID0+IHtcbiAgICAgICAgICBjb250ZXh0LnN5c2NhbGwgPSB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIGlmIChjb250ZXh0LnBhdGggIT09IHVuZGVmaW5lZCkge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwicGF0aFwiLCB7XG4gICAgICAgIGdldCgpIHtcbiAgICAgICAgICByZXR1cm4gY29udGV4dC5wYXRoO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6ICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGNvbnRleHQucGF0aCA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoY29udGV4dC5kZXN0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcImRlc3RcIiwge1xuICAgICAgICBnZXQoKSB7XG4gICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGVzdDtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiAodmFsdWUpID0+IHtcbiAgICAgICAgICBjb250ZXh0LmRlc3QgPSB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgb3ZlcnJpZGUgdG9TdHJpbmcoKSB7XG4gICAgcmV0dXJuIGAke3RoaXMubmFtZX0gWyR7dGhpcy5jb2RlfV06ICR7dGhpcy5tZXNzYWdlfWA7XG4gIH1cbn1cblxuZnVuY3Rpb24gbWFrZVN5c3RlbUVycm9yV2l0aENvZGUoa2V5OiBzdHJpbmcsIG1zZ1ByZml4OiBzdHJpbmcpIHtcbiAgcmV0dXJuIGNsYXNzIE5vZGVFcnJvciBleHRlbmRzIE5vZGVTeXN0ZW1FcnJvciB7XG4gICAgY29uc3RydWN0b3IoY3R4OiBOb2RlU3lzdGVtRXJyb3JDdHgpIHtcbiAgICAgIHN1cGVyKGtleSwgY3R4LCBtc2dQcmZpeCk7XG4gICAgfVxuICB9O1xufVxuXG5leHBvcnQgY29uc3QgRVJSX0ZTX0VJU0RJUiA9IG1ha2VTeXN0ZW1FcnJvcldpdGhDb2RlKFxuICBcIkVSUl9GU19FSVNESVJcIixcbiAgXCJQYXRoIGlzIGEgZGlyZWN0b3J5XCIsXG4pO1xuXG5mdW5jdGlvbiBjcmVhdGVJbnZhbGlkQXJnVHlwZShcbiAgbmFtZTogc3RyaW5nLFxuICBleHBlY3RlZDogc3RyaW5nIHwgc3RyaW5nW10sXG4pOiBzdHJpbmcge1xuICAvLyBodHRwczovL2dpdGh1Yi5jb20vbm9kZWpzL25vZGUvYmxvYi9mM2ViMjI0L2xpYi9pbnRlcm5hbC9lcnJvcnMuanMjTDEwMzctTDEwODdcbiAgZXhwZWN0ZWQgPSBBcnJheS5pc0FycmF5KGV4cGVjdGVkKSA/IGV4cGVjdGVkIDogW2V4cGVjdGVkXTtcbiAgbGV0IG1zZyA9IFwiVGhlIFwiO1xuICBpZiAobmFtZS5lbmRzV2l0aChcIiBhcmd1bWVudFwiKSkge1xuICAgIC8vIEZvciBjYXNlcyBsaWtlICdmaXJzdCBhcmd1bWVudCdcbiAgICBtc2cgKz0gYCR7bmFtZX0gYDtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCB0eXBlID0gbmFtZS5pbmNsdWRlcyhcIi5cIikgPyBcInByb3BlcnR5XCIgOiBcImFyZ3VtZW50XCI7XG4gICAgbXNnICs9IGBcIiR7bmFtZX1cIiAke3R5cGV9IGA7XG4gIH1cbiAgbXNnICs9IFwibXVzdCBiZSBcIjtcblxuICBjb25zdCB0eXBlcyA9IFtdO1xuICBjb25zdCBpbnN0YW5jZXMgPSBbXTtcbiAgY29uc3Qgb3RoZXIgPSBbXTtcbiAgZm9yIChjb25zdCB2YWx1ZSBvZiBleHBlY3RlZCkge1xuICAgIGlmIChrVHlwZXMuaW5jbHVkZXModmFsdWUpKSB7XG4gICAgICB0eXBlcy5wdXNoKHZhbHVlLnRvTG9jYWxlTG93ZXJDYXNlKCkpO1xuICAgIH0gZWxzZSBpZiAoY2xhc3NSZWdFeHAudGVzdCh2YWx1ZSkpIHtcbiAgICAgIGluc3RhbmNlcy5wdXNoKHZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3RoZXIucHVzaCh2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgLy8gU3BlY2lhbCBoYW5kbGUgYG9iamVjdGAgaW4gY2FzZSBvdGhlciBpbnN0YW5jZXMgYXJlIGFsbG93ZWQgdG8gb3V0bGluZVxuICAvLyB0aGUgZGlmZmVyZW5jZXMgYmV0d2VlbiBlYWNoIG90aGVyLlxuICBpZiAoaW5zdGFuY2VzLmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCBwb3MgPSB0eXBlcy5pbmRleE9mKFwib2JqZWN0XCIpO1xuICAgIGlmIChwb3MgIT09IC0xKSB7XG4gICAgICB0eXBlcy5zcGxpY2UocG9zLCAxKTtcbiAgICAgIGluc3RhbmNlcy5wdXNoKFwiT2JqZWN0XCIpO1xuICAgIH1cbiAgfVxuXG4gIGlmICh0eXBlcy5sZW5ndGggPiAwKSB7XG4gICAgaWYgKHR5cGVzLmxlbmd0aCA+IDIpIHtcbiAgICAgIGNvbnN0IGxhc3QgPSB0eXBlcy5wb3AoKTtcbiAgICAgIG1zZyArPSBgb25lIG9mIHR5cGUgJHt0eXBlcy5qb2luKFwiLCBcIil9LCBvciAke2xhc3R9YDtcbiAgICB9IGVsc2UgaWYgKHR5cGVzLmxlbmd0aCA9PT0gMikge1xuICAgICAgbXNnICs9IGBvbmUgb2YgdHlwZSAke3R5cGVzWzBdfSBvciAke3R5cGVzWzFdfWA7XG4gICAgfSBlbHNlIHtcbiAgICAgIG1zZyArPSBgb2YgdHlwZSAke3R5cGVzWzBdfWA7XG4gICAgfVxuICAgIGlmIChpbnN0YW5jZXMubGVuZ3RoID4gMCB8fCBvdGhlci5sZW5ndGggPiAwKSB7XG4gICAgICBtc2cgKz0gXCIgb3IgXCI7XG4gICAgfVxuICB9XG5cbiAgaWYgKGluc3RhbmNlcy5sZW5ndGggPiAwKSB7XG4gICAgaWYgKGluc3RhbmNlcy5sZW5ndGggPiAyKSB7XG4gICAgICBjb25zdCBsYXN0ID0gaW5zdGFuY2VzLnBvcCgpO1xuICAgICAgbXNnICs9IGBhbiBpbnN0YW5jZSBvZiAke2luc3RhbmNlcy5qb2luKFwiLCBcIil9LCBvciAke2xhc3R9YDtcbiAgICB9IGVsc2Uge1xuICAgICAgbXNnICs9IGBhbiBpbnN0YW5jZSBvZiAke2luc3RhbmNlc1swXX1gO1xuICAgICAgaWYgKGluc3RhbmNlcy5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgbXNnICs9IGAgb3IgJHtpbnN0YW5jZXNbMV19YDtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKG90aGVyLmxlbmd0aCA+IDApIHtcbiAgICAgIG1zZyArPSBcIiBvciBcIjtcbiAgICB9XG4gIH1cblxuICBpZiAob3RoZXIubGVuZ3RoID4gMCkge1xuICAgIGlmIChvdGhlci5sZW5ndGggPiAyKSB7XG4gICAgICBjb25zdCBsYXN0ID0gb3RoZXIucG9wKCk7XG4gICAgICBtc2cgKz0gYG9uZSBvZiAke290aGVyLmpvaW4oXCIsIFwiKX0sIG9yICR7bGFzdH1gO1xuICAgIH0gZWxzZSBpZiAob3RoZXIubGVuZ3RoID09PSAyKSB7XG4gICAgICBtc2cgKz0gYG9uZSBvZiAke290aGVyWzBdfSBvciAke290aGVyWzFdfWA7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChvdGhlclswXS50b0xvd2VyQ2FzZSgpICE9PSBvdGhlclswXSkge1xuICAgICAgICBtc2cgKz0gXCJhbiBcIjtcbiAgICAgIH1cbiAgICAgIG1zZyArPSBgJHtvdGhlclswXX1gO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBtc2c7XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfSU5WQUxJRF9BUkdfVFlQRV9SQU5HRSBleHRlbmRzIE5vZGVSYW5nZUVycm9yIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBleHBlY3RlZDogc3RyaW5nIHwgc3RyaW5nW10sIGFjdHVhbDogdW5rbm93bikge1xuICAgIGNvbnN0IG1zZyA9IGNyZWF0ZUludmFsaWRBcmdUeXBlKG5hbWUsIGV4cGVjdGVkKTtcblxuICAgIHN1cGVyKFwiRVJSX0lOVkFMSURfQVJHX1RZUEVcIiwgYCR7bXNnfS4ke2ludmFsaWRBcmdUeXBlSGVscGVyKGFjdHVhbCl9YCk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9JTlZBTElEX0FSR19UWVBFIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgZXhwZWN0ZWQ6IHN0cmluZyB8IHN0cmluZ1tdLCBhY3R1YWw6IHVua25vd24pIHtcbiAgICBjb25zdCBtc2cgPSBjcmVhdGVJbnZhbGlkQXJnVHlwZShuYW1lLCBleHBlY3RlZCk7XG5cbiAgICBzdXBlcihcIkVSUl9JTlZBTElEX0FSR19UWVBFXCIsIGAke21zZ30uJHtpbnZhbGlkQXJnVHlwZUhlbHBlcihhY3R1YWwpfWApO1xuICB9XG5cbiAgc3RhdGljIFJhbmdlRXJyb3IgPSBFUlJfSU5WQUxJRF9BUkdfVFlQRV9SQU5HRTtcbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9JTlZBTElEX0FSR19WQUxVRV9SQU5HRSBleHRlbmRzIE5vZGVSYW5nZUVycm9yIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCB2YWx1ZTogdW5rbm93biwgcmVhc29uOiBzdHJpbmcgPSBcImlzIGludmFsaWRcIikge1xuICAgIGNvbnN0IHR5cGUgPSBuYW1lLmluY2x1ZGVzKFwiLlwiKSA/IFwicHJvcGVydHlcIiA6IFwiYXJndW1lbnRcIjtcbiAgICBjb25zdCBpbnNwZWN0ZWQgPSBpbnNwZWN0KHZhbHVlKTtcblxuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSU5WQUxJRF9BUkdfVkFMVUVcIixcbiAgICAgIGBUaGUgJHt0eXBlfSAnJHtuYW1lfScgJHtyZWFzb259LiBSZWNlaXZlZCAke2luc3BlY3RlZH1gLFxuICAgICk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9JTlZBTElEX0FSR19WQUxVRSBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIHZhbHVlOiB1bmtub3duLCByZWFzb246IHN0cmluZyA9IFwiaXMgaW52YWxpZFwiKSB7XG4gICAgY29uc3QgdHlwZSA9IG5hbWUuaW5jbHVkZXMoXCIuXCIpID8gXCJwcm9wZXJ0eVwiIDogXCJhcmd1bWVudFwiO1xuICAgIGNvbnN0IGluc3BlY3RlZCA9IGluc3BlY3QodmFsdWUpO1xuXG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9JTlZBTElEX0FSR19WQUxVRVwiLFxuICAgICAgYFRoZSAke3R5cGV9ICcke25hbWV9JyAke3JlYXNvbn0uIFJlY2VpdmVkICR7aW5zcGVjdGVkfWAsXG4gICAgKTtcbiAgfVxuXG4gIHN0YXRpYyBSYW5nZUVycm9yID0gRVJSX0lOVkFMSURfQVJHX1ZBTFVFX1JBTkdFO1xufVxuXG4vLyBBIGhlbHBlciBmdW5jdGlvbiB0byBzaW1wbGlmeSBjaGVja2luZyBmb3IgRVJSX0lOVkFMSURfQVJHX1RZUEUgb3V0cHV0LlxuLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbmZ1bmN0aW9uIGludmFsaWRBcmdUeXBlSGVscGVyKGlucHV0OiBhbnkpIHtcbiAgaWYgKGlucHV0ID09IG51bGwpIHtcbiAgICByZXR1cm4gYCBSZWNlaXZlZCAke2lucHV0fWA7XG4gIH1cbiAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gXCJmdW5jdGlvblwiICYmIGlucHV0Lm5hbWUpIHtcbiAgICByZXR1cm4gYCBSZWNlaXZlZCBmdW5jdGlvbiAke2lucHV0Lm5hbWV9YDtcbiAgfVxuICBpZiAodHlwZW9mIGlucHV0ID09PSBcIm9iamVjdFwiKSB7XG4gICAgaWYgKGlucHV0LmNvbnN0cnVjdG9yICYmIGlucHV0LmNvbnN0cnVjdG9yLm5hbWUpIHtcbiAgICAgIHJldHVybiBgIFJlY2VpdmVkIGFuIGluc3RhbmNlIG9mICR7aW5wdXQuY29uc3RydWN0b3IubmFtZX1gO1xuICAgIH1cbiAgICByZXR1cm4gYCBSZWNlaXZlZCAke2luc3BlY3QoaW5wdXQsIHsgZGVwdGg6IC0xIH0pfWA7XG4gIH1cbiAgbGV0IGluc3BlY3RlZCA9IGluc3BlY3QoaW5wdXQsIHsgY29sb3JzOiBmYWxzZSB9KTtcbiAgaWYgKGluc3BlY3RlZC5sZW5ndGggPiAyNSkge1xuICAgIGluc3BlY3RlZCA9IGAke2luc3BlY3RlZC5zbGljZSgwLCAyNSl9Li4uYDtcbiAgfVxuICByZXR1cm4gYCBSZWNlaXZlZCB0eXBlICR7dHlwZW9mIGlucHV0fSAoJHtpbnNwZWN0ZWR9KWA7XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfT1VUX09GX1JBTkdFIGV4dGVuZHMgUmFuZ2VFcnJvciB7XG4gIGNvZGUgPSBcIkVSUl9PVVRfT0ZfUkFOR0VcIjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBzdHI6IHN0cmluZyxcbiAgICByYW5nZTogc3RyaW5nLFxuICAgIGlucHV0OiB1bmtub3duLFxuICAgIHJlcGxhY2VEZWZhdWx0Qm9vbGVhbiA9IGZhbHNlLFxuICApIHtcbiAgICBhc3NlcnQocmFuZ2UsICdNaXNzaW5nIFwicmFuZ2VcIiBhcmd1bWVudCcpO1xuICAgIGxldCBtc2cgPSByZXBsYWNlRGVmYXVsdEJvb2xlYW5cbiAgICAgID8gc3RyXG4gICAgICA6IGBUaGUgdmFsdWUgb2YgXCIke3N0cn1cIiBpcyBvdXQgb2YgcmFuZ2UuYDtcbiAgICBsZXQgcmVjZWl2ZWQ7XG4gICAgaWYgKE51bWJlci5pc0ludGVnZXIoaW5wdXQpICYmIE1hdGguYWJzKGlucHV0IGFzIG51bWJlcikgPiAyICoqIDMyKSB7XG4gICAgICByZWNlaXZlZCA9IGFkZE51bWVyaWNhbFNlcGFyYXRvcihTdHJpbmcoaW5wdXQpKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBpbnB1dCA9PT0gXCJiaWdpbnRcIikge1xuICAgICAgcmVjZWl2ZWQgPSBTdHJpbmcoaW5wdXQpO1xuICAgICAgaWYgKGlucHV0ID4gMm4gKiogMzJuIHx8IGlucHV0IDwgLSgybiAqKiAzMm4pKSB7XG4gICAgICAgIHJlY2VpdmVkID0gYWRkTnVtZXJpY2FsU2VwYXJhdG9yKHJlY2VpdmVkKTtcbiAgICAgIH1cbiAgICAgIHJlY2VpdmVkICs9IFwiblwiO1xuICAgIH0gZWxzZSB7XG4gICAgICByZWNlaXZlZCA9IGluc3BlY3QoaW5wdXQpO1xuICAgIH1cbiAgICBtc2cgKz0gYCBJdCBtdXN0IGJlICR7cmFuZ2V9LiBSZWNlaXZlZCAke3JlY2VpdmVkfWA7XG5cbiAgICBzdXBlcihtc2cpO1xuXG4gICAgY29uc3QgeyBuYW1lIH0gPSB0aGlzO1xuICAgIC8vIEFkZCB0aGUgZXJyb3IgY29kZSB0byB0aGUgbmFtZSB0byBpbmNsdWRlIGl0IGluIHRoZSBzdGFjayB0cmFjZS5cbiAgICB0aGlzLm5hbWUgPSBgJHtuYW1lfSBbJHt0aGlzLmNvZGV9XWA7XG4gICAgLy8gQWNjZXNzIHRoZSBzdGFjayB0byBnZW5lcmF0ZSB0aGUgZXJyb3IgbWVzc2FnZSBpbmNsdWRpbmcgdGhlIGVycm9yIGNvZGUgZnJvbSB0aGUgbmFtZS5cbiAgICB0aGlzLnN0YWNrO1xuICAgIC8vIFJlc2V0IHRoZSBuYW1lIHRvIHRoZSBhY3R1YWwgbmFtZS5cbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfQU1CSUdVT1VTX0FSR1VNRU5UIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZywgeTogc3RyaW5nKSB7XG4gICAgc3VwZXIoXCJFUlJfQU1CSUdVT1VTX0FSR1VNRU5UXCIsIGBUaGUgXCIke3h9XCIgYXJndW1lbnQgaXMgYW1iaWd1b3VzLiAke3l9YCk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9BUkdfTk9UX0lURVJBQkxFIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFwiRVJSX0FSR19OT1RfSVRFUkFCTEVcIiwgYCR7eH0gbXVzdCBiZSBpdGVyYWJsZWApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfQVNTRVJUSU9OIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXCJFUlJfQVNTRVJUSU9OXCIsIGAke3h9YCk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9BU1lOQ19DQUxMQkFDSyBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcIkVSUl9BU1lOQ19DQUxMQkFDS1wiLCBgJHt4fSBtdXN0IGJlIGEgZnVuY3Rpb25gKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0FTWU5DX1RZUEUgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXCJFUlJfQVNZTkNfVFlQRVwiLCBgSW52YWxpZCBuYW1lIGZvciBhc3luYyBcInR5cGVcIjogJHt4fWApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfQlJPVExJX0lOVkFMSURfUEFSQU0gZXh0ZW5kcyBOb2RlUmFuZ2VFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFwiRVJSX0JST1RMSV9JTlZBTElEX1BBUkFNXCIsIGAke3h9IGlzIG5vdCBhIHZhbGlkIEJyb3RsaSBwYXJhbWV0ZXJgKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0JVRkZFUl9PVVRfT0ZfQk9VTkRTIGV4dGVuZHMgTm9kZVJhbmdlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihuYW1lPzogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9CVUZGRVJfT1VUX09GX0JPVU5EU1wiLFxuICAgICAgbmFtZVxuICAgICAgICA/IGBcIiR7bmFtZX1cIiBpcyBvdXRzaWRlIG9mIGJ1ZmZlciBib3VuZHNgXG4gICAgICAgIDogXCJBdHRlbXB0IHRvIGFjY2VzcyBtZW1vcnkgb3V0c2lkZSBidWZmZXIgYm91bmRzXCIsXG4gICAgKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0JVRkZFUl9UT09fTEFSR0UgZXh0ZW5kcyBOb2RlUmFuZ2VFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfQlVGRkVSX1RPT19MQVJHRVwiLFxuICAgICAgYENhbm5vdCBjcmVhdGUgYSBCdWZmZXIgbGFyZ2VyIHRoYW4gJHt4fSBieXRlc2AsXG4gICAgKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0NBTk5PVF9XQVRDSF9TSUdJTlQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcIkVSUl9DQU5OT1RfV0FUQ0hfU0lHSU5UXCIsIFwiQ2Fubm90IHdhdGNoIGZvciBTSUdJTlQgc2lnbmFsc1wiKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0NISUxEX0NMT1NFRF9CRUZPUkVfUkVQTFkgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0NISUxEX0NMT1NFRF9CRUZPUkVfUkVQTFlcIixcbiAgICAgIFwiQ2hpbGQgY2xvc2VkIGJlZm9yZSByZXBseSByZWNlaXZlZFwiLFxuICAgICk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9DSElMRF9QUk9DRVNTX0lQQ19SRVFVSVJFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfQ0hJTERfUFJPQ0VTU19JUENfUkVRVUlSRURcIixcbiAgICAgIGBGb3JrZWQgcHJvY2Vzc2VzIG11c3QgaGF2ZSBhbiBJUEMgY2hhbm5lbCwgbWlzc2luZyB2YWx1ZSAnaXBjJyBpbiAke3h9YCxcbiAgICApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfQ0hJTERfUFJPQ0VTU19TVERJT19NQVhCVUZGRVIgZXh0ZW5kcyBOb2RlUmFuZ2VFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfQ0hJTERfUFJPQ0VTU19TVERJT19NQVhCVUZGRVJcIixcbiAgICAgIGAke3h9IG1heEJ1ZmZlciBsZW5ndGggZXhjZWVkZWRgLFxuICAgICk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9DT05TT0xFX1dSSVRBQkxFX1NUUkVBTSBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0NPTlNPTEVfV1JJVEFCTEVfU1RSRUFNXCIsXG4gICAgICBgQ29uc29sZSBleHBlY3RzIGEgd3JpdGFibGUgc3RyZWFtIGluc3RhbmNlIGZvciAke3h9YCxcbiAgICApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfQ09OVEVYVF9OT1RfSU5JVElBTElaRUQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcIkVSUl9DT05URVhUX05PVF9JTklUSUFMSVpFRFwiLCBcImNvbnRleHQgdXNlZCBpcyBub3QgaW5pdGlhbGl6ZWRcIik7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9DUFVfVVNBR0UgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcIkVSUl9DUFVfVVNBR0VcIiwgYFVuYWJsZSB0byBvYnRhaW4gY3B1IHVzYWdlICR7eH1gKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0NSWVBUT19DVVNUT01fRU5HSU5FX05PVF9TVVBQT1JURUQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0NSWVBUT19DVVNUT01fRU5HSU5FX05PVF9TVVBQT1JURURcIixcbiAgICAgIFwiQ3VzdG9tIGVuZ2luZXMgbm90IHN1cHBvcnRlZCBieSB0aGlzIE9wZW5TU0xcIixcbiAgICApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfQ1JZUFRPX0VDREhfSU5WQUxJRF9GT1JNQVQgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXCJFUlJfQ1JZUFRPX0VDREhfSU5WQUxJRF9GT1JNQVRcIiwgYEludmFsaWQgRUNESCBmb3JtYXQ6ICR7eH1gKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0NSWVBUT19FQ0RIX0lOVkFMSURfUFVCTElDX0tFWSBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfQ1JZUFRPX0VDREhfSU5WQUxJRF9QVUJMSUNfS0VZXCIsXG4gICAgICBcIlB1YmxpYyBrZXkgaXMgbm90IHZhbGlkIGZvciBzcGVjaWZpZWQgY3VydmVcIixcbiAgICApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfQ1JZUFRPX0VOR0lORV9VTktOT1dOIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXCJFUlJfQ1JZUFRPX0VOR0lORV9VTktOT1dOXCIsIGBFbmdpbmUgXCIke3h9XCIgd2FzIG5vdCBmb3VuZGApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfQ1JZUFRPX0ZJUFNfRk9SQ0VEIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9DUllQVE9fRklQU19GT1JDRURcIixcbiAgICAgIFwiQ2Fubm90IHNldCBGSVBTIG1vZGUsIGl0IHdhcyBmb3JjZWQgd2l0aCAtLWZvcmNlLWZpcHMgYXQgc3RhcnR1cC5cIixcbiAgICApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfQ1JZUFRPX0ZJUFNfVU5BVkFJTEFCTEUgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0NSWVBUT19GSVBTX1VOQVZBSUxBQkxFXCIsXG4gICAgICBcIkNhbm5vdCBzZXQgRklQUyBtb2RlIGluIGEgbm9uLUZJUFMgYnVpbGQuXCIsXG4gICAgKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0NSWVBUT19IQVNIX0ZJTkFMSVpFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX0NSWVBUT19IQVNIX0ZJTkFMSVpFRFwiLCBcIkRpZ2VzdCBhbHJlYWR5IGNhbGxlZFwiKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0NSWVBUT19IQVNIX1VQREFURV9GQUlMRUQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcIkVSUl9DUllQVE9fSEFTSF9VUERBVEVfRkFJTEVEXCIsIFwiSGFzaCB1cGRhdGUgZmFpbGVkXCIpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfQ1JZUFRPX0lOQ09NUEFUSUJMRV9LRVkgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcsIHk6IHN0cmluZykge1xuICAgIHN1cGVyKFwiRVJSX0NSWVBUT19JTkNPTVBBVElCTEVfS0VZXCIsIGBJbmNvbXBhdGlibGUgJHt4fTogJHt5fWApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfQ1JZUFRPX0lOQ09NUEFUSUJMRV9LRVlfT1BUSU9OUyBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZywgeTogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9DUllQVE9fSU5DT01QQVRJQkxFX0tFWV9PUFRJT05TXCIsXG4gICAgICBgVGhlIHNlbGVjdGVkIGtleSBlbmNvZGluZyAke3h9ICR7eX0uYCxcbiAgICApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfQ1JZUFRPX0lOVkFMSURfRElHRVNUIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFwiRVJSX0NSWVBUT19JTlZBTElEX0RJR0VTVFwiLCBgSW52YWxpZCBkaWdlc3Q6ICR7eH1gKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0NSWVBUT19JTlZBTElEX0tFWV9PQkpFQ1RfVFlQRSBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcsIHk6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfQ1JZUFRPX0lOVkFMSURfS0VZX09CSkVDVF9UWVBFXCIsXG4gICAgICBgSW52YWxpZCBrZXkgb2JqZWN0IHR5cGUgJHt4fSwgZXhwZWN0ZWQgJHt5fS5gLFxuICAgICk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9DUllQVE9fSU5WQUxJRF9TVEFURSBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFwiRVJSX0NSWVBUT19JTlZBTElEX1NUQVRFXCIsIGBJbnZhbGlkIHN0YXRlIGZvciBvcGVyYXRpb24gJHt4fWApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfQ1JZUFRPX1BCS0RGMl9FUlJPUiBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX0NSWVBUT19QQktERjJfRVJST1JcIiwgXCJQQktERjIgZXJyb3JcIik7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9DUllQVE9fU0NSWVBUX0lOVkFMSURfUEFSQU1FVEVSIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXCJFUlJfQ1JZUFRPX1NDUllQVF9JTlZBTElEX1BBUkFNRVRFUlwiLCBcIkludmFsaWQgc2NyeXB0IHBhcmFtZXRlclwiKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0NSWVBUT19TQ1JZUFRfTk9UX1NVUFBPUlRFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX0NSWVBUT19TQ1JZUFRfTk9UX1NVUFBPUlRFRFwiLCBcIlNjcnlwdCBhbGdvcml0aG0gbm90IHN1cHBvcnRlZFwiKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0NSWVBUT19TSUdOX0tFWV9SRVFVSVJFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX0NSWVBUT19TSUdOX0tFWV9SRVFVSVJFRFwiLCBcIk5vIGtleSBwcm92aWRlZCB0byBzaWduXCIpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfRElSX0NMT1NFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX0RJUl9DTE9TRURcIiwgXCJEaXJlY3RvcnkgaGFuZGxlIHdhcyBjbG9zZWRcIik7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9ESVJfQ09OQ1VSUkVOVF9PUEVSQVRJT04gZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0RJUl9DT05DVVJSRU5UX09QRVJBVElPTlwiLFxuICAgICAgXCJDYW5ub3QgZG8gc3luY2hyb25vdXMgd29yayBvbiBkaXJlY3RvcnkgaGFuZGxlIHdpdGggY29uY3VycmVudCBhc3luY2hyb25vdXMgb3BlcmF0aW9uc1wiLFxuICAgICk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9ETlNfU0VUX1NFUlZFUlNfRkFJTEVEIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nLCB5OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0ROU19TRVRfU0VSVkVSU19GQUlMRURcIixcbiAgICAgIGBjLWFyZXMgZmFpbGVkIHRvIHNldCBzZXJ2ZXJzOiBcIiR7eH1cIiBbJHt5fV1gLFxuICAgICk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9ET01BSU5fQ0FMTEJBQ0tfTk9UX0FWQUlMQUJMRSBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfRE9NQUlOX0NBTExCQUNLX05PVF9BVkFJTEFCTEVcIixcbiAgICAgIFwiQSBjYWxsYmFjayB3YXMgcmVnaXN0ZXJlZCB0aHJvdWdoIFwiICtcbiAgICAgICAgXCJwcm9jZXNzLnNldFVuY2F1Z2h0RXhjZXB0aW9uQ2FwdHVyZUNhbGxiYWNrKCksIHdoaWNoIGlzIG11dHVhbGx5IFwiICtcbiAgICAgICAgXCJleGNsdXNpdmUgd2l0aCB1c2luZyB0aGUgYGRvbWFpbmAgbW9kdWxlXCIsXG4gICAgKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0RPTUFJTl9DQU5OT1RfU0VUX1VOQ0FVR0hUX0VYQ0VQVElPTl9DQVBUVVJFXG4gIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9ET01BSU5fQ0FOTk9UX1NFVF9VTkNBVUdIVF9FWENFUFRJT05fQ0FQVFVSRVwiLFxuICAgICAgXCJUaGUgYGRvbWFpbmAgbW9kdWxlIGlzIGluIHVzZSwgd2hpY2ggaXMgbXV0dWFsbHkgZXhjbHVzaXZlIHdpdGggY2FsbGluZyBcIiArXG4gICAgICAgIFwicHJvY2Vzcy5zZXRVbmNhdWdodEV4Y2VwdGlvbkNhcHR1cmVDYWxsYmFjaygpXCIsXG4gICAgKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0VOQ09ESU5HX0lOVkFMSURfRU5DT0RFRF9EQVRBIGV4dGVuZHMgTm9kZUVycm9yQWJzdHJhY3Rpb25cbiAgaW1wbGVtZW50cyBUeXBlRXJyb3Ige1xuICBlcnJubzogbnVtYmVyO1xuICBjb25zdHJ1Y3RvcihlbmNvZGluZzogc3RyaW5nLCByZXQ6IG51bWJlcikge1xuICAgIHN1cGVyKFxuICAgICAgVHlwZUVycm9yLnByb3RvdHlwZS5uYW1lLFxuICAgICAgXCJFUlJfRU5DT0RJTkdfSU5WQUxJRF9FTkNPREVEX0RBVEFcIixcbiAgICAgIGBUaGUgZW5jb2RlZCBkYXRhIHdhcyBub3QgdmFsaWQgZm9yIGVuY29kaW5nICR7ZW5jb2Rpbmd9YCxcbiAgICApO1xuICAgIE9iamVjdC5zZXRQcm90b3R5cGVPZih0aGlzLCBUeXBlRXJyb3IucHJvdG90eXBlKTtcblxuICAgIHRoaXMuZXJybm8gPSByZXQ7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9FTkNPRElOR19OT1RfU1VQUE9SVEVEIGV4dGVuZHMgTm9kZVJhbmdlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcIkVSUl9FTkNPRElOR19OT1RfU1VQUE9SVEVEXCIsIGBUaGUgXCIke3h9XCIgZW5jb2RpbmcgaXMgbm90IHN1cHBvcnRlZGApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0VWQUxfRVNNX0NBTk5PVF9QUklOVCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX0VWQUxfRVNNX0NBTk5PVF9QUklOVFwiLCBgLS1wcmludCBjYW5ub3QgYmUgdXNlZCB3aXRoIEVTTSBpbnB1dGApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0VWRU5UX1JFQ1VSU0lPTiBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfRVZFTlRfUkVDVVJTSU9OXCIsXG4gICAgICBgVGhlIGV2ZW50IFwiJHt4fVwiIGlzIGFscmVhZHkgYmVpbmcgZGlzcGF0Y2hlZGAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9GRUFUVVJFX1VOQVZBSUxBQkxFX09OX1BMQVRGT1JNIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfRkVBVFVSRV9VTkFWQUlMQUJMRV9PTl9QTEFURk9STVwiLFxuICAgICAgYFRoZSBmZWF0dXJlICR7eH0gaXMgdW5hdmFpbGFibGUgb24gdGhlIGN1cnJlbnQgcGxhdGZvcm0sIHdoaWNoIGlzIGJlaW5nIHVzZWQgdG8gcnVuIE5vZGUuanNgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfRlNfRklMRV9UT09fTEFSR0UgZXh0ZW5kcyBOb2RlUmFuZ2VFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFwiRVJSX0ZTX0ZJTEVfVE9PX0xBUkdFXCIsIGBGaWxlIHNpemUgKCR7eH0pIGlzIGdyZWF0ZXIgdGhhbiAyIEdCYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfRlNfSU5WQUxJRF9TWU1MSU5LX1RZUEUgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0ZTX0lOVkFMSURfU1lNTElOS19UWVBFXCIsXG4gICAgICBgU3ltbGluayB0eXBlIG11c3QgYmUgb25lIG9mIFwiZGlyXCIsIFwiZmlsZVwiLCBvciBcImp1bmN0aW9uXCIuIFJlY2VpdmVkIFwiJHt4fVwiYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX0FMVFNWQ19JTlZBTElEX09SSUdJTiBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0hUVFAyX0FMVFNWQ19JTlZBTElEX09SSUdJTlwiLFxuICAgICAgYEhUVFAvMiBBTFRTVkMgZnJhbWVzIHJlcXVpcmUgYSB2YWxpZCBvcmlnaW5gLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUDJfQUxUU1ZDX0xFTkdUSCBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0hUVFAyX0FMVFNWQ19MRU5HVEhcIixcbiAgICAgIGBIVFRQLzIgQUxUU1ZDIGZyYW1lcyBhcmUgbGltaXRlZCB0byAxNjM4MiBieXRlc2AsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9IVFRQMl9DT05ORUNUX0FVVEhPUklUWSBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSFRUUDJfQ09OTkVDVF9BVVRIT1JJVFlcIixcbiAgICAgIGA6YXV0aG9yaXR5IGhlYWRlciBpcyByZXF1aXJlZCBmb3IgQ09OTkVDVCByZXF1ZXN0c2AsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9IVFRQMl9DT05ORUNUX1BBVEggZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0hUVFAyX0NPTk5FQ1RfUEFUSFwiLFxuICAgICAgYFRoZSA6cGF0aCBoZWFkZXIgaXMgZm9yYmlkZGVuIGZvciBDT05ORUNUIHJlcXVlc3RzYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX0NPTk5FQ1RfU0NIRU1FIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9IVFRQMl9DT05ORUNUX1NDSEVNRVwiLFxuICAgICAgYFRoZSA6c2NoZW1lIGhlYWRlciBpcyBmb3JiaWRkZW4gZm9yIENPTk5FQ1QgcmVxdWVzdHNgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUDJfR09BV0FZX1NFU1NJT04gZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0hUVFAyX0dPQVdBWV9TRVNTSU9OXCIsXG4gICAgICBgTmV3IHN0cmVhbXMgY2Fubm90IGJlIGNyZWF0ZWQgYWZ0ZXIgcmVjZWl2aW5nIGEgR09BV0FZYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX0hFQURFUlNfQUZURVJfUkVTUE9ORCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSFRUUDJfSEVBREVSU19BRlRFUl9SRVNQT05EXCIsXG4gICAgICBgQ2Fubm90IHNwZWNpZnkgYWRkaXRpb25hbCBoZWFkZXJzIGFmdGVyIHJlc3BvbnNlIGluaXRpYXRlZGAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9IVFRQMl9IRUFERVJTX1NFTlQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcIkVSUl9IVFRQMl9IRUFERVJTX1NFTlRcIiwgYFJlc3BvbnNlIGhhcyBhbHJlYWR5IGJlZW4gaW5pdGlhdGVkLmApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX0hFQURFUl9TSU5HTEVfVkFMVUUgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9IVFRQMl9IRUFERVJfU0lOR0xFX1ZBTFVFXCIsXG4gICAgICBgSGVhZGVyIGZpZWxkIFwiJHt4fVwiIG11c3Qgb25seSBoYXZlIGEgc2luZ2xlIHZhbHVlYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX0lORk9fU1RBVFVTX05PVF9BTExPV0VEIGV4dGVuZHMgTm9kZVJhbmdlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0hUVFAyX0lORk9fU1RBVFVTX05PVF9BTExPV0VEXCIsXG4gICAgICBgSW5mb3JtYXRpb25hbCBzdGF0dXMgY29kZXMgY2Fubm90IGJlIHVzZWRgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUDJfSU5WQUxJRF9DT05ORUNUSU9OX0hFQURFUlMgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9IVFRQMl9JTlZBTElEX0NPTk5FQ1RJT05fSEVBREVSU1wiLFxuICAgICAgYEhUVFAvMSBDb25uZWN0aW9uIHNwZWNpZmljIGhlYWRlcnMgYXJlIGZvcmJpZGRlbjogXCIke3h9XCJgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUDJfSU5WQUxJRF9IRUFERVJfVkFMVUUgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nLCB5OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0hUVFAyX0lOVkFMSURfSEVBREVSX1ZBTFVFXCIsXG4gICAgICBgSW52YWxpZCB2YWx1ZSBcIiR7eH1cIiBmb3IgaGVhZGVyIFwiJHt5fVwiYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX0lOVkFMSURfSU5GT19TVEFUVVMgZXh0ZW5kcyBOb2RlUmFuZ2VFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSFRUUDJfSU5WQUxJRF9JTkZPX1NUQVRVU1wiLFxuICAgICAgYEludmFsaWQgaW5mb3JtYXRpb25hbCBzdGF0dXMgY29kZTogJHt4fWAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9IVFRQMl9JTlZBTElEX09SSUdJTiBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0hUVFAyX0lOVkFMSURfT1JJR0lOXCIsXG4gICAgICBgSFRUUC8yIE9SSUdJTiBmcmFtZXMgcmVxdWlyZSBhIHZhbGlkIG9yaWdpbmAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9IVFRQMl9JTlZBTElEX1BBQ0tFRF9TRVRUSU5HU19MRU5HVEggZXh0ZW5kcyBOb2RlUmFuZ2VFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSFRUUDJfSU5WQUxJRF9QQUNLRURfU0VUVElOR1NfTEVOR1RIXCIsXG4gICAgICBgUGFja2VkIHNldHRpbmdzIGxlbmd0aCBtdXN0IGJlIGEgbXVsdGlwbGUgb2Ygc2l4YCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX0lOVkFMSURfUFNFVURPSEVBREVSIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSFRUUDJfSU5WQUxJRF9QU0VVRE9IRUFERVJcIixcbiAgICAgIGBcIiR7eH1cIiBpcyBhbiBpbnZhbGlkIHBzZXVkb2hlYWRlciBvciBpcyB1c2VkIGluY29ycmVjdGx5YCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX0lOVkFMSURfU0VTU0lPTiBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX0hUVFAyX0lOVkFMSURfU0VTU0lPTlwiLCBgVGhlIHNlc3Npb24gaGFzIGJlZW4gZGVzdHJveWVkYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUDJfSU5WQUxJRF9TVFJFQU0gZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcIkVSUl9IVFRQMl9JTlZBTElEX1NUUkVBTVwiLCBgVGhlIHN0cmVhbSBoYXMgYmVlbiBkZXN0cm95ZWRgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9IVFRQMl9NQVhfUEVORElOR19TRVRUSU5HU19BQ0sgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0hUVFAyX01BWF9QRU5ESU5HX1NFVFRJTkdTX0FDS1wiLFxuICAgICAgYE1heGltdW0gbnVtYmVyIG9mIHBlbmRpbmcgc2V0dGluZ3MgYWNrbm93bGVkZ2VtZW50c2AsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9IVFRQMl9ORVNURURfUFVTSCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSFRUUDJfTkVTVEVEX1BVU0hcIixcbiAgICAgIGBBIHB1c2ggc3RyZWFtIGNhbm5vdCBpbml0aWF0ZSBhbm90aGVyIHB1c2ggc3RyZWFtLmAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9IVFRQMl9OT19TT0NLRVRfTUFOSVBVTEFUSU9OIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9IVFRQMl9OT19TT0NLRVRfTUFOSVBVTEFUSU9OXCIsXG4gICAgICBgSFRUUC8yIHNvY2tldHMgc2hvdWxkIG5vdCBiZSBkaXJlY3RseSBtYW5pcHVsYXRlZCAoZS5nLiByZWFkIGFuZCB3cml0dGVuKWAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9IVFRQMl9PUklHSU5fTEVOR1RIIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSFRUUDJfT1JJR0lOX0xFTkdUSFwiLFxuICAgICAgYEhUVFAvMiBPUklHSU4gZnJhbWVzIGFyZSBsaW1pdGVkIHRvIDE2MzgyIGJ5dGVzYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX09VVF9PRl9TVFJFQU1TIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9IVFRQMl9PVVRfT0ZfU1RSRUFNU1wiLFxuICAgICAgYE5vIHN0cmVhbSBJRCBpcyBhdmFpbGFibGUgYmVjYXVzZSBtYXhpbXVtIHN0cmVhbSBJRCBoYXMgYmVlbiByZWFjaGVkYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX1BBWUxPQURfRk9SQklEREVOIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9IVFRQMl9QQVlMT0FEX0ZPUkJJRERFTlwiLFxuICAgICAgYFJlc3BvbnNlcyB3aXRoICR7eH0gc3RhdHVzIG11c3Qgbm90IGhhdmUgYSBwYXlsb2FkYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX1BJTkdfQ0FOQ0VMIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXCJFUlJfSFRUUDJfUElOR19DQU5DRUxcIiwgYEhUVFAyIHBpbmcgY2FuY2VsbGVkYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUDJfUElOR19MRU5HVEggZXh0ZW5kcyBOb2RlUmFuZ2VFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX0hUVFAyX1BJTkdfTEVOR1RIXCIsIGBIVFRQMiBwaW5nIHBheWxvYWQgbXVzdCBiZSA4IGJ5dGVzYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUDJfUFNFVURPSEVBREVSX05PVF9BTExPV0VEIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSFRUUDJfUFNFVURPSEVBREVSX05PVF9BTExPV0VEXCIsXG4gICAgICBgQ2Fubm90IHNldCBIVFRQLzIgcHNldWRvLWhlYWRlcnNgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUDJfUFVTSF9ESVNBQkxFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX0hUVFAyX1BVU0hfRElTQUJMRURcIiwgYEhUVFAvMiBjbGllbnQgaGFzIGRpc2FibGVkIHB1c2ggc3RyZWFtc2ApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX1NFTkRfRklMRSBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX0hUVFAyX1NFTkRfRklMRVwiLCBgRGlyZWN0b3JpZXMgY2Fubm90IGJlIHNlbnRgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9IVFRQMl9TRU5EX0ZJTEVfTk9TRUVLIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9IVFRQMl9TRU5EX0ZJTEVfTk9TRUVLXCIsXG4gICAgICBgT2Zmc2V0IG9yIGxlbmd0aCBjYW4gb25seSBiZSBzcGVjaWZpZWQgZm9yIHJlZ3VsYXIgZmlsZXNgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUDJfU0VTU0lPTl9FUlJPUiBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFwiRVJSX0hUVFAyX1NFU1NJT05fRVJST1JcIiwgYFNlc3Npb24gY2xvc2VkIHdpdGggZXJyb3IgY29kZSAke3h9YCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUDJfU0VUVElOR1NfQ0FOQ0VMIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXCJFUlJfSFRUUDJfU0VUVElOR1NfQ0FOQ0VMXCIsIGBIVFRQMiBzZXNzaW9uIHNldHRpbmdzIGNhbmNlbGVkYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUDJfU09DS0VUX0JPVU5EIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9IVFRQMl9TT0NLRVRfQk9VTkRcIixcbiAgICAgIGBUaGUgc29ja2V0IGlzIGFscmVhZHkgYm91bmQgdG8gYW4gSHR0cDJTZXNzaW9uYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX1NPQ0tFVF9VTkJPVU5EIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9IVFRQMl9TT0NLRVRfVU5CT1VORFwiLFxuICAgICAgYFRoZSBzb2NrZXQgaGFzIGJlZW4gZGlzY29ubmVjdGVkIGZyb20gdGhlIEh0dHAyU2Vzc2lvbmAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9IVFRQMl9TVEFUVVNfMTAxIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9IVFRQMl9TVEFUVVNfMTAxXCIsXG4gICAgICBgSFRUUCBzdGF0dXMgY29kZSAxMDEgKFN3aXRjaGluZyBQcm90b2NvbHMpIGlzIGZvcmJpZGRlbiBpbiBIVFRQLzJgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUDJfU1RBVFVTX0lOVkFMSUQgZXh0ZW5kcyBOb2RlUmFuZ2VFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFwiRVJSX0hUVFAyX1NUQVRVU19JTlZBTElEXCIsIGBJbnZhbGlkIHN0YXR1cyBjb2RlOiAke3h9YCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUDJfU1RSRUFNX0VSUk9SIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXCJFUlJfSFRUUDJfU1RSRUFNX0VSUk9SXCIsIGBTdHJlYW0gY2xvc2VkIHdpdGggZXJyb3IgY29kZSAke3h9YCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUDJfU1RSRUFNX1NFTEZfREVQRU5ERU5DWSBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSFRUUDJfU1RSRUFNX1NFTEZfREVQRU5ERU5DWVwiLFxuICAgICAgYEEgc3RyZWFtIGNhbm5vdCBkZXBlbmQgb24gaXRzZWxmYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX1RSQUlMRVJTX0FMUkVBRFlfU0VOVCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSFRUUDJfVFJBSUxFUlNfQUxSRUFEWV9TRU5UXCIsXG4gICAgICBgVHJhaWxpbmcgaGVhZGVycyBoYXZlIGFscmVhZHkgYmVlbiBzZW50YCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX1RSQUlMRVJTX05PVF9SRUFEWSBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSFRUUDJfVFJBSUxFUlNfTk9UX1JFQURZXCIsXG4gICAgICBgVHJhaWxpbmcgaGVhZGVycyBjYW5ub3QgYmUgc2VudCB1bnRpbCBhZnRlciB0aGUgd2FudFRyYWlsZXJzIGV2ZW50IGlzIGVtaXR0ZWRgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUDJfVU5TVVBQT1JURURfUFJPVE9DT0wgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcIkVSUl9IVFRQMl9VTlNVUFBPUlRFRF9QUk9UT0NPTFwiLCBgcHJvdG9jb2wgXCIke3h9XCIgaXMgdW5zdXBwb3J0ZWQuYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUF9IRUFERVJTX1NFTlQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0hUVFBfSEVBREVSU19TRU5UXCIsXG4gICAgICBgQ2Fubm90ICR7eH0gaGVhZGVycyBhZnRlciB0aGV5IGFyZSBzZW50IHRvIHRoZSBjbGllbnRgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUF9JTlZBTElEX0hFQURFUl9WQUxVRSBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcsIHk6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSFRUUF9JTlZBTElEX0hFQURFUl9WQUxVRVwiLFxuICAgICAgYEludmFsaWQgdmFsdWUgXCIke3h9XCIgZm9yIGhlYWRlciBcIiR7eX1cImAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9IVFRQX0lOVkFMSURfU1RBVFVTX0NPREUgZXh0ZW5kcyBOb2RlUmFuZ2VFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFwiRVJSX0hUVFBfSU5WQUxJRF9TVEFUVVNfQ09ERVwiLCBgSW52YWxpZCBzdGF0dXMgY29kZTogJHt4fWApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFBfU09DS0VUX0VOQ09ESU5HIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9IVFRQX1NPQ0tFVF9FTkNPRElOR1wiLFxuICAgICAgYENoYW5naW5nIHRoZSBzb2NrZXQgZW5jb2RpbmcgaXMgbm90IGFsbG93ZWQgcGVyIFJGQzcyMzAgU2VjdGlvbiAzLmAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9IVFRQX1RSQUlMRVJfSU5WQUxJRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSFRUUF9UUkFJTEVSX0lOVkFMSURcIixcbiAgICAgIGBUcmFpbGVycyBhcmUgaW52YWxpZCB3aXRoIHRoaXMgdHJhbnNmZXIgZW5jb2RpbmdgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSU5DT01QQVRJQkxFX09QVElPTl9QQUlSIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZywgeTogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9JTkNPTVBBVElCTEVfT1BUSU9OX1BBSVJcIixcbiAgICAgIGBPcHRpb24gXCIke3h9XCIgY2Fubm90IGJlIHVzZWQgaW4gY29tYmluYXRpb24gd2l0aCBvcHRpb24gXCIke3l9XCJgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSU5QVVRfVFlQRV9OT1RfQUxMT1dFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSU5QVVRfVFlQRV9OT1RfQUxMT1dFRFwiLFxuICAgICAgYC0taW5wdXQtdHlwZSBjYW4gb25seSBiZSB1c2VkIHdpdGggc3RyaW5nIGlucHV0IHZpYSAtLWV2YWwsIC0tcHJpbnQsIG9yIFNURElOYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0lOU1BFQ1RPUl9BTFJFQURZX0FDVElWQVRFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSU5TUEVDVE9SX0FMUkVBRFlfQUNUSVZBVEVEXCIsXG4gICAgICBgSW5zcGVjdG9yIGlzIGFscmVhZHkgYWN0aXZhdGVkLiBDbG9zZSBpdCB3aXRoIGluc3BlY3Rvci5jbG9zZSgpIGJlZm9yZSBhY3RpdmF0aW5nIGl0IGFnYWluLmAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9JTlNQRUNUT1JfQUxSRUFEWV9DT05ORUNURUQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcIkVSUl9JTlNQRUNUT1JfQUxSRUFEWV9DT05ORUNURURcIiwgYCR7eH0gaXMgYWxyZWFkeSBjb25uZWN0ZWRgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9JTlNQRUNUT1JfQ0xPU0VEIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXCJFUlJfSU5TUEVDVE9SX0NMT1NFRFwiLCBgU2Vzc2lvbiB3YXMgY2xvc2VkYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSU5TUEVDVE9SX0NPTU1BTkQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBudW1iZXIsIHk6IHN0cmluZykge1xuICAgIHN1cGVyKFwiRVJSX0lOU1BFQ1RPUl9DT01NQU5EXCIsIGBJbnNwZWN0b3IgZXJyb3IgJHt4fTogJHt5fWApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0lOU1BFQ1RPUl9OT1RfQUNUSVZFIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXCJFUlJfSU5TUEVDVE9SX05PVF9BQ1RJVkVcIiwgYEluc3BlY3RvciBpcyBub3QgYWN0aXZlYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSU5TUEVDVE9SX05PVF9BVkFJTEFCTEUgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcIkVSUl9JTlNQRUNUT1JfTk9UX0FWQUlMQUJMRVwiLCBgSW5zcGVjdG9yIGlzIG5vdCBhdmFpbGFibGVgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9JTlNQRUNUT1JfTk9UX0NPTk5FQ1RFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX0lOU1BFQ1RPUl9OT1RfQ09OTkVDVEVEXCIsIGBTZXNzaW9uIGlzIG5vdCBjb25uZWN0ZWRgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9JTlNQRUNUT1JfTk9UX1dPUktFUiBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX0lOU1BFQ1RPUl9OT1RfV09SS0VSXCIsIGBDdXJyZW50IHRocmVhZCBpcyBub3QgYSB3b3JrZXJgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9JTlZBTElEX0FTWU5DX0lEIGV4dGVuZHMgTm9kZVJhbmdlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcsIHk6IHN0cmluZyB8IG51bWJlcikge1xuICAgIHN1cGVyKFwiRVJSX0lOVkFMSURfQVNZTkNfSURcIiwgYEludmFsaWQgJHt4fSB2YWx1ZTogJHt5fWApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0lOVkFMSURfQlVGRkVSX1NJWkUgZXh0ZW5kcyBOb2RlUmFuZ2VFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFwiRVJSX0lOVkFMSURfQlVGRkVSX1NJWkVcIiwgYEJ1ZmZlciBzaXplIG11c3QgYmUgYSBtdWx0aXBsZSBvZiAke3h9YCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSU5WQUxJRF9DVVJTT1JfUE9TIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSU5WQUxJRF9DVVJTT1JfUE9TXCIsXG4gICAgICBgQ2Fubm90IHNldCBjdXJzb3Igcm93IHdpdGhvdXQgc2V0dGluZyBpdHMgY29sdW1uYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0lOVkFMSURfRkQgZXh0ZW5kcyBOb2RlUmFuZ2VFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFwiRVJSX0lOVkFMSURfRkRcIiwgYFwiZmRcIiBtdXN0IGJlIGEgcG9zaXRpdmUgaW50ZWdlcjogJHt4fWApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0lOVkFMSURfRkRfVFlQRSBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcIkVSUl9JTlZBTElEX0ZEX1RZUEVcIiwgYFVuc3VwcG9ydGVkIGZkIHR5cGU6ICR7eH1gKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9JTlZBTElEX0ZJTEVfVVJMX0hPU1QgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9JTlZBTElEX0ZJTEVfVVJMX0hPU1RcIixcbiAgICAgIGBGaWxlIFVSTCBob3N0IG11c3QgYmUgXCJsb2NhbGhvc3RcIiBvciBlbXB0eSBvbiAke3h9YCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0lOVkFMSURfRklMRV9VUkxfUEFUSCBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcIkVSUl9JTlZBTElEX0ZJTEVfVVJMX1BBVEhcIiwgYEZpbGUgVVJMIHBhdGggJHt4fWApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0lOVkFMSURfSEFORExFX1RZUEUgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXCJFUlJfSU5WQUxJRF9IQU5ETEVfVFlQRVwiLCBgVGhpcyBoYW5kbGUgdHlwZSBjYW5ub3QgYmUgc2VudGApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0lOVkFMSURfSFRUUF9UT0tFTiBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcsIHk6IHN0cmluZykge1xuICAgIHN1cGVyKFwiRVJSX0lOVkFMSURfSFRUUF9UT0tFTlwiLCBgJHt4fSBtdXN0IGJlIGEgdmFsaWQgSFRUUCB0b2tlbiBbXCIke3l9XCJdYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSU5WQUxJRF9JUF9BRERSRVNTIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFwiRVJSX0lOVkFMSURfSVBfQUREUkVTU1wiLCBgSW52YWxpZCBJUCBhZGRyZXNzOiAke3h9YCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSU5WQUxJRF9PUFRfVkFMVUVfRU5DT0RJTkcgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9JTlZBTElEX09QVF9WQUxVRV9FTkNPRElOR1wiLFxuICAgICAgYFRoZSB2YWx1ZSBcIiR7eH1cIiBpcyBpbnZhbGlkIGZvciBvcHRpb24gXCJlbmNvZGluZ1wiYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0lOVkFMSURfUEVSRk9STUFOQ0VfTUFSSyBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSU5WQUxJRF9QRVJGT1JNQU5DRV9NQVJLXCIsXG4gICAgICBgVGhlIFwiJHt4fVwiIHBlcmZvcm1hbmNlIG1hcmsgaGFzIG5vdCBiZWVuIHNldGAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9JTlZBTElEX1BST1RPQ09MIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZywgeTogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9JTlZBTElEX1BST1RPQ09MXCIsXG4gICAgICBgUHJvdG9jb2wgXCIke3h9XCIgbm90IHN1cHBvcnRlZC4gRXhwZWN0ZWQgXCIke3l9XCJgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSU5WQUxJRF9SRVBMX0VWQUxfQ09ORklHIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSU5WQUxJRF9SRVBMX0VWQUxfQ09ORklHXCIsXG4gICAgICBgQ2Fubm90IHNwZWNpZnkgYm90aCBcImJyZWFrRXZhbE9uU2lnaW50XCIgYW5kIFwiZXZhbFwiIGZvciBSRVBMYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0lOVkFMSURfUkVQTF9JTlBVVCBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcIkVSUl9JTlZBTElEX1JFUExfSU5QVVRcIiwgYCR7eH1gKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9JTlZBTElEX1NZTkNfRk9SS19JTlBVVCBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0lOVkFMSURfU1lOQ19GT1JLX0lOUFVUXCIsXG4gICAgICBgQXN5bmNocm9ub3VzIGZvcmtzIGRvIG5vdCBzdXBwb3J0IEJ1ZmZlciwgVHlwZWRBcnJheSwgRGF0YVZpZXcgb3Igc3RyaW5nIGlucHV0OiAke3h9YCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0lOVkFMSURfVEhJUyBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcIkVSUl9JTlZBTElEX1RISVNcIiwgYFZhbHVlIG9mIFwidGhpc1wiIG11c3QgYmUgb2YgdHlwZSAke3h9YCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSU5WQUxJRF9UVVBMRSBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcsIHk6IHN0cmluZykge1xuICAgIHN1cGVyKFwiRVJSX0lOVkFMSURfVFVQTEVcIiwgYCR7eH0gbXVzdCBiZSBhbiBpdGVyYWJsZSAke3l9IHR1cGxlYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSU5WQUxJRF9VUkkgZXh0ZW5kcyBOb2RlVVJJRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcIkVSUl9JTlZBTElEX1VSSVwiLCBgVVJJIG1hbGZvcm1lZGApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0lQQ19DSEFOTkVMX0NMT1NFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX0lQQ19DSEFOTkVMX0NMT1NFRFwiLCBgQ2hhbm5lbCBjbG9zZWRgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9JUENfRElTQ09OTkVDVEVEIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXCJFUlJfSVBDX0RJU0NPTk5FQ1RFRFwiLCBgSVBDIGNoYW5uZWwgaXMgYWxyZWFkeSBkaXNjb25uZWN0ZWRgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9JUENfT05FX1BJUEUgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcIkVSUl9JUENfT05FX1BJUEVcIiwgYENoaWxkIHByb2Nlc3MgY2FuIGhhdmUgb25seSBvbmUgSVBDIHBpcGVgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9JUENfU1lOQ19GT1JLIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXCJFUlJfSVBDX1NZTkNfRk9SS1wiLCBgSVBDIGNhbm5vdCBiZSB1c2VkIHdpdGggc3luY2hyb25vdXMgZm9ya3NgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9NQU5JRkVTVF9ERVBFTkRFTkNZX01JU1NJTkcgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcsIHk6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfTUFOSUZFU1RfREVQRU5ERU5DWV9NSVNTSU5HXCIsXG4gICAgICBgTWFuaWZlc3QgcmVzb3VyY2UgJHt4fSBkb2VzIG5vdCBsaXN0ICR7eX0gYXMgYSBkZXBlbmRlbmN5IHNwZWNpZmllcmAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9NQU5JRkVTVF9JTlRFR1JJVFlfTUlTTUFUQ0ggZXh0ZW5kcyBOb2RlU3ludGF4RXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX01BTklGRVNUX0lOVEVHUklUWV9NSVNNQVRDSFwiLFxuICAgICAgYE1hbmlmZXN0IHJlc291cmNlICR7eH0gaGFzIG11bHRpcGxlIGVudHJpZXMgYnV0IGludGVncml0eSBsaXN0cyBkbyBub3QgbWF0Y2hgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfTUFOSUZFU1RfSU5WQUxJRF9SRVNPVVJDRV9GSUVMRCBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcsIHk6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfTUFOSUZFU1RfSU5WQUxJRF9SRVNPVVJDRV9GSUVMRFwiLFxuICAgICAgYE1hbmlmZXN0IHJlc291cmNlICR7eH0gaGFzIGludmFsaWQgcHJvcGVydHkgdmFsdWUgZm9yICR7eX1gLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfTUFOSUZFU1RfVERaIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXCJFUlJfTUFOSUZFU1RfVERaXCIsIGBNYW5pZmVzdCBpbml0aWFsaXphdGlvbiBoYXMgbm90IHlldCBydW5gKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9NQU5JRkVTVF9VTktOT1dOX09ORVJST1IgZXh0ZW5kcyBOb2RlU3ludGF4RXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX01BTklGRVNUX1VOS05PV05fT05FUlJPUlwiLFxuICAgICAgYE1hbmlmZXN0IHNwZWNpZmllZCB1bmtub3duIGVycm9yIGJlaGF2aW9yIFwiJHt4fVwiLmAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9NRVRIT0RfTk9UX0lNUExFTUVOVEVEIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXCJFUlJfTUVUSE9EX05PVF9JTVBMRU1FTlRFRFwiLCBgVGhlICR7eH0gbWV0aG9kIGlzIG5vdCBpbXBsZW1lbnRlZGApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX01JU1NJTkdfQVJHUyBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3RvciguLi5hcmdzOiAoc3RyaW5nIHwgc3RyaW5nW10pW10pIHtcbiAgICBsZXQgbXNnID0gXCJUaGUgXCI7XG5cbiAgICBjb25zdCBsZW4gPSBhcmdzLmxlbmd0aDtcblxuICAgIGNvbnN0IHdyYXAgPSAoYTogdW5rbm93bikgPT4gYFwiJHthfVwiYDtcblxuICAgIGFyZ3MgPSBhcmdzLm1hcCgoYSkgPT5cbiAgICAgIEFycmF5LmlzQXJyYXkoYSkgPyBhLm1hcCh3cmFwKS5qb2luKFwiIG9yIFwiKSA6IHdyYXAoYSlcbiAgICApO1xuXG4gICAgc3dpdGNoIChsZW4pIHtcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgbXNnICs9IGAke2FyZ3NbMF19IGFyZ3VtZW50YDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIG1zZyArPSBgJHthcmdzWzBdfSBhbmQgJHthcmdzWzFdfSBhcmd1bWVudHNgO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIG1zZyArPSBhcmdzLnNsaWNlKDAsIGxlbiAtIDEpLmpvaW4oXCIsIFwiKTtcbiAgICAgICAgbXNnICs9IGAsIGFuZCAke2FyZ3NbbGVuIC0gMV19IGFyZ3VtZW50c2A7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIHN1cGVyKFwiRVJSX01JU1NJTkdfQVJHU1wiLCBgJHttc2d9IG11c3QgYmUgc3BlY2lmaWVkYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfTUlTU0lOR19PUFRJT04gZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXCJFUlJfTUlTU0lOR19PUFRJT05cIiwgYCR7eH0gaXMgcmVxdWlyZWRgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9NVUxUSVBMRV9DQUxMQkFDSyBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX01VTFRJUExFX0NBTExCQUNLXCIsIGBDYWxsYmFjayBjYWxsZWQgbXVsdGlwbGUgdGltZXNgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9OQVBJX0NPTlNfRlVOQ1RJT04gZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXCJFUlJfTkFQSV9DT05TX0ZVTkNUSU9OXCIsIGBDb25zdHJ1Y3RvciBtdXN0IGJlIGEgZnVuY3Rpb25gKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9OQVBJX0lOVkFMSURfREFUQVZJRVdfQVJHUyBleHRlbmRzIE5vZGVSYW5nZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9OQVBJX0lOVkFMSURfREFUQVZJRVdfQVJHU1wiLFxuICAgICAgYGJ5dGVfb2Zmc2V0ICsgYnl0ZV9sZW5ndGggc2hvdWxkIGJlIGxlc3MgdGhhbiBvciBlcXVhbCB0byB0aGUgc2l6ZSBpbiBieXRlcyBvZiB0aGUgYXJyYXkgcGFzc2VkIGluYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX05BUElfSU5WQUxJRF9UWVBFREFSUkFZX0FMSUdOTUVOVCBleHRlbmRzIE5vZGVSYW5nZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nLCB5OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX05BUElfSU5WQUxJRF9UWVBFREFSUkFZX0FMSUdOTUVOVFwiLFxuICAgICAgYHN0YXJ0IG9mZnNldCBvZiAke3h9IHNob3VsZCBiZSBhIG11bHRpcGxlIG9mICR7eX1gLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfTkFQSV9JTlZBTElEX1RZUEVEQVJSQVlfTEVOR1RIIGV4dGVuZHMgTm9kZVJhbmdlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcIkVSUl9OQVBJX0lOVkFMSURfVFlQRURBUlJBWV9MRU5HVEhcIiwgYEludmFsaWQgdHlwZWQgYXJyYXkgbGVuZ3RoYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfTk9fQ1JZUFRPIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9OT19DUllQVE9cIixcbiAgICAgIGBOb2RlLmpzIGlzIG5vdCBjb21waWxlZCB3aXRoIE9wZW5TU0wgY3J5cHRvIHN1cHBvcnRgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfTk9fSUNVIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfTk9fSUNVXCIsXG4gICAgICBgJHt4fSBpcyBub3Qgc3VwcG9ydGVkIG9uIE5vZGUuanMgY29tcGlsZWQgd2l0aG91dCBJQ1VgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfUVVJQ0NMSUVOVFNFU1NJT05fRkFJTEVEIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9RVUlDQ0xJRU5UU0VTU0lPTl9GQUlMRURcIixcbiAgICAgIGBGYWlsZWQgdG8gY3JlYXRlIGEgbmV3IFF1aWNDbGllbnRTZXNzaW9uOiAke3h9YCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1FVSUNDTElFTlRTRVNTSU9OX0ZBSUxFRF9TRVRTT0NLRVQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1FVSUNDTElFTlRTRVNTSU9OX0ZBSUxFRF9TRVRTT0NLRVRcIixcbiAgICAgIGBGYWlsZWQgdG8gc2V0IHRoZSBRdWljU29ja2V0YCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1FVSUNTRVNTSU9OX0RFU1RST1lFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfUVVJQ1NFU1NJT05fREVTVFJPWUVEXCIsXG4gICAgICBgQ2Fubm90IGNhbGwgJHt4fSBhZnRlciBhIFF1aWNTZXNzaW9uIGhhcyBiZWVuIGRlc3Ryb3llZGAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9RVUlDU0VTU0lPTl9JTlZBTElEX0RDSUQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcIkVSUl9RVUlDU0VTU0lPTl9JTlZBTElEX0RDSURcIiwgYEludmFsaWQgRENJRCB2YWx1ZTogJHt4fWApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1FVSUNTRVNTSU9OX1VQREFURUtFWSBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX1FVSUNTRVNTSU9OX1VQREFURUtFWVwiLCBgVW5hYmxlIHRvIHVwZGF0ZSBRdWljU2Vzc2lvbiBrZXlzYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfUVVJQ1NPQ0tFVF9ERVNUUk9ZRUQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1FVSUNTT0NLRVRfREVTVFJPWUVEXCIsXG4gICAgICBgQ2Fubm90IGNhbGwgJHt4fSBhZnRlciBhIFF1aWNTb2NrZXQgaGFzIGJlZW4gZGVzdHJveWVkYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1FVSUNTT0NLRVRfSU5WQUxJRF9TVEFURUxFU1NfUkVTRVRfU0VDUkVUX0xFTkdUSFxuICBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfUVVJQ1NPQ0tFVF9JTlZBTElEX1NUQVRFTEVTU19SRVNFVF9TRUNSRVRfTEVOR1RIXCIsXG4gICAgICBgVGhlIHN0YXRlUmVzZXRUb2tlbiBtdXN0IGJlIGV4YWN0bHkgMTYtYnl0ZXMgaW4gbGVuZ3RoYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1FVSUNTT0NLRVRfTElTVEVOSU5HIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXCJFUlJfUVVJQ1NPQ0tFVF9MSVNURU5JTkdcIiwgYFRoaXMgUXVpY1NvY2tldCBpcyBhbHJlYWR5IGxpc3RlbmluZ2ApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1FVSUNTT0NLRVRfVU5CT1VORCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfUVVJQ1NPQ0tFVF9VTkJPVU5EXCIsXG4gICAgICBgQ2Fubm90IGNhbGwgJHt4fSBiZWZvcmUgYSBRdWljU29ja2V0IGhhcyBiZWVuIGJvdW5kYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1FVSUNTVFJFQU1fREVTVFJPWUVEIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9RVUlDU1RSRUFNX0RFU1RST1lFRFwiLFxuICAgICAgYENhbm5vdCBjYWxsICR7eH0gYWZ0ZXIgYSBRdWljU3RyZWFtIGhhcyBiZWVuIGRlc3Ryb3llZGAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9RVUlDU1RSRUFNX0lOVkFMSURfUFVTSCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfUVVJQ1NUUkVBTV9JTlZBTElEX1BVU0hcIixcbiAgICAgIGBQdXNoIHN0cmVhbXMgYXJlIG9ubHkgc3VwcG9ydGVkIG9uIGNsaWVudC1pbml0aWF0ZWQsIGJpZGlyZWN0aW9uYWwgc3RyZWFtc2AsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9RVUlDU1RSRUFNX09QRU5fRkFJTEVEIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXCJFUlJfUVVJQ1NUUkVBTV9PUEVOX0ZBSUxFRFwiLCBgT3BlbmluZyBhIG5ldyBRdWljU3RyZWFtIGZhaWxlZGApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1FVSUNTVFJFQU1fVU5TVVBQT1JURURfUFVTSCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfUVVJQ1NUUkVBTV9VTlNVUFBPUlRFRF9QVVNIXCIsXG4gICAgICBgUHVzaCBzdHJlYW1zIGFyZSBub3Qgc3VwcG9ydGVkIG9uIHRoaXMgUXVpY1Nlc3Npb25gLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfUVVJQ19UTFMxM19SRVFVSVJFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX1FVSUNfVExTMTNfUkVRVUlSRURcIiwgYFFVSUMgcmVxdWlyZXMgVExTIHZlcnNpb24gMS4zYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfU0NSSVBUX0VYRUNVVElPTl9JTlRFUlJVUFRFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfU0NSSVBUX0VYRUNVVElPTl9JTlRFUlJVUFRFRFwiLFxuICAgICAgXCJTY3JpcHQgZXhlY3V0aW9uIHdhcyBpbnRlcnJ1cHRlZCBieSBgU0lHSU5UYFwiLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfU0VSVkVSX0FMUkVBRFlfTElTVEVOIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9TRVJWRVJfQUxSRUFEWV9MSVNURU5cIixcbiAgICAgIGBMaXN0ZW4gbWV0aG9kIGhhcyBiZWVuIGNhbGxlZCBtb3JlIHRoYW4gb25jZSB3aXRob3V0IGNsb3NpbmcuYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1NFUlZFUl9OT1RfUlVOTklORyBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX1NFUlZFUl9OT1RfUlVOTklOR1wiLCBgU2VydmVyIGlzIG5vdCBydW5uaW5nLmApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1NPQ0tFVF9BTFJFQURZX0JPVU5EIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXCJFUlJfU09DS0VUX0FMUkVBRFlfQk9VTkRcIiwgYFNvY2tldCBpcyBhbHJlYWR5IGJvdW5kYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfU09DS0VUX0JBRF9CVUZGRVJfU0laRSBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1NPQ0tFVF9CQURfQlVGRkVSX1NJWkVcIixcbiAgICAgIGBCdWZmZXIgc2l6ZSBtdXN0IGJlIGEgcG9zaXRpdmUgaW50ZWdlcmAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9TT0NLRVRfQkFEX1BPUlQgZXh0ZW5kcyBOb2RlUmFuZ2VFcnJvciB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgcG9ydDogdW5rbm93biwgYWxsb3daZXJvID0gdHJ1ZSkge1xuICAgIGFzc2VydChcbiAgICAgIHR5cGVvZiBhbGxvd1plcm8gPT09IFwiYm9vbGVhblwiLFxuICAgICAgXCJUaGUgJ2FsbG93WmVybycgYXJndW1lbnQgbXVzdCBiZSBvZiB0eXBlIGJvb2xlYW4uXCIsXG4gICAgKTtcblxuICAgIGNvbnN0IG9wZXJhdG9yID0gYWxsb3daZXJvID8gXCI+PVwiIDogXCI+XCI7XG5cbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1NPQ0tFVF9CQURfUE9SVFwiLFxuICAgICAgYCR7bmFtZX0gc2hvdWxkIGJlICR7b3BlcmF0b3J9IDAgYW5kIDwgNjU1MzYuIFJlY2VpdmVkICR7cG9ydH0uYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1NPQ0tFVF9CQURfVFlQRSBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1NPQ0tFVF9CQURfVFlQRVwiLFxuICAgICAgYEJhZCBzb2NrZXQgdHlwZSBzcGVjaWZpZWQuIFZhbGlkIHR5cGVzIGFyZTogdWRwNCwgdWRwNmAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9TT0NLRVRfQlVGRkVSX1NJWkUgZXh0ZW5kcyBOb2RlU3lzdGVtRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihjdHg6IE5vZGVTeXN0ZW1FcnJvckN0eCkge1xuICAgIHN1cGVyKFwiRVJSX1NPQ0tFVF9CVUZGRVJfU0laRVwiLCBjdHgsIFwiQ291bGQgbm90IGdldCBvciBzZXQgYnVmZmVyIHNpemVcIik7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfU09DS0VUX0NMT1NFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX1NPQ0tFVF9DTE9TRURcIiwgYFNvY2tldCBpcyBjbG9zZWRgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9TT0NLRVRfREdSQU1fSVNfQ09OTkVDVEVEIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXCJFUlJfU09DS0VUX0RHUkFNX0lTX0NPTk5FQ1RFRFwiLCBgQWxyZWFkeSBjb25uZWN0ZWRgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9TT0NLRVRfREdSQU1fTk9UX0NPTk5FQ1RFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX1NPQ0tFVF9ER1JBTV9OT1RfQ09OTkVDVEVEXCIsIGBOb3QgY29ubmVjdGVkYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfU09DS0VUX0RHUkFNX05PVF9SVU5OSU5HIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXCJFUlJfU09DS0VUX0RHUkFNX05PVF9SVU5OSU5HXCIsIGBOb3QgcnVubmluZ2ApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1NSSV9QQVJTRSBleHRlbmRzIE5vZGVTeW50YXhFcnJvciB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgY2hhcjogc3RyaW5nLCBwb3NpdGlvbjogbnVtYmVyKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9TUklfUEFSU0VcIixcbiAgICAgIGBTdWJyZXNvdXJjZSBJbnRlZ3JpdHkgc3RyaW5nICR7bmFtZX0gaGFkIGFuIHVuZXhwZWN0ZWQgJHtjaGFyfSBhdCBwb3NpdGlvbiAke3Bvc2l0aW9ufWAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9TVFJFQU1fQUxSRUFEWV9GSU5JU0hFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfU1RSRUFNX0FMUkVBRFlfRklOSVNIRURcIixcbiAgICAgIGBDYW5ub3QgY2FsbCAke3h9IGFmdGVyIGEgc3RyZWFtIHdhcyBmaW5pc2hlZGAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9TVFJFQU1fQ0FOTk9UX1BJUEUgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcIkVSUl9TVFJFQU1fQ0FOTk9UX1BJUEVcIiwgYENhbm5vdCBwaXBlLCBub3QgcmVhZGFibGVgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9TVFJFQU1fREVTVFJPWUVEIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9TVFJFQU1fREVTVFJPWUVEXCIsXG4gICAgICBgQ2Fubm90IGNhbGwgJHt4fSBhZnRlciBhIHN0cmVhbSB3YXMgZGVzdHJveWVkYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1NUUkVBTV9OVUxMX1ZBTFVFUyBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcIkVSUl9TVFJFQU1fTlVMTF9WQUxVRVNcIiwgYE1heSBub3Qgd3JpdGUgbnVsbCB2YWx1ZXMgdG8gc3RyZWFtYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfU1RSRUFNX1BSRU1BVFVSRV9DTE9TRSBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX1NUUkVBTV9QUkVNQVRVUkVfQ0xPU0VcIiwgYFByZW1hdHVyZSBjbG9zZWApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1NUUkVBTV9QVVNIX0FGVEVSX0VPRiBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX1NUUkVBTV9QVVNIX0FGVEVSX0VPRlwiLCBgc3RyZWFtLnB1c2goKSBhZnRlciBFT0ZgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9TVFJFQU1fVU5TSElGVF9BRlRFUl9FTkRfRVZFTlQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1NUUkVBTV9VTlNISUZUX0FGVEVSX0VORF9FVkVOVFwiLFxuICAgICAgYHN0cmVhbS51bnNoaWZ0KCkgYWZ0ZXIgZW5kIGV2ZW50YCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1NUUkVBTV9XUkFQIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9TVFJFQU1fV1JBUFwiLFxuICAgICAgYFN0cmVhbSBoYXMgU3RyaW5nRGVjb2RlciBzZXQgb3IgaXMgaW4gb2JqZWN0TW9kZWAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9TVFJFQU1fV1JJVEVfQUZURVJfRU5EIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXCJFUlJfU1RSRUFNX1dSSVRFX0FGVEVSX0VORFwiLCBgd3JpdGUgYWZ0ZXIgZW5kYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfU1lOVEhFVElDIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXCJFUlJfU1lOVEhFVElDXCIsIGBKYXZhU2NyaXB0IENhbGxzdGFja2ApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1RMU19DRVJUX0FMVE5BTUVfSU5WQUxJRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIHJlYXNvbjogc3RyaW5nO1xuICBob3N0OiBzdHJpbmc7XG4gIGNlcnQ6IHN0cmluZztcblxuICBjb25zdHJ1Y3RvcihyZWFzb246IHN0cmluZywgaG9zdDogc3RyaW5nLCBjZXJ0OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1RMU19DRVJUX0FMVE5BTUVfSU5WQUxJRFwiLFxuICAgICAgYEhvc3RuYW1lL0lQIGRvZXMgbm90IG1hdGNoIGNlcnRpZmljYXRlJ3MgYWx0bmFtZXM6ICR7cmVhc29ufWAsXG4gICAgKTtcbiAgICB0aGlzLnJlYXNvbiA9IHJlYXNvbjtcbiAgICB0aGlzLmhvc3QgPSBob3N0O1xuICAgIHRoaXMuY2VydCA9IGNlcnQ7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfVExTX0RIX1BBUkFNX1NJWkUgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcIkVSUl9UTFNfREhfUEFSQU1fU0laRVwiLCBgREggcGFyYW1ldGVyIHNpemUgJHt4fSBpcyBsZXNzIHRoYW4gMjA0OGApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1RMU19IQU5EU0hBS0VfVElNRU9VVCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX1RMU19IQU5EU0hBS0VfVElNRU9VVFwiLCBgVExTIGhhbmRzaGFrZSB0aW1lb3V0YCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfVExTX0lOVkFMSURfQ09OVEVYVCBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcIkVSUl9UTFNfSU5WQUxJRF9DT05URVhUXCIsIGAke3h9IG11c3QgYmUgYSBTZWN1cmVDb250ZXh0YCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfVExTX0lOVkFMSURfU1RBVEUgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1RMU19JTlZBTElEX1NUQVRFXCIsXG4gICAgICBgVExTIHNvY2tldCBjb25uZWN0aW9uIG11c3QgYmUgc2VjdXJlbHkgZXN0YWJsaXNoZWRgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfVExTX0lOVkFMSURfUFJPVE9DT0xfVkVSU0lPTiBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcihwcm90b2NvbDogc3RyaW5nLCB4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1RMU19JTlZBTElEX1BST1RPQ09MX1ZFUlNJT05cIixcbiAgICAgIGAke3Byb3RvY29sfSBpcyBub3QgYSB2YWxpZCAke3h9IFRMUyBwcm90b2NvbCB2ZXJzaW9uYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1RMU19QUk9UT0NPTF9WRVJTSU9OX0NPTkZMSUNUIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHByZXZQcm90b2NvbDogc3RyaW5nLCBwcm90b2NvbDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9UTFNfUFJPVE9DT0xfVkVSU0lPTl9DT05GTElDVFwiLFxuICAgICAgYFRMUyBwcm90b2NvbCB2ZXJzaW9uICR7cHJldlByb3RvY29sfSBjb25mbGljdHMgd2l0aCBzZWN1cmVQcm90b2NvbCAke3Byb3RvY29sfWAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9UTFNfUkVORUdPVElBVElPTl9ESVNBQkxFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfVExTX1JFTkVHT1RJQVRJT05fRElTQUJMRURcIixcbiAgICAgIGBUTFMgc2Vzc2lvbiByZW5lZ290aWF0aW9uIGRpc2FibGVkIGZvciB0aGlzIHNvY2tldGAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9UTFNfUkVRVUlSRURfU0VSVkVSX05BTUUgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1RMU19SRVFVSVJFRF9TRVJWRVJfTkFNRVwiLFxuICAgICAgYFwic2VydmVybmFtZVwiIGlzIHJlcXVpcmVkIHBhcmFtZXRlciBmb3IgU2VydmVyLmFkZENvbnRleHRgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfVExTX1NFU1NJT05fQVRUQUNLIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9UTFNfU0VTU0lPTl9BVFRBQ0tcIixcbiAgICAgIGBUTFMgc2Vzc2lvbiByZW5lZ290aWF0aW9uIGF0dGFjayBkZXRlY3RlZGAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9UTFNfU05JX0ZST01fU0VSVkVSIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9UTFNfU05JX0ZST01fU0VSVkVSXCIsXG4gICAgICBgQ2Fubm90IGlzc3VlIFNOSSBmcm9tIGEgVExTIHNlcnZlci1zaWRlIHNvY2tldGAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9UUkFDRV9FVkVOVFNfQ0FURUdPUllfUkVRVUlSRUQgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9UUkFDRV9FVkVOVFNfQ0FURUdPUllfUkVRVUlSRURcIixcbiAgICAgIGBBdCBsZWFzdCBvbmUgY2F0ZWdvcnkgaXMgcmVxdWlyZWRgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfVFJBQ0VfRVZFTlRTX1VOQVZBSUxBQkxFIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXCJFUlJfVFJBQ0VfRVZFTlRTX1VOQVZBSUxBQkxFXCIsIGBUcmFjZSBldmVudHMgYXJlIHVuYXZhaWxhYmxlYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfVU5BVkFJTEFCTEVfRFVSSU5HX0VYSVQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1VOQVZBSUxBQkxFX0RVUklOR19FWElUXCIsXG4gICAgICBgQ2Fubm90IGNhbGwgZnVuY3Rpb24gaW4gcHJvY2VzcyBleGl0IGhhbmRsZXJgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfVU5DQVVHSFRfRVhDRVBUSU9OX0NBUFRVUkVfQUxSRUFEWV9TRVQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1VOQ0FVR0hUX0VYQ0VQVElPTl9DQVBUVVJFX0FMUkVBRFlfU0VUXCIsXG4gICAgICBcImBwcm9jZXNzLnNldHVwVW5jYXVnaHRFeGNlcHRpb25DYXB0dXJlKClgIHdhcyBjYWxsZWQgd2hpbGUgYSBjYXB0dXJlIGNhbGxiYWNrIHdhcyBhbHJlYWR5IGFjdGl2ZVwiLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfVU5FU0NBUEVEX0NIQVJBQ1RFUlMgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXCJFUlJfVU5FU0NBUEVEX0NIQVJBQ1RFUlNcIiwgYCR7eH0gY29udGFpbnMgdW5lc2NhcGVkIGNoYXJhY3RlcnNgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9VTkhBTkRMRURfRVJST1IgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcIkVSUl9VTkhBTkRMRURfRVJST1JcIiwgYFVuaGFuZGxlZCBlcnJvci4gKCR7eH0pYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfVU5LTk9XTl9CVUlMVElOX01PRFVMRSBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFwiRVJSX1VOS05PV05fQlVJTFRJTl9NT0RVTEVcIiwgYE5vIHN1Y2ggYnVpbHQtaW4gbW9kdWxlOiAke3h9YCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfVU5LTk9XTl9DUkVERU5USUFMIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nLCB5OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcIkVSUl9VTktOT1dOX0NSRURFTlRJQUxcIiwgYCR7eH0gaWRlbnRpZmllciBkb2VzIG5vdCBleGlzdDogJHt5fWApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1VOS05PV05fRU5DT0RJTkcgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXCJFUlJfVU5LTk9XTl9FTkNPRElOR1wiLCBgVW5rbm93biBlbmNvZGluZzogJHt4fWApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1VOS05PV05fRklMRV9FWFRFTlNJT04gZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nLCB5OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1VOS05PV05fRklMRV9FWFRFTlNJT05cIixcbiAgICAgIGBVbmtub3duIGZpbGUgZXh0ZW5zaW9uIFwiJHt4fVwiIGZvciAke3l9YCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1VOS05PV05fTU9EVUxFX0ZPUk1BVCBleHRlbmRzIE5vZGVSYW5nZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXCJFUlJfVU5LTk9XTl9NT0RVTEVfRk9STUFUXCIsIGBVbmtub3duIG1vZHVsZSBmb3JtYXQ6ICR7eH1gKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9VTktOT1dOX1NJR05BTCBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcIkVSUl9VTktOT1dOX1NJR05BTFwiLCBgVW5rbm93biBzaWduYWw6ICR7eH1gKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9VTlNVUFBPUlRFRF9ESVJfSU1QT1JUIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nLCB5OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1VOU1VQUE9SVEVEX0RJUl9JTVBPUlRcIixcbiAgICAgIGBEaXJlY3RvcnkgaW1wb3J0ICcke3h9JyBpcyBub3Qgc3VwcG9ydGVkIHJlc29sdmluZyBFUyBtb2R1bGVzLCBpbXBvcnRlZCBmcm9tICR7eX1gLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfVU5TVVBQT1JURURfRVNNX1VSTF9TQ0hFTUUgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1VOU1VQUE9SVEVEX0VTTV9VUkxfU0NIRU1FXCIsXG4gICAgICBgT25seSBmaWxlIGFuZCBkYXRhIFVSTHMgYXJlIHN1cHBvcnRlZCBieSB0aGUgZGVmYXVsdCBFU00gbG9hZGVyYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1Y4QlJFQUtJVEVSQVRPUiBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfVjhCUkVBS0lURVJBVE9SXCIsXG4gICAgICBgRnVsbCBJQ1UgZGF0YSBub3QgaW5zdGFsbGVkLiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL25vZGVqcy9ub2RlL3dpa2kvSW50bGAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9WQUxJRF9QRVJGT1JNQU5DRV9FTlRSWV9UWVBFIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9WQUxJRF9QRVJGT1JNQU5DRV9FTlRSWV9UWVBFXCIsXG4gICAgICBgQXQgbGVhc3Qgb25lIHZhbGlkIHBlcmZvcm1hbmNlIGVudHJ5IHR5cGUgaXMgcmVxdWlyZWRgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfVk1fRFlOQU1JQ19JTVBPUlRfQ0FMTEJBQ0tfTUlTU0lORyBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1ZNX0RZTkFNSUNfSU1QT1JUX0NBTExCQUNLX01JU1NJTkdcIixcbiAgICAgIGBBIGR5bmFtaWMgaW1wb3J0IGNhbGxiYWNrIHdhcyBub3Qgc3BlY2lmaWVkLmAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9WTV9NT0RVTEVfQUxSRUFEWV9MSU5LRUQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcIkVSUl9WTV9NT0RVTEVfQUxSRUFEWV9MSU5LRURcIiwgYE1vZHVsZSBoYXMgYWxyZWFkeSBiZWVuIGxpbmtlZGApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1ZNX01PRFVMRV9DQU5OT1RfQ1JFQVRFX0NBQ0hFRF9EQVRBIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9WTV9NT0RVTEVfQ0FOTk9UX0NSRUFURV9DQUNIRURfREFUQVwiLFxuICAgICAgYENhY2hlZCBkYXRhIGNhbm5vdCBiZSBjcmVhdGVkIGZvciBhIG1vZHVsZSB3aGljaCBoYXMgYmVlbiBldmFsdWF0ZWRgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfVk1fTU9EVUxFX0RJRkZFUkVOVF9DT05URVhUIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9WTV9NT0RVTEVfRElGRkVSRU5UX0NPTlRFWFRcIixcbiAgICAgIGBMaW5rZWQgbW9kdWxlcyBtdXN0IHVzZSB0aGUgc2FtZSBjb250ZXh0YCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1ZNX01PRFVMRV9MSU5LSU5HX0VSUk9SRUQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1ZNX01PRFVMRV9MSU5LSU5HX0VSUk9SRURcIixcbiAgICAgIGBMaW5raW5nIGhhcyBhbHJlYWR5IGZhaWxlZCBmb3IgdGhlIHByb3ZpZGVkIG1vZHVsZWAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9WTV9NT0RVTEVfTk9UX01PRFVMRSBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfVk1fTU9EVUxFX05PVF9NT0RVTEVcIixcbiAgICAgIGBQcm92aWRlZCBtb2R1bGUgaXMgbm90IGFuIGluc3RhbmNlIG9mIE1vZHVsZWAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9WTV9NT0RVTEVfU1RBVFVTIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXCJFUlJfVk1fTU9EVUxFX1NUQVRVU1wiLCBgTW9kdWxlIHN0YXR1cyAke3h9YCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfV0FTSV9BTFJFQURZX1NUQVJURUQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcIkVSUl9XQVNJX0FMUkVBRFlfU1RBUlRFRFwiLCBgV0FTSSBpbnN0YW5jZSBoYXMgYWxyZWFkeSBzdGFydGVkYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfV09SS0VSX0lOSVRfRkFJTEVEIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXCJFUlJfV09SS0VSX0lOSVRfRkFJTEVEXCIsIGBXb3JrZXIgaW5pdGlhbGl6YXRpb24gZmFpbHVyZTogJHt4fWApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1dPUktFUl9OT1RfUlVOTklORyBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX1dPUktFUl9OT1RfUlVOTklOR1wiLCBgV29ya2VyIGluc3RhbmNlIG5vdCBydW5uaW5nYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfV09SS0VSX09VVF9PRl9NRU1PUlkgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1dPUktFUl9PVVRfT0ZfTUVNT1JZXCIsXG4gICAgICBgV29ya2VyIHRlcm1pbmF0ZWQgZHVlIHRvIHJlYWNoaW5nIG1lbW9yeSBsaW1pdDogJHt4fWAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9XT1JLRVJfVU5TRVJJQUxJWkFCTEVfRVJST1IgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1dPUktFUl9VTlNFUklBTElaQUJMRV9FUlJPUlwiLFxuICAgICAgYFNlcmlhbGl6aW5nIGFuIHVuY2F1Z2h0IGV4Y2VwdGlvbiBmYWlsZWRgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfV09SS0VSX1VOU1VQUE9SVEVEX0VYVEVOU0lPTiBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1dPUktFUl9VTlNVUFBPUlRFRF9FWFRFTlNJT05cIixcbiAgICAgIGBUaGUgd29ya2VyIHNjcmlwdCBleHRlbnNpb24gbXVzdCBiZSBcIi5qc1wiLCBcIi5tanNcIiwgb3IgXCIuY2pzXCIuIFJlY2VpdmVkIFwiJHt4fVwiYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1dPUktFUl9VTlNVUFBPUlRFRF9PUEVSQVRJT04gZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9XT1JLRVJfVU5TVVBQT1JURURfT1BFUkFUSU9OXCIsXG4gICAgICBgJHt4fSBpcyBub3Qgc3VwcG9ydGVkIGluIHdvcmtlcnNgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfWkxJQl9JTklUSUFMSVpBVElPTl9GQUlMRUQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcIkVSUl9aTElCX0lOSVRJQUxJWkFUSU9OX0ZBSUxFRFwiLCBgSW5pdGlhbGl6YXRpb24gZmFpbGVkYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfRkFMU1lfVkFMVUVfUkVKRUNUSU9OIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgcmVhc29uOiBzdHJpbmc7XG4gIGNvbnN0cnVjdG9yKHJlYXNvbjogc3RyaW5nKSB7XG4gICAgc3VwZXIoXCJFUlJfRkFMU1lfVkFMVUVfUkVKRUNUSU9OXCIsIFwiUHJvbWlzZSB3YXMgcmVqZWN0ZWQgd2l0aCBmYWxzeSB2YWx1ZVwiKTtcbiAgICB0aGlzLnJlYXNvbiA9IHJlYXNvbjtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9IVFRQMl9JTlZBTElEX1NFVFRJTkdfVkFMVUUgZXh0ZW5kcyBOb2RlUmFuZ2VFcnJvciB7XG4gIGFjdHVhbDogdW5rbm93bjtcbiAgbWluPzogbnVtYmVyO1xuICBtYXg/OiBudW1iZXI7XG5cbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhY3R1YWw6IHVua25vd24sIG1pbj86IG51bWJlciwgbWF4PzogbnVtYmVyKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9IVFRQMl9JTlZBTElEX1NFVFRJTkdfVkFMVUVcIixcbiAgICAgIGBJbnZhbGlkIHZhbHVlIGZvciBzZXR0aW5nIFwiJHtuYW1lfVwiOiAke2FjdHVhbH1gLFxuICAgICk7XG4gICAgdGhpcy5hY3R1YWwgPSBhY3R1YWw7XG4gICAgaWYgKG1pbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLm1pbiA9IG1pbjtcbiAgICAgIHRoaXMubWF4ID0gbWF4O1xuICAgIH1cbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9IVFRQMl9TVFJFQU1fQ0FOQ0VMIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgb3ZlcnJpZGUgY2F1c2U/OiBFcnJvcjtcbiAgY29uc3RydWN0b3IoZXJyb3I6IEVycm9yKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9IVFRQMl9TVFJFQU1fQ0FOQ0VMXCIsXG4gICAgICB0eXBlb2YgZXJyb3IubWVzc2FnZSA9PT0gXCJzdHJpbmdcIlxuICAgICAgICA/IGBUaGUgcGVuZGluZyBzdHJlYW0gaGFzIGJlZW4gY2FuY2VsZWQgKGNhdXNlZCBieTogJHtlcnJvci5tZXNzYWdlfSlgXG4gICAgICAgIDogXCJUaGUgcGVuZGluZyBzdHJlYW0gaGFzIGJlZW4gY2FuY2VsZWRcIixcbiAgICApO1xuICAgIGlmIChlcnJvcikge1xuICAgICAgdGhpcy5jYXVzZSA9IGVycm9yO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0lOVkFMSURfQUREUkVTU19GQU1JTFkgZXh0ZW5kcyBOb2RlUmFuZ2VFcnJvciB7XG4gIGhvc3Q6IHN0cmluZztcbiAgcG9ydDogbnVtYmVyO1xuICBjb25zdHJ1Y3RvcihhZGRyZXNzVHlwZTogc3RyaW5nLCBob3N0OiBzdHJpbmcsIHBvcnQ6IG51bWJlcikge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSU5WQUxJRF9BRERSRVNTX0ZBTUlMWVwiLFxuICAgICAgYEludmFsaWQgYWRkcmVzcyBmYW1pbHk6ICR7YWRkcmVzc1R5cGV9ICR7aG9zdH06JHtwb3J0fWAsXG4gICAgKTtcbiAgICB0aGlzLmhvc3QgPSBob3N0O1xuICAgIHRoaXMucG9ydCA9IHBvcnQ7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9JTlZBTElEX0NIQVIgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBmaWVsZD86IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSU5WQUxJRF9DSEFSXCIsXG4gICAgICBmaWVsZFxuICAgICAgICA/IGBJbnZhbGlkIGNoYXJhY3RlciBpbiAke25hbWV9YFxuICAgICAgICA6IGBJbnZhbGlkIGNoYXJhY3RlciBpbiAke25hbWV9IFtcIiR7ZmllbGR9XCJdYCxcbiAgICApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfSU5WQUxJRF9PUFRfVkFMVUUgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCB2YWx1ZTogdW5rbm93bikge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSU5WQUxJRF9PUFRfVkFMVUVcIixcbiAgICAgIGBUaGUgdmFsdWUgXCIke3ZhbHVlfVwiIGlzIGludmFsaWQgZm9yIG9wdGlvbiBcIiR7bmFtZX1cImAsXG4gICAgKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0lOVkFMSURfUkVUVVJOX1BST1BFUlRZIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKGlucHV0OiBzdHJpbmcsIG5hbWU6IHN0cmluZywgcHJvcDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9JTlZBTElEX1JFVFVSTl9QUk9QRVJUWVwiLFxuICAgICAgYEV4cGVjdGVkIGEgdmFsaWQgJHtpbnB1dH0gdG8gYmUgcmV0dXJuZWQgZm9yIHRoZSBcIiR7cHJvcH1cIiBmcm9tIHRoZSBcIiR7bmFtZX1cIiBmdW5jdGlvbiBidXQgZ290ICR7dmFsdWV9LmAsXG4gICAgKTtcbiAgfVxufVxuXG4vLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuZnVuY3Rpb24gYnVpbGRSZXR1cm5Qcm9wZXJ0eVR5cGUodmFsdWU6IGFueSkge1xuICBpZiAodmFsdWUgJiYgdmFsdWUuY29uc3RydWN0b3IgJiYgdmFsdWUuY29uc3RydWN0b3IubmFtZSkge1xuICAgIHJldHVybiBgaW5zdGFuY2Ugb2YgJHt2YWx1ZS5jb25zdHJ1Y3Rvci5uYW1lfWA7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGB0eXBlICR7dHlwZW9mIHZhbHVlfWA7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9JTlZBTElEX1JFVFVSTl9QUk9QRVJUWV9WQUxVRSBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihpbnB1dDogc3RyaW5nLCBuYW1lOiBzdHJpbmcsIHByb3A6IHN0cmluZywgdmFsdWU6IHVua25vd24pIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0lOVkFMSURfUkVUVVJOX1BST1BFUlRZX1ZBTFVFXCIsXG4gICAgICBgRXhwZWN0ZWQgJHtpbnB1dH0gdG8gYmUgcmV0dXJuZWQgZm9yIHRoZSBcIiR7cHJvcH1cIiBmcm9tIHRoZSBcIiR7bmFtZX1cIiBmdW5jdGlvbiBidXQgZ290ICR7XG4gICAgICAgIGJ1aWxkUmV0dXJuUHJvcGVydHlUeXBlKFxuICAgICAgICAgIHZhbHVlLFxuICAgICAgICApXG4gICAgICB9LmAsXG4gICAgKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0lOVkFMSURfUkVUVVJOX1ZBTFVFIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKGlucHV0OiBzdHJpbmcsIG5hbWU6IHN0cmluZywgdmFsdWU6IHVua25vd24pIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0lOVkFMSURfUkVUVVJOX1ZBTFVFXCIsXG4gICAgICBgRXhwZWN0ZWQgJHtpbnB1dH0gdG8gYmUgcmV0dXJuZWQgZnJvbSB0aGUgXCIke25hbWV9XCIgZnVuY3Rpb24gYnV0IGdvdCAke1xuICAgICAgICBkZXRlcm1pbmVTcGVjaWZpY1R5cGUoXG4gICAgICAgICAgdmFsdWUsXG4gICAgICAgIClcbiAgICAgIH0uYCxcbiAgICApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfSU5WQUxJRF9VUkwgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgaW5wdXQ6IHN0cmluZztcbiAgY29uc3RydWN0b3IoaW5wdXQ6IHN0cmluZykge1xuICAgIHN1cGVyKFwiRVJSX0lOVkFMSURfVVJMXCIsIGBJbnZhbGlkIFVSTDogJHtpbnB1dH1gKTtcbiAgICB0aGlzLmlucHV0ID0gaW5wdXQ7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9JTlZBTElEX1VSTF9TQ0hFTUUgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoZXhwZWN0ZWQ6IHN0cmluZyB8IFtzdHJpbmddIHwgW3N0cmluZywgc3RyaW5nXSkge1xuICAgIGV4cGVjdGVkID0gQXJyYXkuaXNBcnJheShleHBlY3RlZCkgPyBleHBlY3RlZCA6IFtleHBlY3RlZF07XG4gICAgY29uc3QgcmVzID0gZXhwZWN0ZWQubGVuZ3RoID09PSAyXG4gICAgICA/IGBvbmUgb2Ygc2NoZW1lICR7ZXhwZWN0ZWRbMF19IG9yICR7ZXhwZWN0ZWRbMV19YFxuICAgICAgOiBgb2Ygc2NoZW1lICR7ZXhwZWN0ZWRbMF19YDtcbiAgICBzdXBlcihcIkVSUl9JTlZBTElEX1VSTF9TQ0hFTUVcIiwgYFRoZSBVUkwgbXVzdCBiZSAke3Jlc31gKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX01PRFVMRV9OT1RfRk9VTkQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihwYXRoOiBzdHJpbmcsIGJhc2U6IHN0cmluZywgdHlwZTogc3RyaW5nID0gXCJwYWNrYWdlXCIpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX01PRFVMRV9OT1RfRk9VTkRcIixcbiAgICAgIGBDYW5ub3QgZmluZCAke3R5cGV9ICcke3BhdGh9JyBpbXBvcnRlZCBmcm9tICR7YmFzZX1gLFxuICAgICk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9JTlZBTElEX1BBQ0tBR0VfQ09ORklHIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IocGF0aDogc3RyaW5nLCBiYXNlPzogc3RyaW5nLCBtZXNzYWdlPzogc3RyaW5nKSB7XG4gICAgY29uc3QgbXNnID0gYEludmFsaWQgcGFja2FnZSBjb25maWcgJHtwYXRofSR7XG4gICAgICBiYXNlID8gYCB3aGlsZSBpbXBvcnRpbmcgJHtiYXNlfWAgOiBcIlwiXG4gICAgfSR7bWVzc2FnZSA/IGAuICR7bWVzc2FnZX1gIDogXCJcIn1gO1xuICAgIHN1cGVyKFwiRVJSX0lOVkFMSURfUEFDS0FHRV9DT05GSUdcIiwgbXNnKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0lOVkFMSURfTU9EVUxFX1NQRUNJRklFUiBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihyZXF1ZXN0OiBzdHJpbmcsIHJlYXNvbjogc3RyaW5nLCBiYXNlPzogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9JTlZBTElEX01PRFVMRV9TUEVDSUZJRVJcIixcbiAgICAgIGBJbnZhbGlkIG1vZHVsZSBcIiR7cmVxdWVzdH1cIiAke3JlYXNvbn0ke1xuICAgICAgICBiYXNlID8gYCBpbXBvcnRlZCBmcm9tICR7YmFzZX1gIDogXCJcIlxuICAgICAgfWAsXG4gICAgKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0lOVkFMSURfUEFDS0FHRV9UQVJHRVQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihcbiAgICBwa2dQYXRoOiBzdHJpbmcsXG4gICAga2V5OiBzdHJpbmcsXG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICB0YXJnZXQ6IGFueSxcbiAgICBpc0ltcG9ydD86IGJvb2xlYW4sXG4gICAgYmFzZT86IHN0cmluZyxcbiAgKSB7XG4gICAgbGV0IG1zZzogc3RyaW5nO1xuICAgIGNvbnN0IHJlbEVycm9yID0gdHlwZW9mIHRhcmdldCA9PT0gXCJzdHJpbmdcIiAmJlxuICAgICAgIWlzSW1wb3J0ICYmXG4gICAgICB0YXJnZXQubGVuZ3RoICYmXG4gICAgICAhdGFyZ2V0LnN0YXJ0c1dpdGgoXCIuL1wiKTtcbiAgICBpZiAoa2V5ID09PSBcIi5cIikge1xuICAgICAgYXNzZXJ0KGlzSW1wb3J0ID09PSBmYWxzZSk7XG4gICAgICBtc2cgPSBgSW52YWxpZCBcImV4cG9ydHNcIiBtYWluIHRhcmdldCAke0pTT04uc3RyaW5naWZ5KHRhcmdldCl9IGRlZmluZWQgYCArXG4gICAgICAgIGBpbiB0aGUgcGFja2FnZSBjb25maWcgJHtwa2dQYXRofXBhY2thZ2UuanNvbiR7XG4gICAgICAgICAgYmFzZSA/IGAgaW1wb3J0ZWQgZnJvbSAke2Jhc2V9YCA6IFwiXCJcbiAgICAgICAgfSR7cmVsRXJyb3IgPyAnOyB0YXJnZXRzIG11c3Qgc3RhcnQgd2l0aCBcIi4vXCInIDogXCJcIn1gO1xuICAgIH0gZWxzZSB7XG4gICAgICBtc2cgPSBgSW52YWxpZCBcIiR7aXNJbXBvcnQgPyBcImltcG9ydHNcIiA6IFwiZXhwb3J0c1wifVwiIHRhcmdldCAke1xuICAgICAgICBKU09OLnN0cmluZ2lmeShcbiAgICAgICAgICB0YXJnZXQsXG4gICAgICAgIClcbiAgICAgIH0gZGVmaW5lZCBmb3IgJyR7a2V5fScgaW4gdGhlIHBhY2thZ2UgY29uZmlnICR7cGtnUGF0aH1wYWNrYWdlLmpzb24ke1xuICAgICAgICBiYXNlID8gYCBpbXBvcnRlZCBmcm9tICR7YmFzZX1gIDogXCJcIlxuICAgICAgfSR7cmVsRXJyb3IgPyAnOyB0YXJnZXRzIG11c3Qgc3RhcnQgd2l0aCBcIi4vXCInIDogXCJcIn1gO1xuICAgIH1cbiAgICBzdXBlcihcIkVSUl9JTlZBTElEX1BBQ0tBR0VfVEFSR0VUXCIsIG1zZyk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9QQUNLQUdFX0lNUE9SVF9OT1RfREVGSU5FRCBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihcbiAgICBzcGVjaWZpZXI6IHN0cmluZyxcbiAgICBwYWNrYWdlUGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkLFxuICAgIGJhc2U6IHN0cmluZyxcbiAgKSB7XG4gICAgY29uc3QgbXNnID0gYFBhY2thZ2UgaW1wb3J0IHNwZWNpZmllciBcIiR7c3BlY2lmaWVyfVwiIGlzIG5vdCBkZWZpbmVkJHtcbiAgICAgIHBhY2thZ2VQYXRoID8gYCBpbiBwYWNrYWdlICR7cGFja2FnZVBhdGh9cGFja2FnZS5qc29uYCA6IFwiXCJcbiAgICB9IGltcG9ydGVkIGZyb20gJHtiYXNlfWA7XG5cbiAgICBzdXBlcihcIkVSUl9QQUNLQUdFX0lNUE9SVF9OT1RfREVGSU5FRFwiLCBtc2cpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfUEFDS0FHRV9QQVRIX05PVF9FWFBPUlRFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHN1YnBhdGg6IHN0cmluZywgcGtnUGF0aDogc3RyaW5nLCBiYXNlUGF0aD86IHN0cmluZykge1xuICAgIGxldCBtc2c6IHN0cmluZztcbiAgICBpZiAoc3VicGF0aCA9PT0gXCIuXCIpIHtcbiAgICAgIG1zZyA9IGBObyBcImV4cG9ydHNcIiBtYWluIGRlZmluZWQgaW4gJHtwa2dQYXRofXBhY2thZ2UuanNvbiR7XG4gICAgICAgIGJhc2VQYXRoID8gYCBpbXBvcnRlZCBmcm9tICR7YmFzZVBhdGh9YCA6IFwiXCJcbiAgICAgIH1gO1xuICAgIH0gZWxzZSB7XG4gICAgICBtc2cgPVxuICAgICAgICBgUGFja2FnZSBzdWJwYXRoICcke3N1YnBhdGh9JyBpcyBub3QgZGVmaW5lZCBieSBcImV4cG9ydHNcIiBpbiAke3BrZ1BhdGh9cGFja2FnZS5qc29uJHtcbiAgICAgICAgICBiYXNlUGF0aCA/IGAgaW1wb3J0ZWQgZnJvbSAke2Jhc2VQYXRofWAgOiBcIlwiXG4gICAgICAgIH1gO1xuICAgIH1cblxuICAgIHN1cGVyKFwiRVJSX1BBQ0tBR0VfUEFUSF9OT1RfRVhQT1JURURcIiwgbXNnKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0lOVEVSTkFMX0FTU0VSVElPTiBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2U/OiBzdHJpbmcpIHtcbiAgICBjb25zdCBzdWZmaXggPSBcIlRoaXMgaXMgY2F1c2VkIGJ5IGVpdGhlciBhIGJ1ZyBpbiBOb2RlLmpzIFwiICtcbiAgICAgIFwib3IgaW5jb3JyZWN0IHVzYWdlIG9mIE5vZGUuanMgaW50ZXJuYWxzLlxcblwiICtcbiAgICAgIFwiUGxlYXNlIG9wZW4gYW4gaXNzdWUgd2l0aCB0aGlzIHN0YWNrIHRyYWNlIGF0IFwiICtcbiAgICAgIFwiaHR0cHM6Ly9naXRodWIuY29tL25vZGVqcy9ub2RlL2lzc3Vlc1xcblwiO1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSU5URVJOQUxfQVNTRVJUSU9OXCIsXG4gICAgICBtZXNzYWdlID09PSB1bmRlZmluZWQgPyBzdWZmaXggOiBgJHttZXNzYWdlfVxcbiR7c3VmZml4fWAsXG4gICAgKTtcbiAgfVxufVxuXG4vLyBVc2luZyBgZnMucm1kaXJgIG9uIGEgcGF0aCB0aGF0IGlzIGEgZmlsZSByZXN1bHRzIGluIGFuIEVOT0VOVCBlcnJvciBvbiBXaW5kb3dzIGFuZCBhbiBFTk9URElSIGVycm9yIG9uIFBPU0lYLlxuZXhwb3J0IGNsYXNzIEVSUl9GU19STURJUl9FTk9URElSIGV4dGVuZHMgTm9kZVN5c3RlbUVycm9yIHtcbiAgY29uc3RydWN0b3IocGF0aDogc3RyaW5nKSB7XG4gICAgY29uc3QgY29kZSA9IGlzV2luZG93cyA/IFwiRU5PRU5UXCIgOiBcIkVOT1RESVJcIjtcbiAgICBjb25zdCBjdHg6IE5vZGVTeXN0ZW1FcnJvckN0eCA9IHtcbiAgICAgIG1lc3NhZ2U6IFwibm90IGEgZGlyZWN0b3J5XCIsXG4gICAgICBwYXRoLFxuICAgICAgc3lzY2FsbDogXCJybWRpclwiLFxuICAgICAgY29kZSxcbiAgICAgIGVycm5vOiBpc1dpbmRvd3MgPyBFTk9FTlQgOiBFTk9URElSLFxuICAgIH07XG4gICAgc3VwZXIoY29kZSwgY3R4LCBcIlBhdGggaXMgbm90IGEgZGlyZWN0b3J5XCIpO1xuICB9XG59XG5cbmludGVyZmFjZSBVdkV4Y2VwdGlvbkNvbnRleHQge1xuICBzeXNjYWxsOiBzdHJpbmc7XG59XG5leHBvcnQgZnVuY3Rpb24gZGVub0Vycm9yVG9Ob2RlRXJyb3IoZTogRXJyb3IsIGN0eDogVXZFeGNlcHRpb25Db250ZXh0KSB7XG4gIGNvbnN0IGVycm5vID0gZXh0cmFjdE9zRXJyb3JOdW1iZXJGcm9tRXJyb3JNZXNzYWdlKGUpO1xuICBpZiAodHlwZW9mIGVycm5vID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgcmV0dXJuIGU7XG4gIH1cblxuICBjb25zdCBleCA9IHV2RXhjZXB0aW9uKHtcbiAgICBlcnJubzogbWFwU3lzRXJybm9Ub1V2RXJybm8oZXJybm8pLFxuICAgIC4uLmN0eCxcbiAgfSk7XG4gIHJldHVybiBleDtcbn1cblxuZnVuY3Rpb24gZXh0cmFjdE9zRXJyb3JOdW1iZXJGcm9tRXJyb3JNZXNzYWdlKGU6IHVua25vd24pOiBudW1iZXIgfCB1bmRlZmluZWQge1xuICBjb25zdCBtYXRjaCA9IGUgaW5zdGFuY2VvZiBFcnJvclxuICAgID8gZS5tZXNzYWdlLm1hdGNoKC9cXChvcyBlcnJvciAoXFxkKylcXCkvKVxuICAgIDogZmFsc2U7XG5cbiAgaWYgKG1hdGNoKSB7XG4gICAgcmV0dXJuICttYXRjaFsxXTtcbiAgfVxuXG4gIHJldHVybiB1bmRlZmluZWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb25uUmVzZXRFeGNlcHRpb24obXNnOiBzdHJpbmcpIHtcbiAgY29uc3QgZXggPSBuZXcgRXJyb3IobXNnKTtcbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgKGV4IGFzIGFueSkuY29kZSA9IFwiRUNPTk5SRVNFVFwiO1xuICByZXR1cm4gZXg7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhZ2dyZWdhdGVUd29FcnJvcnMoXG4gIGlubmVyRXJyb3I6IEFnZ3JlZ2F0ZUVycm9yLFxuICBvdXRlckVycm9yOiBBZ2dyZWdhdGVFcnJvciAmIHsgY29kZTogc3RyaW5nIH0sXG4pIHtcbiAgaWYgKGlubmVyRXJyb3IgJiYgb3V0ZXJFcnJvciAmJiBpbm5lckVycm9yICE9PSBvdXRlckVycm9yKSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkob3V0ZXJFcnJvci5lcnJvcnMpKSB7XG4gICAgICAvLyBJZiBgb3V0ZXJFcnJvcmAgaXMgYWxyZWFkeSBhbiBgQWdncmVnYXRlRXJyb3JgLlxuICAgICAgb3V0ZXJFcnJvci5lcnJvcnMucHVzaChpbm5lckVycm9yKTtcbiAgICAgIHJldHVybiBvdXRlckVycm9yO1xuICAgIH1cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcmVzdHJpY3RlZC1zeW50YXhcbiAgICBjb25zdCBlcnIgPSBuZXcgQWdncmVnYXRlRXJyb3IoXG4gICAgICBbXG4gICAgICAgIG91dGVyRXJyb3IsXG4gICAgICAgIGlubmVyRXJyb3IsXG4gICAgICBdLFxuICAgICAgb3V0ZXJFcnJvci5tZXNzYWdlLFxuICAgICk7XG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICAoZXJyIGFzIGFueSkuY29kZSA9IG91dGVyRXJyb3IuY29kZTtcbiAgICByZXR1cm4gZXJyO1xuICB9XG4gIHJldHVybiBpbm5lckVycm9yIHx8IG91dGVyRXJyb3I7XG59XG5jb2Rlcy5FUlJfSVBDX0NIQU5ORUxfQ0xPU0VEID0gRVJSX0lQQ19DSEFOTkVMX0NMT1NFRDtcbmNvZGVzLkVSUl9JTlZBTElEX0FSR19UWVBFID0gRVJSX0lOVkFMSURfQVJHX1RZUEU7XG5jb2Rlcy5FUlJfSU5WQUxJRF9BUkdfVkFMVUUgPSBFUlJfSU5WQUxJRF9BUkdfVkFMVUU7XG5jb2Rlcy5FUlJfT1VUX09GX1JBTkdFID0gRVJSX09VVF9PRl9SQU5HRTtcbmNvZGVzLkVSUl9TT0NLRVRfQkFEX1BPUlQgPSBFUlJfU09DS0VUX0JBRF9QT1JUO1xuY29kZXMuRVJSX0JVRkZFUl9PVVRfT0ZfQk9VTkRTID0gRVJSX0JVRkZFUl9PVVRfT0ZfQk9VTkRTO1xuY29kZXMuRVJSX1VOS05PV05fRU5DT0RJTkcgPSBFUlJfVU5LTk9XTl9FTkNPRElORztcbi8vIFRPRE8oa3Qzayk6IGFzc2lnbiBhbGwgZXJyb3IgY2xhc3NlcyBoZXJlLlxuXG4vKipcbiAqIFRoaXMgY3JlYXRlcyBhIGdlbmVyaWMgTm9kZS5qcyBlcnJvci5cbiAqXG4gKiBAcGFyYW0gbWVzc2FnZSBUaGUgZXJyb3IgbWVzc2FnZS5cbiAqIEBwYXJhbSBlcnJvclByb3BlcnRpZXMgT2JqZWN0IHdpdGggYWRkaXRpb25hbCBwcm9wZXJ0aWVzIHRvIGJlIGFkZGVkIHRvIHRoZSBlcnJvci5cbiAqIEByZXR1cm5zXG4gKi9cbmNvbnN0IGdlbmVyaWNOb2RlRXJyb3IgPSBoaWRlU3RhY2tGcmFtZXMoXG4gIGZ1bmN0aW9uIGdlbmVyaWNOb2RlRXJyb3IobWVzc2FnZSwgZXJyb3JQcm9wZXJ0aWVzKSB7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXJlc3RyaWN0ZWQtc3ludGF4XG4gICAgY29uc3QgZXJyID0gbmV3IEVycm9yKG1lc3NhZ2UpO1xuICAgIE9iamVjdC5hc3NpZ24oZXJyLCBlcnJvclByb3BlcnRpZXMpO1xuXG4gICAgcmV0dXJuIGVycjtcbiAgfSxcbik7XG5cbi8qKlxuICogRGV0ZXJtaW5lIHRoZSBzcGVjaWZpYyB0eXBlIG9mIGEgdmFsdWUgZm9yIHR5cGUtbWlzbWF0Y2ggZXJyb3JzLlxuICogQHBhcmFtIHsqfSB2YWx1ZVxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbmZ1bmN0aW9uIGRldGVybWluZVNwZWNpZmljVHlwZSh2YWx1ZTogYW55KSB7XG4gIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgcmV0dXJuIFwiXCIgKyB2YWx1ZTtcbiAgfVxuICBpZiAodHlwZW9mIHZhbHVlID09PSBcImZ1bmN0aW9uXCIgJiYgdmFsdWUubmFtZSkge1xuICAgIHJldHVybiBgZnVuY3Rpb24gJHt2YWx1ZS5uYW1lfWA7XG4gIH1cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIikge1xuICAgIGlmICh2YWx1ZS5jb25zdHJ1Y3Rvcj8ubmFtZSkge1xuICAgICAgcmV0dXJuIGBhbiBpbnN0YW5jZSBvZiAke3ZhbHVlLmNvbnN0cnVjdG9yLm5hbWV9YDtcbiAgICB9XG4gICAgcmV0dXJuIGAke2luc3BlY3QodmFsdWUsIHsgZGVwdGg6IC0xIH0pfWA7XG4gIH1cbiAgbGV0IGluc3BlY3RlZCA9IGluc3BlY3QodmFsdWUsIHsgY29sb3JzOiBmYWxzZSB9KTtcbiAgaWYgKGluc3BlY3RlZC5sZW5ndGggPiAyOCkgaW5zcGVjdGVkID0gYCR7aW5zcGVjdGVkLnNsaWNlKDAsIDI1KX0uLi5gO1xuXG4gIHJldHVybiBgdHlwZSAke3R5cGVvZiB2YWx1ZX0gKCR7aW5zcGVjdGVkfSlgO1xufVxuXG5leHBvcnQgeyBjb2RlcywgZ2VuZXJpY05vZGVFcnJvciwgaGlkZVN0YWNrRnJhbWVzIH07XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgQWJvcnRFcnJvcixcbiAgRVJSX0FNQklHVU9VU19BUkdVTUVOVCxcbiAgRVJSX0FSR19OT1RfSVRFUkFCTEUsXG4gIEVSUl9BU1NFUlRJT04sXG4gIEVSUl9BU1lOQ19DQUxMQkFDSyxcbiAgRVJSX0FTWU5DX1RZUEUsXG4gIEVSUl9CUk9UTElfSU5WQUxJRF9QQVJBTSxcbiAgRVJSX0JVRkZFUl9PVVRfT0ZfQk9VTkRTLFxuICBFUlJfQlVGRkVSX1RPT19MQVJHRSxcbiAgRVJSX0NBTk5PVF9XQVRDSF9TSUdJTlQsXG4gIEVSUl9DSElMRF9DTE9TRURfQkVGT1JFX1JFUExZLFxuICBFUlJfQ0hJTERfUFJPQ0VTU19JUENfUkVRVUlSRUQsXG4gIEVSUl9DSElMRF9QUk9DRVNTX1NURElPX01BWEJVRkZFUixcbiAgRVJSX0NPTlNPTEVfV1JJVEFCTEVfU1RSRUFNLFxuICBFUlJfQ09OVEVYVF9OT1RfSU5JVElBTElaRUQsXG4gIEVSUl9DUFVfVVNBR0UsXG4gIEVSUl9DUllQVE9fQ1VTVE9NX0VOR0lORV9OT1RfU1VQUE9SVEVELFxuICBFUlJfQ1JZUFRPX0VDREhfSU5WQUxJRF9GT1JNQVQsXG4gIEVSUl9DUllQVE9fRUNESF9JTlZBTElEX1BVQkxJQ19LRVksXG4gIEVSUl9DUllQVE9fRU5HSU5FX1VOS05PV04sXG4gIEVSUl9DUllQVE9fRklQU19GT1JDRUQsXG4gIEVSUl9DUllQVE9fRklQU19VTkFWQUlMQUJMRSxcbiAgRVJSX0NSWVBUT19IQVNIX0ZJTkFMSVpFRCxcbiAgRVJSX0NSWVBUT19IQVNIX1VQREFURV9GQUlMRUQsXG4gIEVSUl9DUllQVE9fSU5DT01QQVRJQkxFX0tFWSxcbiAgRVJSX0NSWVBUT19JTkNPTVBBVElCTEVfS0VZX09QVElPTlMsXG4gIEVSUl9DUllQVE9fSU5WQUxJRF9ESUdFU1QsXG4gIEVSUl9DUllQVE9fSU5WQUxJRF9LRVlfT0JKRUNUX1RZUEUsXG4gIEVSUl9DUllQVE9fSU5WQUxJRF9TVEFURSxcbiAgRVJSX0NSWVBUT19QQktERjJfRVJST1IsXG4gIEVSUl9DUllQVE9fU0NSWVBUX0lOVkFMSURfUEFSQU1FVEVSLFxuICBFUlJfQ1JZUFRPX1NDUllQVF9OT1RfU1VQUE9SVEVELFxuICBFUlJfQ1JZUFRPX1NJR05fS0VZX1JFUVVJUkVELFxuICBFUlJfRElSX0NMT1NFRCxcbiAgRVJSX0RJUl9DT05DVVJSRU5UX09QRVJBVElPTixcbiAgRVJSX0ROU19TRVRfU0VSVkVSU19GQUlMRUQsXG4gIEVSUl9ET01BSU5fQ0FMTEJBQ0tfTk9UX0FWQUlMQUJMRSxcbiAgRVJSX0RPTUFJTl9DQU5OT1RfU0VUX1VOQ0FVR0hUX0VYQ0VQVElPTl9DQVBUVVJFLFxuICBFUlJfRU5DT0RJTkdfSU5WQUxJRF9FTkNPREVEX0RBVEEsXG4gIEVSUl9FTkNPRElOR19OT1RfU1VQUE9SVEVELFxuICBFUlJfRVZBTF9FU01fQ0FOTk9UX1BSSU5ULFxuICBFUlJfRVZFTlRfUkVDVVJTSU9OLFxuICBFUlJfRkFMU1lfVkFMVUVfUkVKRUNUSU9OLFxuICBFUlJfRkVBVFVSRV9VTkFWQUlMQUJMRV9PTl9QTEFURk9STSxcbiAgRVJSX0ZTX0VJU0RJUixcbiAgRVJSX0ZTX0ZJTEVfVE9PX0xBUkdFLFxuICBFUlJfRlNfSU5WQUxJRF9TWU1MSU5LX1RZUEUsXG4gIEVSUl9GU19STURJUl9FTk9URElSLFxuICBFUlJfSFRUUDJfQUxUU1ZDX0lOVkFMSURfT1JJR0lOLFxuICBFUlJfSFRUUDJfQUxUU1ZDX0xFTkdUSCxcbiAgRVJSX0hUVFAyX0NPTk5FQ1RfQVVUSE9SSVRZLFxuICBFUlJfSFRUUDJfQ09OTkVDVF9QQVRILFxuICBFUlJfSFRUUDJfQ09OTkVDVF9TQ0hFTUUsXG4gIEVSUl9IVFRQMl9HT0FXQVlfU0VTU0lPTixcbiAgRVJSX0hUVFAyX0hFQURFUlNfQUZURVJfUkVTUE9ORCxcbiAgRVJSX0hUVFAyX0hFQURFUlNfU0VOVCxcbiAgRVJSX0hUVFAyX0hFQURFUl9TSU5HTEVfVkFMVUUsXG4gIEVSUl9IVFRQMl9JTkZPX1NUQVRVU19OT1RfQUxMT1dFRCxcbiAgRVJSX0hUVFAyX0lOVkFMSURfQ09OTkVDVElPTl9IRUFERVJTLFxuICBFUlJfSFRUUDJfSU5WQUxJRF9IRUFERVJfVkFMVUUsXG4gIEVSUl9IVFRQMl9JTlZBTElEX0lORk9fU1RBVFVTLFxuICBFUlJfSFRUUDJfSU5WQUxJRF9PUklHSU4sXG4gIEVSUl9IVFRQMl9JTlZBTElEX1BBQ0tFRF9TRVRUSU5HU19MRU5HVEgsXG4gIEVSUl9IVFRQMl9JTlZBTElEX1BTRVVET0hFQURFUixcbiAgRVJSX0hUVFAyX0lOVkFMSURfU0VTU0lPTixcbiAgRVJSX0hUVFAyX0lOVkFMSURfU0VUVElOR19WQUxVRSxcbiAgRVJSX0hUVFAyX0lOVkFMSURfU1RSRUFNLFxuICBFUlJfSFRUUDJfTUFYX1BFTkRJTkdfU0VUVElOR1NfQUNLLFxuICBFUlJfSFRUUDJfTkVTVEVEX1BVU0gsXG4gIEVSUl9IVFRQMl9OT19TT0NLRVRfTUFOSVBVTEFUSU9OLFxuICBFUlJfSFRUUDJfT1JJR0lOX0xFTkdUSCxcbiAgRVJSX0hUVFAyX09VVF9PRl9TVFJFQU1TLFxuICBFUlJfSFRUUDJfUEFZTE9BRF9GT1JCSURERU4sXG4gIEVSUl9IVFRQMl9QSU5HX0NBTkNFTCxcbiAgRVJSX0hUVFAyX1BJTkdfTEVOR1RILFxuICBFUlJfSFRUUDJfUFNFVURPSEVBREVSX05PVF9BTExPV0VELFxuICBFUlJfSFRUUDJfUFVTSF9ESVNBQkxFRCxcbiAgRVJSX0hUVFAyX1NFTkRfRklMRSxcbiAgRVJSX0hUVFAyX1NFTkRfRklMRV9OT1NFRUssXG4gIEVSUl9IVFRQMl9TRVNTSU9OX0VSUk9SLFxuICBFUlJfSFRUUDJfU0VUVElOR1NfQ0FOQ0VMLFxuICBFUlJfSFRUUDJfU09DS0VUX0JPVU5ELFxuICBFUlJfSFRUUDJfU09DS0VUX1VOQk9VTkQsXG4gIEVSUl9IVFRQMl9TVEFUVVNfMTAxLFxuICBFUlJfSFRUUDJfU1RBVFVTX0lOVkFMSUQsXG4gIEVSUl9IVFRQMl9TVFJFQU1fQ0FOQ0VMLFxuICBFUlJfSFRUUDJfU1RSRUFNX0VSUk9SLFxuICBFUlJfSFRUUDJfU1RSRUFNX1NFTEZfREVQRU5ERU5DWSxcbiAgRVJSX0hUVFAyX1RSQUlMRVJTX0FMUkVBRFlfU0VOVCxcbiAgRVJSX0hUVFAyX1RSQUlMRVJTX05PVF9SRUFEWSxcbiAgRVJSX0hUVFAyX1VOU1VQUE9SVEVEX1BST1RPQ09MLFxuICBFUlJfSFRUUF9IRUFERVJTX1NFTlQsXG4gIEVSUl9IVFRQX0lOVkFMSURfSEVBREVSX1ZBTFVFLFxuICBFUlJfSFRUUF9JTlZBTElEX1NUQVRVU19DT0RFLFxuICBFUlJfSFRUUF9TT0NLRVRfRU5DT0RJTkcsXG4gIEVSUl9IVFRQX1RSQUlMRVJfSU5WQUxJRCxcbiAgRVJSX0lOQ09NUEFUSUJMRV9PUFRJT05fUEFJUixcbiAgRVJSX0lOUFVUX1RZUEVfTk9UX0FMTE9XRUQsXG4gIEVSUl9JTlNQRUNUT1JfQUxSRUFEWV9BQ1RJVkFURUQsXG4gIEVSUl9JTlNQRUNUT1JfQUxSRUFEWV9DT05ORUNURUQsXG4gIEVSUl9JTlNQRUNUT1JfQ0xPU0VELFxuICBFUlJfSU5TUEVDVE9SX0NPTU1BTkQsXG4gIEVSUl9JTlNQRUNUT1JfTk9UX0FDVElWRSxcbiAgRVJSX0lOU1BFQ1RPUl9OT1RfQVZBSUxBQkxFLFxuICBFUlJfSU5TUEVDVE9SX05PVF9DT05ORUNURUQsXG4gIEVSUl9JTlNQRUNUT1JfTk9UX1dPUktFUixcbiAgRVJSX0lOVEVSTkFMX0FTU0VSVElPTixcbiAgRVJSX0lOVkFMSURfQUREUkVTU19GQU1JTFksXG4gIEVSUl9JTlZBTElEX0FSR19UWVBFLFxuICBFUlJfSU5WQUxJRF9BUkdfVFlQRV9SQU5HRSxcbiAgRVJSX0lOVkFMSURfQVJHX1ZBTFVFLFxuICBFUlJfSU5WQUxJRF9BUkdfVkFMVUVfUkFOR0UsXG4gIEVSUl9JTlZBTElEX0FTWU5DX0lELFxuICBFUlJfSU5WQUxJRF9CVUZGRVJfU0laRSxcbiAgRVJSX0lOVkFMSURfQ0hBUixcbiAgRVJSX0lOVkFMSURfQ1VSU09SX1BPUyxcbiAgRVJSX0lOVkFMSURfRkQsXG4gIEVSUl9JTlZBTElEX0ZEX1RZUEUsXG4gIEVSUl9JTlZBTElEX0ZJTEVfVVJMX0hPU1QsXG4gIEVSUl9JTlZBTElEX0ZJTEVfVVJMX1BBVEgsXG4gIEVSUl9JTlZBTElEX0hBTkRMRV9UWVBFLFxuICBFUlJfSU5WQUxJRF9IVFRQX1RPS0VOLFxuICBFUlJfSU5WQUxJRF9JUF9BRERSRVNTLFxuICBFUlJfSU5WQUxJRF9NT0RVTEVfU1BFQ0lGSUVSLFxuICBFUlJfSU5WQUxJRF9PUFRfVkFMVUUsXG4gIEVSUl9JTlZBTElEX09QVF9WQUxVRV9FTkNPRElORyxcbiAgRVJSX0lOVkFMSURfUEFDS0FHRV9DT05GSUcsXG4gIEVSUl9JTlZBTElEX1BBQ0tBR0VfVEFSR0VULFxuICBFUlJfSU5WQUxJRF9QRVJGT1JNQU5DRV9NQVJLLFxuICBFUlJfSU5WQUxJRF9QUk9UT0NPTCxcbiAgRVJSX0lOVkFMSURfUkVQTF9FVkFMX0NPTkZJRyxcbiAgRVJSX0lOVkFMSURfUkVQTF9JTlBVVCxcbiAgRVJSX0lOVkFMSURfUkVUVVJOX1BST1BFUlRZLFxuICBFUlJfSU5WQUxJRF9SRVRVUk5fUFJPUEVSVFlfVkFMVUUsXG4gIEVSUl9JTlZBTElEX1JFVFVSTl9WQUxVRSxcbiAgRVJSX0lOVkFMSURfU1lOQ19GT1JLX0lOUFVULFxuICBFUlJfSU5WQUxJRF9USElTLFxuICBFUlJfSU5WQUxJRF9UVVBMRSxcbiAgRVJSX0lOVkFMSURfVVJJLFxuICBFUlJfSU5WQUxJRF9VUkwsXG4gIEVSUl9JTlZBTElEX1VSTF9TQ0hFTUUsXG4gIEVSUl9JUENfQ0hBTk5FTF9DTE9TRUQsXG4gIEVSUl9JUENfRElTQ09OTkVDVEVELFxuICBFUlJfSVBDX09ORV9QSVBFLFxuICBFUlJfSVBDX1NZTkNfRk9SSyxcbiAgRVJSX01BTklGRVNUX0RFUEVOREVOQ1lfTUlTU0lORyxcbiAgRVJSX01BTklGRVNUX0lOVEVHUklUWV9NSVNNQVRDSCxcbiAgRVJSX01BTklGRVNUX0lOVkFMSURfUkVTT1VSQ0VfRklFTEQsXG4gIEVSUl9NQU5JRkVTVF9URFosXG4gIEVSUl9NQU5JRkVTVF9VTktOT1dOX09ORVJST1IsXG4gIEVSUl9NRVRIT0RfTk9UX0lNUExFTUVOVEVELFxuICBFUlJfTUlTU0lOR19BUkdTLFxuICBFUlJfTUlTU0lOR19PUFRJT04sXG4gIEVSUl9NT0RVTEVfTk9UX0ZPVU5ELFxuICBFUlJfTVVMVElQTEVfQ0FMTEJBQ0ssXG4gIEVSUl9OQVBJX0NPTlNfRlVOQ1RJT04sXG4gIEVSUl9OQVBJX0lOVkFMSURfREFUQVZJRVdfQVJHUyxcbiAgRVJSX05BUElfSU5WQUxJRF9UWVBFREFSUkFZX0FMSUdOTUVOVCxcbiAgRVJSX05BUElfSU5WQUxJRF9UWVBFREFSUkFZX0xFTkdUSCxcbiAgRVJSX05PX0NSWVBUTyxcbiAgRVJSX05PX0lDVSxcbiAgRVJSX09VVF9PRl9SQU5HRSxcbiAgRVJSX1BBQ0tBR0VfSU1QT1JUX05PVF9ERUZJTkVELFxuICBFUlJfUEFDS0FHRV9QQVRIX05PVF9FWFBPUlRFRCxcbiAgRVJSX1FVSUNDTElFTlRTRVNTSU9OX0ZBSUxFRCxcbiAgRVJSX1FVSUNDTElFTlRTRVNTSU9OX0ZBSUxFRF9TRVRTT0NLRVQsXG4gIEVSUl9RVUlDU0VTU0lPTl9ERVNUUk9ZRUQsXG4gIEVSUl9RVUlDU0VTU0lPTl9JTlZBTElEX0RDSUQsXG4gIEVSUl9RVUlDU0VTU0lPTl9VUERBVEVLRVksXG4gIEVSUl9RVUlDU09DS0VUX0RFU1RST1lFRCxcbiAgRVJSX1FVSUNTT0NLRVRfSU5WQUxJRF9TVEFURUxFU1NfUkVTRVRfU0VDUkVUX0xFTkdUSCxcbiAgRVJSX1FVSUNTT0NLRVRfTElTVEVOSU5HLFxuICBFUlJfUVVJQ1NPQ0tFVF9VTkJPVU5ELFxuICBFUlJfUVVJQ1NUUkVBTV9ERVNUUk9ZRUQsXG4gIEVSUl9RVUlDU1RSRUFNX0lOVkFMSURfUFVTSCxcbiAgRVJSX1FVSUNTVFJFQU1fT1BFTl9GQUlMRUQsXG4gIEVSUl9RVUlDU1RSRUFNX1VOU1VQUE9SVEVEX1BVU0gsXG4gIEVSUl9RVUlDX1RMUzEzX1JFUVVJUkVELFxuICBFUlJfU0NSSVBUX0VYRUNVVElPTl9JTlRFUlJVUFRFRCxcbiAgRVJSX1NFUlZFUl9BTFJFQURZX0xJU1RFTixcbiAgRVJSX1NFUlZFUl9OT1RfUlVOTklORyxcbiAgRVJSX1NPQ0tFVF9BTFJFQURZX0JPVU5ELFxuICBFUlJfU09DS0VUX0JBRF9CVUZGRVJfU0laRSxcbiAgRVJSX1NPQ0tFVF9CQURfUE9SVCxcbiAgRVJSX1NPQ0tFVF9CQURfVFlQRSxcbiAgRVJSX1NPQ0tFVF9CVUZGRVJfU0laRSxcbiAgRVJSX1NPQ0tFVF9DTE9TRUQsXG4gIEVSUl9TT0NLRVRfREdSQU1fSVNfQ09OTkVDVEVELFxuICBFUlJfU09DS0VUX0RHUkFNX05PVF9DT05ORUNURUQsXG4gIEVSUl9TT0NLRVRfREdSQU1fTk9UX1JVTk5JTkcsXG4gIEVSUl9TUklfUEFSU0UsXG4gIEVSUl9TVFJFQU1fQUxSRUFEWV9GSU5JU0hFRCxcbiAgRVJSX1NUUkVBTV9DQU5OT1RfUElQRSxcbiAgRVJSX1NUUkVBTV9ERVNUUk9ZRUQsXG4gIEVSUl9TVFJFQU1fTlVMTF9WQUxVRVMsXG4gIEVSUl9TVFJFQU1fUFJFTUFUVVJFX0NMT1NFLFxuICBFUlJfU1RSRUFNX1BVU0hfQUZURVJfRU9GLFxuICBFUlJfU1RSRUFNX1VOU0hJRlRfQUZURVJfRU5EX0VWRU5ULFxuICBFUlJfU1RSRUFNX1dSQVAsXG4gIEVSUl9TVFJFQU1fV1JJVEVfQUZURVJfRU5ELFxuICBFUlJfU1lOVEhFVElDLFxuICBFUlJfVExTX0NFUlRfQUxUTkFNRV9JTlZBTElELFxuICBFUlJfVExTX0RIX1BBUkFNX1NJWkUsXG4gIEVSUl9UTFNfSEFORFNIQUtFX1RJTUVPVVQsXG4gIEVSUl9UTFNfSU5WQUxJRF9DT05URVhULFxuICBFUlJfVExTX0lOVkFMSURfUFJPVE9DT0xfVkVSU0lPTixcbiAgRVJSX1RMU19JTlZBTElEX1NUQVRFLFxuICBFUlJfVExTX1BST1RPQ09MX1ZFUlNJT05fQ09ORkxJQ1QsXG4gIEVSUl9UTFNfUkVORUdPVElBVElPTl9ESVNBQkxFRCxcbiAgRVJSX1RMU19SRVFVSVJFRF9TRVJWRVJfTkFNRSxcbiAgRVJSX1RMU19TRVNTSU9OX0FUVEFDSyxcbiAgRVJSX1RMU19TTklfRlJPTV9TRVJWRVIsXG4gIEVSUl9UUkFDRV9FVkVOVFNfQ0FURUdPUllfUkVRVUlSRUQsXG4gIEVSUl9UUkFDRV9FVkVOVFNfVU5BVkFJTEFCTEUsXG4gIEVSUl9VTkFWQUlMQUJMRV9EVVJJTkdfRVhJVCxcbiAgRVJSX1VOQ0FVR0hUX0VYQ0VQVElPTl9DQVBUVVJFX0FMUkVBRFlfU0VULFxuICBFUlJfVU5FU0NBUEVEX0NIQVJBQ1RFUlMsXG4gIEVSUl9VTkhBTkRMRURfRVJST1IsXG4gIEVSUl9VTktOT1dOX0JVSUxUSU5fTU9EVUxFLFxuICBFUlJfVU5LTk9XTl9DUkVERU5USUFMLFxuICBFUlJfVU5LTk9XTl9FTkNPRElORyxcbiAgRVJSX1VOS05PV05fRklMRV9FWFRFTlNJT04sXG4gIEVSUl9VTktOT1dOX01PRFVMRV9GT1JNQVQsXG4gIEVSUl9VTktOT1dOX1NJR05BTCxcbiAgRVJSX1VOU1VQUE9SVEVEX0RJUl9JTVBPUlQsXG4gIEVSUl9VTlNVUFBPUlRFRF9FU01fVVJMX1NDSEVNRSxcbiAgRVJSX1Y4QlJFQUtJVEVSQVRPUixcbiAgRVJSX1ZBTElEX1BFUkZPUk1BTkNFX0VOVFJZX1RZUEUsXG4gIEVSUl9WTV9EWU5BTUlDX0lNUE9SVF9DQUxMQkFDS19NSVNTSU5HLFxuICBFUlJfVk1fTU9EVUxFX0FMUkVBRFlfTElOS0VELFxuICBFUlJfVk1fTU9EVUxFX0NBTk5PVF9DUkVBVEVfQ0FDSEVEX0RBVEEsXG4gIEVSUl9WTV9NT0RVTEVfRElGRkVSRU5UX0NPTlRFWFQsXG4gIEVSUl9WTV9NT0RVTEVfTElOS0lOR19FUlJPUkVELFxuICBFUlJfVk1fTU9EVUxFX05PVF9NT0RVTEUsXG4gIEVSUl9WTV9NT0RVTEVfU1RBVFVTLFxuICBFUlJfV0FTSV9BTFJFQURZX1NUQVJURUQsXG4gIEVSUl9XT1JLRVJfSU5JVF9GQUlMRUQsXG4gIEVSUl9XT1JLRVJfTk9UX1JVTk5JTkcsXG4gIEVSUl9XT1JLRVJfT1VUX09GX01FTU9SWSxcbiAgRVJSX1dPUktFUl9VTlNFUklBTElaQUJMRV9FUlJPUixcbiAgRVJSX1dPUktFUl9VTlNVUFBPUlRFRF9FWFRFTlNJT04sXG4gIEVSUl9XT1JLRVJfVU5TVVBQT1JURURfT1BFUkFUSU9OLFxuICBFUlJfWkxJQl9JTklUSUFMSVpBVElPTl9GQUlMRUQsXG4gIE5vZGVFcnJvcixcbiAgTm9kZUVycm9yQWJzdHJhY3Rpb24sXG4gIE5vZGVSYW5nZUVycm9yLFxuICBOb2RlU3ludGF4RXJyb3IsXG4gIE5vZGVUeXBlRXJyb3IsXG4gIE5vZGVVUklFcnJvcixcbiAgYWdncmVnYXRlVHdvRXJyb3JzLFxuICBjb2RlcyxcbiAgY29ublJlc2V0RXhjZXB0aW9uLFxuICBkZW5vRXJyb3JUb05vZGVFcnJvcixcbiAgZG5zRXhjZXB0aW9uLFxuICBlcnJub0V4Y2VwdGlvbixcbiAgZXJyb3JNYXAsXG4gIGV4Y2VwdGlvbldpdGhIb3N0UG9ydCxcbiAgZ2VuZXJpY05vZGVFcnJvcixcbiAgaGlkZVN0YWNrRnJhbWVzLFxuICBpc1N0YWNrT3ZlcmZsb3dFcnJvcixcbiAgdXZFeGNlcHRpb24sXG4gIHV2RXhjZXB0aW9uV2l0aEhvc3RQb3J0LFxufTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUsb0VBQW9FO0FBQ3BFOzs7Ozs7Ozs7OztHQVdHLENBRUgsU0FBUyxPQUFPLFFBQVEsOEJBQThCLENBQUM7QUFDdkQsU0FBUyxLQUFLLFFBQVEsa0JBQWtCLENBQUM7QUFDekMsU0FDRSxPQUFPLEVBQ1AsUUFBUSxFQUNSLG9CQUFvQixRQUNmLDJCQUEyQixDQUFDO0FBQ25DLFNBQVMsTUFBTSxRQUFRLHVCQUF1QixDQUFDO0FBQy9DLFNBQVMsU0FBUyxRQUFRLG1CQUFtQixDQUFDO0FBQzlDLFNBQVMsRUFBRSxJQUFJLFdBQVcsUUFBUSxrQ0FBa0MsQ0FBQztBQUNyRSxNQUFNLEVBQ0osS0FBSyxFQUFFLEVBQUUsT0FBTyxDQUFBLEVBQUUsTUFBTSxDQUFBLEVBQUUsQ0FBQSxJQUMzQixHQUFHLFdBQVcsQUFBQztBQUNoQixTQUFTLGVBQWUsUUFBUSx3QkFBd0IsQ0FBQztBQUN6RCxTQUFTLGtCQUFrQixRQUFRLGNBQWMsQ0FBQztBQUVsRCxTQUFTLFFBQVEsR0FB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