import { Connection, PublicKey } from "@solana/web3.js";
import { deserializeUnchecked, serialize } from "borsh";

import { HAPI_PROGRAM_ID } from "../constants";
import { u64 } from "../utils";
import { Category, Categories, HapiAccountType } from "./enums";

export class AddressState {
  account_type: HapiAccountType;
  risk: number;
  case_id: u64;
  category: number;
  constructor(object: Partial<AddressState>) {
    Object.assign(this, object);
  }
  static schema = new Map([
    [
      AddressState,
      {
        kind: "struct",
        fields: [
          ["account_type", "u8"],
          ["risk", "u8"],
          ["case_id", "u64"],
          ["category", "u8"],
        ],
      },
    ],
  ]);
  static size = 11;
}

export class Address {
  /// HAPI account type
  accountType: HapiAccountType;

  /// Risk score
  risk: number;

  /// Case ID
  caseId: u64;

  /// Category
  category: Category;

  constructor(data?: Partial<Address>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  static fromState(state: AddressState): Address {
    return new Address({
      accountType: state.account_type,
      risk: state.risk,
      caseId: state.case_id,
      category: Categories[state.category],
    });
  }

  static deserialize(buffer: Buffer): Address {
    return Address.fromState(
      deserializeUnchecked(AddressState.schema, AddressState, buffer)
    );
  }

  static async retrieve(
    connection: Connection,
    communityName: string,
    networkName: string,
    address: PublicKey
  ): Promise<{ data: Address; account: PublicKey }> {
    const [communityAddress] = await PublicKey.findProgramAddress(
      [Buffer.from("community"), Buffer.from(communityName)],
      HAPI_PROGRAM_ID
    );

    const [networkAddress] = await PublicKey.findProgramAddress(
      [
        Buffer.from("network"),
        communityAddress.toBuffer(),
        Buffer.from(networkName),
      ],
      HAPI_PROGRAM_ID
    );

    const [addressAddress] = await PublicKey.findProgramAddress(
      [Buffer.from("address"), networkAddress.toBuffer(), address.toBuffer()],
      HAPI_PROGRAM_ID
    );

    const account = await connection.getAccountInfo(
      addressAddress,
      "processed"
    );
    if (!account) {
      throw new Error(
        `Address not found: "${address}" in network "${networkName}" (${networkAddress}) in community "${communityName}" (${communityAddress})`
      );
    }

    return { data: Address.deserialize(account.data), account: addressAddress };
  }

  serialize(): Uint8Array {
    const buf = Buffer.alloc(AddressState.size);
    buf.set(serialize(AddressState.schema, this.toState()));
    return buf;
  }

  toState(): AddressState {
    return new AddressState({
      account_type: this.accountType,
      risk: this.risk,
      case_id: this.caseId,
      category: Categories.indexOf(this.category),
    });
  }
}
