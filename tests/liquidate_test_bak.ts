import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.31.1/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';
import { Pool } from './interfaces/pool.ts';
import { Loan } from './interfaces/loan.ts';


Clarinet.test({
    name: "Ensure that a borrower is liquidated after Grace Period ends",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployerWallet = accounts.get("deployer") as Account;
        let wallet_1 = accounts.get("wallet_1") as Account;
        let wallet_2 = accounts.get("wallet_2") as Account;
        let wallet_7 = accounts.get("wallet_7") as Account;
        let assetMaps = chain.getAssetsMaps();
        let pool = new Pool(chain, deployerWallet);
        let loan = new Loan(chain, deployerWallet);

        let block = pool.deposit(500_000_000, wallet_1.address);
        pool.deposit(250_000_000, wallet_2.address);

        block = loan.createLoan(
            600_000_000,
            600_000,
            `${deployerWallet.address}.xbtc`,
            300,
            3000,
            1000,
            `${deployerWallet.address}.debt-vault`,
            `${deployerWallet.address}.coll-vault`, 
            wallet_7.address);
        
        pool.fundLoan(0);

        loan.drawdown(0, 4, `${deployerWallet.address}.xbtc`, `${deployerWallet.address}.coll-vault`, wallet_7.address);
        chain.mineEmptyBlock(1719)
        // block = pool.liquidate(0, `${deployerWallet.address}.coll-vault`, deployerWallet.address);
        block = pool.liquidate(0, `${deployerWallet.address}.coll-vault`, deployerWallet.address);
        assetMaps = chain.getAssetsMaps();
        // console.log(assetMaps);
        // console.log(block);
        // console.log(loan.getLoanData(0).expectTuple());
        // assetMaps = chain.getAssetsMaps();
        // assertEquals(loan.getLoanData(0).expectTuple().status, "0x03");
        // console.log(assetMaps.assets[".xbtc.xbtc"][`${deployerWallet.address}.loan`]);
        // console.log(assetMaps);
        // console.log(block);
    },
});
