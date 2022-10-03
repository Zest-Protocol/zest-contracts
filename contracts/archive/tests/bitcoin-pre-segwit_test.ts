
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.14.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Ensure that <...>",
    fn(chain: Chain, accounts: Map<string, Account>) {
        let deployerWallet = accounts.get("deployer") as Account;

        // let tx =  types.tuple({
        //     "version": types.buff(new ArrayBuffer(4)),
        //     "ins": types.list([
        //         types.tuple({
        //             "outpoint": types.tuple({
        //                 "hash": types.buff(new ArrayBuffer(32)),
        //                 "index": types.buff(new ArrayBuffer(4)),
        //             }),
        //             "scriptSig": types.buff(new ArrayBuffer(256)),
        //             "sequence": types.buff(new ArrayBuffer(4))
        //         })
        //     ]),
        //     "outs": types.list([
        //         types.tuple({
        //             "value": types.buff(new ArrayBuffer(8)),
        //             "scriptPubKey": types.buff(new ArrayBuffer(128)),
        //         })
        //     ]),
        //     "locktime": types.buff(new ArrayBuffer(4)),
        // })

        // let block = chain.mineBlock([
        //     Tx.contractCall(
        //         `bitcoin-p2pkh`,
        //         "concat-tx",
        //         [],
        //         deployerWallet.address
        //     ),
        // ]);

        let assetMaps = chain.getAssetsMaps();
    },
});
