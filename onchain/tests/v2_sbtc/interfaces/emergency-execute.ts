import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.5.4/index.ts';

class EmergencyExecute {
  static executiveAction(
    proposal: string,
    teamMember: string) {
    return Tx.contractCall(
      "zge003-emergency-execute",
      "executive-action",
      [
        types.principal(proposal),
      ],
      teamMember
    )
  }
}

export { EmergencyExecute };