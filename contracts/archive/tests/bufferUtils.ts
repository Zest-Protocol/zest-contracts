// let version = new ArrayBuffer(4);
// let view = new DataView(version);
// view.setUint8(0, 0);
// view.setUint8(1, 0);
// view.setUint8(2, 0);
// view.setUint8(3, 1);

let decoder = new TextDecoder();
let encoder = new TextEncoder();


// console.log(parseInt("0x00", 16))

let s = "0011ff44";

// var r = decodeURIComponent(s.replace(/\s+/g, '').replace(/[0-9a-f]{2}/g, '%$&'));

function hexToEncoded(hexStr: string): any {
    let bytes = [...hexStr.matchAll(/[^ ]{1,2}/g)].map(a => parseInt('0x' + a[0]));
    
    return bytes 
}

function numToChar(nums: number[]): any {
    let tempStr = "";
    
    for (let i = 0; i < nums.length; ++i) {
        tempStr += String.fromCharCode(nums[i]);
    }

    return tempStr;
}

console.log(encoder.encode(numToChar(hexToEncoded(s))))

// const text = encoder.encode(bytes);
// console.log(text);
// console.log(String.fromCharCode(121))
// console.log(encoder.encode("y"))
// const uint8ArrayToArrayBuffer = (arr: ArrayBuffer, buffer: Uint8Array) => {
//     const view = new DataView(arr);
    
//     for (let i = 0; i < buffer.length; ++i) {
//         view.setUint8(i, buffer[i]);
//     }
//     // console.log(view);

//     return arr;
// }

// uint8ArrayToArrayBuffer(buffer, text);

// console.log(buffer);
