const EC = require('elliptic').ec;

const ec = new EC('secp256k1');

// const keyPair = ec.genKeyPair();
// const pub = keyPair.getPublic()
//   .encode('hex');
// const priv = keyPair.getPrivate()
//   .toString('hex');
// const txtKeyPair = `publicKey(your address): ${pub}
// privateKey(secret key, don't share it): ${priv}`;

const genKeyPair = () => {
  const keyPair = ec.genKeyPair();
  const pub = keyPair.getPublic()
    .encode('hex');
  const priv = keyPair.getPrivate()
    .toString('hex');

  return {
    pub,
    priv,
  };
};

module.exports = {
  genKeyPair,
};
