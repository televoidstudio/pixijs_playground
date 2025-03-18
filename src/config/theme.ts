// Color palette definition with modern UI colors
export const palette = {
    // Primary colors
    primary: {
        main: 0x2D3250,     // Deep blue-grey
        light: 0x424769,    // Lighter blue-grey
        dark: 0x1B1F38      // Darker blue-grey
    },
    // Secondary colors
    secondary: {
        main: 0x676FA3,     // Soft purple-blue
        light: 0x7C85B3,    // Light purple-blue
        dark: 0x515B8C      // Dark purple-blue
    },
    // Accent colors
    accent: {
        blue: 0x00A9FF,     // Bright blue
        red: 0xFF5757,      // Soft red
        green: 0x42A459     // Forest green
    },
    // Background colors
    background: {
        primary: 0x1A1B26,  // Dark background
        secondary: 0x24283B // Slightly lighter background
    },
    // Text colors
    text: {
        primary: 0xFFFFFF,   // White
        secondary: 0xA9B1D6, // Light grey
        disabled: 0x565F89   // Muted grey
    }
} as const;

// Window theme configuration
export const theme = {
    colors: {
        window: {
            background: palette.background.secondary,
            titleBar: palette.primary.main,
            titleBarHover: palette.primary.light,
            border: palette.primary.light,
            buttons: {
                close: {
                    default: palette.accent.red,
                    hover: 0xFF7070    // Lighter red on hover
                },
                minimize: {
                    default: palette.accent.blue,
                    hover: 0x47B9FF    // Lighter blue on hover
                }
            }
        },
        contextMenu: {
            background: palette.background.secondary,
            hoverBackground: palette.primary.light,
            text: palette.text.primary,
            border: palette.primary.main
        }
    },
    dimensions: {
        titleHeight: 32,          // Slightly smaller title bar
        minWidth: 200,
        minHeight: 150,
        buttonSize: 14,          // Slightly smaller buttons
        borderRadius: 6,         // Rounded corners
        borderWidth: 1
    },
    spacing: {
        padding: 8,
        buttonGap: 6
    },
    animation: {
        duration: 0.2,           // seconds
        easing: 'easeOutCubic'
    }
} as const;

// Shadow configuration for depth effect
export const shadows = {
    window: '0 4px 12px rgba(0, 0, 0, 0.3)',
    contextMenu: '0 2px 8px rgba(0, 0, 0, 0.2)'
} as const;

// Export everything
export default {
    palette,
    theme,
    shadows
}; 