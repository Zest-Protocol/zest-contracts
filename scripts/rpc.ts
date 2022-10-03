import { Clarinet, Contract, Account, StacksNode } from 'https://deno.land/x/clarinet@v0.13.0/index.ts';
import { readline } from "https://deno.land/x/readline/mod.ts";

Clarinet.run({
    async fn(accounts: Map<string, Account>, contracts: Map<string, Contract>, node: StacksNode) {
        console.log(JSON.stringify({
            ready: true,
            accounts: Object.fromEntries(accounts),
            contracts: Object.fromEntries(contracts)
        }));
        const decoder = new TextDecoder();
        for await (const line of readline(Deno.stdin)) {
            const json = JSON.parse(decoder.decode(line));
            const result = JSON.parse((Deno as any).core.opSync(json.op, json.params));
            console.log(JSON.stringify( { id: json.id, result }));
        }
    }
})