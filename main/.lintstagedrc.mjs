const config = {
  "*.{md,json}": "prettier --write",
  "*.{js,mjs}": ["eslint", "prettier --write"],
  "*.{ts,mts}": [
    () => "tsc -p tsconfig.json --noEmit",
    "eslint",
    "prettier --write",
  ],
};

export default config;
