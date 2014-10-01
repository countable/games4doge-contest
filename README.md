games4doge
==========

This branch (master) of this repository is an example Node.JS based game using Block.IO . The contest website is in the other, gh-pages branch.

Demo
====

To run the test game, clone the repo, and

```
npm install .
cp config.js.template config.js
```

Sign up for a block.io account, and set your secret pin. Enter your API key, secret pin, and default dogecoin address (or testnet one) in the file, config.js. Then,

```
node app
```

And browse to localhost:3000

Disclaimer
==========

A real game should be more careful with security. This demo is kept intentionally brief as a demonstration of how you could use Block.IO only.

