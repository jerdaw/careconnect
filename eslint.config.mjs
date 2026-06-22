import nextCoreWebVitals from "eslint-config-next/core-web-vitals"

const projectA11yRules = {
  "jsx-a11y/alt-text": "error",
  "jsx-a11y/aria-role": "error",
  "jsx-a11y/aria-props": "error",
  "jsx-a11y/aria-unsupported-elements": "error",
  "jsx-a11y/heading-has-content": "error",
  "jsx-a11y/label-has-associated-control": [
    "error",
    {
      labelAttributes: ["label"],
      controlComponents: ["Input", "Textarea", "Select"],
      depth: 3,
    },
  ],
  "jsx-a11y/click-events-have-key-events": "error",
  "jsx-a11y/no-static-element-interactions": "error",
}

const projectTypeScriptRules = {
  "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
}

const projectReactHooksRules = {
  // Existing client-only hydration patterns are not React Compiler-ready yet.
  // Keep these opt-in until the affected hooks/components are refactored deliberately.
  "react-hooks/purity": "off",
  "react-hooks/refs": "off",
  "react-hooks/set-state-in-effect": "off",
}

const typeScriptPlugin = nextCoreWebVitals.find((config) => config.plugins?.["@typescript-eslint"])?.plugins?.[
  "@typescript-eslint"
]

const nextConfig = nextCoreWebVitals.map((config) => {
  const rules = {
    ...(config.plugins?.["react-hooks"] ? projectReactHooksRules : {}),
    ...(config.plugins?.["jsx-a11y"] ? projectA11yRules : {}),
    ...(config.plugins?.["@typescript-eslint"] ? projectTypeScriptRules : {}),
  }

  if (Object.keys(rules).length > 0) {
    return {
      ...config,
      rules: {
        ...config.rules,
        ...rules,
      },
    }
  }

  return config
})

const eslintConfig = [
  ...nextConfig,
  {
    // Enforce logger usage over console in production code
    files: ["app/**/*.ts", "app/**/*.tsx", "components/**/*.ts", "components/**/*.tsx", "hooks/**/*.ts", "lib/**/*.ts"],
    ignores: ["app/worker.ts", "app/global-error.tsx", "lib/logger.ts"],
    rules: {
      "no-console": "warn",
    },
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx", "tests/**", "scripts/**", "types/**"],
    plugins: {
      "@typescript-eslint": typeScriptPlugin,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "site/**",
      "next-env.d.ts",
      "coverage/**",
      "public/**/*.js",
      ".gemini/**",
    ],
  },
]

export default eslintConfig
