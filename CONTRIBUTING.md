# Contributing to Zest Protocol

Thank you for your interest in contributing to Zest Protocol! This document provides guidelines for contributing to the zest-contracts repository.

## Where to Open Issues

**Bug Reports and Feature Requests:** Please open issues directly on this repository at [github.com/Zest-Protocol/zest-contracts/issues](https://github.com/Zest-Protocol/zest-contracts/issues).

When opening an issue, please include:
- A clear, descriptive title
- Detailed description of the bug or feature request
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Relevant contract names or transaction IDs if applicable

## Repository Structure

```
zest-contracts/
├── onchain/          # Clarity smart contracts
│   └── contracts/
│       └── borrow/   # Zest Borrow contracts
├── btc/              # Bitcoin-related contracts
├── doc/              # Documentation
└── src/              # TypeScript utilities
```

## Development Setup

### Prerequisites

- [Clarinet](https://docs.hiro.so/clarinet/installing-clarinet) for Clarity development
- [Node.js](https://nodejs.org/) for TypeScript tooling

### Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/zest-contracts.git
   cd zest-contracts
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## Making Contributions

### Pull Request Process

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** with clear, atomic commits

3. **Test your changes** thoroughly:
   ```bash
   cd onchain
   clarinet test
   ```

4. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Open a Pull Request** with:
   - Clear description of changes
   - Reference to any related issues
   - Test results if applicable

### Code Style

- Follow existing code patterns in the repository
- Add comments for complex logic
- Use descriptive variable and function names

## Security

For security vulnerabilities, please **do not** open a public issue. Instead, contact the team directly through appropriate security disclosure channels.

## Audit Information

Zest Protocol contracts have undergone security audits:
- **Zest Borrow:** Coinfabrik (Feb 2024)
- **Zest Earn:** Coinfabrik (Aug 2022), Least Authority (Mar 2023)

See the [README](README.md) for links to audit reports.

## Questions?

- Open a [discussion](https://github.com/Zest-Protocol/zest-contracts/issues) for general questions
- Review existing issues before creating new ones

## License

By contributing, you agree that your contributions will be licensed under the same terms as this project.
