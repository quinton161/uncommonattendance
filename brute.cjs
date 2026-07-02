const { sha256 } = require("@oslojs/crypto/sha2");
const { encodeHexLowerCase } = require("@oslojs/encoding");

function hashCode(code) {
  return encodeHexLowerCase(sha256(new TextEncoder().encode(code)));
}

// The correct hash from the DB
const targetHash = "af2b8cec3a3ce1fab5e5b2f548c5650cbc0add1cd7046cfcc3669222abc581f4";

// Try all 6-digit codes
for (let i = 100000; i <= 999999; i++) {
  const code = i.toString();
  const hash = hashCode(code);
  if (hash === targetHash) {
    console.log("FOUND! Code:", code);
    process.exit(0);
  }
}
console.log("Code not found in range");
