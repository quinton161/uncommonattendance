# Chillax Font Files

## Required Font Files

Place the following Chillax font files in this directory:

```
src/assets/fonts/
├── Chillax-Extralight.woff
├── Chillax-Light.woff
├── Chillax-Regular.woff
├── Chillax-Medium.woff
├── Chillax-Semibold.woff
└── Chillax-Bold.woff
```

## Font Weights Available

- **Extralight (200)**: `Chillax-Extralight.woff`
- **Light (300)**: `Chillax-Light.woff`
- **Regular (400)**: `Chillax-Regular.woff`
- **Medium (500)**: `Chillax-Medium.woff`
- **Semibold (600)**: `Chillax-Semibold.woff`
- **Bold (700)**: `Chillax-Bold.woff`

## Usage in Code

The fonts are automatically loaded via `fonts.css` and can be used with:

```css
font-family: 'Chillax', sans-serif;
font-weight: 200; /* Extralight */
font-weight: 300; /* Light */
font-weight: 400; /* Regular */
font-weight: 500; /* Medium */
font-weight: 600; /* Semibold */
font-weight: 700; /* Bold */
```

## Fallback

If font files are not available, the application will fall back to Google Fonts Chillax or system fonts.

## Character Support

Supports extended Latin characters including:
- Turkish: Şş, Iı, İi
- Numbers: 0123456789
- Symbols: !@#$%^&*()_+-=[]{}|;:'".,<>?/~`
