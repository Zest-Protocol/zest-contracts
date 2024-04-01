import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';
import { Buffer } from "https://deno.land/std@0.159.0/node/buffer.ts";

class TestUtils {
    static setMinedTx(txid: string, caller: string) {
      return Tx.contractCall("test-utils", 'set-mined', [ types.buff(Buffer.from(txid, "hex")) ], caller);
    }

    static setBurnHeaderTx(height: number, header: string, caller: string) {
      return Tx.contractCall("test-utils", 'set-burn-header',
        [
          types.uint(height),
          types.buff(Buffer.from(header, "hex"))
        ], caller);
    }

    static wasMinedTx(chain: Chain, txid: string, caller: string) {
      return chain.callReadOnlyFn(`test-utils`, "was-mined", [ types.buff(Buffer.from(txid, "hex")) ], caller).result;
    }

    static burnBlockHeader(chain: Chain, height: number, header: string, caller: string) {
      return chain.callReadOnlyFn(`test-utils`, "was-mined", [ types.uint(height), types.buff(Buffer.from(header, "hex")) ], caller).result;
    }

}

export { TestUtils };