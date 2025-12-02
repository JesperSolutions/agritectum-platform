/**
 * Custom ESLint rule to detect hardcoded strings that should be translated
 */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Detect hardcoded strings that should be translated',
      category: 'Best Practices',
      recommended: false,
    },
    fixable: null,
    schema: [],
    messages: {
      hardcodedString: 'Hardcoded string "{{text}}" should be translated using t() function',
    },
  },

  create(context) {
    // Patterns that are likely hardcoded strings that should be translated
    const hardcodedPatterns = [
      /^[A-Z][a-z]+ [A-Z][a-z]+$/, // "User Management", "Add User", etc.
      /^[A-Z][a-z]+$/, // "Cancel", "Save", "Delete", etc.
      /^[A-Z][a-z]+ [a-z]+$/, // "Phone Number", "Email Address", etc.
    ];

    // Patterns to ignore (not user-facing strings)
    const ignorePatterns = [
      /^[a-z]+$/, // single lowercase words
      /^\d+$/, // numbers
      /^[A-Z_]+$/, // constants
      /^[a-z]+@[a-z]+\.[a-z]+$/, // email addresses
      /^https?:\/\//, // URLs
      /^[a-z-]+$/, // CSS classes, IDs
      /^[A-Z][a-z]+[A-Z]/, // camelCase
      /^[a-z]+[A-Z]/, // camelCase
    ];

    function isHardcodedString(text) {
      if (typeof text !== 'string' || text.length < 2) return false;

      // Check ignore patterns first
      for (const pattern of ignorePatterns) {
        if (pattern.test(text)) return false;
      }

      // Check if it matches hardcoded patterns
      for (const pattern of hardcodedPatterns) {
        if (pattern.test(text)) return true;
      }

      return false;
    }

    return {
      Literal(node) {
        if (typeof node.value === 'string' && isHardcodedString(node.value)) {
          context.report({
            node,
            messageId: 'hardcodedString',
            data: {
              text: node.value,
            },
          });
        }
      },
    };
  },
};
