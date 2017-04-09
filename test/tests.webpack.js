function requireAll(requireContext) {
  return requireContext.keys().map(requireContext);
}

const srcContext = requireAll(require.context('../src', true, /\.test\.(js|jsx)$/));
const testContext = requireAll(require.context('.', true, /\.test\.(js|jsx)$/));