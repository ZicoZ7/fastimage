/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * Apple-style neutral color palette inspired by the provided image
 */

const tintColorLight = '#8B7355';
const tintColorDark = '#D4C4A8';

export const Colors = {
  light: {
    text: '#2C2C2E',
    background: '#F2F2F7',
    tint: tintColorLight,
    icon: '#8E8E93',
    tabIconDefault: '#8E8E93',
    tabIconSelected: tintColorLight,
    // Additional colors for the image generation app
    cardBackground: '#FFFFFF',
    secondaryBackground: '#E5E5EA',
    accent: '#A68B5B',
    border: '#C6C6C8',
    placeholder: '#C7C7CC',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
  },
  dark: {
    text: '#FFFFFF',
    background: '#1C1C1E',
    tint: tintColorDark,
    icon: '#8E8E93',
    tabIconDefault: '#8E8E93',
    tabIconSelected: tintColorDark,
    // Additional colors for the image generation app
    cardBackground: '#2C2C2E',
    secondaryBackground: '#3A3A3C',
    accent: '#D4C4A8',
    border: '#48484A',
    placeholder: '#8E8E93',
    success: '#30D158',
    warning: '#FF9F0A',
    error: '#FF453A',
  },
};
