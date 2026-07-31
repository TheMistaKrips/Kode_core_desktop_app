/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/renderer/index.html",
        "./src/renderer/src/**/*.{js,jsx}",
    ],
    theme: {
        extend: {
            colors: {
                space: {
                    900: '#090B10', // Глубокий темный фон
                    800: '#121620', // Фон панелей
                    700: '#1A202C', // Светлые элементы
                },
                aqua: {
                    500: '#00d2ff', // Акцентный цвет
                    600: '#3a7bd5',
                }
            },
            backgroundImage: {
                'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
            },
            backdropBlur: {
                'glass': '16px',
            }
        },
    },
    plugins: [],
}