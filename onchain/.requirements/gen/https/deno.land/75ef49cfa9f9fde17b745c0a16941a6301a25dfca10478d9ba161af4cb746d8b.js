export class Tx {
    type;
    sender;
    contractCall;
    transferStx;
    deployContract;
    constructor(type, sender){
        this.type = type;
        this.sender = sender;
    }
    static transferSTX(amount, recipient, sender) {
        let tx = new Tx(1, sender);
        tx.transferStx = {
            recipient,
            amount
        };
        return tx;
    }
    static contractCall(contract, method, args, sender) {
        let tx = new Tx(2, sender);
        tx.contractCall = {
            contract,
            method,
            args
        };
        return tx;
    }
    static deployContract(name, code, sender) {
        let tx = new Tx(3, sender);
        tx.deployContract = {
            name,
            code
        };
        return tx;
    }
}
export class Chain {
    sessionId;
    blockHeight = 1;
    constructor(sessionId){
        this.sessionId = sessionId;
    }
    mineBlock(transactions) {
        // @ts-ignore
        let result = JSON.parse(Deno.core.opSync("api/v1/mine_block", {
            sessionId: this.sessionId,
            transactions: transactions
        }));
        this.blockHeight = result.block_height;
        let block = {
            height: result.block_height,
            receipts: result.receipts
        };
        return block;
    }
    mineEmptyBlock(count) {
        let result = JSON.parse(// @ts-ignore
        Deno.core.opSync("api/v1/mine_empty_blocks", {
            sessionId: this.sessionId,
            count: count
        }));
        this.blockHeight = result.block_height;
        let emptyBlock = {
            session_id: result.session_id,
            block_height: result.block_height
        };
        return emptyBlock;
    }
    mineEmptyBlockUntil(targetBlockHeight) {
        let count = targetBlockHeight - this.blockHeight;
        if (count < 0) {
            throw new Error(`Chain tip cannot be moved from ${this.blockHeight} to ${targetBlockHeight}`);
        }
        return this.mineEmptyBlock(count);
    }
    callReadOnlyFn(contract, method, args, sender) {
        let result = JSON.parse(// @ts-ignore
        Deno.core.opSync("api/v1/call_read_only_fn", {
            sessionId: this.sessionId,
            contract: contract,
            method: method,
            args: args,
            sender: sender
        }));
        let readOnlyFn = {
            session_id: result.session_id,
            result: result.result,
            events: result.events
        };
        return readOnlyFn;
    }
    getAssetsMaps() {
        let result = JSON.parse(// @ts-ignore
        Deno.core.opSync("api/v1/get_assets_maps", {
            sessionId: this.sessionId
        }));
        let assetsMaps = {
            session_id: result.session_id,
            assets: result.assets
        };
        return assetsMaps;
    }
}
export class Clarinet {
    static test(options) {
        // @ts-ignore
        Deno.test({
            name: options.name,
            only: options.only,
            ignore: options.ignore,
            async fn () {
                let hasPreDeploymentSteps = options.preDeployment !== undefined;
                let result = JSON.parse(// @ts-ignore
                Deno.core.opSync("api/v1/new_session", {
                    name: options.name,
                    loadDeployment: !hasPreDeploymentSteps,
                    deploymentPath: options.deploymentPath
                }));
                if (options.preDeployment) {
                    let chain = new Chain(result["session_id"]);
                    let accounts = new Map();
                    for (let account of result["accounts"]){
                        accounts.set(account.name, account);
                    }
                    await options.preDeployment(chain, accounts);
                    result = JSON.parse(// @ts-ignore
                    Deno.core.opSync("api/v1/load_deployment", {
                        sessionId: chain.sessionId,
                        deploymentPath: options.deploymentPath
                    }));
                }
                let chain1 = new Chain(result["session_id"]);
                let accounts1 = new Map();
                for (let account1 of result["accounts"]){
                    accounts1.set(account1.name, account1);
                }
                let contracts = new Map();
                for (let contract of result["contracts"]){
                    contracts.set(contract.contract_id, contract);
                }
                await options.fn(chain1, accounts1, contracts);
                // @ts-ignore
                JSON.parse(Deno.core.opSync("api/v1/terminate_session", {
                    sessionId: chain1.sessionId
                }));
            }
        });
    }
    static run(options) {
        // @ts-ignore
        Deno.test({
            name: "running script",
            async fn () {
                let result = JSON.parse(// @ts-ignore
                Deno.core.opSync("api/v1/new_session", {
                    name: "running script",
                    loadDeployment: true,
                    deploymentPath: undefined
                }));
                let accounts = new Map();
                for (let account of result["accounts"]){
                    accounts.set(account.name, account);
                }
                let contracts = new Map();
                for (let contract of result["contracts"]){
                    contracts.set(contract.contract_id, contract);
                }
                let stacks_node = {
                    url: result["stacks_node_url"]
                };
                await options.fn(accounts, contracts, stacks_node);
            }
        });
    }
}
export var types;
(function(types) {
    const byteToHex = [];
    for(let n = 0; n <= 0xff; ++n){
        const hexOctet = n.toString(16).padStart(2, "0");
        byteToHex.push(hexOctet);
    }
    function serializeTuple(input) {
        let items = [];
        for (var [key, value] of Object.entries(input)){
            if (typeof value === "object") {
                items.push(`${key}: { ${serializeTuple(value)} }`);
            } else if (Array.isArray(value)) {
            // todo(ludo): not supported, should panic
            } else {
                items.push(`${key}: ${value}`);
            }
        }
        return items.join(", ");
    }
    function isObject(obj) {
        return typeof obj === "object" && !Array.isArray(obj);
    }
    function ok(val) {
        return `(ok ${val})`;
    }
    types.ok = ok;
    function err(val) {
        return `(err ${val})`;
    }
    types.err = err;
    function some(val) {
        return `(some ${val})`;
    }
    types.some = some;
    function none() {
        return `none`;
    }
    types.none = none;
    function bool(val) {
        return `${val}`;
    }
    types.bool = bool;
    function int(val) {
        return `${val}`;
    }
    types.int = int;
    function uint(val) {
        return `u${val}`;
    }
    types.uint = uint;
    function ascii(val) {
        return JSON.stringify(val);
    }
    types.ascii = ascii;
    function utf8(val) {
        return `u${JSON.stringify(val)}`;
    }
    types.utf8 = utf8;
    function buff(val) {
        const buff = typeof val == "string" ? new TextEncoder().encode(val) : new Uint8Array(val);
        const hexOctets = new Array(buff.length);
        for(let i = 0; i < buff.length; ++i){
            hexOctets[i] = byteToHex[buff[i]];
        }
        return `0x${hexOctets.join("")}`;
    }
    types.buff = buff;
    function list(val) {
        return `(list ${val.join(" ")})`;
    }
    types.list = list;
    function principal(val) {
        return `'${val}`;
    }
    types.principal = principal;
    function tuple(val) {
        return `{ ${serializeTuple(val)} }`;
    }
    types.tuple = tuple;
})(types || (types = {}));
function consume(src, expectation, wrapped) {
    let dst = (" " + src).slice(1);
    let size = expectation.length;
    if (!wrapped && src !== expectation) {
        throw new Error(`Expected ${green(expectation.toString())}, got ${red(src.toString())}`);
    }
    if (wrapped) {
        size += 2;
    }
    if (dst.length < size) {
        throw new Error(`Expected ${green(expectation.toString())}, got ${red(src.toString())}`);
    }
    if (wrapped) {
        dst = dst.substring(1, dst.length - 1);
    }
    let res = dst.slice(0, expectation.length);
    if (res !== expectation) {
        throw new Error(`Expected ${green(expectation.toString())}, got ${red(src.toString())}`);
    }
    let leftPad = 0;
    if (dst.charAt(expectation.length) === " ") {
        leftPad = 1;
    }
    let remainder = dst.substring(expectation.length + leftPad);
    return remainder;
}
String.prototype.expectOk = function() {
    return consume(this, "ok", true);
};
String.prototype.expectErr = function() {
    return consume(this, "err", true);
};
String.prototype.expectSome = function() {
    return consume(this, "some", true);
};
String.prototype.expectNone = function() {
    return consume(this, "none", false);
};
String.prototype.expectBool = function(value) {
    try {
        consume(this, `${value}`, false);
    } catch (error) {
        throw error;
    }
    return value;
};
String.prototype.expectUint = function(value) {
    try {
        consume(this, `u${value}`, false);
    } catch (error) {
        throw error;
    }
    return BigInt(value);
};
String.prototype.expectInt = function(value) {
    try {
        consume(this, `${value}`, false);
    } catch (error) {
        throw error;
    }
    return BigInt(value);
};
String.prototype.expectBuff = function(value) {
    let buffer = types.buff(value);
    if (this !== buffer) {
        throw new Error(`Expected ${green(buffer)}, got ${red(this.toString())}`);
    }
    return value;
};
String.prototype.expectAscii = function(value) {
    try {
        consume(this, `"${value}"`, false);
    } catch (error) {
        throw error;
    }
    return value;
};
String.prototype.expectUtf8 = function(value) {
    try {
        consume(this, `u"${value}"`, false);
    } catch (error) {
        throw error;
    }
    return value;
};
String.prototype.expectPrincipal = function(value) {
    try {
        consume(this, `${value}`, false);
    } catch (error) {
        throw error;
    }
    return value;
};
String.prototype.expectList = function() {
    if (this.charAt(0) !== "[" || this.charAt(this.length - 1) !== "]") {
        throw new Error(`Expected ${green("(list ...)")}, got ${red(this.toString())}`);
    }
    let stack = [];
    let elements = [];
    let start = 1;
    for(var i = 0; i < this.length; i++){
        if (this.charAt(i) === "," && stack.length == 1) {
            elements.push(this.substring(start, i));
            start = i + 2;
        }
        if ([
            "(",
            "[",
            "{"
        ].includes(this.charAt(i))) {
            stack.push(this.charAt(i));
        }
        if (this.charAt(i) === ")" && stack[stack.length - 1] === "(") {
            stack.pop();
        }
        if (this.charAt(i) === "}" && stack[stack.length - 1] === "{") {
            stack.pop();
        }
        if (this.charAt(i) === "]" && stack[stack.length - 1] === "[") {
            stack.pop();
        }
    }
    let remainder = this.substring(start, this.length - 1);
    if (remainder.length > 0) {
        elements.push(remainder);
    }
    return elements;
};
String.prototype.expectTuple = function() {
    if (this.charAt(0) !== "{" || this.charAt(this.length - 1) !== "}") {
        throw new Error(`Expected ${green("(tuple ...)")}, got ${red(this.toString())}`);
    }
    let start = 1;
    let stack = [];
    let elements = [];
    for(var i = 0; i < this.length; i++){
        if (this.charAt(i) === "," && stack.length == 1) {
            elements.push(this.substring(start, i));
            start = i + 2;
        }
        if ([
            "(",
            "[",
            "{"
        ].includes(this.charAt(i))) {
            stack.push(this.charAt(i));
        }
        if (this.charAt(i) === ")" && stack[stack.length - 1] === "(") {
            stack.pop();
        }
        if (this.charAt(i) === "}" && stack[stack.length - 1] === "{") {
            stack.pop();
        }
        if (this.charAt(i) === "]" && stack[stack.length - 1] === "[") {
            stack.pop();
        }
    }
    let remainder = this.substring(start, this.length - 1);
    if (remainder.length > 0) {
        elements.push(remainder);
    }
    let tuple = {};
    for (let element of elements){
        for(var i = 0; i < element.length; i++){
            if (element.charAt(i) === ":") {
                let key = element.substring(0, i);
                let value = element.substring(i + 2, element.length);
                tuple[key] = value;
                break;
            }
        }
    }
    return tuple;
};
Array.prototype.expectSTXTransferEvent = function(amount, sender, recipient) {
    for (let event of this){
        try {
            let e = {};
            e["amount"] = event.stx_transfer_event.amount.expectInt(amount);
            e["sender"] = event.stx_transfer_event.sender.expectPrincipal(sender);
            e["recipient"] = event.stx_transfer_event.recipient.expectPrincipal(recipient);
            return e;
        } catch (error) {
            continue;
        }
    }
    throw new Error(`Unable to retrieve expected STXTransferEvent`);
};
Array.prototype.expectFungibleTokenTransferEvent = function(amount, sender, recipient, assetId) {
    for (let event of this){
        try {
            let e = {};
            e["amount"] = event.ft_transfer_event.amount.expectInt(amount);
            e["sender"] = event.ft_transfer_event.sender.expectPrincipal(sender);
            e["recipient"] = event.ft_transfer_event.recipient.expectPrincipal(recipient);
            if (event.ft_transfer_event.asset_identifier.endsWith(assetId)) {
                e["assetId"] = event.ft_transfer_event.asset_identifier;
            } else {
                continue;
            }
            return e;
        } catch (error) {
            continue;
        }
    }
    throw new Error(`Unable to retrieve expected FungibleTokenTransferEvent(${amount}, ${sender}, ${recipient}, ${assetId})\n${JSON.stringify(this)}`);
};
Array.prototype.expectFungibleTokenMintEvent = function(amount, recipient, assetId) {
    for (let event of this){
        try {
            let e = {};
            e["amount"] = event.ft_mint_event.amount.expectInt(amount);
            e["recipient"] = event.ft_mint_event.recipient.expectPrincipal(recipient);
            if (event.ft_mint_event.asset_identifier.endsWith(assetId)) {
                e["assetId"] = event.ft_mint_event.asset_identifier;
            } else {
                continue;
            }
            return e;
        } catch (error) {
            continue;
        }
    }
    throw new Error(`Unable to retrieve expected FungibleTokenMintEvent`);
};
Array.prototype.expectFungibleTokenBurnEvent = function(amount, sender, assetId) {
    for (let event of this){
        try {
            let e = {};
            e["amount"] = event.ft_burn_event.amount.expectInt(amount);
            e["sender"] = event.ft_burn_event.sender.expectPrincipal(sender);
            if (event.ft_burn_event.asset_identifier.endsWith(assetId)) {
                e["assetId"] = event.ft_burn_event.asset_identifier;
            } else {
                continue;
            }
            return e;
        } catch (error) {
            continue;
        }
    }
    throw new Error(`Unable to retrieve expected FungibleTokenBurnEvent`);
};
Array.prototype.expectPrintEvent = function(contract_identifier, value) {
    for (let event of this){
        try {
            let e = {};
            e["contract_identifier"] = event.contract_event.contract_identifier.expectPrincipal(contract_identifier);
            if (event.contract_event.topic.endsWith("print")) {
                e["topic"] = event.contract_event.topic;
            } else {
                continue;
            }
            if (event.contract_event.value.endsWith(value)) {
                e["value"] = event.contract_event.value;
            } else {
                continue;
            }
            return e;
        } catch (error) {
            continue;
        }
    }
    throw new Error(`Unable to retrieve expected PrintEvent`);
};
// Array.prototype.expectEvent = function(sel: (e: Object) => Object) {
//     for (let event of this) {
//         try {
//             sel(event);
//             return event as Object;
//         } catch (error) {
//             continue;
//         }
//     }
//     throw new Error(`Unable to retrieve expected PrintEvent`);
// }
Array.prototype.expectNonFungibleTokenTransferEvent = function(tokenId, sender, recipient, assetAddress, assetId) {
    for (let event of this){
        try {
            let e = {};
            if (event.nft_transfer_event.value === tokenId) {
                e["tokenId"] = event.nft_transfer_event.value;
            } else {
                continue;
            }
            e["sender"] = event.nft_transfer_event.sender.expectPrincipal(sender);
            e["recipient"] = event.nft_transfer_event.recipient.expectPrincipal(recipient);
            if (event.nft_transfer_event.asset_identifier === `${assetAddress}::${assetId}`) {
                e["assetId"] = event.nft_transfer_event.asset_identifier;
            } else {
                continue;
            }
            return e;
        } catch (error) {
            continue;
        }
    }
    throw new Error(`Unable to retrieve expected NonFungibleTokenTransferEvent`);
};
Array.prototype.expectNonFungibleTokenMintEvent = function(tokenId, recipient, assetAddress, assetId) {
    for (let event of this){
        try {
            let e = {};
            if (event.nft_mint_event.value === tokenId) {
                e["tokenId"] = event.nft_mint_event.value;
            } else {
                continue;
            }
            e["recipient"] = event.nft_mint_event.recipient.expectPrincipal(recipient);
            if (event.nft_mint_event.asset_identifier === `${assetAddress}::${assetId}`) {
                e["assetId"] = event.nft_mint_event.asset_identifier;
            } else {
                continue;
            }
            return e;
        } catch (error) {
            continue;
        }
    }
    throw new Error(`Unable to retrieve expected NonFungibleTokenMintEvent`);
};
Array.prototype.expectNonFungibleTokenBurnEvent = function(tokenId, sender, assetAddress, assetId) {
    for (let event of this){
        try {
            let e = {};
            if (event.nft_burn_event.value === tokenId) {
                e["tokenId"] = event.nft_burn_event.value;
            } else {
                continue;
            }
            e["sender"] = event.nft_burn_event.sender.expectPrincipal(sender);
            if (event.nft_burn_event.asset_identifier === `${assetAddress}::${assetId}`) {
                e["assetId"] = event.nft_burn_event.asset_identifier;
            } else {
                continue;
            }
            return e;
        } catch (error) {
            continue;
        }
    }
    throw new Error(`Unable to retrieve expected NonFungibleTokenBurnEvent`);
};
const noColor = globalThis.Deno?.noColor ?? true;
let enabled = !noColor;
function code(open, close) {
    return {
        open: `\x1b[${open.join(";")}m`,
        close: `\x1b[${close}m`,
        regexp: new RegExp(`\\x1b\\[${close}m`, "g")
    };
}
function run(str, code) {
    return enabled ? `${code.open}${str.replace(code.regexp, code.open)}${code.close}` : str;
}
export function red(str) {
    return run(str, code([
        31
    ], 39));
}
export function green(str) {
    return run(str, code([
        32
    ], 39));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xhcmluZXRAdjEuMC4zL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjbGFzcyBUeCB7XG4gIHR5cGU6IG51bWJlcjtcbiAgc2VuZGVyOiBzdHJpbmc7XG4gIGNvbnRyYWN0Q2FsbD86IFR4Q29udHJhY3RDYWxsO1xuICB0cmFuc2ZlclN0eD86IFR4VHJhbnNmZXI7XG4gIGRlcGxveUNvbnRyYWN0PzogVHhEZXBsb3lDb250cmFjdDtcblxuICBjb25zdHJ1Y3Rvcih0eXBlOiBudW1iZXIsIHNlbmRlcjogc3RyaW5nKSB7XG4gICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICB0aGlzLnNlbmRlciA9IHNlbmRlcjtcbiAgfVxuXG4gIHN0YXRpYyB0cmFuc2ZlclNUWChhbW91bnQ6IG51bWJlciwgcmVjaXBpZW50OiBzdHJpbmcsIHNlbmRlcjogc3RyaW5nKSB7XG4gICAgbGV0IHR4ID0gbmV3IFR4KDEsIHNlbmRlcik7XG4gICAgdHgudHJhbnNmZXJTdHggPSB7XG4gICAgICByZWNpcGllbnQsXG4gICAgICBhbW91bnQsXG4gICAgfTtcbiAgICByZXR1cm4gdHg7XG4gIH1cblxuICBzdGF0aWMgY29udHJhY3RDYWxsKFxuICAgIGNvbnRyYWN0OiBzdHJpbmcsXG4gICAgbWV0aG9kOiBzdHJpbmcsXG4gICAgYXJnczogQXJyYXk8c3RyaW5nPixcbiAgICBzZW5kZXI6IHN0cmluZyxcbiAgKSB7XG4gICAgbGV0IHR4ID0gbmV3IFR4KDIsIHNlbmRlcik7XG4gICAgdHguY29udHJhY3RDYWxsID0ge1xuICAgICAgY29udHJhY3QsXG4gICAgICBtZXRob2QsXG4gICAgICBhcmdzLFxuICAgIH07XG4gICAgcmV0dXJuIHR4O1xuICB9XG5cbiAgc3RhdGljIGRlcGxveUNvbnRyYWN0KG5hbWU6IHN0cmluZywgY29kZTogc3RyaW5nLCBzZW5kZXI6IHN0cmluZykge1xuICAgIGxldCB0eCA9IG5ldyBUeCgzLCBzZW5kZXIpO1xuICAgIHR4LmRlcGxveUNvbnRyYWN0ID0ge1xuICAgICAgbmFtZSxcbiAgICAgIGNvZGUsXG4gICAgfTtcbiAgICByZXR1cm4gdHg7XG4gIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBUeENvbnRyYWN0Q2FsbCB7XG4gIGNvbnRyYWN0OiBzdHJpbmc7XG4gIG1ldGhvZDogc3RyaW5nO1xuICBhcmdzOiBBcnJheTxzdHJpbmc+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFR4RGVwbG95Q29udHJhY3Qge1xuICBjb2RlOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBUeFRyYW5zZmVyIHtcbiAgYW1vdW50OiBudW1iZXI7XG4gIHJlY2lwaWVudDogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFR4UmVjZWlwdCB7XG4gIHJlc3VsdDogc3RyaW5nO1xuICBldmVudHM6IEFycmF5PGFueT47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQmxvY2sge1xuICBoZWlnaHQ6IG51bWJlcjtcbiAgcmVjZWlwdHM6IEFycmF5PFR4UmVjZWlwdD47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQWNjb3VudCB7XG4gIGFkZHJlc3M6IHN0cmluZztcbiAgYmFsYW5jZTogbnVtYmVyO1xuICBuYW1lOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2hhaW4ge1xuICBzZXNzaW9uSWQ6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSZWFkT25seUZuIHtcbiAgc2Vzc2lvbl9pZDogbnVtYmVyO1xuICByZXN1bHQ6IHN0cmluZztcbiAgZXZlbnRzOiBBcnJheTxhbnk+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEVtcHR5QmxvY2sge1xuICBzZXNzaW9uX2lkOiBudW1iZXI7XG4gIGJsb2NrX2hlaWdodDogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEFzc2V0c01hcHMge1xuICBzZXNzaW9uX2lkOiBudW1iZXI7XG4gIGFzc2V0czoge1xuICAgIFtuYW1lOiBzdHJpbmddOiB7XG4gICAgICBbb3duZXI6IHN0cmluZ106IG51bWJlcjtcbiAgICB9O1xuICB9O1xufVxuXG5leHBvcnQgY2xhc3MgQ2hhaW4ge1xuICBzZXNzaW9uSWQ6IG51bWJlcjtcbiAgYmxvY2tIZWlnaHQ6IG51bWJlciA9IDE7XG5cbiAgY29uc3RydWN0b3Ioc2Vzc2lvbklkOiBudW1iZXIpIHtcbiAgICB0aGlzLnNlc3Npb25JZCA9IHNlc3Npb25JZDtcbiAgfVxuXG4gIG1pbmVCbG9jayh0cmFuc2FjdGlvbnM6IEFycmF5PFR4Pik6IEJsb2NrIHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgbGV0IHJlc3VsdCA9IEpTT04ucGFyc2UoRGVuby5jb3JlLm9wU3luYyhcImFwaS92MS9taW5lX2Jsb2NrXCIsIHtcbiAgICAgIHNlc3Npb25JZDogdGhpcy5zZXNzaW9uSWQsXG4gICAgICB0cmFuc2FjdGlvbnM6IHRyYW5zYWN0aW9ucyxcbiAgICB9KSk7XG4gICAgdGhpcy5ibG9ja0hlaWdodCA9IHJlc3VsdC5ibG9ja19oZWlnaHQ7XG4gICAgbGV0IGJsb2NrOiBCbG9jayA9IHtcbiAgICAgIGhlaWdodDogcmVzdWx0LmJsb2NrX2hlaWdodCxcbiAgICAgIHJlY2VpcHRzOiByZXN1bHQucmVjZWlwdHMsXG4gICAgfTtcbiAgICByZXR1cm4gYmxvY2s7XG4gIH1cblxuICBtaW5lRW1wdHlCbG9jayhjb3VudDogbnVtYmVyKTogRW1wdHlCbG9jayB7XG4gICAgbGV0IHJlc3VsdCA9IEpTT04ucGFyc2UoXG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICBEZW5vLmNvcmUub3BTeW5jKFwiYXBpL3YxL21pbmVfZW1wdHlfYmxvY2tzXCIsIHtcbiAgICAgICAgc2Vzc2lvbklkOiB0aGlzLnNlc3Npb25JZCxcbiAgICAgICAgY291bnQ6IGNvdW50LFxuICAgICAgfSksXG4gICAgKTtcbiAgICB0aGlzLmJsb2NrSGVpZ2h0ID0gcmVzdWx0LmJsb2NrX2hlaWdodDtcbiAgICBsZXQgZW1wdHlCbG9jazogRW1wdHlCbG9jayA9IHtcbiAgICAgIHNlc3Npb25faWQ6IHJlc3VsdC5zZXNzaW9uX2lkLFxuICAgICAgYmxvY2tfaGVpZ2h0OiByZXN1bHQuYmxvY2tfaGVpZ2h0LFxuICAgIH07XG4gICAgcmV0dXJuIGVtcHR5QmxvY2s7XG4gIH1cblxuICBtaW5lRW1wdHlCbG9ja1VudGlsKHRhcmdldEJsb2NrSGVpZ2h0OiBudW1iZXIpOiBFbXB0eUJsb2NrIHtcbiAgICBsZXQgY291bnQgPSB0YXJnZXRCbG9ja0hlaWdodCAtIHRoaXMuYmxvY2tIZWlnaHQ7XG4gICAgaWYgKGNvdW50IDwgMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgQ2hhaW4gdGlwIGNhbm5vdCBiZSBtb3ZlZCBmcm9tICR7dGhpcy5ibG9ja0hlaWdodH0gdG8gJHt0YXJnZXRCbG9ja0hlaWdodH1gLFxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMubWluZUVtcHR5QmxvY2soY291bnQpO1xuICB9XG5cbiAgY2FsbFJlYWRPbmx5Rm4oXG4gICAgY29udHJhY3Q6IHN0cmluZyxcbiAgICBtZXRob2Q6IHN0cmluZyxcbiAgICBhcmdzOiBBcnJheTxhbnk+LFxuICAgIHNlbmRlcjogc3RyaW5nLFxuICApOiBSZWFkT25seUZuIHtcbiAgICBsZXQgcmVzdWx0ID0gSlNPTi5wYXJzZShcbiAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgIERlbm8uY29yZS5vcFN5bmMoXCJhcGkvdjEvY2FsbF9yZWFkX29ubHlfZm5cIiwge1xuICAgICAgICBzZXNzaW9uSWQ6IHRoaXMuc2Vzc2lvbklkLFxuICAgICAgICBjb250cmFjdDogY29udHJhY3QsXG4gICAgICAgIG1ldGhvZDogbWV0aG9kLFxuICAgICAgICBhcmdzOiBhcmdzLFxuICAgICAgICBzZW5kZXI6IHNlbmRlcixcbiAgICAgIH0pLFxuICAgICk7XG4gICAgbGV0IHJlYWRPbmx5Rm46IFJlYWRPbmx5Rm4gPSB7XG4gICAgICBzZXNzaW9uX2lkOiByZXN1bHQuc2Vzc2lvbl9pZCxcbiAgICAgIHJlc3VsdDogcmVzdWx0LnJlc3VsdCxcbiAgICAgIGV2ZW50czogcmVzdWx0LmV2ZW50cyxcbiAgICB9O1xuICAgIHJldHVybiByZWFkT25seUZuO1xuICB9XG5cbiAgZ2V0QXNzZXRzTWFwcygpOiBBc3NldHNNYXBzIHtcbiAgICBsZXQgcmVzdWx0ID0gSlNPTi5wYXJzZShcbiAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgIERlbm8uY29yZS5vcFN5bmMoXCJhcGkvdjEvZ2V0X2Fzc2V0c19tYXBzXCIsIHtcbiAgICAgICAgc2Vzc2lvbklkOiB0aGlzLnNlc3Npb25JZCxcbiAgICAgIH0pLFxuICAgICk7XG4gICAgbGV0IGFzc2V0c01hcHM6IEFzc2V0c01hcHMgPSB7XG4gICAgICBzZXNzaW9uX2lkOiByZXN1bHQuc2Vzc2lvbl9pZCxcbiAgICAgIGFzc2V0czogcmVzdWx0LmFzc2V0cyxcbiAgICB9O1xuICAgIHJldHVybiBhc3NldHNNYXBzO1xuICB9XG59XG5cbnR5cGUgUHJlRGVwbG95bWVudEZ1bmN0aW9uID0gKFxuICBjaGFpbjogQ2hhaW4sXG4gIGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50PixcbikgPT4gdm9pZCB8IFByb21pc2U8dm9pZD47XG5cbnR5cGUgVGVzdEZ1bmN0aW9uID0gKFxuICBjaGFpbjogQ2hhaW4sXG4gIGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50PixcbiAgY29udHJhY3RzOiBNYXA8c3RyaW5nLCBDb250cmFjdD4sXG4pID0+IHZvaWQgfCBQcm9taXNlPHZvaWQ+O1xudHlwZSBQcmVTZXR1cEZ1bmN0aW9uID0gKCkgPT4gQXJyYXk8VHg+O1xuXG5pbnRlcmZhY2UgVW5pdFRlc3RPcHRpb25zIHtcbiAgbmFtZTogc3RyaW5nO1xuICBvbmx5PzogdHJ1ZTtcbiAgaWdub3JlPzogdHJ1ZTtcbiAgZGVwbG95bWVudFBhdGg/OiBzdHJpbmc7XG4gIHByZURlcGxveW1lbnQ/OiBQcmVEZXBsb3ltZW50RnVuY3Rpb247XG4gIGZuOiBUZXN0RnVuY3Rpb247XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29udHJhY3Qge1xuICBjb250cmFjdF9pZDogc3RyaW5nO1xuICBzb3VyY2U6IHN0cmluZztcbiAgY29udHJhY3RfaW50ZXJmYWNlOiBhbnk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3RhY2tzTm9kZSB7XG4gIHVybDogc3RyaW5nO1xufVxuXG50eXBlIFNjcmlwdEZ1bmN0aW9uID0gKFxuICBhY2NvdW50czogTWFwPHN0cmluZywgQWNjb3VudD4sXG4gIGNvbnRyYWN0czogTWFwPHN0cmluZywgQ29udHJhY3Q+LFxuICBub2RlOiBTdGFja3NOb2RlLFxuKSA9PiB2b2lkIHwgUHJvbWlzZTx2b2lkPjtcblxuaW50ZXJmYWNlIFNjcmlwdE9wdGlvbnMge1xuICBmbjogU2NyaXB0RnVuY3Rpb247XG59XG5cbmV4cG9ydCBjbGFzcyBDbGFyaW5ldCB7XG4gIHN0YXRpYyB0ZXN0KG9wdGlvbnM6IFVuaXRUZXN0T3B0aW9ucykge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBEZW5vLnRlc3Qoe1xuICAgICAgbmFtZTogb3B0aW9ucy5uYW1lLFxuICAgICAgb25seTogb3B0aW9ucy5vbmx5LFxuICAgICAgaWdub3JlOiBvcHRpb25zLmlnbm9yZSxcbiAgICAgIGFzeW5jIGZuKCkge1xuICAgICAgICBsZXQgaGFzUHJlRGVwbG95bWVudFN0ZXBzID0gb3B0aW9ucy5wcmVEZXBsb3ltZW50ICE9PSB1bmRlZmluZWQ7XG5cbiAgICAgICAgbGV0IHJlc3VsdCA9IEpTT04ucGFyc2UoXG4gICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgIERlbm8uY29yZS5vcFN5bmMoXCJhcGkvdjEvbmV3X3Nlc3Npb25cIiwge1xuICAgICAgICAgICAgbmFtZTogb3B0aW9ucy5uYW1lLFxuICAgICAgICAgICAgbG9hZERlcGxveW1lbnQ6ICFoYXNQcmVEZXBsb3ltZW50U3RlcHMsXG4gICAgICAgICAgICBkZXBsb3ltZW50UGF0aDogb3B0aW9ucy5kZXBsb3ltZW50UGF0aCxcbiAgICAgICAgICB9KSxcbiAgICAgICAgKTtcblxuICAgICAgICBpZiAob3B0aW9ucy5wcmVEZXBsb3ltZW50KSB7XG4gICAgICAgICAgbGV0IGNoYWluID0gbmV3IENoYWluKHJlc3VsdFtcInNlc3Npb25faWRcIl0pO1xuICAgICAgICAgIGxldCBhY2NvdW50czogTWFwPHN0cmluZywgQWNjb3VudD4gPSBuZXcgTWFwKCk7XG4gICAgICAgICAgZm9yIChsZXQgYWNjb3VudCBvZiByZXN1bHRbXCJhY2NvdW50c1wiXSkge1xuICAgICAgICAgICAgYWNjb3VudHMuc2V0KGFjY291bnQubmFtZSwgYWNjb3VudCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGF3YWl0IG9wdGlvbnMucHJlRGVwbG95bWVudChjaGFpbiwgYWNjb3VudHMpO1xuXG4gICAgICAgICAgcmVzdWx0ID0gSlNPTi5wYXJzZShcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIERlbm8uY29yZS5vcFN5bmMoXCJhcGkvdjEvbG9hZF9kZXBsb3ltZW50XCIsIHtcbiAgICAgICAgICAgICAgc2Vzc2lvbklkOiBjaGFpbi5zZXNzaW9uSWQsXG4gICAgICAgICAgICAgIGRlcGxveW1lbnRQYXRoOiBvcHRpb25zLmRlcGxveW1lbnRQYXRoLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBjaGFpbiA9IG5ldyBDaGFpbihyZXN1bHRbXCJzZXNzaW9uX2lkXCJdKTtcbiAgICAgICAgbGV0IGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50PiA9IG5ldyBNYXAoKTtcbiAgICAgICAgZm9yIChsZXQgYWNjb3VudCBvZiByZXN1bHRbXCJhY2NvdW50c1wiXSkge1xuICAgICAgICAgIGFjY291bnRzLnNldChhY2NvdW50Lm5hbWUsIGFjY291bnQpO1xuICAgICAgICB9XG4gICAgICAgIGxldCBjb250cmFjdHM6IE1hcDxzdHJpbmcsIENvbnRyYWN0PiA9IG5ldyBNYXAoKTtcbiAgICAgICAgZm9yIChsZXQgY29udHJhY3Qgb2YgcmVzdWx0W1wiY29udHJhY3RzXCJdKSB7XG4gICAgICAgICAgY29udHJhY3RzLnNldChjb250cmFjdC5jb250cmFjdF9pZCwgY29udHJhY3QpO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IG9wdGlvbnMuZm4oY2hhaW4sIGFjY291bnRzLCBjb250cmFjdHMpO1xuXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgSlNPTi5wYXJzZShEZW5vLmNvcmUub3BTeW5jKFwiYXBpL3YxL3Rlcm1pbmF0ZV9zZXNzaW9uXCIsIHtcbiAgICAgICAgICBzZXNzaW9uSWQ6IGNoYWluLnNlc3Npb25JZCxcbiAgICAgICAgfSkpO1xuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBydW4ob3B0aW9uczogU2NyaXB0T3B0aW9ucykge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBEZW5vLnRlc3Qoe1xuICAgICAgbmFtZTogXCJydW5uaW5nIHNjcmlwdFwiLFxuICAgICAgYXN5bmMgZm4oKSB7XG4gICAgICAgIGxldCByZXN1bHQgPSBKU09OLnBhcnNlKFxuICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICBEZW5vLmNvcmUub3BTeW5jKFwiYXBpL3YxL25ld19zZXNzaW9uXCIsIHtcbiAgICAgICAgICAgIG5hbWU6IFwicnVubmluZyBzY3JpcHRcIixcbiAgICAgICAgICAgIGxvYWREZXBsb3ltZW50OiB0cnVlLFxuICAgICAgICAgICAgZGVwbG95bWVudFBhdGg6IHVuZGVmaW5lZCxcbiAgICAgICAgICB9KSxcbiAgICAgICAgKTtcbiAgICAgICAgbGV0IGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50PiA9IG5ldyBNYXAoKTtcbiAgICAgICAgZm9yIChsZXQgYWNjb3VudCBvZiByZXN1bHRbXCJhY2NvdW50c1wiXSkge1xuICAgICAgICAgIGFjY291bnRzLnNldChhY2NvdW50Lm5hbWUsIGFjY291bnQpO1xuICAgICAgICB9XG4gICAgICAgIGxldCBjb250cmFjdHM6IE1hcDxzdHJpbmcsIENvbnRyYWN0PiA9IG5ldyBNYXAoKTtcbiAgICAgICAgZm9yIChsZXQgY29udHJhY3Qgb2YgcmVzdWx0W1wiY29udHJhY3RzXCJdKSB7XG4gICAgICAgICAgY29udHJhY3RzLnNldChjb250cmFjdC5jb250cmFjdF9pZCwgY29udHJhY3QpO1xuICAgICAgICB9XG4gICAgICAgIGxldCBzdGFja3Nfbm9kZTogU3RhY2tzTm9kZSA9IHtcbiAgICAgICAgICB1cmw6IHJlc3VsdFtcInN0YWNrc19ub2RlX3VybFwiXSxcbiAgICAgICAgfTtcbiAgICAgICAgYXdhaXQgb3B0aW9ucy5mbihhY2NvdW50cywgY29udHJhY3RzLCBzdGFja3Nfbm9kZSk7XG4gICAgICB9LFxuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBuYW1lc3BhY2UgdHlwZXMge1xuICBjb25zdCBieXRlVG9IZXg6IGFueSA9IFtdO1xuICBmb3IgKGxldCBuID0gMDsgbiA8PSAweGZmOyArK24pIHtcbiAgICBjb25zdCBoZXhPY3RldCA9IG4udG9TdHJpbmcoMTYpLnBhZFN0YXJ0KDIsIFwiMFwiKTtcbiAgICBieXRlVG9IZXgucHVzaChoZXhPY3RldCk7XG4gIH1cblxuICBmdW5jdGlvbiBzZXJpYWxpemVUdXBsZShpbnB1dDogT2JqZWN0KSB7XG4gICAgbGV0IGl0ZW1zOiBBcnJheTxzdHJpbmc+ID0gW107XG4gICAgZm9yICh2YXIgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKGlucHV0KSkge1xuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICBpdGVtcy5wdXNoKGAke2tleX06IHsgJHtzZXJpYWxpemVUdXBsZSh2YWx1ZSl9IH1gKTtcbiAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgLy8gdG9kbyhsdWRvKTogbm90IHN1cHBvcnRlZCwgc2hvdWxkIHBhbmljXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpdGVtcy5wdXNoKGAke2tleX06ICR7dmFsdWV9YCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBpdGVtcy5qb2luKFwiLCBcIik7XG4gIH1cblxuICBmdW5jdGlvbiBpc09iamVjdChvYmo6IGFueSkge1xuICAgIHJldHVybiB0eXBlb2Ygb2JqID09PSBcIm9iamVjdFwiICYmICFBcnJheS5pc0FycmF5KG9iaik7XG4gIH1cblxuICBleHBvcnQgZnVuY3Rpb24gb2sodmFsOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gYChvayAke3ZhbH0pYDtcbiAgfVxuXG4gIGV4cG9ydCBmdW5jdGlvbiBlcnIodmFsOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gYChlcnIgJHt2YWx9KWA7XG4gIH1cblxuICBleHBvcnQgZnVuY3Rpb24gc29tZSh2YWw6IHN0cmluZykge1xuICAgIHJldHVybiBgKHNvbWUgJHt2YWx9KWA7XG4gIH1cblxuICBleHBvcnQgZnVuY3Rpb24gbm9uZSgpIHtcbiAgICByZXR1cm4gYG5vbmVgO1xuICB9XG5cbiAgZXhwb3J0IGZ1bmN0aW9uIGJvb2wodmFsOiBib29sZWFuKSB7XG4gICAgcmV0dXJuIGAke3ZhbH1gO1xuICB9XG5cbiAgZXhwb3J0IGZ1bmN0aW9uIGludCh2YWw6IG51bWJlciB8IGJpZ2ludCkge1xuICAgIHJldHVybiBgJHt2YWx9YDtcbiAgfVxuXG4gIGV4cG9ydCBmdW5jdGlvbiB1aW50KHZhbDogbnVtYmVyIHwgYmlnaW50KSB7XG4gICAgcmV0dXJuIGB1JHt2YWx9YDtcbiAgfVxuXG4gIGV4cG9ydCBmdW5jdGlvbiBhc2NpaSh2YWw6IHN0cmluZykge1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh2YWwpO1xuICB9XG5cbiAgZXhwb3J0IGZ1bmN0aW9uIHV0ZjgodmFsOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gYHUke0pTT04uc3RyaW5naWZ5KHZhbCl9YDtcbiAgfVxuXG4gIGV4cG9ydCBmdW5jdGlvbiBidWZmKHZhbDogQXJyYXlCdWZmZXIgfCBzdHJpbmcpIHtcbiAgICBjb25zdCBidWZmID0gdHlwZW9mIHZhbCA9PSBcInN0cmluZ1wiXG4gICAgICA/IG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZSh2YWwpXG4gICAgICA6IG5ldyBVaW50OEFycmF5KHZhbCk7XG5cbiAgICBjb25zdCBoZXhPY3RldHMgPSBuZXcgQXJyYXkoYnVmZi5sZW5ndGgpO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBidWZmLmxlbmd0aDsgKytpKSB7XG4gICAgICBoZXhPY3RldHNbaV0gPSBieXRlVG9IZXhbYnVmZltpXV07XG4gICAgfVxuXG4gICAgcmV0dXJuIGAweCR7aGV4T2N0ZXRzLmpvaW4oXCJcIil9YDtcbiAgfVxuXG4gIGV4cG9ydCBmdW5jdGlvbiBsaXN0KHZhbDogQXJyYXk8YW55Pikge1xuICAgIHJldHVybiBgKGxpc3QgJHt2YWwuam9pbihcIiBcIil9KWA7XG4gIH1cblxuICBleHBvcnQgZnVuY3Rpb24gcHJpbmNpcGFsKHZhbDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIGAnJHt2YWx9YDtcbiAgfVxuXG4gIGV4cG9ydCBmdW5jdGlvbiB0dXBsZSh2YWw6IE9iamVjdCkge1xuICAgIHJldHVybiBgeyAke3NlcmlhbGl6ZVR1cGxlKHZhbCl9IH1gO1xuICB9XG59XG5cbmRlY2xhcmUgZ2xvYmFsIHtcbiAgaW50ZXJmYWNlIFN0cmluZyB7XG4gICAgZXhwZWN0T2soKTogU3RyaW5nO1xuICAgIGV4cGVjdEVycigpOiBTdHJpbmc7XG4gICAgZXhwZWN0U29tZSgpOiBTdHJpbmc7XG4gICAgZXhwZWN0Tm9uZSgpOiB2b2lkO1xuICAgIGV4cGVjdEJvb2wodmFsdWU6IGJvb2xlYW4pOiBib29sZWFuO1xuICAgIGV4cGVjdFVpbnQodmFsdWU6IG51bWJlciB8IGJpZ2ludCk6IGJpZ2ludDtcbiAgICBleHBlY3RJbnQodmFsdWU6IG51bWJlciB8IGJpZ2ludCk6IGJpZ2ludDtcbiAgICBleHBlY3RCdWZmKHZhbHVlOiBBcnJheUJ1ZmZlcik6IEFycmF5QnVmZmVyO1xuICAgIGV4cGVjdEFzY2lpKHZhbHVlOiBTdHJpbmcpOiBTdHJpbmc7XG4gICAgZXhwZWN0VXRmOCh2YWx1ZTogU3RyaW5nKTogU3RyaW5nO1xuICAgIGV4cGVjdFByaW5jaXBhbCh2YWx1ZTogU3RyaW5nKTogU3RyaW5nO1xuICAgIGV4cGVjdExpc3QoKTogQXJyYXk8U3RyaW5nPjtcbiAgICBleHBlY3RUdXBsZSgpOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuICB9XG5cbiAgaW50ZXJmYWNlIEFycmF5PFQ+IHtcbiAgICBleHBlY3RTVFhUcmFuc2ZlckV2ZW50KFxuICAgICAgYW1vdW50OiBOdW1iZXIgfCBiaWdpbnQsXG4gICAgICBzZW5kZXI6IFN0cmluZyxcbiAgICAgIHJlY2lwaWVudDogU3RyaW5nLFxuICAgICk6IE9iamVjdDtcbiAgICBleHBlY3RGdW5naWJsZVRva2VuVHJhbnNmZXJFdmVudChcbiAgICAgIGFtb3VudDogTnVtYmVyIHwgYmlnaW50LFxuICAgICAgc2VuZGVyOiBTdHJpbmcsXG4gICAgICByZWNpcGllbnQ6IFN0cmluZyxcbiAgICAgIGFzc2V0SWQ6IFN0cmluZyxcbiAgICApOiBPYmplY3Q7XG4gICAgZXhwZWN0RnVuZ2libGVUb2tlbk1pbnRFdmVudChcbiAgICAgIGFtb3VudDogTnVtYmVyIHwgYmlnaW50LFxuICAgICAgcmVjaXBpZW50OiBTdHJpbmcsXG4gICAgICBhc3NldElkOiBTdHJpbmcsXG4gICAgKTogT2JqZWN0O1xuICAgIGV4cGVjdEZ1bmdpYmxlVG9rZW5CdXJuRXZlbnQoXG4gICAgICBhbW91bnQ6IE51bWJlciB8IGJpZ2ludCxcbiAgICAgIHNlbmRlcjogU3RyaW5nLFxuICAgICAgYXNzZXRJZDogU3RyaW5nLFxuICAgICk6IE9iamVjdDtcbiAgICBleHBlY3RQcmludEV2ZW50KFxuICAgICAgY29udHJhY3RfaWRlbnRpZmllcjogc3RyaW5nLFxuICAgICAgdmFsdWU6IHN0cmluZyxcbiAgICApOiBPYmplY3Q7XG4gICAgZXhwZWN0Tm9uRnVuZ2libGVUb2tlblRyYW5zZmVyRXZlbnQoXG4gICAgICB0b2tlbklkOiBTdHJpbmcsXG4gICAgICBzZW5kZXI6IFN0cmluZyxcbiAgICAgIHJlY2lwaWVudDogU3RyaW5nLFxuICAgICAgYXNzZXRBZGRyZXNzOiBTdHJpbmcsXG4gICAgICBhc3NldElkOiBTdHJpbmcsXG4gICAgKTogT2JqZWN0O1xuICAgIGV4cGVjdE5vbkZ1bmdpYmxlVG9rZW5NaW50RXZlbnQoXG4gICAgICB0b2tlbklkOiBTdHJpbmcsXG4gICAgICByZWNpcGllbnQ6IFN0cmluZyxcbiAgICAgIGFzc2V0QWRkcmVzczogU3RyaW5nLFxuICAgICAgYXNzZXRJZDogU3RyaW5nLFxuICAgICk6IE9iamVjdDtcbiAgICBleHBlY3ROb25GdW5naWJsZVRva2VuQnVybkV2ZW50KFxuICAgICAgdG9rZW5JZDogU3RyaW5nLFxuICAgICAgc2VuZGVyOiBTdHJpbmcsXG4gICAgICBhc3NldEFkZHJlc3M6IFN0cmluZyxcbiAgICAgIGFzc2V0SWQ6IFN0cmluZyxcbiAgICApOiBPYmplY3Q7XG4gICAgLy8gZXhwZWN0RXZlbnQoc2VsOiAoZTogT2JqZWN0KSA9PiBPYmplY3QpOiBPYmplY3Q7XG4gIH1cbn1cblxuZnVuY3Rpb24gY29uc3VtZShzcmM6IFN0cmluZywgZXhwZWN0YXRpb246IFN0cmluZywgd3JhcHBlZDogYm9vbGVhbikge1xuICBsZXQgZHN0ID0gKFwiIFwiICsgc3JjKS5zbGljZSgxKTtcbiAgbGV0IHNpemUgPSBleHBlY3RhdGlvbi5sZW5ndGg7XG4gIGlmICghd3JhcHBlZCAmJiBzcmMgIT09IGV4cGVjdGF0aW9uKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgYEV4cGVjdGVkICR7Z3JlZW4oZXhwZWN0YXRpb24udG9TdHJpbmcoKSl9LCBnb3QgJHtyZWQoc3JjLnRvU3RyaW5nKCkpfWAsXG4gICAgKTtcbiAgfVxuICBpZiAod3JhcHBlZCkge1xuICAgIHNpemUgKz0gMjtcbiAgfVxuICBpZiAoZHN0Lmxlbmd0aCA8IHNpemUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBgRXhwZWN0ZWQgJHtncmVlbihleHBlY3RhdGlvbi50b1N0cmluZygpKX0sIGdvdCAke3JlZChzcmMudG9TdHJpbmcoKSl9YCxcbiAgICApO1xuICB9XG4gIGlmICh3cmFwcGVkKSB7XG4gICAgZHN0ID0gZHN0LnN1YnN0cmluZygxLCBkc3QubGVuZ3RoIC0gMSk7XG4gIH1cbiAgbGV0IHJlcyA9IGRzdC5zbGljZSgwLCBleHBlY3RhdGlvbi5sZW5ndGgpO1xuICBpZiAocmVzICE9PSBleHBlY3RhdGlvbikge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIGBFeHBlY3RlZCAke2dyZWVuKGV4cGVjdGF0aW9uLnRvU3RyaW5nKCkpfSwgZ290ICR7cmVkKHNyYy50b1N0cmluZygpKX1gLFxuICAgICk7XG4gIH1cbiAgbGV0IGxlZnRQYWQgPSAwO1xuICBpZiAoZHN0LmNoYXJBdChleHBlY3RhdGlvbi5sZW5ndGgpID09PSBcIiBcIikge1xuICAgIGxlZnRQYWQgPSAxO1xuICB9XG4gIGxldCByZW1haW5kZXIgPSBkc3Quc3Vic3RyaW5nKGV4cGVjdGF0aW9uLmxlbmd0aCArIGxlZnRQYWQpO1xuICByZXR1cm4gcmVtYWluZGVyO1xufVxuXG5TdHJpbmcucHJvdG90eXBlLmV4cGVjdE9rID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gY29uc3VtZSh0aGlzLCBcIm9rXCIsIHRydWUpO1xufTtcblxuU3RyaW5nLnByb3RvdHlwZS5leHBlY3RFcnIgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBjb25zdW1lKHRoaXMsIFwiZXJyXCIsIHRydWUpO1xufTtcblxuU3RyaW5nLnByb3RvdHlwZS5leHBlY3RTb21lID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gY29uc3VtZSh0aGlzLCBcInNvbWVcIiwgdHJ1ZSk7XG59O1xuXG5TdHJpbmcucHJvdG90eXBlLmV4cGVjdE5vbmUgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBjb25zdW1lKHRoaXMsIFwibm9uZVwiLCBmYWxzZSk7XG59O1xuXG5TdHJpbmcucHJvdG90eXBlLmV4cGVjdEJvb2wgPSBmdW5jdGlvbiAodmFsdWU6IGJvb2xlYW4pIHtcbiAgdHJ5IHtcbiAgICBjb25zdW1lKHRoaXMsIGAke3ZhbHVlfWAsIGZhbHNlKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICB0aHJvdyBlcnJvcjtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59O1xuXG5TdHJpbmcucHJvdG90eXBlLmV4cGVjdFVpbnQgPSBmdW5jdGlvbiAodmFsdWU6IG51bWJlciB8IGJpZ2ludCk6IGJpZ2ludCB7XG4gIHRyeSB7XG4gICAgY29uc3VtZSh0aGlzLCBgdSR7dmFsdWV9YCwgZmFsc2UpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHRocm93IGVycm9yO1xuICB9XG4gIHJldHVybiBCaWdJbnQodmFsdWUpO1xufTtcblxuU3RyaW5nLnByb3RvdHlwZS5leHBlY3RJbnQgPSBmdW5jdGlvbiAodmFsdWU6IG51bWJlciB8IGJpZ2ludCk6IGJpZ2ludCB7XG4gIHRyeSB7XG4gICAgY29uc3VtZSh0aGlzLCBgJHt2YWx1ZX1gLCBmYWxzZSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgdGhyb3cgZXJyb3I7XG4gIH1cbiAgcmV0dXJuIEJpZ0ludCh2YWx1ZSk7XG59O1xuXG5TdHJpbmcucHJvdG90eXBlLmV4cGVjdEJ1ZmYgPSBmdW5jdGlvbiAodmFsdWU6IEFycmF5QnVmZmVyKSB7XG4gIGxldCBidWZmZXIgPSB0eXBlcy5idWZmKHZhbHVlKTtcbiAgaWYgKHRoaXMgIT09IGJ1ZmZlcikge1xuICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgJHtncmVlbihidWZmZXIpfSwgZ290ICR7cmVkKHRoaXMudG9TdHJpbmcoKSl9YCk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufTtcblxuU3RyaW5nLnByb3RvdHlwZS5leHBlY3RBc2NpaSA9IGZ1bmN0aW9uICh2YWx1ZTogc3RyaW5nKSB7XG4gIHRyeSB7XG4gICAgY29uc3VtZSh0aGlzLCBgXCIke3ZhbHVlfVwiYCwgZmFsc2UpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHRocm93IGVycm9yO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn07XG5cblN0cmluZy5wcm90b3R5cGUuZXhwZWN0VXRmOCA9IGZ1bmN0aW9uICh2YWx1ZTogc3RyaW5nKSB7XG4gIHRyeSB7XG4gICAgY29uc3VtZSh0aGlzLCBgdVwiJHt2YWx1ZX1cImAsIGZhbHNlKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICB0aHJvdyBlcnJvcjtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59O1xuXG5TdHJpbmcucHJvdG90eXBlLmV4cGVjdFByaW5jaXBhbCA9IGZ1bmN0aW9uICh2YWx1ZTogc3RyaW5nKSB7XG4gIHRyeSB7XG4gICAgY29uc3VtZSh0aGlzLCBgJHt2YWx1ZX1gLCBmYWxzZSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgdGhyb3cgZXJyb3I7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufTtcblxuU3RyaW5nLnByb3RvdHlwZS5leHBlY3RMaXN0ID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5jaGFyQXQoMCkgIT09IFwiW1wiIHx8IHRoaXMuY2hhckF0KHRoaXMubGVuZ3RoIC0gMSkgIT09IFwiXVwiKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgYEV4cGVjdGVkICR7Z3JlZW4oXCIobGlzdCAuLi4pXCIpfSwgZ290ICR7cmVkKHRoaXMudG9TdHJpbmcoKSl9YCxcbiAgICApO1xuICB9XG5cbiAgbGV0IHN0YWNrID0gW107XG4gIGxldCBlbGVtZW50cyA9IFtdO1xuICBsZXQgc3RhcnQgPSAxO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAodGhpcy5jaGFyQXQoaSkgPT09IFwiLFwiICYmIHN0YWNrLmxlbmd0aCA9PSAxKSB7XG4gICAgICBlbGVtZW50cy5wdXNoKHRoaXMuc3Vic3RyaW5nKHN0YXJ0LCBpKSk7XG4gICAgICBzdGFydCA9IGkgKyAyO1xuICAgIH1cbiAgICBpZiAoW1wiKFwiLCBcIltcIiwgXCJ7XCJdLmluY2x1ZGVzKHRoaXMuY2hhckF0KGkpKSkge1xuICAgICAgc3RhY2sucHVzaCh0aGlzLmNoYXJBdChpKSk7XG4gICAgfVxuICAgIGlmICh0aGlzLmNoYXJBdChpKSA9PT0gXCIpXCIgJiYgc3RhY2tbc3RhY2subGVuZ3RoIC0gMV0gPT09IFwiKFwiKSB7XG4gICAgICBzdGFjay5wb3AoKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuY2hhckF0KGkpID09PSBcIn1cIiAmJiBzdGFja1tzdGFjay5sZW5ndGggLSAxXSA9PT0gXCJ7XCIpIHtcbiAgICAgIHN0YWNrLnBvcCgpO1xuICAgIH1cbiAgICBpZiAodGhpcy5jaGFyQXQoaSkgPT09IFwiXVwiICYmIHN0YWNrW3N0YWNrLmxlbmd0aCAtIDFdID09PSBcIltcIikge1xuICAgICAgc3RhY2sucG9wKCk7XG4gICAgfVxuICB9XG4gIGxldCByZW1haW5kZXIgPSB0aGlzLnN1YnN0cmluZyhzdGFydCwgdGhpcy5sZW5ndGggLSAxKTtcbiAgaWYgKHJlbWFpbmRlci5sZW5ndGggPiAwKSB7XG4gICAgZWxlbWVudHMucHVzaChyZW1haW5kZXIpO1xuICB9XG4gIHJldHVybiBlbGVtZW50cztcbn07XG5cblN0cmluZy5wcm90b3R5cGUuZXhwZWN0VHVwbGUgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh0aGlzLmNoYXJBdCgwKSAhPT0gXCJ7XCIgfHwgdGhpcy5jaGFyQXQodGhpcy5sZW5ndGggLSAxKSAhPT0gXCJ9XCIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBgRXhwZWN0ZWQgJHtncmVlbihcIih0dXBsZSAuLi4pXCIpfSwgZ290ICR7cmVkKHRoaXMudG9TdHJpbmcoKSl9YCxcbiAgICApO1xuICB9XG5cbiAgbGV0IHN0YXJ0ID0gMTtcbiAgbGV0IHN0YWNrID0gW107XG4gIGxldCBlbGVtZW50cyA9IFtdO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAodGhpcy5jaGFyQXQoaSkgPT09IFwiLFwiICYmIHN0YWNrLmxlbmd0aCA9PSAxKSB7XG4gICAgICBlbGVtZW50cy5wdXNoKHRoaXMuc3Vic3RyaW5nKHN0YXJ0LCBpKSk7XG4gICAgICBzdGFydCA9IGkgKyAyO1xuICAgIH1cbiAgICBpZiAoW1wiKFwiLCBcIltcIiwgXCJ7XCJdLmluY2x1ZGVzKHRoaXMuY2hhckF0KGkpKSkge1xuICAgICAgc3RhY2sucHVzaCh0aGlzLmNoYXJBdChpKSk7XG4gICAgfVxuICAgIGlmICh0aGlzLmNoYXJBdChpKSA9PT0gXCIpXCIgJiYgc3RhY2tbc3RhY2subGVuZ3RoIC0gMV0gPT09IFwiKFwiKSB7XG4gICAgICBzdGFjay5wb3AoKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuY2hhckF0KGkpID09PSBcIn1cIiAmJiBzdGFja1tzdGFjay5sZW5ndGggLSAxXSA9PT0gXCJ7XCIpIHtcbiAgICAgIHN0YWNrLnBvcCgpO1xuICAgIH1cbiAgICBpZiAodGhpcy5jaGFyQXQoaSkgPT09IFwiXVwiICYmIHN0YWNrW3N0YWNrLmxlbmd0aCAtIDFdID09PSBcIltcIikge1xuICAgICAgc3RhY2sucG9wKCk7XG4gICAgfVxuICB9XG4gIGxldCByZW1haW5kZXIgPSB0aGlzLnN1YnN0cmluZyhzdGFydCwgdGhpcy5sZW5ndGggLSAxKTtcbiAgaWYgKHJlbWFpbmRlci5sZW5ndGggPiAwKSB7XG4gICAgZWxlbWVudHMucHVzaChyZW1haW5kZXIpO1xuICB9XG5cbiAgbGV0IHR1cGxlOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG4gIGZvciAobGV0IGVsZW1lbnQgb2YgZWxlbWVudHMpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVsZW1lbnQubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChlbGVtZW50LmNoYXJBdChpKSA9PT0gXCI6XCIpIHtcbiAgICAgICAgbGV0IGtleTogc3RyaW5nID0gZWxlbWVudC5zdWJzdHJpbmcoMCwgaSk7XG4gICAgICAgIGxldCB2YWx1ZTogc3RyaW5nID0gZWxlbWVudC5zdWJzdHJpbmcoaSArIDIsIGVsZW1lbnQubGVuZ3RoKTtcbiAgICAgICAgdHVwbGVba2V5XSA9IHZhbHVlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdHVwbGU7XG59O1xuXG5BcnJheS5wcm90b3R5cGUuZXhwZWN0U1RYVHJhbnNmZXJFdmVudCA9IGZ1bmN0aW9uIChcbiAgYW1vdW50OiBOdW1iZXIgfCBiaWdpbnQsXG4gIHNlbmRlcjogU3RyaW5nLFxuICByZWNpcGllbnQ6IFN0cmluZyxcbikge1xuICBmb3IgKGxldCBldmVudCBvZiB0aGlzKSB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCBlOiBhbnkgPSB7fTtcbiAgICAgIGVbXCJhbW91bnRcIl0gPSBldmVudC5zdHhfdHJhbnNmZXJfZXZlbnQuYW1vdW50LmV4cGVjdEludChhbW91bnQpO1xuICAgICAgZVtcInNlbmRlclwiXSA9IGV2ZW50LnN0eF90cmFuc2Zlcl9ldmVudC5zZW5kZXIuZXhwZWN0UHJpbmNpcGFsKHNlbmRlcik7XG4gICAgICBlW1wicmVjaXBpZW50XCJdID0gZXZlbnQuc3R4X3RyYW5zZmVyX2V2ZW50LnJlY2lwaWVudC5leHBlY3RQcmluY2lwYWwoXG4gICAgICAgIHJlY2lwaWVudCxcbiAgICAgICk7XG4gICAgICByZXR1cm4gZTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICB9XG4gIHRocm93IG5ldyBFcnJvcihgVW5hYmxlIHRvIHJldHJpZXZlIGV4cGVjdGVkIFNUWFRyYW5zZmVyRXZlbnRgKTtcbn07XG5cbkFycmF5LnByb3RvdHlwZS5leHBlY3RGdW5naWJsZVRva2VuVHJhbnNmZXJFdmVudCA9IGZ1bmN0aW9uIChcbiAgYW1vdW50OiBOdW1iZXIsXG4gIHNlbmRlcjogU3RyaW5nLFxuICByZWNpcGllbnQ6IFN0cmluZyxcbiAgYXNzZXRJZDogU3RyaW5nLFxuKSB7XG4gIGZvciAobGV0IGV2ZW50IG9mIHRoaXMpIHtcbiAgICB0cnkge1xuICAgICAgbGV0IGU6IGFueSA9IHt9O1xuICAgICAgZVtcImFtb3VudFwiXSA9IGV2ZW50LmZ0X3RyYW5zZmVyX2V2ZW50LmFtb3VudC5leHBlY3RJbnQoYW1vdW50KTtcbiAgICAgIGVbXCJzZW5kZXJcIl0gPSBldmVudC5mdF90cmFuc2Zlcl9ldmVudC5zZW5kZXIuZXhwZWN0UHJpbmNpcGFsKHNlbmRlcik7XG4gICAgICBlW1wicmVjaXBpZW50XCJdID0gZXZlbnQuZnRfdHJhbnNmZXJfZXZlbnQucmVjaXBpZW50LmV4cGVjdFByaW5jaXBhbChcbiAgICAgICAgcmVjaXBpZW50LFxuICAgICAgKTtcbiAgICAgIGlmIChldmVudC5mdF90cmFuc2Zlcl9ldmVudC5hc3NldF9pZGVudGlmaWVyLmVuZHNXaXRoKGFzc2V0SWQpKSB7XG4gICAgICAgIGVbXCJhc3NldElkXCJdID0gZXZlbnQuZnRfdHJhbnNmZXJfZXZlbnQuYXNzZXRfaWRlbnRpZmllcjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGU7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgYFVuYWJsZSB0byByZXRyaWV2ZSBleHBlY3RlZCBGdW5naWJsZVRva2VuVHJhbnNmZXJFdmVudCgke2Ftb3VudH0sICR7c2VuZGVyfSwgJHtyZWNpcGllbnR9LCAke2Fzc2V0SWR9KVxcbiR7XG4gICAgICBKU09OLnN0cmluZ2lmeSh0aGlzKVxuICAgIH1gLFxuICApO1xufTtcblxuQXJyYXkucHJvdG90eXBlLmV4cGVjdEZ1bmdpYmxlVG9rZW5NaW50RXZlbnQgPSBmdW5jdGlvbiAoXG4gIGFtb3VudDogTnVtYmVyIHwgYmlnaW50LFxuICByZWNpcGllbnQ6IFN0cmluZyxcbiAgYXNzZXRJZDogU3RyaW5nLFxuKSB7XG4gIGZvciAobGV0IGV2ZW50IG9mIHRoaXMpIHtcbiAgICB0cnkge1xuICAgICAgbGV0IGU6IGFueSA9IHt9O1xuICAgICAgZVtcImFtb3VudFwiXSA9IGV2ZW50LmZ0X21pbnRfZXZlbnQuYW1vdW50LmV4cGVjdEludChhbW91bnQpO1xuICAgICAgZVtcInJlY2lwaWVudFwiXSA9IGV2ZW50LmZ0X21pbnRfZXZlbnQucmVjaXBpZW50LmV4cGVjdFByaW5jaXBhbChyZWNpcGllbnQpO1xuICAgICAgaWYgKGV2ZW50LmZ0X21pbnRfZXZlbnQuYXNzZXRfaWRlbnRpZmllci5lbmRzV2l0aChhc3NldElkKSkge1xuICAgICAgICBlW1wiYXNzZXRJZFwiXSA9IGV2ZW50LmZ0X21pbnRfZXZlbnQuYXNzZXRfaWRlbnRpZmllcjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGU7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoYFVuYWJsZSB0byByZXRyaWV2ZSBleHBlY3RlZCBGdW5naWJsZVRva2VuTWludEV2ZW50YCk7XG59O1xuXG5BcnJheS5wcm90b3R5cGUuZXhwZWN0RnVuZ2libGVUb2tlbkJ1cm5FdmVudCA9IGZ1bmN0aW9uIChcbiAgYW1vdW50OiBOdW1iZXIgfCBiaWdpbnQsXG4gIHNlbmRlcjogU3RyaW5nLFxuICBhc3NldElkOiBTdHJpbmcsXG4pIHtcbiAgZm9yIChsZXQgZXZlbnQgb2YgdGhpcykge1xuICAgIHRyeSB7XG4gICAgICBsZXQgZTogYW55ID0ge307XG4gICAgICBlW1wiYW1vdW50XCJdID0gZXZlbnQuZnRfYnVybl9ldmVudC5hbW91bnQuZXhwZWN0SW50KGFtb3VudCk7XG4gICAgICBlW1wic2VuZGVyXCJdID0gZXZlbnQuZnRfYnVybl9ldmVudC5zZW5kZXIuZXhwZWN0UHJpbmNpcGFsKHNlbmRlcik7XG4gICAgICBpZiAoZXZlbnQuZnRfYnVybl9ldmVudC5hc3NldF9pZGVudGlmaWVyLmVuZHNXaXRoKGFzc2V0SWQpKSB7XG4gICAgICAgIGVbXCJhc3NldElkXCJdID0gZXZlbnQuZnRfYnVybl9ldmVudC5hc3NldF9pZGVudGlmaWVyO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gZTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICB9XG4gIHRocm93IG5ldyBFcnJvcihgVW5hYmxlIHRvIHJldHJpZXZlIGV4cGVjdGVkIEZ1bmdpYmxlVG9rZW5CdXJuRXZlbnRgKTtcbn07XG5cbkFycmF5LnByb3RvdHlwZS5leHBlY3RQcmludEV2ZW50ID0gZnVuY3Rpb24gKFxuICBjb250cmFjdF9pZGVudGlmaWVyOiBzdHJpbmcsXG4gIHZhbHVlOiBzdHJpbmcsXG4pIHtcbiAgZm9yIChsZXQgZXZlbnQgb2YgdGhpcykge1xuICAgIHRyeSB7XG4gICAgICBsZXQgZTogYW55ID0ge307XG4gICAgICBlW1wiY29udHJhY3RfaWRlbnRpZmllclwiXSA9IGV2ZW50LmNvbnRyYWN0X2V2ZW50LmNvbnRyYWN0X2lkZW50aWZpZXJcbiAgICAgICAgLmV4cGVjdFByaW5jaXBhbChcbiAgICAgICAgICBjb250cmFjdF9pZGVudGlmaWVyLFxuICAgICAgICApO1xuXG4gICAgICBpZiAoZXZlbnQuY29udHJhY3RfZXZlbnQudG9waWMuZW5kc1dpdGgoXCJwcmludFwiKSkge1xuICAgICAgICBlW1widG9waWNcIl0gPSBldmVudC5jb250cmFjdF9ldmVudC50b3BpYztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoZXZlbnQuY29udHJhY3RfZXZlbnQudmFsdWUuZW5kc1dpdGgodmFsdWUpKSB7XG4gICAgICAgIGVbXCJ2YWx1ZVwiXSA9IGV2ZW50LmNvbnRyYWN0X2V2ZW50LnZhbHVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gZTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICB9XG4gIHRocm93IG5ldyBFcnJvcihgVW5hYmxlIHRvIHJldHJpZXZlIGV4cGVjdGVkIFByaW50RXZlbnRgKTtcbn07XG4vLyBBcnJheS5wcm90b3R5cGUuZXhwZWN0RXZlbnQgPSBmdW5jdGlvbihzZWw6IChlOiBPYmplY3QpID0+IE9iamVjdCkge1xuLy8gICAgIGZvciAobGV0IGV2ZW50IG9mIHRoaXMpIHtcbi8vICAgICAgICAgdHJ5IHtcbi8vICAgICAgICAgICAgIHNlbChldmVudCk7XG4vLyAgICAgICAgICAgICByZXR1cm4gZXZlbnQgYXMgT2JqZWN0O1xuLy8gICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuLy8gICAgICAgICAgICAgY29udGludWU7XG4vLyAgICAgICAgIH1cbi8vICAgICB9XG4vLyAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmFibGUgdG8gcmV0cmlldmUgZXhwZWN0ZWQgUHJpbnRFdmVudGApO1xuLy8gfVxuQXJyYXkucHJvdG90eXBlLmV4cGVjdE5vbkZ1bmdpYmxlVG9rZW5UcmFuc2ZlckV2ZW50ID0gZnVuY3Rpb24gKFxuICB0b2tlbklkOiBTdHJpbmcsXG4gIHNlbmRlcjogU3RyaW5nLFxuICByZWNpcGllbnQ6IFN0cmluZyxcbiAgYXNzZXRBZGRyZXNzOiBTdHJpbmcsXG4gIGFzc2V0SWQ6IFN0cmluZyxcbikge1xuICBmb3IgKGxldCBldmVudCBvZiB0aGlzKSB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCBlOiBhbnkgPSB7fTtcbiAgICAgIGlmIChldmVudC5uZnRfdHJhbnNmZXJfZXZlbnQudmFsdWUgPT09IHRva2VuSWQpIHtcbiAgICAgICAgZVtcInRva2VuSWRcIl0gPSBldmVudC5uZnRfdHJhbnNmZXJfZXZlbnQudmFsdWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGVbXCJzZW5kZXJcIl0gPSBldmVudC5uZnRfdHJhbnNmZXJfZXZlbnQuc2VuZGVyLmV4cGVjdFByaW5jaXBhbChzZW5kZXIpO1xuICAgICAgZVtcInJlY2lwaWVudFwiXSA9IGV2ZW50Lm5mdF90cmFuc2Zlcl9ldmVudC5yZWNpcGllbnQuZXhwZWN0UHJpbmNpcGFsKFxuICAgICAgICByZWNpcGllbnQsXG4gICAgICApO1xuICAgICAgaWYgKFxuICAgICAgICBldmVudC5uZnRfdHJhbnNmZXJfZXZlbnQuYXNzZXRfaWRlbnRpZmllciA9PT1cbiAgICAgICAgICBgJHthc3NldEFkZHJlc3N9Ojoke2Fzc2V0SWR9YFxuICAgICAgKSB7XG4gICAgICAgIGVbXCJhc3NldElkXCJdID0gZXZlbnQubmZ0X3RyYW5zZmVyX2V2ZW50LmFzc2V0X2lkZW50aWZpZXI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBlO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKGBVbmFibGUgdG8gcmV0cmlldmUgZXhwZWN0ZWQgTm9uRnVuZ2libGVUb2tlblRyYW5zZmVyRXZlbnRgKTtcbn07XG5cbkFycmF5LnByb3RvdHlwZS5leHBlY3ROb25GdW5naWJsZVRva2VuTWludEV2ZW50ID0gZnVuY3Rpb24gKFxuICB0b2tlbklkOiBTdHJpbmcsXG4gIHJlY2lwaWVudDogU3RyaW5nLFxuICBhc3NldEFkZHJlc3M6IFN0cmluZyxcbiAgYXNzZXRJZDogU3RyaW5nLFxuKSB7XG4gIGZvciAobGV0IGV2ZW50IG9mIHRoaXMpIHtcbiAgICB0cnkge1xuICAgICAgbGV0IGU6IGFueSA9IHt9O1xuICAgICAgaWYgKGV2ZW50Lm5mdF9taW50X2V2ZW50LnZhbHVlID09PSB0b2tlbklkKSB7XG4gICAgICAgIGVbXCJ0b2tlbklkXCJdID0gZXZlbnQubmZ0X21pbnRfZXZlbnQudmFsdWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGVbXCJyZWNpcGllbnRcIl0gPSBldmVudC5uZnRfbWludF9ldmVudC5yZWNpcGllbnQuZXhwZWN0UHJpbmNpcGFsKFxuICAgICAgICByZWNpcGllbnQsXG4gICAgICApO1xuICAgICAgaWYgKFxuICAgICAgICBldmVudC5uZnRfbWludF9ldmVudC5hc3NldF9pZGVudGlmaWVyID09PSBgJHthc3NldEFkZHJlc3N9Ojoke2Fzc2V0SWR9YFxuICAgICAgKSB7XG4gICAgICAgIGVbXCJhc3NldElkXCJdID0gZXZlbnQubmZ0X21pbnRfZXZlbnQuYXNzZXRfaWRlbnRpZmllcjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGU7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoYFVuYWJsZSB0byByZXRyaWV2ZSBleHBlY3RlZCBOb25GdW5naWJsZVRva2VuTWludEV2ZW50YCk7XG59O1xuXG5BcnJheS5wcm90b3R5cGUuZXhwZWN0Tm9uRnVuZ2libGVUb2tlbkJ1cm5FdmVudCA9IGZ1bmN0aW9uIChcbiAgdG9rZW5JZDogU3RyaW5nLFxuICBzZW5kZXI6IFN0cmluZyxcbiAgYXNzZXRBZGRyZXNzOiBTdHJpbmcsXG4gIGFzc2V0SWQ6IFN0cmluZyxcbikge1xuICBmb3IgKGxldCBldmVudCBvZiB0aGlzKSB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCBlOiBhbnkgPSB7fTtcbiAgICAgIGlmIChldmVudC5uZnRfYnVybl9ldmVudC52YWx1ZSA9PT0gdG9rZW5JZCkge1xuICAgICAgICBlW1widG9rZW5JZFwiXSA9IGV2ZW50Lm5mdF9idXJuX2V2ZW50LnZhbHVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBlW1wic2VuZGVyXCJdID0gZXZlbnQubmZ0X2J1cm5fZXZlbnQuc2VuZGVyLmV4cGVjdFByaW5jaXBhbChzZW5kZXIpO1xuICAgICAgaWYgKFxuICAgICAgICBldmVudC5uZnRfYnVybl9ldmVudC5hc3NldF9pZGVudGlmaWVyID09PSBgJHthc3NldEFkZHJlc3N9Ojoke2Fzc2V0SWR9YFxuICAgICAgKSB7XG4gICAgICAgIGVbXCJhc3NldElkXCJdID0gZXZlbnQubmZ0X2J1cm5fZXZlbnQuYXNzZXRfaWRlbnRpZmllcjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGU7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoYFVuYWJsZSB0byByZXRyaWV2ZSBleHBlY3RlZCBOb25GdW5naWJsZVRva2VuQnVybkV2ZW50YCk7XG59O1xuXG5jb25zdCBub0NvbG9yID0gZ2xvYmFsVGhpcy5EZW5vPy5ub0NvbG9yID8/IHRydWU7XG5cbmludGVyZmFjZSBDb2RlIHtcbiAgb3Blbjogc3RyaW5nO1xuICBjbG9zZTogc3RyaW5nO1xuICByZWdleHA6IFJlZ0V4cDtcbn1cblxubGV0IGVuYWJsZWQgPSAhbm9Db2xvcjtcblxuZnVuY3Rpb24gY29kZShvcGVuOiBudW1iZXJbXSwgY2xvc2U6IG51bWJlcik6IENvZGUge1xuICByZXR1cm4ge1xuICAgIG9wZW46IGBcXHgxYlske29wZW4uam9pbihcIjtcIil9bWAsXG4gICAgY2xvc2U6IGBcXHgxYlske2Nsb3NlfW1gLFxuICAgIHJlZ2V4cDogbmV3IFJlZ0V4cChgXFxcXHgxYlxcXFxbJHtjbG9zZX1tYCwgXCJnXCIpLFxuICB9O1xufVxuXG5mdW5jdGlvbiBydW4oc3RyOiBzdHJpbmcsIGNvZGU6IENvZGUpOiBzdHJpbmcge1xuICByZXR1cm4gZW5hYmxlZFxuICAgID8gYCR7Y29kZS5vcGVufSR7c3RyLnJlcGxhY2UoY29kZS5yZWdleHAsIGNvZGUub3Blbil9JHtjb2RlLmNsb3NlfWBcbiAgICA6IHN0cjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlZChzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFszMV0sIDM5KSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBncmVlbihzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFszMl0sIDM5KSk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxNQUFNLEVBQUU7SUFDYixJQUFJLENBQVM7SUFDYixNQUFNLENBQVM7SUFDZixZQUFZLENBQWtCO0lBQzlCLFdBQVcsQ0FBYztJQUN6QixjQUFjLENBQW9CO0lBRWxDLFlBQVksSUFBWSxFQUFFLE1BQWMsQ0FBRTtRQUN4QyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNqQixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztLQUN0QjtJQUVELE9BQU8sV0FBVyxDQUFDLE1BQWMsRUFBRSxTQUFpQixFQUFFLE1BQWMsRUFBRTtRQUNwRSxJQUFJLEVBQUUsR0FBRyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLEFBQUM7UUFDM0IsRUFBRSxDQUFDLFdBQVcsR0FBRztZQUNmLFNBQVM7WUFDVCxNQUFNO1NBQ1AsQ0FBQztRQUNGLE9BQU8sRUFBRSxDQUFDO0tBQ1g7SUFFRCxPQUFPLFlBQVksQ0FDakIsUUFBZ0IsRUFDaEIsTUFBYyxFQUNkLElBQW1CLEVBQ25CLE1BQWMsRUFDZDtRQUNBLElBQUksRUFBRSxHQUFHLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQUFBQztRQUMzQixFQUFFLENBQUMsWUFBWSxHQUFHO1lB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QyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFFO1FBQ3BDLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksS0FBSyxDQUFDLE1BQU0sSUFBSSxDQUFDLEVBQUU7WUFDL0MsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3hDLEtBQUssR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ2Y7UUFDRCxJQUFJO1lBQUMsR0FBRztZQUFFLEdBQUc7WUFBRSxHQUFHO1NBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQzVDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQzVCO1FBQ0QsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUU7WUFDN0QsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDO1NBQ2I7UUFDRCxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRTtZQUM3RCxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUM7U0FDYjtRQUNELElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFO1lBQzdELEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQztTQUNiO0tBQ0Y7SUFDRCxJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMs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