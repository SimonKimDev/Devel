import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement scrolling; Layout calls it on every navigation.
window.scrollTo = () => {};
