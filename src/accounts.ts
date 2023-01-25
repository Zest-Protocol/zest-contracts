import { generateNewAccount, generateWallet } from "@stacks/wallet-sdk";

export async function getWallets() {
  const deployerWallet = await generateWallet({
    secretKey: "twice kind fence tip hidden tilt action fragile skin nothing glory cousin green tomorrow spring wrist shed math olympic multiply hip blue scout claw",
    password: "password"
  });
  
  const tempWallet = await generateWallet({
    secretKey: "sell invite acquire kitten bamboo drastic jelly vivid peace spawn twice guilt pave pen trash pretty park cube fragile unaware remain midnight betray rebuild",
    password: "password"
  });
  const lpWallet = generateNewAccount(tempWallet);
  
  const minerWallet = await generateWallet({
    secretKey: "shadow private easily thought say logic fault paddle word top book during ignore notable orange flight clock image wealth health outside kitten belt reform",
    password: "password"
  });
  
  const delegateWallet = await generateWallet({
    secretKey: "prevent gallery kind limb income control noise together echo rival record wedding sense uncover school version force bleak nuclear include danger skirt enact arrow",
    password: "password"
  });
  
  const borrowerWallet = await generateWallet({
    secretKey: "north swim broom surface easy gasp street sibling pond slab electric endorse comfort bargain valley news drive siege fatal sort current blur cover random",
    password: "password"
  });

  return {
    deployer: deployerWallet,
    lp: lpWallet,
    miner: minerWallet,
    delegate: delegateWallet,
    borrower: borrowerWallet,

  }
}
