function withOpacity(variableName) {
  return ({ opacityVariable, opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgba(var(${variableName}), ${opacityValue})`;
    }
    if (opacityVariable !== undefined) {
      return `rgba(var(${variableName}), var(${opacityVariable}, 1))`;
    }
    return `rgb(var(${variableName}))`;
  };
}

// tailwind.config.js
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./index.html"],

  theme: {
    extend: {
      colors: {
        primary: withOpacity("--color-primary-rgb"),
        primaryAlt: withOpacity("--color-primaryAlt-rgb"),
        secondary: withOpacity("--color-secondary-rgb"),
        secondaryAlt: withOpacity("--color-secondaryAlt-rgb"),
        accent: withOpacity("--color-accent-rgb"),
        neutral: withOpacity("--color-neutral-rgb"),
        neutralAlt: withOpacity("--color-neutralAlt-rgb"),
        error: withOpacity("--color-error-rgb"),
        "base-100": withOpacity("--color-base-100-rgb"),
        "base-100Alt": withOpacity("--color-base-100-rgb"),
      },
      height: {
        "d-screen": "100dvh",
        "s-screen": "100svh",
      },
    },
  },
  plugins: [],
};
