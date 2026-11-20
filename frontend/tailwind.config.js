/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        beige: {
          DEFAULT: '#F5EBDD',
          light: '#FAF3EA',
          dark: '#EBDBC7',
        },
        cream: {
          DEFAULT: '#FBF6EE',
          dark: '#F5ECE0',
        },
        coffee: {
          DEFAULT: '#6F4E37',
          dark: '#4B2E1E',
          deep: '#3B2417',
          muted: '#8B6F5A',
          light: '#835E44',
        },
        mocha: {
          DEFAULT: '#6F4E37',
          light: '#835E44',
          dark: '#4B2E1E',
        },
        latte: {
          DEFAULT: '#A67B5B',
          light: '#C49A78',
          dark: '#8C6546',
        },
        tan: {
          DEFAULT: '#D9C3A5',
          light: '#E6D7C3',
          dark: '#C8AD8A',
        },
        sage: {
          DEFAULT: '#3F6B4A',
          bg: '#E3EBDD',
          text: '#3F6B4A',
          border: '#C2D6BA',
        },
        amber: {
          DEFAULT: '#8A6100',
          bg: '#F8EBC8',
          text: '#8A6100',
          border: '#ECD28C',
        },
        terracotta: {
          DEFAULT: '#A33A36',
          bg: '#F3D9D2',
          text: '#A33A36',
          border: '#E4AEA3',
        },
        // Semantic status mappings
        status: {
          healthy: '#3F6B4A',
          watch: '#8A6100',
          risk: '#A33A36',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        soft: '0 2px 8px rgba(75, 46, 30, 0.06)',
        'soft-md': '0 4px 16px rgba(75, 46, 30, 0.08)',
        'soft-lg': '0 8px 24px rgba(75, 46, 30, 0.12)',
      }
    },
  },
  plugins: [],
}
