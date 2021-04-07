const chain = [];

// eslint-disable-next-line no-plusplus
for (let i = 0; i < 88; i++) {
  chain.push({
    timestamp: Date.now(),
    hash: i + '3'.repeat(i),
    nonce: '3004',
    difficulty: '5',
    data: [
      { transaction: 1 },
      { transaction: 2 },
    ],
  });
}
console.log(chain);

export default chain;
