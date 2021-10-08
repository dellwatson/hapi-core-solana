import { Connection, PublicKey } from "@solana/web3.js";
import stringify from "fast-json-stable-stringify";
import nock from "nock";

import { Address, Category, HapiAccountType } from ".";
import { u64 } from "../utils";
import { assertBuffersEqual } from "../../test/util/comparison";
import { mockRpcOk } from "../../test/util/mocks";
import { HAPI_PROGRAM_ID } from "../constants";

describe("Address", () => {
  nock.disableNetConnect();

  const endpoint = "http://localhost:8899";
  const programId = HAPI_PROGRAM_ID;

  const BINARY_SAMPLE = Buffer.from("BQUBAAAAAAAAAA8=", "base64");
  const ADDRESS_SAMPLE = new Address({
    accountType: HapiAccountType.Address,
    caseId: new u64(1),
    risk: 5,
    category: Category.Theft,
  });

  it("should serialize", () => {
    assertBuffersEqual(ADDRESS_SAMPLE.serialize(), BINARY_SAMPLE);
  });

  it("should deserialize", () => {
    expect(stringify(Address.deserialize(BINARY_SAMPLE))).toEqual(
      stringify(ADDRESS_SAMPLE)
    );
  });

  it("should retrieve", async () => {
    mockRpcOk(
      endpoint,
      "getAccountInfo",
      ["C5Srms9M3eHy5XbzEgRgEEHFZ3rKxdAEaH2DZSSXLGDD"],
      {
        context: { slot: 2223 },
        value: {
          data: ["BQUBAAAAAAAAAA8=", "base64"],
          executable: false,
          lamports: 967440,
          owner: "hapiScWyxeZy36fqXD5CcRUYFCUdid26jXaakAtcdZ7",
          rentEpoch: 0,
        },
      }
    );

    const conn = new Connection(endpoint);
    const network = await Address.retrieve(
      programId,
      conn,
      "hapi.one",
      "testcoin",
      new PublicKey("2Yy2iSPJv4iEMyNkUX7ydFoufSmyPLMc8P9owJopFRew")
    );
    expect(stringify(network.data)).toEqual(stringify(ADDRESS_SAMPLE));
  });
});
