import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.31.1/index.ts';

class Oracle {
    chain: Chain;
    deployer: Account;

    constructor(chain: Chain, deployer: Account) {
        this.chain = chain;
        this.deployer = deployer;
    }

    addAsset(asset: string, price: number, decimals: number) {
        let block = this.chain.mineBlock([
            Tx.contractCall(
                `oracle`,
                "add-asset",
                [
                    types.principal(asset),
                    types.tuple(
                        {
                            "price": types.uint(price),
                            "decimals": types.uint(decimals)
                        })
                ],
                this.deployer.address
            ),
        ]);
        return block;
    }

    setPrice(asset: string, price: number) {
        let block = this.chain.mineBlock([
            Tx.contractCall(
                `oracle`,
                "set-price",
                [
                    types.principal(asset),
                    types.uint(price)
                ],
                this.deployer.address
            ),
        ]);

        return block;
    }
}

export { Oracle }