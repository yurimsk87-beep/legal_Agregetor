import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#19211f",
        trust: "#0f766e",
        leaf: "#16a34a",
        wheat: "#f7f1e3",
        line: "#dfe7e4"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(25, 33, 31, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
