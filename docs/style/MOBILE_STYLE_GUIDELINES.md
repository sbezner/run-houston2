# 📱 Mobile Style Guidelines
## Run Houston Mobile App - React Native Styling Standards

**Last Updated:** 2025-08-15  
**Version:** 1.0.0  
**Framework:** React Native with Expo

---

## 🎯 Overview

This document outlines the styling standards, design patterns, and best practices used in the Run Houston mobile application. All styling follows React Native best practices and creates a consistent, professional user experience across iOS and Android platforms.

---

## 🎨 Core Styling Principles

### 1. **Use StyleSheet.create**
- **Always** use `StyleSheet.create()` for better performance and organization
- **Never** use inline styles for production components
- **Group related styles** logically within StyleSheet objects

```typescript
// ✅ GOOD
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  }
});

// ❌ AVOID
<View style={{ flex: 1, padding: 24, backgroundColor: "#fff" }}>
```

### 2. **Camel Case Properties**
- Use camelCase for all style properties (React Native standard)
- **Examples:** `backgroundColor`, `fontWeight`, `marginTop`, `borderRadius`

### 3. **Consistent Spacing System**
- **Base unit:** 4px (0.25rem equivalent)
- **Common values:** 4, 8, 12, 16, 20, 24, 32, 48
- **Use consistent spacing** across similar components

```typescript
const spacing = {
  xs: 4,    // 4px
  sm: 8,   // 8px
  md: 16,  // 16px
  lg: 24,  // 24px
  xl: 32,  // 32px
  xxl: 48, // 48px
};
```

---

## 🎨 Color Palette

### **Primary Colors**
```typescript
const colors = {
  primary: "#007AFF",      // iOS Blue - Primary actions
  secondary: "#5F6368",    // Google Gray - Secondary text
  success: "#34A853",      // Green - Success states
  warning: "#FBBC04",      // Yellow - Warning states
  error: "#EA4335",        // Red - Error states
};
```

### **Background Colors**
```typescript
const backgrounds = {
  primary: "#FFFFFF",      // Main content background
  secondary: "#F8F9FA",    // Light background for contrast
  card: "#FFFFFF",         // Card backgrounds
  overlay: "#000000",      // Modal overlays
};
```

### **Text Colors**
```typescript
const textColors = {
  primary: "#333333",      // Main text
  secondary: "#5F6368",    // Secondary text
  tertiary: "#9AA0A6",     // Tertiary text
  link: "#007AFF",         // Links and interactive elements
  inverse: "#FFFFFF",      // Text on dark backgrounds
};
```

---

## 🎨 Typography System

### **Font Sizes**
```typescript
const typography = {
  xs: 12,    // Captions, small labels
  sm: 14,    // Body text, secondary information
  md: 16,    // Body text, primary information
  lg: 18,    // Subheadings
  xl: 20,    // Section headers
  xxl: 24,   // Page titles
  xxxl: 28,  // Hero titles
};
```

### **Font Weights**
```typescript
const fontWeights = {
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  extrabold: "800",
};
```

### **Line Heights**
- **Tight:** 1.2 (headings, titles)
- **Normal:** 1.4 (body text)
- **Relaxed:** 1.6 (long-form content)

---

## 🎨 Component Styling Patterns

### 1. **Card Components**
```typescript
const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 16,
    // Enhanced shadows for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4, // Android shadow
  }
});
```

### 2. **Button Components**
```typescript
const buttonStyles = StyleSheet.create({
  primary: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    // Enhanced shadows for active state
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  secondary: {
    backgroundColor: "#F1F3F4",
    borderWidth: 1,
    borderColor: "#E1E5E9",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  }
});
```

### 3. **Toggle/Selector Components**
```typescript
const toggleStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: "#FFFFFF",
    // Subtle shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  }
});
```

---

## 🎨 Shadow System

### **Shadow Levels**
```typescript
const shadows = {
  // Level 1: Subtle elevation
  level1: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  // Level 2: Medium elevation
  level2: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },
  // Level 3: High elevation
  level3: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
  // Level 4: Maximum elevation
  level4: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 12,
  }
};
```

### **Special Shadows**
```typescript
// Active state shadows (for buttons, toggles)
const activeShadow = {
  shadowColor: "#007AFF",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 6,
};

// Card shadows
const cardShadow = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 6,
  elevation: 4,
};
```

---

## 🎨 Layout Patterns

### 1. **Container Layouts**
```typescript
const containerStyles = StyleSheet.create({
  // Full screen container
  fullScreen: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  // Centered content container
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  // Card container
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    margin: 16,
  }
});
```

### 2. **Flexbox Patterns**
```typescript
// Common flex patterns
const flexPatterns = {
  // Center content both horizontally and vertically
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  // Center content horizontally
  centerHorizontal: {
    alignItems: "center",
  },
  // Center content vertically
  centerVertical: {
    justifyContent: "center",
  },
  // Space items evenly
  spaceEvenly: {
    justifyContent: "space-evenly",
  },
  // Space items between
  spaceBetween: {
    justifyContent: "space-between",
  }
};
```

---

## 🎨 Responsive Design

### **Screen Size Considerations**
```typescript
// Consider different screen sizes
const responsiveStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 16, // Base padding
    // For larger screens, increase padding
    ...(Dimensions.get('window').width > 400 && {
      paddingHorizontal: 24,
    }),
  },
  title: {
    fontSize: 20, // Base font size
    // For larger screens, increase font size
    ...(Dimensions.get('window').width > 400 && {
      fontSize: 24,
    }),
  }
});
```

---

## 🎨 Cross-Platform Considerations

### **Platform-Specific Styling**
```typescript
import { Platform } from 'react-native';

const platformStyles = StyleSheet.create({
  container: {
    // iOS-specific shadows
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      // Android elevation
      android: {
        elevation: 4,
      },
    }),
  }
});
```

---

## 🎨 Animation & Interaction

### **Touch Feedback**
```typescript
// Use Pressable with proper styling
<Pressable
  style={({ pressed }) => [
    styles.button,
    pressed && styles.buttonPressed
  ]}
>
  <Text style={styles.buttonText}>Press Me</Text>
</Pressable>

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 10,
  },
  buttonPressed: {
    backgroundColor: "#0056CC", // Darker shade when pressed
    transform: [{ scale: 0.98 }], // Slight scale down
  }
});
```

---

## 🎨 Accessibility

### **Color Contrast**
- **Ensure sufficient contrast** between text and background
- **Test with accessibility tools** for color blindness
- **Use semantic colors** (success, warning, error)

### **Touch Targets**
- **Minimum size:** 44x44 points for touch targets
- **Adequate spacing** between interactive elements
- **Clear visual feedback** for touch states

---

## 🎨 Performance Best Practices

### **Style Optimization**
```typescript
// ✅ GOOD: Use StyleSheet.create
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 }
});

// ❌ AVOID: Inline styles or object creation
<View style={{ flex: 1, padding: 16 }}>

// ❌ AVOID: Dynamic style objects
<View style={{ backgroundColor: isActive ? 'blue' : 'gray' }}>
```

### **Conditional Styling**
```typescript
// ✅ GOOD: Use arrays for conditional styles
<View style={[styles.base, isActive && styles.active]}>

// ✅ GOOD: Use Platform.select for platform differences
const styles = StyleSheet.create({
  shadow: Platform.select({
    ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 } },
    android: { elevation: 4 }
  })
});
```

---

## 🎨 File Organization

### **Style File Structure**
```
src/
├── components/
│   ├── AboutScreen/
│   │   ├── AboutScreen.tsx
│   │   └── AboutScreen.styles.ts  // Separate style file
│   ├── RaceMap/
│   │   ├── RaceMap.tsx
│   │   └── RaceMap.styles.ts
│   └── ...
├── styles/
│   ├── colors.ts          // Color constants
│   ├── typography.ts      // Typography constants
│   ├── spacing.ts         // Spacing constants
│   ├── shadows.ts         // Shadow presets
│   └── common.ts          // Common style patterns
└── ...
```

---

## 🎨 Code Examples

### **Complete Component Example**
```typescript
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export default function Button({ title, onPress, variant = 'primary', disabled = false }: ButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        pressed && styles.pressed,
        disabled && styles.disabled
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.text, styles[`${variant}Text`], disabled && styles.disabledText]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primary: {
    backgroundColor: '#007AFF',
    ...shadows.level2,
  },
  secondary: {
    backgroundColor: '#F1F3F4',
    borderWidth: 1,
    borderColor: '#E1E5E9',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#5F6368',
  },
  disabledText: {
    color: '#9AA0A6',
  },
});
```

---

## 🎨 Testing & Validation

### **Style Testing Checklist**
- [ ] **Cross-platform consistency** (iOS/Android)
- [ ] **Accessibility compliance** (color contrast, touch targets)
- [ ] **Performance validation** (no inline styles, StyleSheet.create usage)
- [ ] **Responsive behavior** (different screen sizes)
- [ ] **Visual consistency** (spacing, typography, colors)

---

## 🎨 Resources & References

- [React Native Style Documentation](https://reactnative.dev/docs/style)
- [React Native Layout with Flexbox](https://reactnative.dev/docs/flexbox)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design Guidelines](https://material.io/design)

---

## 📝 Version History

- **v1.0.0** (2025-08-15): Initial style guidelines based on Run Houston mobile app implementation

---

**Remember:** These guidelines ensure consistency, maintainability, and professional appearance across your mobile application. Always follow these standards when adding new components or modifying existing styles.
