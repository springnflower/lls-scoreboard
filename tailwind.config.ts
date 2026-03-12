import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        ink: '#101828',
        line: '#E4E7EC',
        canvas: '#F8FAFC'
      },
      boxShadow: {
        soft: '0 10px 30px rgba(16, 24, 40, 0.08)'
      }
    }
  },
  plugins: []
};

export default config;
